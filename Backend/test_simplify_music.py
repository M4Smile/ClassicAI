import requests
import json
import os

# API endpoint configuration
BASE_URL = os.getenv("TEST_API_URL", "http://localhost:8000")
LOGIN_ENDPOINT = f"{BASE_URL}/login"
SIMPLIFY_MUSIC_ENDPOINT = f"{BASE_URL}/simplify_music"

# Test user credentials
TEST_USER = {
    "email": os.getenv("TEST_USER_EMAIL", "test@example.invalid"),
    "password": os.getenv("TEST_USER_PASSWORD", "example-test-password"),
}

def get_auth_token():
    """Get authentication token by logging in"""
    response = requests.post(LOGIN_ENDPOINT, json=TEST_USER)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Login failed: {response.text}")

def test_simplify_music(midi_file_path):
    """Test the simplify_music endpoint with a MIDI file"""
    # Get authentication token
    token = get_auth_token()
    
    # Prepare headers with authentication
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Prepare file for upload
    with open(midi_file_path, 'rb') as f:
        files = {
            'file': (midi_file_path.split('/')[-1], f, 'application/midi')
        }
        
        # Make the request
        response = requests.post(
            SIMPLIFY_MUSIC_ENDPOINT,
            headers=headers,
            files=files
        )
        
        # Print results
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success!")
            print("Response:", json.dumps(response.json(), indent=2))
        else:
            print("Error:", response.text)

if __name__ == "__main__":
    # Replace with path to your test MIDI file
    test_midi_file = "test.mid"
    test_simplify_music(test_midi_file)
