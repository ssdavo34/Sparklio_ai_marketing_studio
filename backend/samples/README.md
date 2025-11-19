# Canvas Document Samples

Backend Abstract Spec v2.0 기반의 샘플 Canvas JSON 파일들입니다.

## 📁 파일 목록

### 1. `product_detail.json`
- **용도**: 제품 상세 페이지 (Single Page)
- **크기**: 1080x1350
- **제품**: Sony WH-1000XM5 헤드폰
- **포함 요소**:
  - Headline (role: headline)
  - Subheadline (role: subheadline)
  - Product Image (role: product_image)
  - Feature List (role: body)
  - CTA Button (role: cta_button + cta)
  - Price Info (role: caption)
  - Logo (role: logo)
  - Decoration (role: decoration)

### 2. `sns_feed_set.json`
- **용도**: SNS 콘텐츠 세트 (Multi Page)
- **페이지 구성**:
  - **Page 1 (Square)**: 1080x1080 - Instagram 피드용
  - **Page 2 (Portrait)**: 1080x1350 - Instagram 피드용 (4:5)
  - **Page 3 (Story)**: 1080x1920 - Instagram 스토리용 (9:16)
- **배경 타입**:
  - Page 1: Gradient (linear)
  - Page 2: Color (solid)
  - Page 3: Image (background image)

## 🔍 사용법

### Python에서 검증

```python
import json
from app.schemas.canvas import DocumentPayload

# 샘플 로드 및 검증
with open('samples/product_detail.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    doc = DocumentPayload(**data)

    # 검증 성공! 이제 doc 객체 사용 가능
    print(f"Document ID: {doc.id}")
    print(f"Pages: {len(doc.pages)}")
    print(f"Objects: {len(doc.pages[0].objects)}")
```

### 타입별 객체 필터링

```python
from app.schemas.canvas import TextObject, ImageObject, ObjectType

# 텍스트 객체만 추출
text_objects = [
    obj for obj in doc.pages[0].objects
    if obj.type == ObjectType.TEXT
]

# role 기반 필터링
headlines = [
    obj for obj in doc.pages[0].objects
    if isinstance(obj, TextObject) and obj.role == "headline"
]
```

### Role별 제약 검증

```python
from app.schemas.canvas import validate_text_role_constraints, TextObject

for obj in doc.pages[0].objects:
    if isinstance(obj, TextObject):
        try:
            validate_text_role_constraints(obj)
            print(f"✅ {obj.id}: 제약 조건 통과")
        except ValueError as e:
            print(f"❌ {obj.id}: {e}")
```

## 📊 Element Role 제약사항

| Role | 최대 글자 수 | 폰트 크기 범위 | 용도 |
|------|-------------|---------------|------|
| headline | 50자 | 36-72px | 메인 헤드라인 |
| subheadline | 100자 | 24-48px | 서브헤드라인 |
| body | 제한 없음 | 14-24px | 본문 텍스트 |
| caption | 200자 | 12-16px | 캡션/부가설명 |
| cta | 20자 | 16-24px | 행동유도 버튼 |

## 🎨 Brand Colors 구조

```json
{
  "colors": {
    "primary": "#1f2937",      // 메인 브랜드 컬러
    "secondary": "#3b82f6",    // 서브 컬러
    "accent": "#f59e0b",       // 강조 컬러
    "text_primary": "#1f2937", // 주요 텍스트
    "text_secondary": "#6b7280", // 보조 텍스트
    "background": "#ffffff"    // 기본 배경
  }
}
```

## 📐 Object 공통 속성

모든 Canvas Object는 다음 필수 속성을 가집니다:

```typescript
{
  id: string;          // 고유 ID (필수)
  type: ObjectType;    // 객체 타입 (필수)
  x: number;           // X 위치 px (필수)
  y: number;           // Y 위치 px (필수)
  width: number;       // 너비 px (필수)
  height: number;      // 높이 px (필수)
  rotation?: number;   // 회전 각도 (기본: 0)
  opacity?: number;    // 투명도 0-1 (기본: 1.0)
  visible?: boolean;   // 가시성 (기본: true)
  locked?: boolean;    // 잠금 (기본: false)
  z_index?: number;    // 레이어 순서
}
```

## 🔗 Data Bindings

`bindings` 필드는 Canvas 요소와 데이터 소스를 연결합니다:

```json
{
  "bindings": {
    "obj_headline.text": "copy.headline",         // 헤드라인 텍스트 바인딩
    "obj_main_image.src": "media.product_image",  // 이미지 URL 바인딩
    "obj_price.text": "product.price_info"        // 가격 정보 바인딩
  }
}
```

**사용 예시**:
- Generator Service가 LLM에서 `copy.headline` 생성
- 이 값을 `obj_headline.text`에 자동 주입
- Frontend는 실시간으로 변경사항 반영

## 🧪 테스트

전체 샘플 검증:

```bash
python -c "
import json
from app.schemas.canvas import DocumentPayload

for filename in ['product_detail.json', 'sns_feed_set.json']:
    with open(f'samples/{filename}', 'r', encoding='utf-8') as f:
        data = json.load(f)
        doc = DocumentPayload(**data)
        print(f'✅ {filename} 검증 성공')
"
```

## 📝 참고 문서

- **스펙 문서**: [docs/BACKEND_CANVAS_SPEC_V2.md](../docs/BACKEND_CANVAS_SPEC_V2.md)
- **Pydantic 스키마**: [app/schemas/canvas.py](../app/schemas/canvas.py)
- **C팀 피드백**: [C_TEAM_FEEDBACK_REVIEW_2025-11-19.md](../C_TEAM_FEEDBACK_REVIEW_2025-11-19.md)

## 🔄 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-11-19 | v2.0 | 초기 샘플 생성 (product_detail, sns_feed_set) |
