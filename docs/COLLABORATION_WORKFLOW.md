# COLLABORATION_WORKFLOW.md
Sparklio V4 — 팀 간 협업 워크플로우
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 1. 협업 원칙

## 기본 방식
- ✅ **실제 폴더에서 직접 작업** (backend/, frontend/)
- ✅ **머지 절차 없음** - 즉시 반영, 즉시 테스트
- ✅ **수정 요청서**로 다른 팀 폴더 수정 요청
- ✅ **실시간 통합 테스트** 가능

---

# 2. 폴더별 권한

| 폴더 | 주 담당 팀 | 수정 권한 | 읽기 권한 | Git 커밋 권한 |
|------|-----------|-----------|-----------|--------------|
| `backend/` | **B팀** | B팀만 | A/C팀 | B팀만 |
| `frontend/` | **C팀** | C팀만 | A/B팀 | C팀만 |
| `docs/` | **A팀** | A팀 주관 | 모든 팀 | A팀 주관 |
| `infrastructure/` | **A팀** | A팀만 | B/C팀 | A팀만 |
| `docs/requests/` | **공유** | 모든 팀 | 모든 팀 | 작성한 팀 |

## 규칙
1. **절대 다른 팀 폴더를 직접 수정하지 않습니다**
2. **수정이 필요하면 수정 요청서를 작성합니다**
3. **요청서는 `docs/requests/` 폴더에 저장합니다**

---

# 3. 수정 요청 프로세스

## 3.1 워크플로우

```
┌─────────────┐
│ 1. 요청 팀  │  수정 요청서 작성
│   (C팀)     │  docs/requests/BACKEND_MODIFICATION_REQUEST_001.md
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 2. 대상 팀  │  요청서 확인 및 검토
│   (B팀)     │  - 기술적 검토
└──────┬──────┘  - 우선순위 결정
       │         - 일정 협의
       ▼
┌─────────────┐
│ 3. 대상 팀  │  backend/ 폴더에서 직접 수정
│   (B팀)     │  - 코드 작성
└──────┬──────┘  - 테스트
       │         - Git commit & push
       ▼
┌─────────────┐
│ 4. 요청 팀  │  즉시 테스트 가능
│   (C팀)     │  - frontend/에서 연동 테스트
└──────┬──────┘  - 문제 있으면 추가 요청
       │
       ▼
┌─────────────┐
│ 5. 완료     │  요청서 상태 업데이트
│   (양 팀)   │  - "테스트 완료"로 변경
└─────────────┘  - 요청 종료
```

---

## 3.2 요청서 작성 방법

### Step 1: 요청서 파일 생성

**파일명 형식**:
```
docs/requests/[대상팀]_MODIFICATION_REQUEST_[번호].md
```

**예시**:
- `docs/requests/BACKEND_MODIFICATION_REQUEST_001.md`
- `docs/requests/FRONTEND_MODIFICATION_REQUEST_001.md`
- `docs/requests/INFRASTRUCTURE_MODIFICATION_REQUEST_001.md`

### Step 2: 템플릿 사용

**템플릿 위치**: [docs/templates/MODIFICATION_REQUEST_TEMPLATE.md](templates/MODIFICATION_REQUEST_TEMPLATE.md)

**필수 항목**:
1. 요청 팀, 대상 팀
2. 요청 사유 (왜 필요한가?)
3. 수정 파일 목록
4. 현재 상태 vs 원하는 결과
5. 테스트 방법
6. 우선순위 및 희망 완료일

### Step 3: 대상 팀에 알림

**알림 방법**:
1. Git commit & push
2. Slack 또는 이메일로 알림
3. Daily standup에서 언급

### Step 4: 진행 상황 추적

**상태 코드**:
- `요청됨` → `검토 중` → `진행 중` → `완료` → `테스트 대기` → `테스트 완료` → `종료`

---

# 4. 실제 사례

## 사례 1: C팀이 Backend API 요청

