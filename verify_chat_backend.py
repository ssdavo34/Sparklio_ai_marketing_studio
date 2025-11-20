import requests
import json

def test_chat():
    url = "http://localhost:8000/api/v1/chat/analyze"
    payload = {
        "message": "배경을 파란색으로 바꿔줘",
        "llm_selection": {"mode": "auto"}
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat()
