# LLM 연결 전략 종합 분석 보고서

---
doc_id: REPORT-001
title: LLM 연결 전략 종합 분석 보고서
created: 2025-11-16
updated: 2025-11-16
status: approved
authors: A팀 (QA & Testing)
supersedes: Obsidian LLM 폴더 문서 001~006 분석
related:
  - ARCH-001: System Overview
  - ARCH-002: Gateway Pattern
  - DEC-001: Why Gateway Pattern
---

# LLM 연결 전략 종합 분석 보고서

**작성일**: 2025-11-16
**작성자**: A팀 (QA & Testing)
**문서 버전**: v1.0
**분석 대상**: Obsidian LLM 폴더 문서 001~006

---

## 📋 Executive Summary

6개 문서를 정독한 결과, **Gateway Pattern 기반 접근이 현재 상황에 가장 적합**합니다.

### 핵심 결론

✅ **추천 방향**: **점진적 Gateway 구축** (참조: [ARCH-002](../architecture/002_GATEWAY_PATTERN.md)) - 6개 Agent + 2 Gateway 방식
⚠️ **현재 문제**: 테스트 타임아웃의 근본 원인은 LLM/ComfyUI 미연결
🎯 **최우선 작업**: Gateway 구조 먼저 구축 → 소수 Agent 연결 → E2E 검증

---

## 1. 문서별 핵심 내용 요약

### 001. llm 연결.md - 전체 비전과 4대 Gateway 설계

**핵심 개념**:
- AI Gateway를 **4개 축**으로 분리: LLM / Image / Video / Audio
- 현재(Ollama, ComfyUI, ffmpeg) + 미래(GPT, Claude, DALL·E, Veo3, ElevenLabs, Suno) 모두 고려
- **Provider 패턴**: 상위 레이어는 Gateway만 호출, 실제 모델 선택은 내부에서

**Phase별 계획**:
- Phase 0: 설계/스펙 작성 (LLM_GATEWAY_SPEC, MEDIA_GATEWAY_SPEC, PROVIDER_CONFIG.yaml)
- Phase 1: 현재 자원(Ollama + ComfyUI + ffmpeg)으로 동작
- Phase 2: ElevenLabs + Suno 도입
- Phase 3: Cloud LLM + Image Provider (GPT, Claude, DALL·E, Nanobanana)
- Phase 4: Veo3 + 고급 오케스트레이션

**중요 원칙**:
> "에디터, Sparklio 서비스, 에이전트들은 오직 이 4개 Gateway만 알고, 각 Gateway 안에서만 어떤 회사/모델을 쓸지를 판단"

---

### 002. LLM Gateway Spec v1.0.md - LLM Gateway 상세 스펙

**API Contract**:
```http
POST /api/v1/llm/generate
{
  "role": "strategist",        // strategist | copywriter | editor | brief | brand
  "task": "product_detail",    // 비즈니스 태스크
  "mode": "chat",              // chat | json | tools
  "input": { brand, context, payload },
  "options": { temperature, max_tokens, provider }
}
```

**Router 설계**:
- role/task 기반으로 모델 자동 선택
- 전략/카피 → qwen2.5:14b
- 브리프/브랜드/에디터 → qwen2.5:7b
- heavy_reasoning → mistral-small
- 태그/요약 → llama3.2

**Provider 인터페이스**:
- 현재: `OllamaProvider`
- 나중: `OpenAIProvider`, `AnthropicProvider`, `GeminiProvider` (스켈레톤)

**중요 포인트**:
- 모든 Agent는 **직접 Ollama 호출 금지**, 반드시 Gateway 경유
- 에러 포맷 표준화: `LLM_PROVIDER_ERROR`, `LLM_TIMEOUT`, etc.
- 로깅/모니터링: request_id, provider, model, latency_ms, usage.total_tokens

---

### 003. Media Gateway Spec v1.0.md - 미디어 Gateway 상세 스펙

**3개 API 그룹**:

1. **Image API**: `POST /api/v1/media/image/generate`
   - Provider: ComfyUI (현재) → DALL·E, Nanobanana (미래)
   - 동기 or Job 처리 선택 가능

2. **Video API**: `POST /api/v1/media/video/generate`
   - Provider: ffmpeg (현재) → Veo3 (미래)
   - 반드시 비동기 Job 처리
   - Timeline 기반: scenes[] → image_id + voiceover_id + bgm_id + transition