### 상황
C팀이 Editor에서 Asset 업로드 기능을 개발 중인데, Backend에 Asset 업로드 API가 필요함.

### 진행 과정

#### 1. C팀 → 요청서 작성
**파일**: `docs/requests/BACKEND_MODIFICATION_REQUEST_001.md`

```markdown
# 수정 요청서 #001

## 기본 정보
- 요청 팀: C팀
- 대상 팀: B팀
- 요청일: 2025-11-16
- 우선순위: High
- 희망 완료일: 2025-11-18

## 요청 내용

### 수정 파일
- [ ] `backend/app/api/v1/assets.py` (신규 생성)
- [ ] `backend/app/api/v1/__init__.py` (라우터 추가)

### API 스펙
**엔드포인트**: `POST /api/v1/assets/upload`

**요청**:
- Content-Type: multipart/form-data
- file: (binary)
- project_id: string

**응답**:
{
  "asset_id": "asset-123",
  "url": "http://100.123.51.5:9000/sparklio/assets/abc.jpg"
}

### 테스트 방법
curl -X POST http://100.123.51.5:8000/api/v1/assets/upload \
  -F "file=@test.jpg" \
  -F "project_id=proj-001"
```

#### 2. B팀 → 검토 및 수정
```bash
# B팀이 backend/ 폴더에서 작업
cd backend/app/api/v1
vi assets.py  # API 구현

# 테스트
pytest tests/test_assets.py

# Git commit
git add app/api/v1/assets.py
git commit -m "feat(api): Add asset upload endpoint for C팀

Implements POST /api/v1/assets/upload
- Multipart file upload
- MinIO storage integration
- Returns asset_id and public URL

Resolves: BACKEND_MODIFICATION_REQUEST_001"
git push origin dev
```

#### 3. B팀 → 요청서 업데이트
```markdown
## 진행 상황
| 날짜 | 상태 | 담당자 | 비고 |
|------|------|--------|------|
| 2025-11-16 | 요청됨 | C팀 | - |
| 2025-11-16 | 진행 중 | B팀 김개발 | 작업 시작 |
| 2025-11-17 | 완료 | B팀 김개발 | 커밋: abc123 |

## 커밋 정보
- 커밋 해시: `abc123def456`
- 브랜치: `dev`
```

#### 4. C팀 → 즉시 테스트
```javascript
// frontend/lib/api-client.ts
export async function uploadAsset(file: File, projectId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('project_id', projectId);

  const response = await fetch('http://100.123.51.5:8000/api/v1/assets/upload', {
    method: 'POST',
    body: formData
  });

  return response.json();
}

// 테스트 성공 → 요청서에 "테스트 완료" 업데이트
```

---

## 사례 2: B팀이 Frontend 확인 요청

### 상황
B팀이 SmartRouter API를 완성했는데, Frontend에서 제대로 연동되는지 확인 필요.

### 진행 과정

#### 1. B팀 → 확인 요청서 작성
**파일**: `docs/requests/FRONTEND_VERIFICATION_REQUEST_001.md`

```markdown
# 확인 요청서 #001

## 기본 정보
- 요청 팀: B팀
- 대상 팀: C팀
- 요청일: 2025-11-18

## 요청 내용

### 완성된 API
**엔드포인트**: `POST /api/v1/router/route`

**사용 방법**:
curl -X POST http://100.123.51.5:8000/api/v1/router/route \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "request_text": "빨간색 원 추가",
    "brand_id": "brand-001"
  }'

### 확인 사항
- [ ] Frontend에서 호출 성공
- [ ] 응답 데이터 파싱 성공
- [ ] UI에 적절히 표시
```

#### 2. C팀 → 테스트 및 피드백
```markdown
## 테스트 결과
- [x] API 호출 성공
- [x] 응답 파싱 성공
- [ ] UI 표시 - 일부 필드 누락

## 추가 요청
`response.metadata` 필드에 `confidence` 값 추가 필요
→ 새 요청서 작성: BACKEND_MODIFICATION_REQUEST_002.md
```

