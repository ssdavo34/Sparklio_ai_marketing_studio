# 🔌 Backend API 연결 테스트 요청서

**작성자:** C팀 (Frontend Team)
**작성일:** 2025년 11월 17일 월요일 12:13
**목적:** One-Page Editor E2E 연동 - P0 완료 후 실제 Backend API 테스트

---

## 📋 테스트 개요

Frontend에서 **Chat → Generate → Canvas 렌더링** 흐름이 Mock 데이터로 완료되었습니다.
이제 실제 Backend API (+ OpenSource LLM)와 연결하여 E2E 테스트를 진행하려 합니다.

---

## ✅ 사전 확인 사항

### 1. Backend 서버 실행 여부

- [ ] Backend 서버가 `http://localhost:8000`에서 실행 중인지 확인
- [ ] Health check endpoint 응답 확인 (있다면)

### 2. Generate API Endpoint 확인

**Endpoint:** `POST /api/v1/generate`

**예상 Request Body:**

```json
{
  "kind": "product_detail",
  "brandId": null,
  "locale": "ko-KR",
  "input": {
    "prompt": "고급 스킨케어 제품 상세 페이지를 만들어줘"
  },
  "context": {}
}
```

**예상 Response:**

```json
{
  "taskId": "task_123456",
  "kind": "product_detail",
  "textBlocks": {
    "headline": "...",
    "description": "..."
  },
  "editorDocument": {
    "documentId": "doc_123456",
    "type": "product_detail",
    "canvas_json": {
      "version": "5.3.0",
      "objects": [...],
      "background": "#ffffff"
    },
    "pages": []
  },
  "meta": {
    "templates_used": ["..."],
    "agents_trace": [...],
    "llm_cost": {}
  }
}
```

---

## 🧪 테스트 절차

### Step 1: Backend 서버 실행 확인

```bash
# Backend가 실행 중인지 확인 (Backend 디렉토리에서)
# 예시 명령어 (실제 명령어로 대체)
cd K:\sparklio_ai_marketing_studio\backend
python main.py  # 또는 uvicorn main:app --reload
```

**확인 방법:**

```bash
# Frontend 디렉토리에서 curl 테스트
curl http://localhost:8000/api/v1/health
# 또는
curl http://localhost:8000/
```

### Step 2: Generate API 단독 테스트

```bash
# Frontend 디렉토리에서
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": null,
    "locale": "ko-KR",
    "input": {
      "prompt": "고급 스킨케어 제품 상세 페이지를 만들어줘"
    },
    "context": {}
  }'
```

**예상 결과:**

- 200 OK 응답
- JSON 형식의 GenerateResponse 반환
- `editorDocument.canvas_json`에 Fabric.js 호환 JSON 포함

### Step 3: Frontend Mock 모드 해제

**Frontend `.env.local` 수정:**

```env
# 현재 (Mock 모드 활성화)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 변경 필요 없음 - 이미 올바름!
# useGenerate.ts의 USE_MOCK 조건을 수정해야 함
```

**`useGenerate.ts` 수정 필요:**
현재 조건 (Line 81-82):

```typescript
const USE_MOCK = !process.env.NEXT_PUBLIC_API_BASE_URL ||
                 process.env.NEXT_PUBLIC_API_BASE_URL.includes('localhost:8000');
```

Backend 연결 시:

```typescript
// Backend 서버가 준비되면 Mock 모드 비활성화
const USE_MOCK = false; // 또는 환경변수로 제어
```

### Step 4: Frontend에서 E2E 테스트

1. Browser: `http://localhost:3001`
2. Chat 탭 열기
3. Kind: "상품 상세" 선택
4. Prompt: "고급 스킨케어 제품 상세 페이지를 만들어줘" 입력
5. "생성하기" 버튼 클릭
6. **확인 사항:**
   - Console에 `[useGenerate] Backend 서버 없음` 메시지 **없어야 함**
   - Network 탭에서 `POST /api/v1/generate` 요청 성공
   - Canvas에 실제 LLM이 생성한 콘텐츠 렌더링
   - Fabric.js 에러 없어야 함

---

## 📝 체크리스트 (확인 후 체크해주세요)

### Backend 준비 사항

