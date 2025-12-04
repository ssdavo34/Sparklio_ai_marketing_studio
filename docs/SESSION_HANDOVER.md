# 세션 인수인계 (2025-12-03 18:55 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `60722e9` - 세션 인수인계 문서 업데이트
- **Mac Mini 배포**: ✅ 동기화 완료
- **서버 상태**:
  - Frontend: ✅ localhost:3001 (재시작 필요 - .env 변경됨)
  - Backend (Mac Mini): ✅ 100.123.51.5:8000
  - Z-Image (Desktop GPU): ✅ 100.120.180.42:7860
  - Ollama (Desktop GPU): ✅ 100.120.180.42:11434

---

## 오늘 완료한 작업 (2025-12-03)

### ImageTab v2 → 실제 API 연동 작업 (C팀)

#### 1. Z-Image 서버 버그 수정 ✅
- **파일**: `tools/zimage/server.py` (Desktop PC: `D:\ai\zimage\server.py`)
- **문제**: `torch.Generator(device=DEVICE)` → `enable_model_cpu_offload()` 사용 시 에러
- **수정**: `torch.Generator(device="cpu")` (line 215)
- **결과**: Z-Image 직접 호출 시 이미지 생성 성공

#### 2. Frontend API 엔드포인트 수정 ✅
- **파일**: `useImageTabStore.ts`
- **변경**: VisionGeneratorAgent API (`/api/v1/agents/vision-generator/generate`) → MediaGateway API (`/api/v1/media/generate`)
- **이유**: VisionGeneratorAgent 엔드포인트가 Backend에 없음 (404)

#### 3. Base64 이미지 데이터 처리 수정 ✅
- **파일**: `vision-generator-api.ts`
- **변경**: `output.data || output.base64` 로 Backend 응답 필드 매핑
- **결과**: 이미지가 채팅창에 정상 표시

#### 4. LLM 프롬프트 번역 직접 호출 구현 ✅
- **파일**: `useImageTabStore.ts`
- **문제**: Backend `/api/v1/llm/chat` 엔드포인트 없음 (404)
- **해결**: OpenAI, Ollama API 직접 호출 함수 추가
  - `callOpenAI()`: GPT-4o-mini 선택 시 OpenAI API 직접 호출
  - `callOllama()`: 오픈소스 선택 시 Ollama API 직접 호출
- **gatewayClient import 제거** (더 이상 사용 안 함)

#### 5. Frontend 환경변수 추가 ✅
- **파일**: `frontend/.env.local`
- **추가**:
  ```
  NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-...
  NEXT_PUBLIC_OLLAMA_URL=http://100.120.180.42:11434
  ```
- **이유**: Next.js 클라이언트에서 사용하려면 `NEXT_PUBLIC_` 접두사 필요

---

## 🟡 진행 중 / 남은 작업

### P0 (Critical) - 다음 세션 즉시 해야 할 작업

1. **Frontend 서버 재시작 후 테스트**
   - `.env.local` 변경 반영을 위해 서버 재시작 필요
   - 포트 3001 프로세스 kill 후 `npm run dev`
   - "20대 여성 스튜디오 촬영" 같은 한글 프롬프트로 테스트
   - 콘솔에서 `[ImageTabStore] Using OpenAI gpt-4o-mini` 로그 확인
   - `[ImageTabStore] Translated:` 로그에서 영문 변환 확인

2. **이미지 생성 End-to-End 테스트**
   - GPT-4o-mini 선택 → 한글 프롬프트 → 영문 번역 → Z-Image 생성 → 이미지 표시
   - 오픈소스(Llama) 선택 → Ollama 번역 → Z-Image 생성

### P1 (High)

3. **getPolotnoStore 마이그레이션 완료**
   - 아직 deprecated API 사용 중인 파일들:
     - `useBrandToCanvas.ts`
     - `ChatPanel.tsx`
     - `canvasOperations.ts`
     - `useEditorActions.ts`
     - `useChatStore.ts`
     - `PagesTab.tsx`

### P2 (Medium)

4. VEO3 테스트 - 이미지 → 동영상 변환
5. NanoBanana 이미지 생성 확인
6. Backend `/api/v1/llm/chat` 엔드포인트 추가 (선택사항)

---

## 이번 세션 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `stores/useImageTabStore.ts` | MediaGateway 사용, OpenAI/Ollama 직접 호출 |
| `lib/api/vision-generator-api.ts` | base64 데이터 필드 매핑 수정 |
| `frontend/.env.local` | NEXT_PUBLIC_OPENAI_API_KEY, NEXT_PUBLIC_OLLAMA_URL 추가 |
| `tools/zimage/server.py` | torch.Generator device="cpu" 수정 |
| `backend/.../zimage_provider.py` | Z-Image Provider 구현 |
| `backend/.../hunyuan_provider.py` | HunyuanVideo Provider 구현 |

---

## 아키텍처 흐름 (ImageTab v2)

```
[사용자 입력 (한글)]
       ↓
[translatePromptToEnglish()]
  ├─ GPT-4o-mini 선택 → callOpenAI() → OpenAI API 직접
  └─ 오픈소스 선택 → callOllama() → Ollama API 직접 (GPU 서버)
       ↓
[영문 프롬프트]
       ↓
[generateViaMediaGateway()]
       ↓
[Mac Mini Backend /api/v1/media/generate]
       ↓
[zimage_provider.py → Desktop GPU Z-Image 서버]
       ↓
[base64 이미지 반환]
       ↓
[채팅창에 이미지 표시]
```

---

## 서버 정보

| 서버 | IP | 포트 | 용도 |
|------|-----|------|------|
| Mac Mini | 100.123.51.5 | 8000 | Backend API |
| Desktop (GPU) | 100.120.180.42 | 7860 | Z-Image (SDXL) |
| Desktop (GPU) | 100.120.180.42 | 11434 | Ollama (LLM) |
| Desktop (GPU) | 100.120.180.42 | 8188 | ComfyUI |
| Laptop | localhost | 3001 | Frontend |

---

## 중요: Video6는 건들지 마세요!

> "아 영상은 건들이지 말고 하자. 또 작업하다가 잘 되던 것도 안되면 안되니까"

Video6 관련 파일들은 이미 잘 작동하고 있으므로 수정하지 않습니다.

---

## 테스트 명령어

```bash
# Frontend 재시작
cd frontend
npm run dev

# Z-Image 헬스체크
curl http://100.120.180.42:7860/health

# Ollama 모델 확인
curl http://100.120.180.42:11434/api/tags

# Z-Image 직접 테스트
curl -X POST http://100.120.180.42:7860/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A young Korean woman in her 20s, studio photography, professional lighting", "width": 1024, "height": 1024, "steps": 8}'
```

---

## 알려진 이슈

1. **Backend `/api/v1/llm/chat` 없음**
   - 현재 Frontend에서 직접 OpenAI/Ollama 호출로 우회
   - 장기적으로는 Backend에 엔드포인트 추가 권장

2. **Claude 프롬프트 번역 미지원**
   - Anthropic API 직접 호출 미구현 (필요 시 추가)
   - 현재 Claude 선택 시 fallback 프롬프트 사용

---

**마지막 업데이트**: 2025-12-03 18:55 by C팀 (Frontend)
