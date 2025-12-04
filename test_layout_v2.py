"""Test Layout API v2.0"""
import requests
import json

url = "http://localhost:8002/api/v1/layout/generate"

data = {
    "document_type": "meeting_summary",
    "title": "Product Strategy Meeting",
    "subtitle": "Q1 2025 Planning Session",
    "summary": "We discussed the Q1 product roadmap and aligned on key priorities. The team agreed on mobile-first approach. Customer feedback indicates strong demand for improved performance.",
    "sections": [
        {
            "type": "agenda",
            "title": "주요 안건",
            "items": ["Q1 Roadmap Review", "Market Research", "Resource Allocation", "Timeline Discussion"]
        },
        {
            "type": "decisions",
            "title": "결정 사항",
            "items": ["Mobile-first approach", "Performance optimization priority", "New hire approved"]
        },
        {
            "type": "action_items",
            "title": "액션 아이템",
            "items": [
                {"task": "Create wireframes", "assignee": "Design Team"},
                {"task": "Set up benchmarks", "assignee": "Engineering"},
                {"task": "Draft job description", "assignee": "HR"},
                {"task": "Update timeline", "assignee": "PM"}
            ]
        }
    ],
    "keywords": ["Product", "Strategy", "Mobile", "Q1"],
    "page_width": 1920,
    "page_height": 1080
}

try:
    response = requests.post(url, json=data, timeout=30)
    result = response.json()

    print("=" * 60)
    print("Layout API v2.0 Test Result")
    print("=" * 60)
    print(f"Status: {response.status_code}")
    print(f"Success: {result.get('success', False)}")
    print(f"Document Type: {result.get('document_type', 'N/A')}")

    layout = result.get('layout', {})
    print(f"\nTotal Pages: {layout.get('total_pages', 0)}")
    print(f"Page Size: {layout.get('page_width', 0)}x{layout.get('page_height', 0)}")

    print("\nPages:")
    for page in layout.get('pages', []):
        print(f"  Page {page.get('page_number')}: {page.get('page_type')} - {page.get('layout_type')}")
        print(f"    Section: {page.get('section_title')}")
        print(f"    Elements: {len(page.get('elements', []))}")

    # Design tokens
    tokens = layout.get('design_tokens', {})
    if tokens.get('version'):
        print(f"\nDesign Tokens Version: {tokens.get('version')}")
        print(f"Page Size: {tokens.get('page_size')}")

    # First page elements sample
    pages = layout.get('pages', [])
    if pages:
        first_page = pages[0]
        print(f"\nFirst Page Elements (sample):")
        for elem in first_page.get('elements', [])[:5]:
            print(f"  - {elem.get('type')}: x={elem.get('x')}, y={elem.get('y')}, w={elem.get('width')}")
            props = elem.get('properties', {})
            if props.get('fontSize'):
                print(f"      fontSize: {props.get('fontSize')}")
            if elem.get('content'):
                content = elem.get('content', '')[:50]
                print(f"      content: {content}...")

except Exception as e:
    print(f"Error: {e}")
