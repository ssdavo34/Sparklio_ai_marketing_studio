"""Test Layout API with real meeting data (similar to screenshot)"""
import requests
import json

url = "http://localhost:8002/api/v1/layout/generate"

# Similar to the screenshot content
data = {
    "document_type": "meeting_summary",
    "title": "회의 요약 (2025.12.04)",
    "subtitle": "인공지능 및 인공신경망 역사와 발전 과정 논의",
    "summary": "[Part 1] 회의에서는 인공지능 및 인공신경망의 역사와 발전 과정에 대해 논의되었습니다. 김영덕 대표는 1999년부터 인공신경망 연구를 시작하였으며, 그 이후로 AI 분야에서 다양한 경력을 쌓아왔습니다. 또한, 회의에서는 AI 기술의 여러 사이클과 최근의 라이브러리 모델만능주의에 대한 의견을 나눴습니다. [Part 2] 회의에서는 딥러닝 기술의 발전 과정이 논의되었으며, 특히 빅데이터와 하드웨어 인프라의 개선이 딥러닝 성능 향상에 크게 기여했다는 점이 강조되었다. 또한 2016년 알파고 이벤트 이후 딥러닝의 주목도가 높아지면서 라지랭기지 모델 기반 서비스들에 대한 만능주의가 나타났다. [Part 3] 회의에서는 딥러닝 기술을 활용한 서비스에 대해 논의되었다. 특히 GPT와 같은 라지랭기지 모델들이 언어 처리뿐만 아니라 영상 제작, 작곡 등의 다양한 분야에서 활용되고 있는 가능성과 그로 인해 등장한 생성형 AI 서비스에 대해 논의되었다. [Part 4] 회의에서는 생성형 AI의 활용 방안에 대해 논의되었습니다.",
    "sections": [
        {
            "type": "agenda",
            "title": "주요 안건",
            "items": [
                "인공지능 및 인공신경망 역사",
                "김영덕 대표 경력 소개",
                "AI 기술 발전 과정",
                "딥러닝 기술 발전 과정",
                "빅데이터와 하드웨어 인프라 개선의 역할",
                "알파고 이벤트 이후 딥러닝 주목도 상승",
                "라지랭기지 모델 기반 서비스에 대한 만능주의",
                "딥러닝 기술과 트랜스포머 모델에 대한 논의"
            ]
        },
        {
            "type": "decisions",
            "title": "결정 사항",
            "items": [
                "딥러닝 기술 발전이 빅데이터와 하드웨어 인프라 개선 덕분이라고 결정",
                "다음 회의에서 트랜스포머 모델과 라지랭기지 모델에 대한 더 깊은 이해를 갖기로 결정함",
                "본인의 주도적인 생각과 결합하여 부분적으로 생성형 AI를 활용하기로 결정"
            ]
        },
        {
            "type": "action_items",
            "title": "액션 아이템",
            "items": [
                {"task": "딥러닝 기술의 한계점 연구 필요성", "assignee": "OOO", "due": "YYYY-MM-DD"},
                {"task": "회의록 정리 및 공유", "assignee": "화자", "due": "기한 미정"},
                {"task": "딥러닝 관련 최신 논문 검토하기", "assignee": "화자", "due": "두 주 후"},
                {"task": "참석자들이 본인의 계획을 먼저 수립한 후 도움을 받는 방법 모색", "assignee": "각 참석자", "due": "다음 회의 전"},
                {"task": "생성형 AI 활용에 대한 추가 연구 진행하기", "assignee": "화자142", "due": "2주 내"}
            ]
        }
    ],
    "keywords": ["인공지능", "딥러닝", "GPT", "트랜스포머"],
    "page_width": 1920,
    "page_height": 1080
}

try:
    response = requests.post(url, json=data, timeout=30)
    result = response.json()

    print("=" * 60)
    print("Layout API Real Meeting Data Test")
    print("=" * 60)
    print(f"Status: {response.status_code}")
    print(f"Success: {result.get('success', False)}")

    layout = result.get('layout', {})
    print(f"\nTotal Pages: {layout.get('total_pages', 0)}")

    tokens = layout.get('design_tokens', {})
    analysis = tokens.get('content_analysis', {})
    print(f"Summary Complexity: {analysis.get('summary_complexity', 'N/A')}")
    print(f"Summary Length: {len(data['summary'])} chars")

    print("\nPage Distribution:")
    for dist in analysis.get('page_distribution', []):
        print(f"  - {dist}")

    print("\nPages:")
    for page in layout.get('pages', []):
        print(f"  Page {page.get('page_number')}: {page.get('page_type')} - {page.get('layout_type')}")
        print(f"    Section: {page.get('section_title')}")
        print(f"    Elements: {len(page.get('elements', []))}")

except Exception as e:
    print(f"Error: {e}")
