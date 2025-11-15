# A팀 QA 작업지시서 (Sparklio v4.3)

**작성일**: 2025-11-15
**버전**: v1.0
**담당**: A팀 (QA & Testing)
**우선순위**: P0

---

## 목차

1. [A팀 역할 및 책임](#1-a팀-역할-및-책임)
2. [테스트 전략 개요](#2-테스트-전략-개요)
3. [Phase별 테스트 계획](#3-phase별-테스트-계획)
4. [테스트 환경 설정](#4-테스트-환경-설정)
5. [Canvas Studio v3 테스트](#5-canvas-studio-v3-테스트)
6. [Concept Board 테스트](#6-concept-board-테스트)
7. [Generator API 테스트](#7-generator-api-테스트)
8. [성능 테스트](#8-성능-테스트)
9. [버그 리포팅 프로세스](#9-버그-리포팅-프로세스)
10. [DoD (Definition of Done)](#10-dod-definition-of-done)

---

## 1. A팀 역할 및 책임

### 1.1 핵심 역할

A팀은 **QA & Testing 전담팀**으로서 다음 책임을 가집니다:

1. **통합 테스트 실행**
   - Canvas Studio v3 E2E 테스트
   - Concept Board 기능 테스트
   - Generator API 통합 테스트
   - Cross-Feature 시나리오 테스트

2. **성능 테스트**
   - Canvas 렌더링 성능 측정
   - API 응답 시간 측정
   - 부하 테스트 (Artillery)
   - 메모리 누수 체크

3. **회귀 테스트**
   - 기존 기능 동작 확인
   - 버전 업그레이드 시 호환성 검증
   - 브라우저 호환성 테스트

4. **버그 리포팅 & 추적**
   - 버그 재현 시나리오 작성
   - B팀/C팀과 버그 커뮤니케이션
   - 버그 수정 검증 (Verification)

### 1.2 A팀 구성원 (예시)

- **QA Lead**: 테스트 전략 수립, 리포팅
- **QA Engineer 1**: Canvas Studio v3 테스트
- **QA Engineer 2**: Concept Board + Generator API 테스트
- **Performance Tester**: 성능 테스트 및 분석

---

## 2. 테스트 전략 개요

### 2.1 테스트 피라미드

```
         /\
        /  \  E2E Tests (10%)
       /____\
      /      \  Integration Tests (30%)
     /________\
    /          \ Unit Tests (60%)
   /____________\
```

**A팀 담당 범위**:
- ✅ E2E Tests (100% A팀 담당)
- ✅ Integration Tests (B팀/C팀과 협업)
- ⚠️ Unit Tests (B팀/C팀이 작성, A팀은 검토)

### 2.2 테스트 레벨

| 레벨 | 담당 | 도구 | 목적 |
|-----|------|------|------|
| Unit | B팀/C팀 | pytest, Jest | 개별 함수/컴포넌트 검증 |
| Integration | A팀 + B/C팀 | pytest, Jest | 모듈 간 통합 검증 |
| E2E | A팀 | Playwright | 사용자 시나리오 검증 |
| Performance | A팀 | Artillery, Lighthouse | 성능 기준 검증 |

### 2.3 테스트 범위 (P0 Only)

| 기능 | 우선순위 | 테스트 시나리오 수 | 예상 소요 |
|-----|---------|------------------|----------|
| Canvas Studio v3 | P0 | 25개 | 3일 |
| Concept Board (Mock) | P0 | 15개 | 2일 |
| Generator API | P0 | 10개 | 1일 |
| Cross-Feature | P0 | 5개 | 1일 |
| Performance | P0 | 5개 | 1일 |
| **합계** | | **60개** | **8일** |

### 2.4 Exit Criteria (출시 기준)

✅ **테스트 통과율**:
- P0 E2E 시나리오: 100% 통과
- Integration 테스트: 95% 이상 통과
- Performance 테스트: 모든 기준 충족

✅ **버그 상태**:
- Critical/Blocker 버그: 0개
- Major 버그: 최대 3개 (workaround 있어야 함)
- Minor 버그: 최대 10개

✅ **성능 기준**:
- Canvas 렌더링 (100개 객체): < 500ms
- API 응답 시간 p95: < 2초
- Generator API p95: < 10초

---

## 3. Phase별 테스트 계획

### 3.1 Phase 1: VSCode Layout 구조 (Week 1)

**C팀 작업 완료 후 테스트 시작**

**테스트 항목**:
1. Activity Bar 렌더링 (56px width)
2. Left Panel 렌더링 (280px width, 리사이즈 가능)
3. Canvas Viewport 렌더링
4. Right Dock 렌더링 (360px width, 5개 탭)
5. Top Toolbar 렌더링

**DoD**:
- [ ] 모든 레이아웃 요소가 정확한 크기로 렌더링됨
- [ ] 1920x1080, 1024x768, 2560x1440 해상도에서 정상 작동
- [ ] Left Panel 리사이즈 동작 정상
- [ ] Right Dock 탭 전환 정상

**예상 소요**: 1일

---

### 3.2 Phase 2: Fabric.js Canvas 통합 (Week 2)

**C팀 작업 완료 후 테스트 시작**

**테스트 항목**:
1. Fabric.js Canvas 초기화
2. 텍스트 객체 추가/수정/삭제
3. 이미지 객체 추가/수정/삭제
4. 도형 객체 (rect, circle) 추가/수정/삭제
5. 객체 선택/드래그/리사이즈
6. Canvas zoom/pan 동작

**DoD**:
- [ ] 100개 객체 렌더링 시간 < 500ms
- [ ] 드래그 앤 드롭 60fps 유지
- [ ] zoom/pan 60fps 유지
- [ ] 객체 선택 시 바운딩 박스 표시 정상

**예상 소요**: 2일

---

### 3.3 Phase 3: Zustand State 관리 (Week 3)

**C팀 작업 완료 후 테스트 시작**

**테스트 항목**:
1. editorStore 초기화
2. canvasObjects 배열 업데이트
3. selectedObjects 배열 업데이트
4. isDirty 플래그 변경 감지
5. Undo/Redo 동작
6. 문서 저장/로드

**DoD**:
- [ ] 모든 상태 변경이 UI에 즉시 반영됨
- [ ] Undo/Redo 10단계 정상 동작
- [ ] 문서 저장 후 새로고침 시 상태 복원 정상
- [ ] 메모리 누수 없음 (10분 작업 시)

**예상 소요**: 1.5일

---

### 3.4 Phase 4: End-to-End 통합 (Week 4)

**B팀 + C팀 작업 완료 후 테스트 시작**

**테스트 항목**:
1. 새 문서 생성 E2E
2. Chat 명령 → Canvas 수정 E2E
3. Template → 문서 생성 E2E
4. Concept Board Mock 이미지 생성 E2E
5. Concept Board → Pitch Deck 전환 E2E
6. Generator API 통합 E2E

**DoD**:
- [ ] 모든 E2E 시나리오 100% 통과
- [ ] Mock Provider → Real API 전환 시 동작 일치
- [ ] Chrome, Safari, Edge 브라우저 호환성 확인
- [ ] 모바일 반응형 확인 (768px, 1024px)

**예상 소요**: 2.5일

---

## 4. 테스트 환경 설정

### 4.1 로컬 테스트 환경

**필수 소프트웨어**:
```bash
# 1. Node.js 20.x
node -v  # v20.10.0

# 2. Python 3.11+
python --version  # Python 3.11.6

# 3. PostgreSQL 15+
psql --version  # psql (PostgreSQL) 15.4

# 4. Playwright
npm install -g @playwright/test
playwright install chromium webkit

# 5. Artillery (부하 테스트)
npm install -g artillery
```

**환경 변수 설정**:
```bash
# .env.test
SPARKLIO_ENV=test
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
USE_MOCK_PROVIDER=true
POSTGRES_DB=sparklio_test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=testpassword
MINIO_ENDPOINT=localhost:9000
MINIO_BUCKET=sparklio-test
REDIS_URL=redis://localhost:6379/0
```

### 4.2 테스트 데이터베이스 초기화

```bash
# 1. 테스트 DB 생성
createdb -U postgres sparklio_test

# 2. 스키마 적용
psql -U postgres -d sparklio_test -f backend/migrations/001_initial_schema.sql

# 3. 테스트 데이터 삽입
psql -U postgres -d sparklio_test -f tests/fixtures/test_data.sql
```

**test_data.sql** (테스트 픽스처):
```sql
-- 테스트 브랜드
INSERT INTO brands (id, name, primary_color, created_at)
VALUES
  ('brand-test-001', 'Test Brand Alpha', '#FF6B35', NOW()),
  ('brand-test-002', 'Test Brand Beta', '#4A90E2', NOW());

-- 테스트 사용자
INSERT INTO users (id, email, role, created_at)
VALUES
  ('user-test-001', 'qa@sparklio.ai', 'admin', NOW()),
  ('user-test-002', 'qa2@sparklio.ai', 'editor', NOW());

-- 테스트 템플릿
INSERT INTO templates (id, name, template_type, mode, canvas_json, created_at)
VALUES
  ('template-concept-001', 'Test Concept Board', 'concept_board', 'concept_board',
   '{"version":"1.0","objects":[]}', NOW()),
  ('template-pitch-001', 'Test Pitch Deck', 'pitch_deck', 'pitch_deck',
   '{"version":"1.0","objects":[{"type":"text","name":"Title","props":{"fontSize":64}}]}', NOW());
```

### 4.3 Playwright 설정

**playwright.config.ts**:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
```

---

## 5. Canvas Studio v3 테스트

### 5.1 테스트 시나리오 1: 새 문서 생성

**테스트 파일**: `tests/e2e/canvas-studio/create-document.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas Studio - 새 문서 생성', () => {
  test('Concept Board 모드로 새 문서 생성', async ({ page }) => {
    // 1. 로그인
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'qa@sparklio.ai');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // 2. Studio 페이지 이동
    await page.goto('/studio');
    await expect(page).toHaveURL(/\/studio/);

    // 3. New Document 버튼 클릭
    await page.click('[data-testid="activity-bar-new-doc"]');

    // 4. 모드 선택 다이얼로그
    await expect(page.locator('[data-testid="mode-select-dialog"]')).toBeVisible();
    await page.click('[data-testid="mode-concept-board"]');

    // 5. 문서 이름 입력
    await page.fill('[data-testid="doc-name-input"]', 'My Test Concept Board');
    await page.click('[data-testid="create-button"]');

    // 6. Canvas 로드 확인
    await expect(page.locator('canvas')).toBeVisible({ timeout: 3000 });

    // 7. URL 변경 확인
    await expect(page).toHaveURL(/\/studio\/doc-/);

    // 8. Left Panel 제목 확인
    await expect(page.locator('[data-testid="document-title"]')).toContainText('My Test Concept Board');

    // 9. Right Dock Chat 탭 활성화 확인
    await expect(page.locator('[data-testid="right-dock-chat"]')).toHaveClass(/active/);

    // 10. 저장 (Ctrl+S)
    await page.keyboard.press('Control+S');

    // 11. 토스트 메시지 확인
    await expect(page.locator('.toast-success')).toContainText(/saved successfully/i);
  });

  test('Pitch Deck 모드로 새 문서 생성', async ({ page }) => {
    await page.goto('/studio');
    await page.click('[data-testid="activity-bar-new-doc"]');
    await page.click('[data-testid="mode-pitch-deck"]');
    await page.fill('[data-testid="doc-name-input"]', 'My Pitch Deck');
    await page.click('[data-testid="create-button"]');

    await expect(page.locator('canvas')).toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL(/\/studio\/doc-/);
  });
});
```

**체크리스트**:
- [ ] Concept Board 모드 생성 성공
- [ ] Pitch Deck 모드 생성 성공
- [ ] Product Story 모드 생성 성공
- [ ] 문서 이름이 Left Panel에 표시됨
- [ ] Canvas가 정상 렌더링됨
- [ ] URL이 `/studio/{document_id}`로 변경됨
- [ ] Ctrl+S 저장 성공

---

### 5.2 테스트 시나리오 2: Chat 명령으로 Canvas 수정

**테스트 파일**: `tests/e2e/canvas-studio/chat-commands.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas Studio - Chat 명령', () => {
  test.beforeEach(async ({ page }) => {
    // 기존 문서 로드 (픽스처에 미리 생성된 문서)
    await page.goto('/studio/doc-fixture-001');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('"제목 크기를 48로 바꿔줘" 명령 실행', async ({ page }) => {
    // 1. Chat 탭 클릭
    await page.click('[data-testid="right-dock-tab-chat"]');

    // 2. 채팅 입력
    await page.fill('[data-testid="chat-input"]', '제목 크기를 48로 바꿔줘');
    await page.keyboard.press('Enter');

    // 3. 사용자 메시지 표시 확인
    await expect(page.locator('[data-testid="chat-message-user"]').last())
      .toContainText('제목 크기를 48로 바꿔줘');

    // 4. 로딩 인디케이터 표시
    await expect(page.locator('[data-testid="chat-loading"]')).toBeVisible();

    // 5. AI 응답 대기 (최대 5초)
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toContainText(/48/i, { timeout: 5000 });

    // 6. Canvas 업데이트 확인 (Inspector 탭)
    await page.click('[data-testid="right-dock-tab-inspector"]');
    await expect(page.locator('[data-testid="inspector-font-size"]'))
      .toContainText('48');

    // 7. isDirty 플래그 확인 (저장 필요 상태)
    await expect(page.locator('[data-testid="save-indicator"]'))
      .toContainText(/unsaved/i);
  });

  test('"배경을 파란색으로 바꿔줘" 명령 실행', async ({ page }) => {
    await page.click('[data-testid="right-dock-tab-chat"]');
    await page.fill('[data-testid="chat-input"]', '배경을 파란색으로 바꿔줘');
    await page.keyboard.press('Enter');

    // AI 응답 대기
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 5000 });

    // Canvas에서 배경색 변경 확인 (Fabric.js 객체 속성 체크)
    const bgColor = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const bgObject = canvas.getObjects().find((obj: any) => obj.name === 'Background');
      return bgObject?.fill;
    });

    expect(bgColor).toMatch(/#[0-9A-F]{6}/i); // 색상 hex 코드 확인
  });

  test('"이미지를 오른쪽으로 100px 옮겨줘" 명령 실행', async ({ page }) => {
    // 초기 이미지 위치 저장
    const initialLeft = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const imgObject = canvas.getObjects().find((obj: any) => obj.type === 'image');
      return imgObject?.left || 0;
    });

    await page.click('[data-testid="right-dock-tab-chat"]');
    await page.fill('[data-testid="chat-input"]', '이미지를 오른쪽으로 100px 옮겨줘');
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 5000 });

    // 이미지 위치 변경 확인
    const newLeft = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const imgObject = canvas.getObjects().find((obj: any) => obj.type === 'image');
      return imgObject?.left || 0;
    });

    expect(newLeft).toBeCloseTo(initialLeft + 100, 5); // 오차 5px 허용
  });
});
```

**체크리스트**:
- [ ] "제목 크기를 48로 바꿔줘" → update_font_size 성공
- [ ] "배경을 파란색으로 바꿔줘" → update_color 성공
- [ ] "이미지를 오른쪽으로 옮겨줘" → update_position 성공
- [ ] "새로운 제목을 추가해줘" → add_object 성공
- [ ] "이 텍스트를 삭제해줘" → delete_object 성공
- [ ] Chat 응답 시간 < 2초 (p95)
- [ ] isDirty 플래그 정상 동작

---

### 5.3 테스트 시나리오 3: Template으로 문서 생성

**테스트 파일**: `tests/e2e/canvas-studio/template-instantiate.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas Studio - Template 문서 생성', () => {
  test('Pitch Deck Template으로 새 문서 생성', async ({ page }) => {
    // 1. Studio 페이지 이동
    await page.goto('/studio');

    // 2. Activity Bar에서 Templates 아이콘 클릭
    await page.click('[data-testid="activity-bar-templates"]');

    // 3. Left Panel에 Template 목록 표시 확인
    await expect(page.locator('[data-testid="template-list"]')).toBeVisible();

    // 4. Template 검색 (Pitch Deck만 필터)
    await page.click('[data-testid="template-filter-pitch-deck"]');

    // 5. "Test Pitch Deck" Template 클릭
    await page.click('[data-testid="template-item-template-pitch-001"]');

    // 6. Template 미리보기 모달 표시
    await expect(page.locator('[data-testid="template-preview-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-preview-thumbnail"]')).toBeVisible();

    // 7. "Use This Template" 버튼 클릭
    await page.click('[data-testid="use-template-button"]');

    // 8. 문서 이름 입력
    await page.fill('[data-testid="doc-name-input"]', 'Q4 Investor Pitch');
    await page.click('[data-testid="create-button"]');

    // 9. Canvas 로드 및 Template 객체 렌더링 확인
    await expect(page.locator('canvas')).toBeVisible({ timeout: 3000 });

    // 10. Template의 제목 텍스트가 Canvas에 있는지 확인
    const hasTitle = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const titleObject = canvas.getObjects().find((obj: any) => obj.name === 'Title');
      return titleObject !== undefined;
    });
    expect(hasTitle).toBe(true);

    // 11. 문서 이름 확인
    await expect(page.locator('[data-testid="document-title"]'))
      .toContainText('Q4 Investor Pitch');
  });
});
```

**체크리스트**:
- [ ] Template 목록 조회 성공
- [ ] Template 미리보기 모달 표시
- [ ] Template 필터링 동작 (Concept Board, Pitch Deck, Product Story)
- [ ] Template으로 문서 생성 성공
- [ ] Template 객체들이 Canvas에 정상 렌더링됨
- [ ] 문서 이름이 입력한 값으로 설정됨

---

### 5.4 테스트 시나리오 4: 문서 버전 관리

**테스트 파일**: `tests/e2e/canvas-studio/version-history.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas Studio - 문서 버전 관리', () => {
  test('문서 수정 후 이전 버전으로 복원', async ({ page }) => {
    // 1. 기존 문서 로드
    await page.goto('/studio/doc-fixture-001');
    await expect(page.locator('canvas')).toBeVisible();

    // 2. 초기 텍스트 확인
    const initialText = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const textObject = canvas.getObjects().find((obj: any) => obj.type === 'text');
      return textObject?.text || '';
    });

    // 3. Chat으로 텍스트 수정
    await page.click('[data-testid="right-dock-tab-chat"]');
    await page.fill('[data-testid="chat-input"]', '제목을 "Updated Title"로 바꿔줘');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 5000 });

    // 4. 저장
    await page.keyboard.press('Control+S');
    await expect(page.locator('.toast-success')).toBeVisible();

    // 5. 텍스트 변경 확인
    const updatedText = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const textObject = canvas.getObjects().find((obj: any) => obj.type === 'text');
      return textObject?.text || '';
    });
    expect(updatedText).toBe('Updated Title');

    // 6. Version History 버튼 클릭
    await page.click('[data-testid="toolbar-version-history"]');

    // 7. 버전 목록 모달 표시
    await expect(page.locator('[data-testid="version-history-modal"]')).toBeVisible();

    // 8. v1 버전 선택
    await page.click('[data-testid="version-item-1"]');

    // 9. "Restore This Version" 버튼 클릭
    await page.click('[data-testid="restore-version-button"]');

    // 10. 확인 다이얼로그
    await page.click('[data-testid="confirm-restore"]');

    // 11. Canvas에 초기 텍스트 복원 확인
    const restoredText = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const textObject = canvas.getObjects().find((obj: any) => obj.type === 'text');
      return textObject?.text || '';
    });
    expect(restoredText).toBe(initialText);

    // 12. 토스트 메시지 확인
    await expect(page.locator('.toast-success'))
      .toContainText(/Restored to version 1/i);
  });
});
```

**체크리스트**:
- [ ] 문서 수정 후 저장 시 version 증가
- [ ] Version History 모달 표시
- [ ] 버전 목록에 타임스탬프 및 설명 표시
- [ ] 이전 버전 복원 성공
- [ ] 복원 후 새 version 생성됨 (v1 복사본 → v3)

---

## 6. Concept Board 테스트

### 6.1 테스트 시나리오 5: Mock Provider 타일 생성

**테스트 파일**: `tests/e2e/concept-board/mock-tile-generation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Concept Board - Mock 타일 생성', () => {
  test.beforeEach(async ({ page }) => {
    // 환경 변수 확인 (Mock Provider 활성화)
    const useMock = process.env.USE_MOCK_PROVIDER;
    expect(useMock).toBe('true');
  });

  test('프롬프트로 Mock 이미지 타일 생성', async ({ page }) => {
    // 1. Concept Board 문서 로드
    await page.goto('/studio/doc-concept-fixture-001');
    await expect(page.locator('canvas')).toBeVisible();

    // 2. Right Dock "Data" 탭 클릭
    await page.click('[data-testid="right-dock-tab-data"]');

    // 3. "Add Tile" 버튼 클릭
    await page.click('[data-testid="add-tile-button"]');

    // 4. 프롬프트 입력창 표시
    await expect(page.locator('[data-testid="tile-prompt-input"]')).toBeVisible();

    // 5. 프롬프트 입력
    await page.fill('[data-testid="tile-prompt-input"]', 'minimalist office interior');

    // 6. "Generate" 버튼 클릭
    await page.click('[data-testid="generate-tile-button"]');

    // 7. 로딩 인디케이터 표시
    await expect(page.locator('[data-testid="tile-generating"]')).toBeVisible();

    // 8. 타일 생성 완료 (최대 2초)
    await expect(page.locator('[data-testid="tile-generating"]'))
      .toBeHidden({ timeout: 2000 });

    // 9. Canvas에 새 타일 표시 확인
    const tileCount = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas.getObjects().filter((obj: any) => obj.type === 'image').length;
    });
    expect(tileCount).toBeGreaterThan(0);

    // 10. Inspector 탭에서 타일 정보 확인
    await page.click('[data-testid="right-dock-tab-inspector"]');
    await expect(page.locator('[data-testid="inspector-source"]'))
      .toContainText('Mock Provider');
    await expect(page.locator('[data-testid="inspector-prompt"]'))
      .toContainText('minimalist office interior');

    // 11. 팔레트 색상 3개 표시 확인
    const paletteColors = await page.locator('[data-testid="inspector-palette-color"]').count();
    expect(paletteColors).toBe(3);
  });

  test('Mock 이미지에 프롬프트 텍스트 오버레이 표시', async ({ page }) => {
    await page.goto('/studio/doc-concept-fixture-001');

    await page.click('[data-testid="right-dock-tab-data"]');
    await page.click('[data-testid="add-tile-button"]');
    await page.fill('[data-testid="tile-prompt-input"]', 'modern workspace');
    await page.click('[data-testid="generate-tile-button"]');

    await expect(page.locator('[data-testid="tile-generating"]'))
      .toBeHidden({ timeout: 2000 });

    // Canvas에서 타일 이미지 다운로드 및 확인
    const tileImageUrl = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const tileImage = canvas.getObjects().find((obj: any) => obj.type === 'image');
      return tileImage?._element?.src || '';
    });

    expect(tileImageUrl).toContain('minio'); // MinIO URL 확인
    expect(tileImageUrl).toMatch(/\.png$/); // PNG 파일
  });
});
```

**체크리스트**:
- [ ] Mock 타일 생성 성공 (< 500ms)
- [ ] Canvas에 타일 이미지 표시
- [ ] Inspector에 "Source: Mock Provider" 표시
- [ ] 팔레트 3개 색상 추출 및 표시
- [ ] 프롬프트 텍스트 저장 확인
- [ ] MinIO에 이미지 업로드 확인

---

### 6.2 테스트 시나리오 6: 타일 배치 및 리사이즈

**테스트 파일**: `tests/e2e/concept-board/tile-layout.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Concept Board - 타일 배치', () => {
  test('타일 드래그 앤 드롭', async ({ page }) => {
    await page.goto('/studio/doc-concept-fixture-001');
    await expect(page.locator('canvas')).toBeVisible();

    // 1. 초기 타일 위치 저장
    const initialPosition = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const tile = canvas.getObjects()[0];
      return { left: tile.left, top: tile.top };
    });

    // 2. Canvas에서 타일 선택 (클릭)
    await page.locator('canvas').click({ position: { x: 200, y: 200 } });

    // 3. 선택 바운딩 박스 표시 확인
    const isSelected = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas.getActiveObject() !== null;
    });
    expect(isSelected).toBe(true);

    // 4. 드래그 앤 드롭 (200, 200 → 300, 300)
    await page.locator('canvas').dragTo(page.locator('canvas'), {
      sourcePosition: { x: 200, y: 200 },
      targetPosition: { x: 300, y: 300 },
    });

    // 5. 새 위치 확인
    const newPosition = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const tile = canvas.getObjects()[0];
      return { left: tile.left, top: tile.top };
    });

    expect(newPosition.left).toBeGreaterThan(initialPosition.left);
    expect(newPosition.top).toBeGreaterThan(initialPosition.top);

    // 6. isDirty 플래그 확인
    await expect(page.locator('[data-testid="save-indicator"]'))
      .toContainText(/unsaved/i);
  });

  test('타일 리사이즈', async ({ page }) => {
    await page.goto('/studio/doc-concept-fixture-001');
    await expect(page.locator('canvas')).toBeVisible();

    // 1. 초기 타일 크기 저장
    const initialSize = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const tile = canvas.getObjects()[0];
      return { width: tile.width * tile.scaleX, height: tile.height * tile.scaleY };
    });

    // 2. 타일 선택
    await page.locator('canvas').click({ position: { x: 200, y: 200 } });

    // 3. 우측 하단 핸들 드래그 (리사이즈)
    // Note: Playwright에서 Fabric.js 핸들 드래그는 복잡하므로, evaluate로 직접 조작
    await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const tile = canvas.getActiveObject();
      tile.scaleX = 1.5;
      tile.scaleY = 1.5;
      canvas.fire('object:modified', { target: tile });
      canvas.renderAll();
    });

    // 4. 새 크기 확인
    const newSize = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      const tile = canvas.getObjects()[0];
      return { width: tile.width * tile.scaleX, height: tile.height * tile.scaleY };
    });

    expect(newSize.width).toBeCloseTo(initialSize.width * 1.5, 1);
    expect(newSize.height).toBeCloseTo(initialSize.height * 1.5, 1);

    // 5. Inspector 탭에서 크기 확인
    await page.click('[data-testid="right-dock-tab-inspector"]');
    await expect(page.locator('[data-testid="inspector-width"]'))
      .toContainText(String(Math.round(newSize.width)));
  });
});
```

**체크리스트**:
- [ ] 타일 선택 시 바운딩 박스 표시
- [ ] 타일 드래그 앤 드롭 성공
- [ ] 타일 리사이즈 성공 (8방향 핸들)
- [ ] Inspector 탭에 실시간 좌표/크기 업데이트
- [ ] isDirty 플래그 동작
- [ ] 저장 후 위치/크기 복원 확인

---

## 7. Generator API 테스트

### 7.1 테스트 시나리오 7: Generator API 통합

**테스트 파일**: `tests/e2e/generator/api-integration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Generator API - 통합 테스트', () => {
  test('Chat 프롬프트로 Pitch Deck 생성', async ({ page }) => {
    // 1. 빈 Pitch Deck 문서 생성
    await page.goto('/studio');
    await page.click('[data-testid="activity-bar-new-doc"]');
    await page.click('[data-testid="mode-pitch-deck"]');
    await page.fill('[data-testid="doc-name-input"]', 'Auto Generated Pitch');
    await page.click('[data-testid="create-button"]');

    await expect(page.locator('canvas')).toBeVisible();

    // 2. Chat 탭에서 Generator 프롬프트 입력
    await page.click('[data-testid="right-dock-tab-chat"]');
    await page.fill('[data-testid="chat-input"]', `
우리 스타트업 소개 자료를 만들어줘.
회사명: TechVenture
핵심 가치: AI 기반 자동화
타겟: B2B SaaS
    `.trim());
    await page.keyboard.press('Enter');

    // 3. 로딩 인디케이터 (Generator API는 5-10초 소요)
    await expect(page.locator('[data-testid="chat-loading"]')).toBeVisible();

    // 4. AI 응답 대기 (최대 15초)
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toBeVisible({ timeout: 15000 });

    // 5. Canvas에 객체 생성 확인
    const objectCount = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas.getObjects().length;
    });
    expect(objectCount).toBeGreaterThan(0);

    // 6. "TechVenture" 텍스트 존재 확인
    const hasCompanyName = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas.getObjects().some((obj: any) =>
        obj.type === 'text' && obj.text?.includes('TechVenture')
      );
    });
    expect(hasCompanyName).toBe(true);

    // 7. Chat에 생성 시간 표시 확인
    await expect(page.locator('[data-testid="chat-message-ai"]').last())
      .toContainText(/\d+\.\d+초/); // "6.2초 소요" 형식
  });

  test('Generator API 타임아웃 처리', async ({ page }) => {
    // Generator API Mock을 30초 지연으로 설정 (타임아웃 테스트)
    await page.route('**/api/v1/chat/send', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 31000)); // 31초 지연
      await route.fulfill({ status: 504, body: 'Gateway Timeout' });
    });

    await page.goto('/studio/doc-pitch-fixture-001');
    await page.click('[data-testid="right-dock-tab-chat"]');
    await page.fill('[data-testid="chat-input"]', '새 레이아웃을 만들어줘');
    await page.keyboard.press('Enter');

    // 에러 메시지 확인 (30초 후)
    await expect(page.locator('[data-testid="chat-message-error"]').last())
      .toContainText(/timeout/i, { timeout: 32000 });
  });
});
```

**체크리스트**:
- [ ] Generator API 호출 성공
- [ ] 생성 시간 < 10초 (p95)
- [ ] Canvas에 객체 정상 렌더링
- [ ] 브랜드 컬러 적용 확인
- [ ] Generator API 타임아웃 에러 처리
- [ ] Generator API 에러 응답 처리

---

## 8. 성능 테스트

### 8.1 Canvas 렌더링 성능

**테스트 파일**: `tests/performance/canvas-render.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('성능 테스트 - Canvas 렌더링', () => {
  test('100개 객체 렌더링 성능', async ({ page }) => {
    await page.goto('/studio/doc-performance-100-objects');

    // Canvas 렌더링 시간 측정
    const renderTime = await page.evaluate(() => {
      const startTime = performance.now();

      const canvas = (window as any).fabricCanvas;
      canvas.renderAll();

      const endTime = performance.now();
      return endTime - startTime;
    });

    console.log(`렌더링 시간: ${renderTime.toFixed(2)}ms`);

    // 기준: 100개 객체 렌더링 < 500ms
    expect(renderTime).toBeLessThan(500);
  });

  test('드래그 앤 드롭 60fps 유지', async ({ page }) => {
    await page.goto('/studio/doc-performance-100-objects');

    // FPS 측정
    const fps = await page.evaluate(async () => {
      const canvas = (window as any).fabricCanvas;
      const tile = canvas.getObjects()[0];

      let frameCount = 0;
      const startTime = performance.now();

      // 1초 동안 객체 이동
      for (let i = 0; i < 100; i++) {
        tile.set({ left: i * 2 });
        canvas.renderAll();
        frameCount++;
        await new Promise(resolve => requestAnimationFrame(resolve));
      }

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // 초 단위
      return frameCount / duration;
    });

    console.log(`평균 FPS: ${fps.toFixed(2)}`);

    // 기준: 60fps 이상
    expect(fps).toBeGreaterThanOrEqual(60);
  });
});
```

### 8.2 API 응답 시간 (Artillery 부하 테스트)

**테스트 파일**: `tests/performance/api-load-test.yml`

```yaml
config:
  target: "http://localhost:8000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Sustained load"
  processor: "./processor.js"