3. **Audio API**:
   - TTS: `POST /api/v1/media/audio/tts` → ElevenLabs
   - Music: `POST /api/v1/media/audio/music` → Suno

**Job & Worker 설계**:
- Job 타입: `image | video | audio_tts | audio_music`
- Job 상태: `queued | processing | completed | failed`
- Celery/Redis 기반 비동기 처리

**Asset ID 체계**:
- `img_20251116_XXXX`
- `vid_20251116_XXXX`
- `tts_20251116_XXXX`
- `bgm_20251116_XXXX`

---

### 004. 소수의 에이전트로 먼저 추진.md - 점진적 접근의 중요성

**핵심 메시지**:
> "Gateway를 먼저 만들고, 얇은(P0) 에이전트만 연결해서 돌려보는 게 훨씬 안전한 순서"

**3단계 전략**:

1. **인프라 & Gateway 먼저** (에이전트 없이 가능)
   - LLM Gateway → Ollama 연결
   - Media Gateway → ComfyUI 연결
   - Postman/curl로 수동 테스트

2. **얇은 P0 에이전트 3개**
   - `BriefAgent`: 브랜드 정보 → 마케팅 브리프 JSON
   - `StrategistAgent`: 브리프 → 콘텐츠 플랜 JSON
   - `EditorAgent`: 기존 텍스트 + 요청 → 수정된 텍스트

3. **작은 E2E 먼저 성공**
   - Canvas Studio + Gateways + P0 에이전트 3개로 "슬라이드 1장" 완성
   - Gateway 구조 검증, Ollama 실사용 가능 여부 확인

**중요한 깨달음**:
- `role: "strategist"`는 **라우팅을 위한 태그일 뿐**, 에이전트 클래스가 완성되어야만 쓸 수 있는 게 아님
- 나머지 에이전트는 "복사·변형"으로 쉽게 확장 가능

---

### 005. 6개의 에이전트로 llm 연결 방법.md - 실전 Agent 맵핑

**현재 6개 Agent → Gateway 역할 맵핑**:

| Agent | LLM `role` | 대표 `task` | 비고 |
|-------|-----------|------------|------|
| **BriefAgent** | `"brief"` | `"marketing_brief"` | 초기 브리프 생성 |
| **BrandAgent** | `"brand"` | `"brand_voice"`, `"brand_summary"` | 브랜드 톤/가이드 추출 |
| **StrategistAgent** | `"strategist"` | `"content_plan"`, `"deck_outline"` | 섹션/슬라이드 구조 설계 |
| **CopywriterAgent** | `"copywriter"` | `"product_detail"`, `"sns_caption"` | 실제 카피 작성 |
| **VisionGeneratorAgent** | `"vision"` | `"image_prompt"`, `"concept_board"` | ComfyUI용 프롬프트 생성 |
| **ReviewerAgent** | `"reviewer"` | `"style_check"`, `"consistency_check"` | 톤/오탈자/일관성 리뷰 |

**VisionGeneratorAgent 특별 플로우**:
1. LLM Gateway 호출 → 이미지 프롬프트 JSON 생성
2. Media Gateway 호출 → ComfyUI로 이미지 생성
3. `image_id` + `url` 반환

**P0 E2E 시나리오**: "상품 상세 + 이미지" 한 세트
1. BrandAgent → 브랜드 요약
2. BriefAgent → 마케팅 브리프
3. StrategistAgent → 섹션 구조
4. CopywriterAgent → 카피 텍스트
5. VisionGeneratorAgent → 메인 이미지
6. ReviewerAgent → 카피 리뷰
7. Editor/Canvas Studio → 페이지 1장 자동 생성

---

### 006. 점진적 Gateway 구축 가이드 ⭐

**핵심 조언**:
> "현재 인프라(6개 Agent + Mac mini + Desktop)로 Gateway + P0 E2E 실행 가능"

**참조**: [ARCH-002: Gateway Pattern](../architecture/002_GATEWAY_PATTERN.md)

**필수 추가 사항**: **테스트 모드 분리**

```env
# .env.test (기본 백엔드 테스트)
GENERATOR_MODE=mock

# .env.e2e (게이트웨이 + LLM + Comfy 실제 테스트)
GENERATOR_MODE=live
COMFYUI_BASE_URL=http://100.120.180.42:8188
LLM_BASE_URL=http://ollama:11434
```

**즉시 실행 가능한 3단계**:

