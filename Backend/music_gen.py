import os

import requests


STABILITY_API_URL = (
    "https://api.stability.ai/v2beta/audio/stable-audio-2/audio-to-audio"
)


def audio_to_audio(
    input_audio_path: str,
    prompt: str,
    duration: int = 10,
    seed: int = 0,
    steps: int = 50,
    cfg_scale: float = 7.0,
    strength: float = 1.0,
    output_format: str = "mp3",
) -> bytes:
    api_key = os.getenv("STABILITY_API_KEY", "")
    if not api_key or api_key.startswith("change-me"):
        raise RuntimeError("STABILITY_API_KEY is not configured")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "audio/*",
    }
    data = {
        "prompt": prompt,
        "duration": duration,
        "seed": seed,
        "steps": steps,
        "cfg_scale": cfg_scale,
        "output_format": output_format,
        "strength": strength,
    }

    with open(input_audio_path, "rb") as audio_file:
        response = requests.post(
            STABILITY_API_URL,
            headers=headers,
            data=data,
            files={"audio": audio_file},
            timeout=180,
        )

    if not response.ok:
        raise RuntimeError(
            f"Stability AI request failed with status {response.status_code}"
        )
    return response.content
