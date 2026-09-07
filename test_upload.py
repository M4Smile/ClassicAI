import requests
import os
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

BASE_URL = os.getenv("TEST_API_URL", "http://localhost:8000")
SIGNUP_URL = f"{BASE_URL}/signup"
LOGIN_URL = f"{BASE_URL}/login"
UPLOAD_URL = f"{BASE_URL}/upload-audio"

TEST_USER = {
    "email": os.getenv("TEST_USER_EMAIL", "test@example.invalid"),
    "password": os.getenv("TEST_USER_PASSWORD", "example-test-password"),
    "name": "Test User",
}

TEST_AUDIO_PATH = os.getenv("TEST_AUDIO_PATH", "audio.mp3")

# Настройка механизма повторных попыток
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504],
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session = requests.Session()
session.mount("http://", adapter)
session.mount("https://", adapter)

def make_request(method, url, **kwargs):
    try:
        response = session.request(method, url, **kwargs)
        response.raise_for_status()
        return response
    except requests.exceptions.ConnectionError:
        print(f"Connection error. Make sure the server is running at {BASE_URL}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {str(e)}")
        return None

def register_test_user():
    try:
        response = make_request("POST", SIGNUP_URL, json=TEST_USER)
        if response and response.status_code == 200:
            print("User registered successfully!")
            return response.json()
        else:
            print(f"Registration failed: {response.text if response else 'No response'}")
            return None
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        return None

def test_upload():
    # Сначала регистрируем пользователя
    registration = register_test_user()
    if not registration:
        print("Trying to login with existing credentials...")
        # Пробуем залогиниться если пользователь уже существует
        login_response = make_request("POST", LOGIN_URL, json={
            "email": TEST_USER["email"],
            "password": TEST_USER["password"]
        })
        if not login_response or login_response.status_code != 200:
            print(f"Login failed: {login_response.text if login_response else 'No response'}")
            return
        token = login_response.json()["access_token"]
    else:
        token = registration["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # Проверяем существование файла
    if not os.path.exists(TEST_AUDIO_PATH):
        print(f"File {TEST_AUDIO_PATH} not found")
        return

        # Загружаем аудиофайл
    with open(TEST_AUDIO_PATH, "rb") as audio_file:
        files = {"file": (os.path.basename(TEST_AUDIO_PATH), audio_file, "audio/mpeg")}
        upload_response = make_request("POST", UPLOAD_URL, headers=headers, files=files)
        
        if upload_response and upload_response.status_code == 200:
            print("Upload successful!")
            print(upload_response.json())
        else:
            print(f"Upload failed: {upload_response.text if upload_response else 'No response'}")

if __name__ == "__main__":
    print(f"Testing connection to {BASE_URL}...")
    test_upload()