1. **LLM Gateway / Media Gateway 최소 버전 구현**
   - `/api/v1/llm/generate` → Ollama 연결
   - `/api/v1/media/image/generate` → ComfyUI 연결
   - 라우팅/비용 최적화는 나중, 일단 "동작하는 버전" 먼저

2. **6개 Agent를 Gateway 기반으로 리팩터링**
   - 직접 Ollama/ComfyUI 호출 코드 전부 제거
   - `llm_gateway_client.generate(role, task, payload)` 사용
   - `media_gateway_client.generate_image(...)` 사용

3. **P0 E2E 스크립트 작성**
   - `backend/scripts/run_p0_product_detail_flow.py`
   - 6개 Agent 순차 호출 → 최종 JSON 출력
   - `GENERATOR_MODE=mock`: 빠른 구조 확인
   - `GENERATOR_MODE=live`: 실제 LLM + Comfy 테스트

---

## 2. 현재 상황 분석

### 2.1 환경 현황

✅ **준비된 것**:
- Mac mini Backend (FastAPI, PostgreSQL, Redis, MinIO)
- Desktop Docker (Ollama: qwen2.5 7b/14b, mistral-small, llama3.2)
- Desktop ComfyUI (Standalone, GPU 가속)
- 6개 Agent 구현 완료 (Brief, Brand, Strategist, Copywriter, Vision, Reviewer)
- JWT 인증 시스템 동작
- Git 동기화 완료

⚠️ **문제점**:
- Backend API 테스트 타임아웃 (189개 테스트 중 대부분 실패)
- Generator API가 LLM/ComfyUI에 연결되지 않음
- 테스트가 실제 생성 API를 호출하려 하지만 응답 없음

### 2.2 타임아웃 근본 원인

문서 분석 결과, 타임아웃의 진짜 원인은:

1. **Generator API가 Mock이 아닌 실제 호출을 시도**
   - `/api/v1/generate` 엔드포인트가 구현은 되어 있지만
   - 실제로 LLM/ComfyUI를 호출하는 코드가 없거나 연결이 안 됨

2. **GENERATOR_MODE 분리가 없음**
   - 모든 테스트가 실제 생성을 시도 → 60초 타임아웃
   - Mock 모드가 없어서 단순 API 구조 테스트도 느림

3. **Gateway 레이어 부재**
   - Agent가 직접 Ollama/ComfyUI를 호출해야 하는 구조
   - 에러 핸들링, 타임아웃 관리 일관성 없음

---

## 3. 왜 Gateway Pattern이 최선인가?

**참조**: [DEC-001: Why Gateway Pattern](../decisions/2025-11-16_001_WHY_GATEWAY.md)

### 3.1 단계적 접근의 장점

❌ **잘못된 접근**: "모든 Agent 완성 → 테스트"
- 16개 Agent 모두 완성될 때까지 실제 LLM 테스트 불가
- 구조 문제 발견이 늦어짐
- 테스트 타임아웃 해결 지연

✅ **올바른 접근** (Gateway Pattern): "Gateway 먼저 → 소수 Agent → E2E"
- Gateway 2개만 먼저 완성하면 수동 테스트 가능
- 6개 Agent로 전체 플로우 검증 가능
- 문제 조기 발견 및 해결
- 나머지 Agent는 복사·변형으로 빠른 확장

### 3.2 테스트 전략의 개선

**현재** (문제):
```
189개 테스트 → 모두 GENERATOR_MODE=live → 타임아웃 지옥
```

**Gateway Pattern** (해결):
```
일반 API 테스트: GENERATOR_MODE=mock (빠름, 구조 검증)
E2E 테스트: GENERATOR_MODE=live (느림, 실제 품질 검증)
```

### 3.3 확장성

**Gateway 패턴의 힘**:
- Ollama → GPT로 전환: **Gateway 라우터만 수정**, Agent는 변경 없음
- ComfyUI → DALL·E 추가: **Provider 추가**, Agent는 변경 없음
- 새 Agent 추가: **기존 Agent 복사 → role/task만 변경**

---

## 4. 구체적 실행 계획 (Gateway Pattern 기반)

**상세 스펙**:
- [SPEC-001: LLM Gateway Spec](../specs/LLM_GATEWAY_SPEC_v1.0.md)
- [SPEC-002: Media Gateway Spec](../specs/MEDIA_GATEWAY_SPEC_v1.0.md)

### Phase 1: Gateway 기초 구축 (1-2일)

**목표**: Gateway 2개가 Ollama/ComfyUI와 실제로 통신

#### 1.1 Backend 구조 생성