- [ ] Backend 서버 `http://localhost:8000` 실행 중
- [ ] `/api/v1/generate` endpoint 정상 동작
- [ ] OpenSource LLM 연동 완료 및 응답 가능
- [ ] CORS 설정 완료 (Frontend `localhost:3001` 허용)
- [ ] Response에 `canvas_json` 포함 (Fabric.js 형식)

### Frontend 확인 사항

- [x] API Client 구현 완료 (`lib/api/client.ts`)
- [x] useGenerate Hook 구현 완료 (`components/canvas-studio/hooks/useGenerate.ts`)
- [x] Fabric Adapter 구현 완료 (`components/canvas-studio/adapters/response-to-fabric.ts`)
- [x] ChatPanel UI 구현 완료 (`components/canvas-studio/components/ChatPanel.tsx`)
- [x] Mock 모드로 E2E 흐름 테스트 완료

### 연결 테스트 시 확인 사항

- [ ] Backend 요청/응답 로그 확인
- [ ] Frontend Network 탭에서 API 호출 성공
- [ ] LLM 생성 시간 측정 (몇 초 소요?)
- [ ] Canvas에 실제 생성된 콘텐츠 렌더링 확인
- [ ] 에러 핸들링 동작 확인

---

## 🔧 예상 이슈 & 해결 방법

### Issue 1: CORS 에러

**증상:** `Access-Control-Allow-Origin` 에러
**해결:** Backend CORS 설정에 `http://localhost:3001` 추가

### Issue 2: canvas_json 형식 불일치

**증상:** Fabric.js "Failed to load canvas_json" 에러
**해결:** Backend에서 반환하는 `canvas_json`이 Fabric.js `toJSON()` 형식과 일치하는지 확인

### Issue 3: 타임아웃

**증상:** LLM 생성 시간이 너무 길어서 timeout
**해결:** Frontend `apiClient.ts`의 fetch timeout 설정 확인 (현재 기본값 사용 중)

### Issue 4: Mock 모드가 계속 활성화됨

**증상:** Backend 실행 중인데도 Mock 데이터 사용
**해결:** `useGenerate.ts`의 `USE_MOCK` 조건 수정 필요

---

## 📞 연결 테스트 진행 방법

**다음과 같이 진행 가능합니다:**

1. **Backend 준비 완료 확인 후** → `USE_MOCK = false` 설정
2. **curl 테스트 명령어 실행** → API 응답 확인
3. **Frontend Browser 테스트** → 실시간 에러 해결
4. **Response 형식 검증** → canvas_json이 Fabric.js 호환인지 확인

---

## 🎯 테스트 성공 기준

- ✅ Browser에서 "생성하기" 클릭 시 Backend API 호출 성공
- ✅ LLM이 생성한 콘텐츠가 Canvas에 렌더링됨
- ✅ Console에 Fabric.js 에러 없음
- ✅ Network 탭에서 200 OK 응답 확인
- ✅ Response의 `textBlocks`, `editorDocument`, `meta` 데이터 정상

---

## 🚀 준비 완료 시 필요한 정보

1. Backend 서버 실행 상태 (실행 중 / 실행 필요)
2. `/api/v1/generate` 테스트 결과 (curl 결과 또는 Postman 스크린샷)
3. Backend에서 반환하는 `canvas_json` 샘플 (있다면)

---

## 📂 관련 파일

### Frontend 구현 완료 파일

- `frontend/.env.local` - Backend API URL 설정
- `frontend/lib/api/types.ts` - TypeScript 타입 정의
- `frontend/lib/api/client.ts` - API Client 구현
- `frontend/components/canvas-studio/hooks/useGenerate.ts` - Generate Hook
- `frontend/components/canvas-studio/adapters/response-to-fabric.ts` - Fabric Adapter
- `frontend/components/canvas-studio/components/ChatPanel.tsx` - Chat UI

### Backend 확인 필요 파일

- `backend/app/api/v1/generate.py` (또는 해당 endpoint 파일)
- `backend/app/schemas/` - Request/Response 스키마
- `backend/app/config/cors.py` (또는 CORS 설정 파일)

---

**문서 버전:** 1.0
**최종 수정일:** 2025년 11월 17일 월요일 12:13
