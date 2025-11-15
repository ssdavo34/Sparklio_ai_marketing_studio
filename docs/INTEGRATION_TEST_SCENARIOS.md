# 통합 테스트 시나리오 (Integration Test Scenarios)

**문서 버전**: v1.0
**작성일**: 2025-11-15
**대상**: QA팀, B팀(백엔드), C팀(프론트엔드)
**목적**: Sparklio v4.3 P0 기능의 End-to-End 통합 테스트 시나리오 정의

---

## 목차

1. [테스트 개요](#1-테스트-개요)
2. [테스트 환경 설정](#2-테스트-환경-설정)
3. [Canvas Studio v3 통합 테스트](#3-canvas-studio-v3-통합-테스트)
4. [Concept Board 통합 테스트](#4-concept-board-통합-테스트)
5. [Generator API 통합 테스트](#5-generator-api-통합-테스트)
6. [Cross-Feature 통합 테스트](#6-cross-feature-통합-테스트)
7. [성능 테스트](#7-성능-테스트)
8. [테스트 체크리스트](#8-테스트-체크리스트)

---

## 1. 테스트 개요

### 1.1 테스트 범위

| 기능 영역 | 우선순위 | 테스트 유형 |
|---------|---------|-----------|
| Canvas Studio v3 (VSCode 스타일 에디터) | P0 | E2E, UI, API, State |
| Concept Board (무드보드) | P0 | E2E, UI, API, Image |
| Generator API (NanoBanana 연동) | P0 | E2E, API, Performance |
| Template System | P0 | E2E, API, State |
| Document Management | P0 | CRUD, State, Storage |

### 1.2 성공 기준 (Exit Criteria)

- ✅ 모든 P0 E2E 시나리오 통과 (100%)
- ✅ API 응답 시간 < 2초 (95 percentile)
- ✅ Canvas 렌더링 시간 < 500ms (100개 객체 기준)
- ✅ Mock Provider → Real API 전환 시 기능 동작 일치
- ✅ 브라우저 호환성 (Chrome 120+, Safari 17+, Edge 120+)
- ✅ 모바일 반응형 (768px, 1024px, 1920px 해상도)

### 1.3 테스트 데이터

```yaml
# test-data.yaml
brands:
  - id: "brand-test-001"
    name: "Test Brand Alpha"
    primary_color: "#FF6B35"

users:
  - id: "user-test-001"
    email: "qa@sparklio.ai"
    role: "admin"

templates:
  - id: "template-concept-board"
    type: "concept_board"
    mode: "concept_board"

  - id: "template-pitch-deck"
    type: "pitch_deck"
    mode: "pitch_deck"
```

---

## 2. 테스트 환경 설정

### 2.1 환경 구성

```bash
# 1. 로컬 개발 환경 (Phase 1-3)
export SPARKLIO_ENV=test
export API_BASE_URL=http://localhost:8000
export FRONTEND_URL=http://localhost:3000
export USE_MOCK_PROVIDER=true
export POSTGRES_DB=sparklio_test
export MINIO_BUCKET=sparklio-test

# 2. 스테이징 환경 (Phase 4)
export SPARKLIO_ENV=staging
export API_BASE_URL=https://api-staging.sparklio.ai
export USE_MOCK_PROVIDER=false
export NANOBANANA_API_KEY=${NANOBANANA_STAGING_KEY}
```

### 2.2 테스트 데이터베이스 초기화

```sql
-- scripts/init_test_db.sql
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE concept_boards CASCADE;
TRUNCATE TABLE concept_tiles CASCADE;
TRUNCATE TABLE templates CASCADE;

-- Insert test brand
INSERT INTO brands (id, name, primary_color, created_at)
VALUES ('brand-test-001', 'Test Brand Alpha', '#FF6B35', NOW());

-- Insert test user
INSERT INTO users (id, email, role, created_at)
VALUES ('user-test-001', 'qa@sparklio.ai', 'admin', NOW());

-- Insert test templates
INSERT INTO templates (id, name, template_type, mode, canvas_json)
VALUES
  ('template-concept-board', 'Concept Board Template', 'concept_board', 'concept_board', '{"version":"1.0","objects":[]}'),
  ('template-pitch-deck', 'Pitch Deck Template', 'pitch_deck', 'pitch_deck', '{"version":"1.0","objects":[]}');
```

### 2.3 Mock Provider 설정

```python
# app/services/mock_image_provider.py
class MockImageProvider:
    def __init__(self):
        self.enabled = os.getenv("USE_MOCK_PROVIDER") == "true"

    def generate_image(self, prompt: str, width: int, height: int):
        if self.enabled:
            # Phase 1-3: PIL/Pillow 더미 이미지
            return self._create_dummy_image(width, height, prompt)
        else:
            # Phase 4: Real NanoBanana API
            return self._call_nanobanana_api(prompt, width, height)
```

---

## 3. Canvas Studio v3 통합 테스트

### 3.1 시나리오 1: 새 문서 생성 및 저장

**목표**: 사용자가 Canvas Studio에서 새 문서를 생성하고 저장할 수 있다.

**테스트 단계**:

```gherkin
Feature: Canvas Studio 새 문서 생성

  Scenario: Concept Board 모드에서 새 문서 생성
    Given 사용자가 로그인되어 있음
    And 브랜드 "Test Brand Alpha"가 선택되어 있음

    When 사용자가 "/studio" 페이지로 이동
    And Activity Bar에서 "New Document" 버튼 클릭
    And 모드 선택 다이얼로그에서 "Concept Board" 선택
    And 문서 이름 "My First Concept Board" 입력
    And "Create" 버튼 클릭

    Then Canvas Viewport가 로드됨
    And Left Panel에 "My First Concept Board" 제목이 표시됨
    And Top Toolbar에 "Untitled" 대신 문서 이름이 표시됨
    And Right Dock의 "Chat" 탭이 기본으로 열림
    And 브라우저 URL이 "/studio/{document_id}"로 변경됨

    When 사용자가 Ctrl+S (또는 Cmd+S) 단축키 입력

    Then "Document saved successfully" 토스트 메시지 표시
    And 서버에 POST /api/v1/documents API 호출됨
    And 응답으로 document_id 반환됨
    And 문서 상태가 "draft"로 저장됨
```

**API 검증**:

```bash
# POST /api/v1/documents
curl -X POST http://localhost:8000/api/v1/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TEST_TOKEN}" \
  -d '{
    "name": "My First Concept Board",
    "document_type": "concept_board",
    "brand_id": "brand-test-001",
    "document_json": {
      "version": "1.0",
      "mode": "concept_board",
      "objects": [],
      "viewport": {"zoom": 1, "x": 0, "y": 0}
    }
  }'

# Expected Response (201 Created)
{
  "id": "doc-uuid-001",
  "name": "My First Concept Board",
  "document_type": "concept_board",
  "status": "draft",
  "created_at": "2025-11-15T10:30:00Z",
  "updated_at": "2025-11-15T10:30:00Z"
}
```

**UI 검증**:

```javascript
// Playwright test
import { test, expect } from '@playwright/test';

test('새 Concept Board 문서 생성', async ({ page }) => {
  await page.goto('http://localhost:3000/studio');

  // Activity Bar에서 New Document 클릭
  await page.click('[data-testid="activity-bar-new-doc"]');

  // 모드 선택 다이얼로그
  await expect(page.locator('[data-testid="mode-select-dialog"]')).toBeVisible();
  await page.click('[data-testid="mode-concept-board"]');

  // 문서 이름 입력
  await page.fill('[data-testid="doc-name-input"]', 'My First Concept Board');
  await page.click('[data-testid="create-button"]');

  // Canvas 로드 확인
  await expect(page.locator('canvas')).toBeVisible({ timeout: 3000 });

  // URL 변경 확인
  await expect(page).toHaveURL(/\/studio\/doc-/);

  // 저장 (Ctrl+S)
  await page.keyboard.press('Control+S');

  // 토스트 메시지 확인
  await expect(page.locator('.toast-success')).toContainText('saved successfully');
});
```

---

### 3.2 시나리오 2: Chat 명령으로 Canvas 수정

**목표**: 사용자가 Chat 탭에서 명령을 입력하여 Canvas 객체를 수정할 수 있다.

**테스트 단계**:

```gherkin
Feature: Chat 명령으로 Canvas 수정

  Scenario: "제목 크기를 48로 바꿔줘" 명령 실행
    Given 사용자가 Concept Board 문서를 열어둠
    And Canvas에 제목 텍스트 객체 "Main Title"이 있음 (현재 fontSize: 32)

    When 사용자가 Right Dock의 "Chat" 탭 클릭
    And 채팅 입력창에 "제목 크기를 48로 바꿔줘" 입력
    And Enter 키 입력

    Then 채팅창에 사용자 메시지가 표시됨
    And "Analyzing your request..." 로딩 인디케이터 표시
    And 서버에 POST /api/v1/chat/send API 호출됨
    And 서버가 Editor Action 반환:
      """
      {
        "type": "update_font_size",
        "target": {"selector": "type:text AND name:Main Title"},
        "payload": {"fontSize": 48}
      }
      """

    When 서버가 Editor Action을 반환

    Then 프론트엔드가 POST /api/v1/editor/action API 호출
    And 서버가 업데이트된 document_json 반환
    And Canvas에서 "Main Title" 객체의 fontSize가 48로 변경됨
    And 채팅창에 "제목 크기를 48로 변경했습니다." AI 응답 표시
    And Right Dock의 "Inspector" 탭에 fontSize: 48 표시됨
```

**API 검증**:

```bash
# 1. Chat API 호출
curl -X POST http://localhost:8000/api/v1/chat/send \
  -H "Authorization: Bearer ${TEST_TOKEN}" \
  -d '{
    "document_id": "doc-uuid-001",
    "message": "제목 크기를 48로 바꿔줘",
    "context": {
      "current_objects": [
        {"id": "obj-1", "type": "text", "name": "Main Title", "props": {"fontSize": 32}}
      ]
    }
  }'

# Expected Response
{
  "ai_response": "제목 크기를 48로 변경했습니다.",
  "editor_actions": [
    {
      "type": "update_font_size",
      "target": {"selector": "type:text AND name:Main Title"},
      "payload": {"fontSize": 48}
    }
  ]
}

# 2. Editor Action API 호출
curl -X POST http://localhost:8000/api/v1/editor/action \
  -H "Authorization: Bearer ${TEST_TOKEN}" \
  -d '{
    "document_id": "doc-uuid-001",
    "action": {
      "type": "update_font_size",
      "target": {"selector": "type:text AND name:Main Title"},
      "payload": {"fontSize": 48}
    }
  }'

# Expected Response
{
  "success": true,
  "document_json": {
    "version": "1.0",
    "objects": [
      {"id": "obj-1", "type": "text", "name": "Main Title", "props": {"fontSize": 48}}
    ]
  }
}
```

**State 검증**:

```typescript
// Zustand store 검증
import { useEditorStore } from '@/stores/editorStore';

test('Chat 명령으로 객체 업데이트 시 store 반영', async () => {
  const { getState, dispatch } = useEditorStore;

  // 초기 상태
  expect(getState().canvasObjects[0].props.fontSize).toBe(32);

  // Editor Action 적용
  await dispatch(applyEditorAction({
    type: 'update_font_size',
    target: { selector: 'type:text AND name:Main Title' },
    payload: { fontSize: 48 }
  }));

  // 상태 업데이트 확인
  expect(getState().canvasObjects[0].props.fontSize).toBe(48);
  expect(getState().isDirty).toBe(true); // 저장 필요 상태
});
```

---

### 3.3 시나리오 3: Template으로부터 문서 생성

**목표**: 사용자가 기존 Template을 선택하여 새 문서를 생성할 수 있다.

**테스트 단계**:

```gherkin
Feature: Template으로부터 문서 생성

  Scenario: Pitch Deck Template으로 새 문서 생성
    Given 사용자가 로그인되어 있음
    And 시스템에 "Startup Pitch Deck" Template이 등록되어 있음

    When 사용자가 "/studio" 페이지로 이동
    And Activity Bar에서 "Templates" 아이콘 클릭
    And Left Panel에 Template 목록이 표시됨
    And "Startup Pitch Deck" Template 클릭
    And Template 미리보기 모달이 표시됨
    And "Use This Template" 버튼 클릭
    And 문서 이름 "Q4 Investor Pitch" 입력
    And "Create" 버튼 클릭

    Then 서버에 POST /api/v1/templates/{template_id}/instantiate API 호출됨
    And 새 문서가 생성되며 Template의 canvas_json이 복사됨
    And Canvas에 Template의 객체들이 렌더링됨 (제목, 서브타이틀, 이미지 플레이스홀더 등)
    And 문서 이름이 "Q4 Investor Pitch"로 설정됨
    And 문서 상태가 "draft"임
```

**API 검증**:

```bash
# GET /api/v1/templates (목록 조회)
curl -X GET http://localhost:8000/api/v1/templates?mode=pitch_deck \
  -H "Authorization: Bearer ${TEST_TOKEN}"

# Expected Response
{
  "templates": [
    {
      "id": "template-pitch-001",
      "name": "Startup Pitch Deck",
      "mode": "pitch_deck",
      "thumbnail_url": "https://cdn.sparklio.ai/templates/pitch-001.jpg",
      "object_count": 12,
      "created_at": "2025-11-10T00:00:00Z"
    }
  ]
}

# POST /api/v1/templates/{id}/instantiate (문서 생성)
curl -X POST http://localhost:8000/api/v1/templates/template-pitch-001/instantiate \
  -H "Authorization: Bearer ${TEST_TOKEN}" \
  -d '{
    "document_name": "Q4 Investor Pitch",
    "brand_id": "brand-test-001"
  }'

# Expected Response
{
  "document_id": "doc-uuid-002",
  "name": "Q4 Investor Pitch",
  "document_type": "pitch_deck",
  "document_json": {
    "version": "1.0",
    "objects": [
      {"id": "obj-1", "type": "text", "name": "Title", "props": {...}},
      {"id": "obj-2", "type": "text", "name": "Subtitle", "props": {...}},
      // ... template의 모든 객체 복사됨
    ]
  }
}
```

---

### 3.4 시나리오 4: 문서 버전 관리 (저장 및 복원)

**목표**: 사용자가 문서를 수정하고 저장한 후, 이전 버전으로 복원할 수 있다.

**테스트 단계**:

```gherkin
Feature: 문서 버전 관리

  Scenario: 문서 수정 후 이전 버전으로 복원
    Given 사용자가 "My Concept Board" 문서를 열어둠 (현재 version: 1)

    When 사용자가 Canvas에서 텍스트 "Hello"를 "World"로 수정
    And Ctrl+S로 저장

    Then 서버에 PATCH /api/v1/documents/{id} API 호출됨
    And 문서 version이 2로 증가
    And documents 테이블의 version 컬럼이 2로 업데이트됨

    When 사용자가 Top Toolbar의 "Version History" 버튼 클릭
    And 버전 목록 모달이 표시됨:
      """
      v2 (current) - 2025-11-15 10:45 - Modified text
      v1 - 2025-11-15 10:30 - Initial version
      """
    And "v1" 버전 클릭
    And "Restore This Version" 버튼 클릭

    Then 서버에 POST /api/v1/documents/{id}/restore?version=1 API 호출됨
    And Canvas에 v1의 "Hello" 텍스트가 복원됨
    And 새로운 version 3이 생성됨 (v1의 복사본)
    And 채팅창에 "Restored to version 1" 메시지 표시
```

**Database 검증**:

```sql
-- 버전 히스토리 확인
SELECT id, version, document_json->'objects'->0->>'name' as first_object_name, updated_at
FROM documents
WHERE id = 'doc-uuid-001'
ORDER BY version DESC;

-- Expected Result
/*
id             | version | first_object_name | updated_at
---------------|---------|-------------------|-------------------
doc-uuid-001   | 3       | Hello             | 2025-11-15 10:50
doc-uuid-001   | 2       | World             | 2025-11-15 10:45
doc-uuid-001   | 1       | Hello             | 2025-11-15 10:30
*/
```

---

## 4. Concept Board 통합 테스트

### 4.1 시나리오 5: Mock Provider로 Tile 생성 (Phase 1-3)

**목표**: 사용자가 Concept Board에서 프롬프트를 입력하여 Mock 이미지 타일을 생성할 수 있다.

**테스트 단계**:

```gherkin
Feature: Concept Board Mock 이미지 생성

  Scenario: Phase 1-3 환경에서 더미 이미지 타일 생성
    Given 환경 변수 USE_MOCK_PROVIDER=true
    And 사용자가 Concept Board 문서를 열어둠

    When 사용자가 Right Dock의 "Data" 탭 클릭
    And "Add Tile" 버튼 클릭
    And 프롬프트 입력창에 "minimalist office interior" 입력
    And "Generate" 버튼 클릭

    Then 서버에 POST /api/v1/concept-boards/{board_id}/tiles API 호출됨
    And 백엔드가 MockImageProvider.generate_image() 호출
    And PIL/Pillow로 512x512 더미 이미지 생성 (파스텔 톤 + 프롬프트 텍스트 오버레이)
    And MinIO에 이미지 업로드됨
    And concept_tiles 테이블에 레코드 삽입:
      """
      {
        "id": "tile-001",
        "board_id": "board-001",
        "image_url": "http://minio:9000/sparklio-test/tiles/tile-001.png",
        "prompt": "minimalist office interior",
        "source_type": "mock",
        "palette": ["#E8D5C4", "#A8DADC", "#F4A261"]
      }
      """

    When API 응답이 반환됨

    Then Canvas에 새 이미지 타일이 표시됨
    And 이미지 위에 "minimalist office interior" 텍스트 오버레이 표시
    And Right Dock "Inspector" 탭에 타일 정보 표시:
      - Source: Mock Provider
      - Palette: 3 colors
      - Prompt: minimalist office interior
```

**Mock Provider 검증**:

```python
# tests/test_mock_provider.py
import pytest
from app.services.mock_image_provider import MockImageProvider

def test_mock_image_generation():
    provider = MockImageProvider(enabled=True)

    result = provider.generate_image(
        prompt="minimalist office interior",
        width=512,
        height=512
    )

    assert result["image_url"].startswith("http://minio:9000/")
    assert result["source_type"] == "mock"
    assert len(result["palette"]) == 3  # ColorThief 추출 결과
    assert result["prompt"] == "minimalist office interior"

    # 이미지 파일 존재 확인
    import requests
    response = requests.get(result["image_url"])
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "image/png"
```

---

### 4.2 시나리오 6: Real API로 Tile 생성 (Phase 4)

**목표**: 사용자가 Concept Board에서 NanoBanana API로 실제 이미지를 생성할 수 있다.

**테스트 단계**:

```gherkin
Feature: Concept Board Real API 이미지 생성

  Scenario: Phase 4 환경에서 NanoBanana API로 이미지 생성
    Given 환경 변수 USE_MOCK_PROVIDER=false
    And NANOBANANA_API_KEY가 설정되어 있음
    And 사용자가 Concept Board 문서를 열어둠

    When 사용자가 Right Dock의 "Data" 탭 클릭
    And "Add Tile" 버튼 클릭
    And 프롬프트 입력창에 "modern minimalist office with plants" 입력
    And "Generate" 버튼 클릭

    Then 서버에 POST /api/v1/concept-boards/{board_id}/tiles API 호출됨
    And 백엔드가 NanoBananaProvider.generate_image() 호출
    And NanoBanana API에 HTTP POST 요청:
      """
      POST https://api.nanobanana.ai/v1/generate
      {
        "prompt": "modern minimalist office with plants",
        "model": "gemini-2.5-flash-imagen",
        "width": 512,
        "height": 512,
        "num_images": 1
      }
      """

    When NanoBanana API가 이미지 URL 반환 (예상 응답 시간: 3-5초)

    Then 백엔드가 이미지 다운로드 및 MinIO에 재업로드
    And concept_tiles 테이블에 레코드 삽입:
      """
      {
        "id": "tile-002",
        "source_type": "nanobanana",
        "prompt": "modern minimalist office with plants",
        "image_url": "http://minio:9000/sparklio/tiles/tile-002.png",
        "palette": ["#2D4A3E", "#8FBC8F", "#F5F5DC"]
      }
      """

    And Canvas에 실제 AI 생성 이미지가 표시됨
    And Right Dock "Inspector" 탭에:
      - Source: NanoBanana (Gemini 2.5 Flash)
      - Generation time: 4.2s
      - Palette: 3 colors
```

**API 검증 (NanoBanana Mock)**:

```python
# tests/test_nanobanana_integration.py
import pytest
from unittest.mock import patch, MagicMock

@patch('app.services.nanobanana_provider.requests.post')
def test_nanobanana_api_call(mock_post):
    # Mock NanoBanana API 응답
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "images": [
            {
                "url": "https://nanobanana.ai/generated/image-xyz.png",
                "seed": 12345
            }
        ]
    }
    mock_post.return_value = mock_response

    from app.services.nanobanana_provider import NanoBananaProvider
    provider = NanoBananaProvider(api_key="test-key")

    result = provider.generate_image(
        prompt="modern minimalist office with plants",
        width=512,
        height=512
    )

    # API 호출 검증
    mock_post.assert_called_once()
    call_args = mock_post.call_args[1]['json']
    assert call_args['prompt'] == "modern minimalist office with plants"
    assert call_args['model'] == "gemini-2.5-flash-imagen"

    # 결과 검증
    assert result["source_type"] == "nanobanana"
    assert result["prompt"] == "modern minimalist office with plants"
```

---

### 4.3 시나리오 7: Tile 배치 및 레이아웃

**목표**: 사용자가 Canvas에서 타일을 드래그 앤 드롭으로 배치하고 크기를 조정할 수 있다.

**테스트 단계**:

```gherkin
Feature: Concept Board 타일 배치

  Scenario: 타일 드래그 앤 드롭 및 리사이즈
    Given Canvas에 3개의 이미지 타일이 있음:
      - Tile A: x=100, y=100, width=200, height=200
      - Tile B: x=350, y=100, width=200, height=200
      - Tile C: x=100, y=350, width=200, height=200

    When 사용자가 Tile A를 클릭하여 선택

    Then Tile A 주변에 선택 바운딩 박스 표시
    And Right Dock "Inspector" 탭에 Tile A 정보 표시

    When 사용자가 Tile A를 x=150, y=150 위치로 드래그

    Then Canvas에서 Tile A 위치가 실시간으로 업데이트됨
    And Zustand store의 canvasObjects[0].x가 150으로 업데이트됨
    And 문서 isDirty 플래그가 true로 설정됨

    When 사용자가 Tile A의 우측 하단 핸들을 드래그하여 300x300으로 리사이즈

    Then Tile A 크기가 300x300으로 변경됨
    And Inspector 탭에 "Width: 300, Height: 300" 표시

    When 사용자가 Ctrl+S로 저장

    Then 서버에 PATCH /api/v1/documents/{id} API 호출
    And document_json에 업데이트된 좌표 및 크기 반영:
      """
      {
        "objects": [
          {"id": "tile-a", "x": 150, "y": 150, "width": 300, "height": 300}
        ]
      }
      """
```

**Fabric.js 이벤트 검증**:

```typescript
// tests/canvas.test.ts
import { fabric } from 'fabric';

test('타일 드래그 앤 드롭 이벤트', async () => {
  const canvas = new fabric.Canvas('test-canvas');

  const tile = new fabric.Image(imageElement, {
    left: 100,
    top: 100,
    width: 200,
    height: 200,
  });

  canvas.add(tile);

  // 드래그 이벤트 시뮬레이션
  canvas.setActiveObject(tile);
  tile.set({ left: 150, top: 150 });
  canvas.fire('object:modified', { target: tile });

  // 상태 업데이트 확인
  expect(tile.left).toBe(150);
  expect(tile.top).toBe(150);
});
```

---

## 5. Generator API 통합 테스트

### 5.1 시나리오 8: Generator API 호출 (Chat → Template 생성)

**목표**: 사용자가 Chat에서 프롬프트를 입력하면 Generator API가 Template을 생성한다.

**테스트 단계**:

```gherkin
Feature: Generator API 연동

  Scenario: Chat 프롬프트로 Pitch Deck Template 생성
    Given 사용자가 Pitch Deck 문서를 열어둠
    And Canvas가 비어 있음

    When 사용자가 Chat 탭에서 다음 프롬프트 입력:
      """
      우리 스타트업 소개 자료를 만들어줘.
      회사명: TechVenture
      핵심 가치: AI 기반 자동화
      타겟: B2B SaaS
      """
    And Enter 키 입력

    Then 프론트엔드가 POST /api/v1/chat/send API 호출
    And 백엔드가 Generator API에 HTTP POST:
      """
      POST http://node-generator:3001/api/generate
      {
        "prompt": "우리 스타트업 소개 자료를 만들어줘...",
        "mode": "pitch_deck",
        "brand_context": {
          "name": "Test Brand Alpha",
          "primary_color": "#FF6B35"
        }
      }
      """

    When Generator API가 응답 (예상 시간: 5-8초):
      """
      {
        "canvas_json": {
          "version": "1.0",
          "objects": [
            {"type": "text", "name": "Title", "text": "TechVenture", "fontSize": 64, "fill": "#FF6B35"},
            {"type": "text", "name": "Subtitle", "text": "AI 기반 자동화 솔루션", "fontSize": 32},
            {"type": "rect", "name": "Background", "fill": "#F5F5F5", "width": 1920, "height": 1080}
          ]
        },
        "generation_time": 6.2
      }
      """

    Then 백엔드가 Canvas Studio Editor Action으로 변환:
      """
      {
        "type": "replace_all_objects",
        "payload": {
          "objects": [...]
        }
      }
      """

    And 프론트엔드가 Canvas에 객체들을 렌더링
    And Chat에 "Pitch Deck이 생성되었습니다. (6.2초 소요)" 메시지 표시
```

**Generator API Mock 테스트**:

```python
# tests/test_generator_integration.py
import pytest
from unittest.mock import patch

@patch('app.services.generator_client.requests.post')
def test_generator_api_call(mock_post):
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {
        "canvas_json": {
            "version": "1.0",
            "objects": [
                {"type": "text", "name": "Title", "text": "TechVenture"}
            ]
        },
        "generation_time": 6.2
    }

    from app.services.generator_client import GeneratorClient
    client = GeneratorClient(base_url="http://node-generator:3001")

    result = client.generate_template(
        prompt="우리 스타트업 소개 자료를 만들어줘...",
        mode="pitch_deck",
        brand_context={"name": "Test Brand Alpha"}
    )

    assert result["canvas_json"]["objects"][0]["text"] == "TechVenture"
    assert result["generation_time"] == 6.2
```

---

## 6. Cross-Feature 통합 테스트

### 6.1 시나리오 9: Concept Board → Pitch Deck 전환

**목표**: 사용자가 Concept Board에서 작업한 내용을 Pitch Deck으로 변환할 수 있다.

**테스트 단계**:

```gherkin
Feature: 모드 간 전환

  Scenario: Concept Board를 Pitch Deck으로 변환
    Given 사용자가 Concept Board 문서를 작업 중
    And Canvas에 5개의 이미지 타일이 있음
    And concept_boards 테이블에 레코드가 있음

    When 사용자가 Top Toolbar의 "Convert to Pitch Deck" 버튼 클릭
    And 확인 다이얼로그에서 "Confirm" 클릭

    Then 서버에 POST /api/v1/documents/{id}/convert API 호출:
      """
      {
        "target_mode": "pitch_deck"
      }
      """

    And 백엔드가 Generator API 호출:
      """
      POST http://node-generator:3001/api/convert
      {
        "source_mode": "concept_board",
        "source_canvas_json": {...},
        "target_mode": "pitch_deck",
        "concept_tiles": [5개 타일 정보]
      }
      """

    When Generator API가 Pitch Deck canvas_json 반환

    Then 새 문서 생성 (document_type: "pitch_deck")
    And 기존 Concept Board 문서는 parent_document_id로 연결됨
    And Canvas에 Pitch Deck 레이아웃으로 타일들이 재배치됨
    And Chat에 "Concept Board를 Pitch Deck으로 변환했습니다." 메시지 표시
```

---

### 6.2 시나리오 10: 브랜드 컨텍스트 적용

**목표**: 사용자가 브랜드를 전환하면 Canvas의 색상과 스타일이 자동으로 업데이트된다.

**테스트 단계**:

```gherkin
Feature: 브랜드 컨텍스트 적용

  Scenario: 브랜드 전환 시 색상 자동 업데이트
    Given 사용자가 "Brand A" (primary_color: #FF6B35)를 선택하여 문서 작업 중
    And Canvas에 제목 텍스트가 #FF6B35 색상으로 되어 있음

    When 사용자가 Right Dock "Brand" 탭 클릭
    And 브랜드 드롭다운에서 "Brand B" (primary_color: #4A90E2) 선택

    Then 서버에 PATCH /api/v1/documents/{id} API 호출:
      """
      {
        "brand_id": "brand-b-uuid"
      }
      """

    And 프론트엔드가 Chat API 호출:
      """
      POST /api/v1/chat/send
      {
        "message": "브랜드 컬러를 #4A90E2로 변경해줘",
        "auto_apply": true
      }
      """

    When Editor Action이 반환되어 적용됨

    Then Canvas의 모든 브랜드 색상 요소가 #4A90E2로 업데이트됨
    And Inspector 탭에 "Brand: Brand B" 표시
```

---

## 7. 성능 테스트

### 7.1 Canvas 렌더링 성능

**목표**: 100개 객체를 가진 Canvas를 500ms 이내에 렌더링할 수 있다.

```javascript
// tests/performance/canvas-render.test.ts
import { performance } from 'perf_hooks';

test('100개 객체 렌더링 성능', async () => {
  const canvas = new fabric.Canvas('test-canvas');

  // 100개 객체 생성
  const objects = Array.from({ length: 100 }, (_, i) => ({
    type: 'rect',
    left: (i % 10) * 100,
    top: Math.floor(i / 10) * 100,
    width: 80,
    height: 80,
    fill: `#${Math.floor(Math.random()*16777215).toString(16)}`
  }));

  const startTime = performance.now();

  objects.forEach(obj => {
    const rect = new fabric.Rect(obj);
    canvas.add(rect);
  });

  canvas.renderAll();

  const endTime = performance.now();
  const renderTime = endTime - startTime;

  expect(renderTime).toBeLessThan(500); // 500ms 이내
  console.log(`렌더링 시간: ${renderTime.toFixed(2)}ms`);
});
```

### 7.2 API 응답 시간

**목표**: 95 percentile API 응답 시간이 2초 이내여야 한다.

```bash
# Artillery 부하 테스트
artillery run performance/api-load-test.yml

# api-load-test.yml
config:
  target: "http://localhost:8000"
  phases:
    - duration: 60
      arrivalRate: 10
  processor: "./processor.js"

scenarios:
  - name: "Document CRUD"
    flow:
      - post:
          url: "/api/v1/documents"
          json:
            name: "Test Doc"
            document_type: "concept_board"
            brand_id: "brand-test-001"
            document_json: { "version": "1.0", "objects": [] }
          capture:
            - json: "$.id"
              as: "docId"

      - get:
          url: "/api/v1/documents/{{ docId }}"

      - patch:
          url: "/api/v1/documents/{{ docId }}"
          json:
            document_json: { "version": "1.0", "objects": [{"type": "text"}] }

# Expected Results:
# p95 latency < 2000ms
# p99 latency < 3000ms
# Success rate > 99%
```

---

## 8. 테스트 체크리스트

### 8.1 Canvas Studio v3

- [ ] **문서 생성**
  - [ ] Concept Board 모드로 새 문서 생성
  - [ ] Pitch Deck 모드로 새 문서 생성
  - [ ] Product Story 모드로 새 문서 생성
  - [ ] Template으로부터 문서 생성

- [ ] **Chat 명령**
  - [ ] "제목 크기를 48로 바꿔줘" → update_font_size
  - [ ] "배경을 파란색으로 바꿔줘" → update_color
  - [ ] "이미지를 오른쪽으로 옮겨줘" → update_position
  - [ ] "새로운 제목을 추가해줘" → add_object
  - [ ] "이 텍스트를 삭제해줘" → delete_object
  - [ ] "모든 제목을 굵게 만들어줘" → update_font_weight
  - [ ] "전체 레이아웃을 재배치해줘" → replace_all_objects

- [ ] **Layout & UI**
  - [ ] Activity Bar 렌더링 (56px width)
  - [ ] Left Panel 렌더링 (280px width, 리사이즈 가능)
  - [ ] Canvas Viewport 렌더링 (Fabric.js)
  - [ ] Right Dock 렌더링 (360px width, 5개 탭)
  - [ ] Top Toolbar 렌더링 (Save, Undo, Redo, Export)

- [ ] **State Management**
  - [ ] Zustand store 초기화
  - [ ] canvasObjects 배열 업데이트
  - [ ] selectedObjects 배열 업데이트
  - [ ] isDirty 플래그 변경 감지
  - [ ] viewport (zoom, pan) 상태 저장

- [ ] **문서 저장 & 로드**
  - [ ] Ctrl+S로 저장 (API 호출)
  - [ ] 자동 저장 (30초마다)
  - [ ] 문서 로드 시 Canvas 복원
  - [ ] 버전 히스토리 조회
  - [ ] 이전 버전으로 복원

### 8.2 Concept Board

- [ ] **Mock Provider (Phase 1-3)**
  - [ ] PIL/Pillow 더미 이미지 생성
  - [ ] 파스텔 톤 배경색 생성
  - [ ] 프롬프트 텍스트 오버레이
  - [ ] ColorThief로 팔레트 추출
  - [ ] MinIO 업로드

- [ ] **Real API (Phase 4)**
  - [ ] NanoBanana API 호출
  - [ ] 이미지 다운로드 및 MinIO 재업로드
  - [ ] 생성 시간 측정
  - [ ] 에러 처리 (API 실패, 타임아웃)

- [ ] **Tile 관리**
  - [ ] 타일 생성 (POST /api/v1/concept-boards/{id}/tiles)
  - [ ] 타일 드래그 앤 드롭
  - [ ] 타일 리사이즈
  - [ ] 타일 삭제
  - [ ] 타일 Z-index 변경 (앞으로/뒤로 보내기)
  - [ ] 타일 팔레트 표시

- [ ] **브랜드 비주얼 스타일**
  - [ ] brand_visual_styles 테이블 CRUD
  - [ ] 타일 생성 시 스타일 참조
  - [ ] 스타일 업데이트 시 기존 타일 재생성 옵션

### 8.3 Generator API

- [ ] **Template 생성**
  - [ ] Concept Board 모드 생성
  - [ ] Pitch Deck 모드 생성
  - [ ] Product Story 모드 생성
  - [ ] 브랜드 컨텍스트 적용
  - [ ] 생성 시간 < 10초

- [ ] **모드 전환**
  - [ ] Concept Board → Pitch Deck
  - [ ] Pitch Deck → Product Story
  - [ ] 타일 정보 보존

- [ ] **에러 처리**
  - [ ] Generator API 타임아웃 (30초)
  - [ ] Generator API 에러 응답
  - [ ] Fallback 메커니즘

### 8.4 통합 시나리오

- [ ] **End-to-End Flow 1**
  - [ ] 새 Concept Board 생성
  - [ ] Mock Provider로 타일 5개 추가
  - [ ] 타일 배치 및 리사이즈
  - [ ] Pitch Deck으로 변환
  - [ ] Generator API로 레이아웃 재생성
  - [ ] 문서 저장
  - [ ] 버전 히스토리 확인

- [ ] **End-to-End Flow 2**
  - [ ] Template으로 Pitch Deck 생성
  - [ ] Chat으로 제목 수정
  - [ ] Chat으로 색상 변경
  - [ ] 브랜드 전환
  - [ ] 자동 색상 업데이트 확인
  - [ ] 문서 Export (PNG)

- [ ] **브라우저 호환성**
  - [ ] Chrome 120+
  - [ ] Safari 17+
  - [ ] Edge 120+
  - [ ] Firefox 121+

- [ ] **반응형 레이아웃**
  - [ ] 768px (태블릿)
  - [ ] 1024px (작은 데스크톱)
  - [ ] 1920px (일반 데스크톱)
  - [ ] 2560px (대형 모니터)

### 8.5 성능 기준

- [ ] **렌더링 성능**
  - [ ] 100개 객체 렌더링 < 500ms
  - [ ] Canvas pan/zoom 60fps
  - [ ] 타일 드래그 앤 드롭 60fps

- [ ] **API 성능**
  - [ ] Document CRUD p95 < 2s
  - [ ] Editor Action p95 < 1s
  - [ ] Generator API p95 < 10s
  - [ ] Mock Image Generation < 500ms
  - [ ] Real Image Generation < 8s

- [ ] **네트워크 성능**
  - [ ] 초기 페이지 로드 < 3s
  - [ ] Canvas JSON 압축 전송
  - [ ] 이미지 lazy loading

---

## 9. 테스트 실행 방법

### 9.1 로컬 테스트 (Phase 1-3)

```bash
# 1. 환경 변수 설정
export SPARKLIO_ENV=test
export USE_MOCK_PROVIDER=true
export POSTGRES_DB=sparklio_test

# 2. 테스트 DB 초기화
psql -U postgres -d sparklio_test -f scripts/init_test_db.sql

# 3. 백엔드 테스트
cd backend
source venv/bin/activate
pytest tests/ -v --cov=app

# 4. 프론트엔드 테스트
cd frontend
npm run test              # Unit tests (Jest)
npm run test:e2e          # E2E tests (Playwright)
npm run test:performance  # Performance tests

# 5. 통합 테스트
npm run test:integration  # 백엔드 + 프론트엔드 통합
```

### 9.2 스테이징 테스트 (Phase 4)

```bash
# 1. 환경 변수 설정
export SPARKLIO_ENV=staging
export USE_MOCK_PROVIDER=false
export API_BASE_URL=https://api-staging.sparklio.ai

# 2. E2E 테스트 실행
cd frontend
npm run test:e2e:staging

# 3. 부하 테스트
artillery run performance/api-load-test.yml --output staging-report.json
artillery report staging-report.json
```

---

## 10. 테스트 리포트

### 10.1 리포트 포맷

```markdown
# Test Report - Canvas Studio v3

**Date**: 2025-11-15
**Environment**: Staging
**Tester**: QA Team

## Summary

- Total Scenarios: 42
- Passed: 40
- Failed: 2
- Skipped: 0
- Success Rate: 95.2%

## Failed Scenarios

### 1. Canvas Studio - Chat 명령 "전체 레이아웃을 재배치해줘"
- **Expected**: replace_all_objects action 실행
- **Actual**: update_position action만 실행됨
- **Root Cause**: Generator API 파라미터 누락
- **Fix**: Backend chat service에 mode 파라미터 추가 필요

### 2. Concept Board - Real API 이미지 생성
- **Expected**: 생성 시간 < 8초
- **Actual**: 생성 시간 12.3초
- **Root Cause**: NanoBanana API 응답 지연
- **Fix**: 타임아웃 10초 → 15초로 조정

## Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Canvas Render (100 objects) | < 500ms | 387ms | ✅ PASS |
| Document CRUD p95 | < 2s | 1.2s | ✅ PASS |
| Generator API p95 | < 10s | 7.8s | ✅ PASS |
| Mock Image Gen | < 500ms | 234ms | ✅ PASS |
| Real Image Gen | < 8s | 12.3s | ❌ FAIL |

## Recommendations

1. Generator API 파라미터 검증 로직 추가
2. NanoBanana API 타임아웃 조정
3. Real API 이미지 생성 시 progress indicator 추가
```

---

**문서 끝**

이 통합 테스트 시나리오를 기반으로 QA팀이 체계적으로 테스트를 진행할 수 있으며, 각 Phase별로 Mock Provider와 Real API 전환 시점을 명확히 정의했습니다.
