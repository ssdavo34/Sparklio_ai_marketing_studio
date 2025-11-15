# Sparklio QA 테스트 가이드

**작성일**: 2025-11-15
**담당**: A팀 (QA & Testing)
**참고 문서**: [docs/A_TEAM_QA_WORK_ORDER.md](../docs/A_TEAM_QA_WORK_ORDER.md)

---

## 목차

1. [테스트 환경 설정](#1-테스트-환경-설정)
2. [E2E 테스트 실행](#2-e2e-테스트-실행)
3. [성능 테스트 실행](#3-성능-테스트-실행)
4. [테스트 픽스처 관리](#4-테스트-픽스처-관리)
5. [트러블슈팅](#5-트러블슈팅)

---

## 1. 테스트 환경 설정

### 1.1 필수 소프트웨어 설치

```bash
# Node.js 20.x 설치 확인
node -v  # v20.10.0 이상

# Python 3.11+ 설치 확인 (백엔드용)
python --version  # Python 3.11.6 이상

# PostgreSQL 15+ 설치 확인
psql --version  # psql (PostgreSQL) 15.4 이상
```

### 1.2 의존성 설치

```bash
# 1. 루트 디렉토리에서 npm 패키지 설치
npm install

# 2. Playwright 브라우저 설치
npx playwright install chromium webkit firefox

# 3. Artillery 글로벌 설치 (선택 사항)
npm install -g artillery
```

### 1.3 환경 변수 설정

```bash
# .env.test.example을 .env.test로 복사
cp .env.test.example .env.test

# .env.test 파일 편집 (필요한 값 수정)
# - POSTGRES_PASSWORD: PostgreSQL 비밀번호
# - TEST_TOKEN: 백엔드에서 생성한 JWT 토큰
```

### 1.4 테스트 데이터베이스 초기화

```bash
# 1. 테스트 DB 생성
createdb -U postgres sparklio_test

# 2. 스키마 적용 (백엔드 마이그레이션)
psql -U postgres -d sparklio_test -f backend/migrations/001_initial_schema.sql

# 3. 테스트 픽스처 데이터 삽입
npm run test:init-db
```

**예상 출력**:
```
테스트 사용자 생성: 3 명
테스트 브랜드 생성: 3 개
테스트 템플릿 생성: 3 개
테스트 문서 생성: 3 개
테스트 타일 생성: 3 개
=========================================
✅ 테스트 픽스처 데이터 초기화 완료
=========================================
```

### 1.5 백엔드 & 프론트엔드 실행

**터미널 1 (백엔드)**:
```bash
cd backend
source venv/bin/activate
python app/main.py
# → http://localhost:8000 실행
```

**터미널 2 (프론트엔드)**:
```bash
cd frontend
npm run dev
# → http://localhost:3000 실행
```

---

## 2. E2E 테스트 실행

### 2.1 전체 E2E 테스트 실행

```bash
# 모든 브라우저에서 테스트 실행
npm run test:e2e

# 특정 브라우저만 테스트
npm run test:e2e:chromium
npm run test:e2e:webkit
npm run test:e2e:firefox
```

### 2.2 UI 모드 (시각적 디버깅)

```bash
# Playwright UI 모드로 실행
npm run test:e2e:ui
```

브라우저가 열리면:
- 왼쪽에서 테스트 선택
- "Watch mode" 활성화
- 코드 수정 시 자동 재실행

### 2.3 특정 테스트만 실행

```bash
# Phase 1 Layout 테스트만 실행
npx playwright test tests/e2e/canvas-studio/01-layout.spec.ts

# 특정 테스트 케이스만 실행
npx playwright test tests/e2e/canvas-studio/01-layout.spec.ts -g "Activity Bar 렌더링"
```

### 2.4 디버그 모드

```bash
# 디버거 모드로 실행 (브라우저 자동 중지)
npm run test:e2e:debug

# 특정 테스트 디버깅
npx playwright test tests/e2e/canvas-studio/01-layout.spec.ts --debug
```

**디버거 사용법**:
- `F10`: 다음 단계 실행
- `F8`: 계속 실행
- `Shift+F5`: 중지

### 2.5 헤드리스 모드 비활성화 (브라우저 보기)

```bash
npm run test:e2e:headed
```

### 2.6 테스트 리포트 확인

```bash
# HTML 리포트 열기
npx playwright show-report test-results/html

# JSON 리포트 확인
cat test-results/results.json | jq
```

---

## 3. 성능 테스트 실행

### 3.1 로컬 환경 부하 테스트

```bash
# API 부하 테스트 실행
npm run test:perf
```

**예상 출력**:
```
Summary report @ 22:30:00(+0900)
  Scenarios launched:  1100
  Scenarios completed: 1100
  Requests completed:  4400
  Mean response/sec: 40.00
  Response time (msec):
    min: 12
    max: 1234
    median: 145
    p95: 456
    p99: 789
  Scenario counts:
    Document CRUD Operations: 440 (40%)
    Template Operations: 220 (20%)
    Editor Action API: 330 (30%)
    Concept Board Tiles: 110 (10%)
  Codes:
    200: 3520
    201: 880
```

### 3.2 스테이징 환경 부하 테스트

```bash
npm run test:perf:staging
```

### 3.3 커스텀 부하 테스트

```bash
# 더 높은 부하로 테스트 (초당 100 요청)
artillery run tests/performance/api-load-test.yml \
  --overrides '{
    "config": {
      "phases": [{"duration": 60, "arrivalRate": 100}]
    }
  }' \
  --output test-results/high-load.json

# 리포트 생성
artillery report test-results/high-load.json
```

### 3.4 성능 기준 검증

**통과 기준**:
- ✅ p95 응답 시간 < 2000ms
- ✅ p99 응답 시간 < 3000ms
- ✅ 에러율 < 1%

**실패 시 조치**:
1. `test-results/perf-report.json` 확인
2. 느린 API 엔드포인트 식별
3. B팀에 성능 이슈 리포트

---

## 4. 테스트 픽스처 관리

### 4.1 픽스처 데이터 재초기화

```bash
# 테스트 DB 데이터 재생성
npm run test:init-db
```

### 4.2 픽스처 데이터 확인

```bash
# 테스트 사용자 확인
psql -U postgres -d sparklio_test -c "SELECT id, email, role FROM users WHERE id LIKE 'user-test-%';"

# 테스트 브랜드 확인
psql -U postgres -d sparklio_test -c "SELECT id, name, primary_color FROM brands WHERE id LIKE 'brand-test-%';"

# 테스트 문서 확인
psql -U postgres -d sparklio_test -c "SELECT id, name, document_type, status FROM documents WHERE id LIKE 'doc-%fixture%';"
```

### 4.3 픽스처 수정

1. [tests/fixtures/test_data.sql](./fixtures/test_data.sql) 파일 편집
2. 데이터 재초기화: `npm run test:init-db`
3. 테스트 재실행: `npm run test:e2e`

---

## 5. 트러블슈팅

### 5.1 "Command not found: playwright"

**원인**: Playwright가 설치되지 않음

**해결**:
```bash
npm install
npx playwright install chromium
```

### 5.2 "Connection refused: http://localhost:3000"

**원인**: 프론트엔드 서버가 실행 중이지 않음

**해결**:
```bash
cd frontend
npm run dev
```

### 5.3 "FATAL: database 'sparklio_test' does not exist"

**원인**: 테스트 DB가 생성되지 않음

**해결**:
```bash
createdb -U postgres sparklio_test
npm run test:init-db
```

### 5.4 "401 Unauthorized" (API 호출 실패)

**원인**: TEST_TOKEN이 유효하지 않음

**해결**:
1. 백엔드에서 로그인하여 유효한 JWT 토큰 생성
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "qa@sparklio.ai", "password": "testpassword"}'
```

2. `.env.test` 파일의 `TEST_TOKEN` 값 업데이트

### 5.5 테스트 타임아웃

**원인**: API 응답이 느리거나 무한 대기

**해결**:
1. `playwright.config.ts`에서 타임아웃 증가:
```typescript
timeout: 120000, // 60초 → 120초
```

2. 백엔드 로그 확인:
```bash
cd backend
tail -f logs/app.log
```

### 5.6 스크린샷/비디오 저장 안 됨

**원인**: 디렉토리 권한 문제

**해결**:
```bash
mkdir -p test-results
chmod 755 test-results
```

---

## 6. CI/CD 통합 (GitHub Actions)

### 6.1 GitHub Actions 워크플로우

**.github/workflows/qa-tests.yml** (예시):
```yaml
name: QA Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Setup PostgreSQL
        run: |
          sudo systemctl start postgresql
          createdb -U postgres sparklio_test
          psql -U postgres -d sparklio_test -f backend/migrations/001_initial_schema.sql
          npm run test:init-db

      - name: Start backend
        run: |
          cd backend
          python -m venv venv
          source venv/bin/activate
          pip install -r requirements.txt
          python app/main.py &

      - name: Start frontend
        run: |
          cd frontend
          npm install
          npm run build
          npm run start &

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/
```

---

## 7. 참고 문서

- **QA 작업지시서**: [docs/A_TEAM_QA_WORK_ORDER.md](../docs/A_TEAM_QA_WORK_ORDER.md)
- **통합 테스트 시나리오**: [docs/INTEGRATION_TEST_SCENARIOS.md](../docs/INTEGRATION_TEST_SCENARIOS.md)
- **Playwright 공식 문서**: https://playwright.dev
- **Artillery 공식 문서**: https://www.artillery.io/docs

---

**작성자**: A팀 QA
**최종 수정**: 2025-11-15