scenarios:
  - name: "Document CRUD"
    flow:
      - post:
          url: "/api/v1/documents"
          headers:
            Authorization: "Bearer {{ $processEnvironment.TEST_TOKEN }}"
          json:
            name: "Load Test Doc"
            document_type: "concept_board"
            brand_id: "brand-test-001"
            document_json:
              version: "1.0"
              objects: []
          capture:
            - json: "$.id"
              as: "docId"

      - get:
          url: "/api/v1/documents/{{ docId }}"
          headers:
            Authorization: "Bearer {{ $processEnvironment.TEST_TOKEN }}"

      - patch:
          url: "/api/v1/documents/{{ docId }}"
          headers:
            Authorization: "Bearer {{ $processEnvironment.TEST_TOKEN }}"
          json:
            document_json:
              version: "1.0"
              objects:
                - type: "text"
                  text: "Updated"
```

**실행 방법**:
```bash
# 부하 테스트 실행
artillery run tests/performance/api-load-test.yml --output report.json

# 리포트 생성
artillery report report.json
```

**성공 기준**:
- p95 latency < 2000ms
- p99 latency < 3000ms
- Success rate > 99%

---

## 9. 버그 리포팅 프로세스

### 9.1 버그 리포트 템플릿

**GitHub Issue 템플릿**:

```markdown
## 🐛 버그 리포트