---

# 5. 통합 테스트

## 5.1 주간 통합 테스트 (권장)

### 일정
**매주 금요일 오후 3시 - 5시**

### 참여자
- A팀: 1명 (인프라 지원, 디버깅)
- B팀: 전원 (Backend 담당)
- C팀: 전원 (Frontend 담당)

### 절차
```
14:00 - 준비
  - A팀: 서버 상태 확인
  - B팀: Backend 최신 코드 배포
  - C팀: Frontend 최신 코드 배포

15:00 - 통합 테스트 시작
  - 시나리오 1: 사용자 로그인
  - 시나리오 2: SmartRouter 호출
  - 시나리오 3: Asset 업로드
  - 시나리오 4: Workflow 실행

16:00 - 이슈 수정
  - 발견된 버그 즉시 수정
  - 양 팀 협업

17:00 - 테스트 종료 및 회고
  - 성공/실패 항목 정리
  - 다음 주 개선사항 논의
```

---

## 5.2 통합 테스트 체크리스트

**파일**: `docs/integration_tests/INTEGRATION_TEST_YYYY-MM-DD.md`

```markdown
# 통합 테스트 보고서 - 2025-11-22

## 참여자
- A팀: 이인프라
- B팀: 김백엔드, 박API
- C팀: 최프론트, 정UI

## 테스트 환경
- Backend: http://100.123.51.5:8000
- Frontend: http://100.101.68.23:3000
- Database: PostgreSQL @ 100.123.51.5:5432

## 테스트 시나리오

### 1. Health Check
- [x] Backend 서버 정상 응답
- [x] Frontend에서 호출 성공
- [x] 응답 시간 < 100ms

### 2. SmartRouter
- [x] Intent 분류 정확도: 85%
- [x] Agent 선택 적절
- [ ] Frontend UI 표시 이슈 (아이콘 깨짐)

### 3. Asset Upload
- [x] 파일 업로드 성공
- [x] MinIO 저장 확인
- [x] URL 반환 정상

## 발견된 이슈

### Issue #1: Frontend 아이콘 깨짐
- 우선순위: Medium
- 담당: C팀
- 해결 예정일: 2025-11-25

### Issue #2: SmartRouter 응답 지연
- 우선순위: Low
- 담당: B팀
- 원인: Ollama 모델 로딩 시간
- 해결 방법: 모델 preload

## 다음 통합 테스트
- 날짜: 2025-11-29 (금) 15:00
- 목표: Workflow 전체 실행 테스트
```

---

# 6. Git 워크플로우

## 6.1 브랜치 전략

```
main (운영)
  └── dev (개발)
       ├── B팀: backend/ 폴더만 수정
       └── C팀: frontend/ 폴더만 수정
```

## 6.2 커밋 규칙

### B팀 (Backend)
```bash
# backend/ 폴더만 수정
git add backend/
git commit -m "feat(api): Add new endpoint"
git push origin dev
```

### C팀 (Frontend)
```bash
# frontend/ 폴더만 수정
git add frontend/
git commit -m "feat(ui): Add new component"
git push origin dev
```

### 규칙
1. **자기 팀 폴더만 커밋**
2. **커밋 메시지에 팀 표시** (선택사항)
   - `feat(backend): ...` 또는 `feat(frontend): ...`
3. **하루 최소 1회 커밋**
4. **큰 변경 전 팀 내 리뷰**

---

## 6.3 충돌 해결

### 같은 팀 내 충돌
```bash
# Pull 먼저
git pull origin dev

# 충돌 해결
vi conflicted_file.py

# 해결 후 커밋
git add .
git commit -m "merge: Resolve conflict"
git push origin dev
```

### 다른 팀 파일 충돌 (발생 안 함)
각 팀이 자기 폴더만 수정하므로 **다른 팀과 충돌 없음** ✅

---