```
backend/app/
├── api/v1/endpoints/
│   ├── llm_gateway.py          # POST /api/v1/llm/generate
│   └── media_gateway.py        # POST /api/v1/media/image/generate
├── services/
│   ├── llm/
│   │   ├── gateway.py          # LLM Gateway 메인 로직
│   │   ├── router.py           # role/task → model 라우팅
│   │   └── providers/
│   │       ├── base.py         # Provider 인터페이스
│   │       └── ollama.py       # OllamaProvider 구현
│   └── media/
│       ├── gateway.py          # Media Gateway 메인 로직
│       └── providers/
│           ├── base.py         # Provider 인터페이스
│           └── comfyui.py      # ComfyUIProvider 구현
└── core/
    └── config.py               # GENERATOR_MODE, Provider 설정
```

#### 1.2 환경 변수 추가 (.env)

```env
# Generator Mode
GENERATOR_MODE=mock  # mock | live

# LLM (Ollama on Desktop Docker)
OLLAMA_BASE_URL=http://100.120.180.42:11434
OLLAMA_DEFAULT_MODEL=qwen2.5:7b

# Media (ComfyUI on Desktop)
COMFYUI_BASE_URL=http://100.120.180.42:8188
COMFYUI_WORKFLOW_DIR=workflows/
```

#### 1.3 최소 구현

**LLM Gateway** (`llm_gateway.py`):
```python
@router.post("/llm/generate")
async def generate(request: LLMGatewayRequest):
    if settings.GENERATOR_MODE == "mock":
        return mock_llm_response(request)

    # Router: role/task → model 선택
    provider_id, model = route_llm_request(request)

    # Provider 호출
    provider = get_provider(provider_id)
    response = await provider.generate(request)

    return response
```

**Media Gateway** (`media_gateway.py`):
```python
@router.post("/media/image/generate")
async def generate_image(request: ImageRequest):
    if settings.GENERATOR_MODE == "mock":
        return mock_image_response(request)

    # ComfyUI Provider 호출
    provider = ComfyUIProvider()
    images = await provider.generate(request)

    return {"status": "completed", "images": images}
```

#### 1.4 수동 테스트

```bash
# Mock 모드 (빠름)
curl -X POST http://100.123.51.5:8000/api/v1/llm/generate \
  -H "Content-Type: application/json" \
  -d '{"role":"brief","task":"marketing_brief","input":{...}}'

# Live 모드 (Ollama 실제 호출)
GENERATOR_MODE=live curl -X POST ...
```

---

### Phase 2: Agent 리팩터링 (1일)

**목표**: 6개 Agent가 Gateway만 사용하도록 수정

#### 2.1 공통 클라이언트 생성

```python
# backend/app/services/clients/llm_client.py
class LLMGatewayClient:
    async def generate(
        self,
        role: str,
        task: str,
        payload: dict,
        mode: str = "chat",
        options: dict = None
    ) -> dict:
        response = await httpx.post(
            f"{settings.API_BASE_URL}/api/v1/llm/generate",
            json={
                "role": role,
                "task": task,
                "mode": mode,
                "input": payload,
                "options": options or {}
            }
        )
        return response.json()
```

#### 2.2 Agent 수정 예시 (BriefAgent)

**수정 전**:
```python
# 직접 Ollama 호출
response = ollama.generate(model="qwen2.5:7b", prompt=...)
```

**수정 후**:
```python
# LLM Gateway 사용
llm_client = LLMGatewayClient()
response = await llm_client.generate(
    role="brief",
    task="marketing_brief",
    payload={
        "brand": brand_info,
        "product": product_info
    }
)
```

#### 2.3 VisionGeneratorAgent 특별 처리

```python
# 1단계: LLM Gateway로 이미지 프롬프트 생성
prompt_response = await llm_client.generate(
    role="vision",
    task="image_prompt",
    mode="json",
    payload={...}
)

# 2단계: Media Gateway로 이미지 생성
media_client = MediaGatewayClient()
image_response = await media_client.generate_image(
    provider="comfyui",
    kind="product_shot",
    prompt=prompt_response["output"]["parsed"]["prompt"],
    options={
        "workflow": "product_shot_v1",
        "aspect_ratio": "16:9"
    }
)
```

---

### Phase 3: P0 E2E 구현 (1일)

**목표**: "상품 상세 + 이미지 1장" 전체 플로우 성공

#### 3.1 E2E 스크립트 작성

