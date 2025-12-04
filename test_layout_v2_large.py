"""Test Layout API v2.0 with large content"""
import requests
import json

url = "http://localhost:8002/api/v1/layout/generate"

# Large content test (많은 안건, 결정사항, 액션아이템)
data = {
    "document_type": "meeting_summary",
    "title": "전략 기획 회의",
    "subtitle": "2025년 Q1 로드맵 수립",
    "summary": "이번 회의에서는 2025년 1분기 제품 로드맵을 검토하고 주요 우선순위를 정렬했습니다. 팀은 모바일 우선 접근 방식에 동의했습니다. 고객 피드백에 따르면 성능 개선에 대한 수요가 매우 높습니다. 또한 새로운 AI 기능 도입과 관련하여 심도 있는 논의가 있었으며, 기존 인프라 업그레이드 계획도 함께 검토했습니다.",
    "sections": [
        {
            "type": "agenda",
            "title": "주요 안건",
            "items": [
                "Q1 로드맵 검토",
                "시장 조사 결과 분석",
                "리소스 배분 계획",
                "타임라인 논의",
                "AI 기능 도입 검토",
                "인프라 업그레이드",
                "팀 확장 계획"
            ]
        },
        {
            "type": "decisions",
            "title": "결정 사항",
            "items": [
                "모바일 우선 접근 채택",
                "성능 최적화 우선 진행",
                "신규 채용 승인",
                "AI 파일럿 프로젝트 시작"
            ]
        },
        {
            "type": "action_items",
            "title": "액션 아이템",
            "items": [
                {"task": "와이어프레임 제작", "assignee": "디자인팀"},
                {"task": "벤치마크 설정", "assignee": "엔지니어링팀"},
                {"task": "JD 작성", "assignee": "인사팀"},
                {"task": "타임라인 업데이트", "assignee": "PM"},
                {"task": "AI 벤더 미팅", "assignee": "기술팀"}
            ]
        }
    ],
    "keywords": ["전략", "로드맵", "AI", "모바일", "Q1"],
    "page_width": 1920,
    "page_height": 1080
}

try:
    response = requests.post(url, json=data, timeout=30)
    result = response.json()

    print("=" * 60)
    print("Layout API v2.0 Large Content Test")
    print("=" * 60)
    print(f"Status: {response.status_code}")
    print(f"Success: {result.get('success', False)}")

    layout = result.get('layout', {})
    print(f"\nTotal Pages: {layout.get('total_pages', 0)}")

    tokens = layout.get('design_tokens', {})
    analysis = tokens.get('content_analysis', {})
    print(f"Summary Complexity: {analysis.get('summary_complexity', 'N/A')}")

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