# 7. 소통 채널

## 7.1 수정 요청서
**용도**: 공식적인 기능 요청, 버그 수정 요청
**위치**: `docs/requests/`

## 7.2 Daily Standup (선택)
**시간**: 매일 오전 10:00 (15분)
**내용**:
- 어제 한 일
- 오늘 할 일
- 막힌 부분 (다른 팀 도움 필요 시)

## 7.3 Slack / Discord (실시간)
**채널**:
- `#general`: 전체 공지
- `#backend`: B팀 전용
- `#frontend`: C팀 전용
- `#integration`: 통합 테스트, 이슈 논의

## 7.4 주간 회의 (선택)
**시간**: 매주 월요일 오전 10:00 (30분)
**내용**:
- 지난 주 성과
- 이번 주 목표
- 통합 테스트 일정 조율

---

# 8. 빠른 참조

## 수정 요청이 필요한 경우

### C팀이 Backend 수정 필요
```bash
# 1. 요청서 작성
cd docs/requests
cp ../templates/MODIFICATION_REQUEST_TEMPLATE.md BACKEND_MODIFICATION_REQUEST_XXX.md

# 2. 요청서 작성 후 커밋
git add BACKEND_MODIFICATION_REQUEST_XXX.md
git commit -m "request(backend): Add asset upload API"
git push

# 3. B팀에 알림 (Slack)
@backend-team BACKEND_MODIFICATION_REQUEST_XXX.md 확인 부탁드립니다!
```

### B팀이 Frontend 확인 필요
```bash
# 1. 확인 요청서 작성
cd docs/requests
cp ../templates/MODIFICATION_REQUEST_TEMPLATE.md FRONTEND_VERIFICATION_REQUEST_XXX.md

# 2. 커밋 및 알림
git add FRONTEND_VERIFICATION_REQUEST_XXX.md
git commit -m "request(frontend): Verify SmartRouter integration"
git push

# 3. C팀에 알림
@frontend-team FRONTEND_VERIFICATION_REQUEST_XXX.md 확인 부탁드립니다!
```

---

# 9. FAQ

## Q1: 다른 팀 폴더를 읽을 수는 있나요?
**A**: 네! 읽기는 자유입니다. 코드 참고, 테스트, 학습 모두 가능합니다.

## Q2: 급하면 직접 수정해도 되나요?
**A**: 안 됩니다. 반드시 수정 요청서를 작성하고, 대상 팀이 수정해야 합니다.
이유: 각 팀이 자기 코드에 대한 책임을 지고, 품질을 유지하기 위함입니다.

## Q3: 요청서 작성이 너무 번거로워요.
**A**: 템플릿을 사용하면 5분이면 작성 가능합니다.
또한 작은 변경은 Slack으로 먼저 논의 후, 합의되면 요청서 생략 가능합니다. (팀 간 합의 필요)

## Q4: 통합 테스트는 필수인가요?
**A**: 주간 통합 테스트는 강력히 권장합니다. 최소 2주에 1회는 진행하세요.

## Q5: 요청서 번호는 어떻게 매기나요?
**A**: 각 팀별로 001부터 시작합니다.
- BACKEND_MODIFICATION_REQUEST_001
- BACKEND_MODIFICATION_REQUEST_002
- FRONTEND_MODIFICATION_REQUEST_001

---

# 10. 요약

## ✅ 해야 할 것
1. **자기 팀 폴더에서만 작업**
2. **다른 팀 수정 필요 시 요청서 작성**
3. **하루 1회 이상 커밋**
4. **주간 통합 테스트 참여**
5. **요청서 상태 업데이트**

## ❌ 하지 말아야 할 것
1. **다른 팀 폴더 직접 수정**
2. **요청서 없이 수정 요구**
3. **오래된 요청서 방치**
4. **테스트 없이 머지**

---

**작성 완료일**: 2025-11-15
**다음 업데이트**: 실제 운영 후 개선사항 반영