```python
# backend/scripts/run_p0_product_detail_flow.py

async def run_product_detail_flow():
    """상품 상세 페이지 생성 E2E 플로우"""

    # Input
    brand_input = {...}
    product_input = {...}

    # 1. BrandAgent
    brand_agent = BrandAgent()
    brand_summary = await brand_agent.execute(brand_input)

    # 2. BriefAgent
    brief_agent = BriefAgent()
    brief = await brief_agent.execute({
        "brand": brand_summary,
        "product": product_input
    })

    # 3. StrategistAgent
    strategist = StrategistAgent()
    sections = await strategist.execute(brief)

    # 4. CopywriterAgent
    copywriter = CopywriterAgent()
    copy = await copywriter.execute({
        "brief": brief,
        "sections": sections
    })

    # 5. VisionGeneratorAgent
    vision = VisionGeneratorAgent()
    image = await vision.execute({
        "brief": brief,
        "section": sections[0]  # Hero 섹션
    })

    # 6. ReviewerAgent
    reviewer = ReviewerAgent()
    review = await reviewer.execute({
        "brand": brand_summary,
        "copy": copy
    })

    return {
        "brand_summary": brand_summary,
        "brief": brief,
        "sections": sections,
        "copy": copy,
        "image": image,
        "review": review
    }

if __name__ == "__main__":
    result = asyncio.run(run_product_detail_flow())
    print(json.dumps(result, indent=2, ensure_ascii=False))
```

#### 3.2 테스트 환경 설정

```bash
# Mock 모드로 구조 확인 (빠름)
GENERATOR_MODE=mock python backend/scripts/run_p0_product_detail_flow.py

# Live 모드로 실제 생성 (느림, 품질 확인)
GENERATOR_MODE=live python backend/scripts/run_p0_product_detail_flow.py
```

#### 3.3 성공 기준

- [ ] 6개 Agent가 순차적으로 실행됨
- [ ] Mock 모드: 30초 이내 완료
- [ ] Live 모드: 3분 이내 완료
- [ ] 최종 JSON에 모든 필드 존재
- [ ] 이미지 URL이 실제 접근 가능

---

### Phase 4: 통합 테스트 개선 (0.5일)

**목표**: 기존 189개 테스트를 Mock/Live로 분리

#### 4.1 테스트 분리

```typescript
// tests/integration/backend-api.spec.ts (Mock 모드)
test.describe('Backend API - Structure Tests (Mock)', () => {
  test.beforeAll(() => {
    process.env.GENERATOR_MODE = 'mock';
  });

  // 189개 테스트 대부분 → 빠른 구조 검증
});

// tests/e2e/backend-api-live.spec.ts (Live 모드)
test.describe('Backend API - Live Generation Tests', () => {
  test.beforeAll(() => {
    process.env.GENERATOR_MODE = 'live';
  });

  test('Brand Kit Generator - 실제 생성', async ({ request }) => {
    // 실제 LLM + ComfyUI 호출
    // 타임아웃: 120초
  });

  // 핵심 시나리오만 5-10개
});
```

#### 4.2 npm 스크립트 추가

```json
{
  "scripts": {
    "test:backend": "GENERATOR_MODE=mock playwright test tests/integration/",
    "test:backend:live": "GENERATOR_MODE=live playwright test tests/e2e/backend-api-live.spec.ts",
    "test:e2e:p0": "python backend/scripts/run_p0_product_detail_flow.py"
  }
}
```

---

## 5. 꼭 지켜야 할 원칙 (재확인)

### 5.1 절대 규칙

❌ **금지사항**:
1. Agent가 **직접 Ollama/ComfyUI 호출 금지**
2. Gateway 없이 모델 직접 사용 금지
3. 모든 테스트를 Live 모드로 실행 금지
4. 에이전트 코드에 모델명 하드코딩 금지

✅ **필수사항**:
1. 모든 LLM 호출 → **LLM Gateway 경유**
2. 모든 미디어 생성 → **Media Gateway 경유**
3. 빠른 테스트 → **Mock 모드**
4. 실제 품질 검증 → **Live 모드** (소수만)
5. role/task 기반 라우팅 → **Gateway에서 모델 자동 선택**

### 5.2 코드 리뷰 체크리스트

Pull Request 전 확인사항:
- [ ] `import ollama` 같은 직접 import 없음
- [ ] `LLMGatewayClient` 또는 `MediaGatewayClient` 사용
- [ ] `GENERATOR_MODE` 환경변수 확인 코드 존재
- [ ] Mock 응답 구조가 Live 응답과 동일
- [ ] 타임아웃 설정 명시 (Mock: 5s, Live: 120s)

