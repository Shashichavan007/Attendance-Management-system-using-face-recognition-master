import requests
import sys

BASE_URL = "http://127.0.0.1:8008"

def test_api_health():
    print(f"Testing backend server health at {BASE_URL}/api/health...")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print("[OK] AttendAI API is online and responding cleanly!")
            print("Response:", response.json())
            return True
        else:
            print(f"[FAIL] Backend returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] Connection error: {e}")
        return False

if __name__ == "__main__":
    success = test_api_health()
    sys.exit(0 if success else 1)
