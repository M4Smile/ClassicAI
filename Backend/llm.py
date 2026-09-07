import os

import requests
from yandex_cloud_ml_sdk import YCloudML


GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1/models/"
    "gemini-2.0-flash:generateContent"
)


class GPT:
    def __init__(self, message, data, model):
        self.message = message
        self.data = data
        self.model = model

    def is_composer_query(self, text):
        composers = [
            "Чайковский",
            "Рахманинов",
            "Мусоргский",
            "Римский-Корсаков",
            "Бородин",
            "Глинка",
            "Скрябин",
            "Прокофьев",
            "Шостакович",
            "Стравинский",
            "Балакирев",
            "Лядов",
            "Танеев",
            "Глазунов",
        ]
        return any(composer.lower() in text.lower() for composer in composers)

    def build_prompt(self):
        if self.is_composer_query(self.message):
            return f"""Ты музыкальный помощник в образовании. Отвечай о русских
классических композиторах, помогай разбирать произведения и готовить материалы
по музыкальной литературе.

Вопрос: {self.message}

Ответ по композитору структурируй так:
1. Краткая биография
2. Основные произведения
3. Стиль и влияние
4. Интересные факты

Используй маркированные списки и не выдумывай факты."""

        return (
            f"{self.message}\n\n"
            "Если вопрос не касается русских классических композиторов, "
            "вежливо предложи перейти к этой теме. На исходный вопрос не отвечай."
        )

    def generate(self):
        prompt = self.build_prompt()

        if self.model == "gemini":
            api_key = os.getenv("GEMINI_API_KEY", "")
            if not api_key or api_key.startswith("change-me"):
                raise RuntimeError("GEMINI_API_KEY is not configured")

            response = requests.post(
                GEMINI_API_URL,
                params={"key": api_key},
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=60,
            )
            if not response.ok:
                raise RuntimeError(
                    f"Gemini request failed with status {response.status_code}"
                )
            return response.json()["candidates"][0]["content"]["parts"][0]["text"]

        if self.model == "yandex":
            folder_id = os.getenv("YANDEX_FOLDER_ID", "")
            api_key = os.getenv("YANDEX_API_KEY", "")
            if (
                not folder_id
                or not api_key
                or folder_id.startswith("change-me")
                or api_key.startswith("change-me")
            ):
                raise RuntimeError("Yandex Cloud credentials are not configured")

            sdk = YCloudML(folder_id=folder_id, auth=api_key)
            model = sdk.models.completions("yandexgpt").configure(temperature=0.8)
            result = model.run(prompt)
            return result.alternatives[0].text

        raise ValueError(f"Unsupported model: {self.model}")