---

## 6. 예상 일정 및 리소스

### 6.1 작업 일정 (총 4일)

| Phase | 작업 내용 | 예상 시간 | 담당 |
|-------|----------|----------|------|
| Phase 1 | Gateway 기초 구축 | 1-2일 | Backend 팀 |
| Phase 2 | Agent 리팩터링 | 1일 | Backend 팀 |
| Phase 3 | P0 E2E 구현 | 1일 | QA 팀 + Backend 팀 |
| Phase 4 | 테스트 개선 | 0.5일 | QA 팀 |

### 6.2 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|-------|-------|----------|
| Ollama 연결 실패 | 높음 | Desktop Docker 상태 확인, 네트워크 설정 점검 |
| ComfyUI 워크플로 오류 | 중간 | 간단한 워크플로부터 시작, 로그 상세 분석 |
| Agent 리팩터링 범위 과다 | 중간 | 6개 중 3개만 먼저 완성 (Brief, Strategist, Vision) |
| E2E 타임아웃 | 낮음 | Live 모드 타임아웃 180초로 늘림, 단계별 중간 저장 |

---

## 7. 결론 및 권장사항

### 7.1 최종 권장사항

🎯 **Gateway Pattern 방식으로 진행**:

1. **즉시 시작** (1-2일):
   - LLM Gateway + Media Gateway 최소 구현
   - Mock/Live 모드 분리
   - Ollama + ComfyUI 연결 확인

2. **Agent 리팩터링** (1일):
   - 6개 Agent → Gateway Client 사용
   - 직접 모델 호출 코드 제거

3. **P0 E2E 검증** (1일):
   - "상품 상세 + 이미지 1장" 플로우
   - Mock으로 구조 확인, Live로 품질 확인

4. **테스트 정리** (0.5일):
   - 189개 테스트 → Mock 모드
   - 핵심 5-10개만 Live 모드

### 7.2 성공 지표

4일 후 달성 목표:
- [ ] Gateway 2개가 Mock/Live 양쪽 모드에서 정상 동작
- [ ] 6개 Agent가 모두 Gateway 기반으로 리팩터링 완료
- [ ] P0 E2E 스크립트가 Live 모드에서 성공 (이미지 생성 포함)
- [ ] 기존 189개 테스트가 Mock 모드로 2분 이내 완료
- [ ] Live E2E 테스트 5개가 각각 120초 이내 완료

### 7.3 다음 단계 (Phase 5 이후)

Gateway + Agent 구조가 안정화된 후:
- [ ] ElevenLabs TTS 연동 (Audio Gateway)
- [ ] Suno Music 연동 (Audio Gateway)
- [ ] Video Gateway ffmpeg 구현
- [ ] Cloud LLM Provider 추가 (GPT, Claude)
- [ ] 나머지 10개 Agent 확장

---

## 8. 부록

### 8.1 참고 문서 링크

**공식 문서** (이 보고서를 기반으로 작성됨):
- [ARCH-001: System Overview](../architecture/001_SYSTEM_OVERVIEW.md)
- [ARCH-002: Gateway Pattern](../architecture/002_GATEWAY_PATTERN.md)
- [ARCH-003: Agent Architecture](../architecture/003_AGENT_ARCHITECTURE.md)
- [SPEC-001: LLM Gateway Spec](../specs/LLM_GATEWAY_SPEC_v1.0.md)
- [SPEC-002: Media Gateway Spec](../specs/MEDIA_GATEWAY_SPEC_v1.0.md)
- [DEC-001: Why Gateway Pattern](../decisions/2025-11-16_001_WHY_GATEWAY.md)

**원본 참고 자료** (Obsidian):
- `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\001. llm 연결.md`
- `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\002. LLM Gateway Spec v1.0.md`
- `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\003. Media Gateway Spec v1.0.md`

### 8.2 환경 정보

**현재 시스템 구성**:
- Mac mini (100.123.51.5): Backend API, PostgreSQL, Redis, MinIO
- Desktop (100.120.180.42): Docker (Ollama), ComfyUI (Standalone)
- Ollama Models: qwen2.5:7b/14b, mistral-small, llama3.2
- ComfyUI: GPU 가속, Workflow 기반

---

**작성 완료일**: 2025-11-16
**Next Action**: 이 보고서를 기반으로 최종 작업 계획 재수립