**버그 요약**: (한 줄 요약)

**재현 환경**:
- OS: Windows 11 / macOS 14 / Ubuntu 22.04
- 브라우저: Chrome 120.0.6099.109
- 환경: Local / Staging / Production
- USE_MOCK_PROVIDER: true / false

**재현 단계**:
1. `/studio` 페이지로 이동
2. "New Document" 버튼 클릭
3. Concept Board 모드 선택
4. ...

**예상 동작**:
Canvas에 빈 문서가 로드되어야 함

**실제 동작**:
Canvas가 로드되지 않고 흰 화면만 표시됨

**스크린샷**:
![스크린샷](https://...)

**콘솔 에러**:
```
Error: Cannot read property 'renderAll' of undefined
  at StudioLayout.tsx:42
```

**추가 정보**:
- Network 탭에서 API 호출 실패 확인: `POST /api/v1/documents` → 500 Error
- 로그인 사용자: qa@sparklio.ai

**심각도**:
- [x] Critical (서비스 사용 불가)
- [ ] Major (핵심 기능 동작 안 함)
- [ ] Minor (일부 기능 이상)
- [ ] Trivial (UI 이슈)

**담당 팀**:
- [ ] B팀 (백엔드)
- [x] C팀 (프론트엔드)
```

### 9.2 버그 우선순위 가이드

| 심각도 | 정의 | 예시 | 대응 시간 |
|--------|------|------|----------|
| **Critical** | 서비스 사용 불가 | 로그인 불가, Canvas 로드 실패, 서버 다운 | 즉시 (4시간 이내) |
| **Major** | 핵심 기능 동작 안 함 | Chat 명령 실행 실패, 문서 저장 안 됨 | 24시간 이내 |
| **Minor** | 일부 기능 이상 | Template 미리보기 안 보임, 색상 팔레트 누락 | 3일 이내 |
| **Trivial** | UI/UX 이슈 | 버튼 정렬 어긋남, 토스트 메시지 오타 | 1주일 이내 |

### 9.3 버그 검증 (Verification) 체크리스트

B팀/C팀이 버그 수정 완료 후, A팀이 다음을 확인:

- [ ] 재현 단계대로 테스트 시 버그 재현 안 됨
- [ ] 수정 사항이 다른 기능에 영향 없음 (회귀 테스트)
- [ ] Unit/Integration 테스트 추가됨
- [ ] 문서 업데이트됨 (필요 시)
- [ ] Staging 환경에서 검증 완료
- [ ] GitHub Issue에 "Verified" 라벨 추가

---

## 10. DoD (Definition of Done)

### 10.1 Phase별 DoD

**Phase 1 (VSCode Layout)**:
- [ ] 모든 레이아웃 요소 렌더링 (Activity Bar, Left Panel, Canvas, Right Dock, Top Toolbar)
- [ ] 3개 해상도 테스트 통과 (1920x1080, 1024x768, 2560x1440)
- [ ] Left Panel 리사이즈 동작 정상
- [ ] Right Dock 5개 탭 전환 정상
- [ ] 브라우저 호환성 (Chrome, Safari, Edge)

**Phase 2 (Fabric.js Canvas)**:
- [ ] Fabric.js Canvas 초기화 성공
- [ ] 객체 CRUD 동작 (텍스트, 이미지, 도형)
- [ ] 드래그 앤 드롭 60fps
- [ ] zoom/pan 60fps
- [ ] 100개 객체 렌더링 < 500ms

**Phase 3 (Zustand State)**:
- [ ] editorStore 정상 동작
- [ ] Undo/Redo 10단계 성공
- [ ] 문서 저장/로드 정상
- [ ] isDirty 플래그 동작
- [ ] 메모리 누수 없음 (10분 작업 시)

**Phase 4 (End-to-End)**:
- [ ] 10개 E2E 시나리오 100% 통과
- [ ] Mock Provider → Real API 전환 시 동작 일치
- [ ] 성능 기준 모두 충족
- [ ] Critical/Blocker 버그 0개
- [ ] Major 버그 최대 3개 (workaround 있음)

### 10.2 최종 출시 DoD

- [ ] **테스트**
  - [ ] E2E 테스트 100% 통과 (60개 시나리오)
  - [ ] Integration 테스트 95% 이상 통과
  - [ ] 성능 테스트 모든 기준 충족
  - [ ] 브라우저 호환성 테스트 통과 (Chrome, Safari, Edge, Firefox)
  - [ ] 반응형 테스트 통과 (768px, 1024px, 1920px, 2560px)

- [ ] **버그**
  - [ ] Critical/Blocker 버그 0개
  - [ ] Major 버그 최대 3개 (workaround 문서화됨)
  - [ ] Minor 버그 최대 10개

- [ ] **문서**
  - [ ] 사용자 매뉴얼 작성 완료
  - [ ] API 문서 업데이트 완료
  - [ ] Known Issues 문서 작성 완료

- [ ] **성능**
  - [ ] Canvas 렌더링 (100개 객체) < 500ms
  - [ ] API 응답 p95 < 2초
  - [ ] Generator API p95 < 10초
  - [ ] Mock Image Generation < 500ms
  - [ ] Real Image Generation < 8초

- [ ] **보안**
  - [ ] OWASP Top 10 취약점 없음
  - [ ] API 인증/인가 정상 동작
  - [ ] XSS/CSRF 방어 확인

---

## 11. 테스트 실행 스케줄

### 11.1 일일 테스트 (Daily)

**시간**: 매일 09:00 (자동화)

```bash
# CI/CD Pipeline (GitHub Actions)
- name: Daily E2E Tests
  run: |
    npm run test:e2e
    artillery run tests/performance/api-load-test.yml
```

**체크 항목**:
- [ ] E2E 테스트 전체 실행
- [ ] API 부하 테스트
- [ ] 테스트 실패 시 Slack 알림

### 11.2 주간 테스트 (Weekly)

**시간**: 매주 월요일 09:00

**체크 항목**:
- [ ] 브라우저 호환성 테스트 (Chrome, Safari, Edge, Firefox)
- [ ] 반응형 테스트 (4개 해상도)
- [ ] 회귀 테스트 (기존 기능 확인)
- [ ] 성능 트렌드 분석 (지난 주 대비)

### 11.3 Phase 완료 시 테스트

**Phase 1/2/3/4 각 완료 시**:

- [ ] 해당 Phase DoD 전체 확인
- [ ] 버그 리포트 작성 및 B/C팀 전달
- [ ] 테스트 리포트 작성 (성공률, 버그 통계)

---

## 12. 참고 문서

- **통합 테스트 시나리오**: `docs/INTEGRATION_TEST_SCENARIOS.md`
- **Canvas Studio v3 스펙**: `docs/C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md`
- **Concept Board 스펙**: `docs/CONCEPT_BOARD_SPEC.md`
- **시스템 아키텍처**: `docs/SYSTEM_ARCHITECTURE.md`

---

**작성 완료일**: 2025-11-15
**버전**: v1.0
**다음 액션**: A팀 온보딩, 테스트 환경 설정, Phase 1 테스트 시작

**Good luck, A팀! 🧪**
