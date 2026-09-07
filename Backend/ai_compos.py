import base64
import os
import subprocess
from pathlib import Path

import requests
from music21 import converter, note, stream


YANDEX_COMPLETION_URL = (
    "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
)


def convert_midi_to_musicxml(input_midi_path, output_musicxml_path):
    score = converter.parse(input_midi_path)
    score.write("musicxml", fp=str(output_musicxml_path))


def read_musicxml(file_path):
    return converter.parse(str(file_path))


def extract_notes(score):
    return [
        element
        for element in score.recurse().notes
        if isinstance(element, note.Note)
    ]


def notes_to_text(notes):
    return " ".join(item.nameWithOctave for item in notes)


def simplify_with_yandex_gpt(notes_text, api_key, folder_id):
    if (
        not api_key
        or not folder_id
        or api_key.startswith("change-me")
        or folder_id.startswith("change-me")
    ):
        raise RuntimeError("Yandex Cloud credentials are not configured")

    response = requests.post(
        YANDEX_COMPLETION_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Api-Key {api_key}",
        },
        json={
            "modelUri": f"gpt://{folder_id}/yandexgpt-lite",
            "completionOptions": {
                "stream": False,
                "temperature": 0.6,
                "maxTokens": 2000,
            },
            "messages": [
                {
                    "role": "system",
                    "text": "Ты ассистент, который упрощает музыкальные ноты для новичков.",
                },
                {
                    "role": "user",
                    "text": (
                        "Упрости эти ноты для новичка, сохранив всю длину "
                        f"произведения: {notes_text}"
                    ),
                },
            ],
        },
        timeout=90,
    )
    response.raise_for_status()
    return response.json()["result"]["alternatives"][0]["message"]["text"]


def text_to_notes(text):
    simplified_notes = []
    for note_name in text.split():
        try:
            simplified_notes.append(note.Note(note_name))
        except Exception:
            continue
    return simplified_notes


def create_score_from_notes(notes):
    score = stream.Stream()
    for item in notes:
        score.append(item)
    return score


def convert_to_pdf(input_file, output_file):
    commands = [
        ["xvfb-run", "mscore", str(input_file), "-o", str(output_file)],
        ["mscore", str(input_file), "-o", str(output_file)],
    ]
    for command in commands:
        try:
            subprocess.run(
                command,
                check=True,
                capture_output=True,
                timeout=120,
            )
            return
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue
    raise RuntimeError("MuseScore is not installed or conversion failed")


def convert_pdf_to_base64(pdf_path):
    return base64.b64encode(Path(pdf_path).read_bytes()).decode("ascii")


def main_pipeline(input_path, work_dir):
    work_path = Path(work_dir)
    source_musicxml = work_path / "source.musicxml"
    simplified_musicxml = work_path / "simplified.musicxml"
    simplified_pdf = work_path / "simplified.pdf"

    convert_midi_to_musicxml(input_path, source_musicxml)
    score = read_musicxml(source_musicxml)
    notes_text = notes_to_text(extract_notes(score))

    simplified_text = simplify_with_yandex_gpt(
        notes_text,
        os.getenv("YANDEX_API_KEY", ""),
        os.getenv("YANDEX_FOLDER_ID", ""),
    )
    simplified_score = create_score_from_notes(text_to_notes(simplified_text))
    simplified_score.write("musicxml", fp=str(simplified_musicxml))

    convert_to_pdf(simplified_musicxml, simplified_pdf)
    return convert_pdf_to_base64(simplified_pdf)

