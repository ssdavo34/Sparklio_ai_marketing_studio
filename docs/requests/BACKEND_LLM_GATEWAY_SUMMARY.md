---
doc_id: REQ-001
title: B팀 LLM Gateway 작업 요청서 (요약본)
created: 2025-11-16
updated: 2025-11-16
status: approved
priority: P0
from: A팀 (QA & Testing)
to: B팀 (Backend 개발)
related:
  - ARCH-002: Gateway Pattern
  - SPEC-001: LLM Gateway Spec
  - SPEC-002: Media Gateway Spec
  - DEC-001: Why Gateway Pattern
---

# B팀 작업 요청 요약서

**작성일**: 2025-11-16
**요청 팀**: A팀 (QA & Testing)
**담당 팀**: B팀 (Backend 개발)
**우선순위**: 🔴 **최고**
**예상 기간**: 5일

---

## 📋 요청 요약 (1분 요약)

**현재 문제**: Backend API 테스트 189개 중 대부분 타임아웃 발생
**근본 원인**: LLM/ComfyUI가 연결되지 않음, Mock/Live 모드 미분리
**해결 방안**: LLM Gateway + Media Gateway 구축 (Gateway Pattern)
**참조**: [ARCH-002: Gateway Pattern](../architecture/002_GATEWAY_PATTERN.md)

**작업 내용**:
1. LLM Gateway + Media Gateway 구현 (Ollama, ComfyUI 연결)
2. 6개 Agent를 Gateway 기반으로 리팩터링
3. P0 E2E 스크립트 작성 ("상품 상세 + 이미지 1장")
4. Mock/Live 모드 분리

---

## 🎯 핵심 목표

### 즉시 목표 (5일 후)
✅ LLM Gateway가 Ollama와 실제 통신
✅ Media Gateway가 ComfyUI와 실제 통신
✅ 6개 Agent가 Gateway만 사용 (직접 모델 호출 금지)
✅ E2E 스크립트가 실제 이미지 생성까지 성공

### ⭐ 중요 원칙 (반드시 지킬 것)
1. **확장 가능한 Provider 패턴** - OpenAI/Claude/DALL·E 추가 시 최소 수정
2. **설정 기반 라우팅** - 하드코딩 금지, YAML/환경변수로 제어
3. **API Contract 불변성** - Provider 추가와 무관하게 API 스펙 동일
4. **미래 Provider 스켈레톤 포함** - OpenAI/Anthropic 클래스 생성 (TODO 주석)

---

## 📊 작업 범위

### Phase 1: Gateway 기초 구축 (2.5일, 19시간)

**핵심 작업**:
- `/api/v1/llm/generate` 엔드포인트 (Mock/Live 모드)
- `OllamaProvider` 구현 (Desktop Docker 연결)
- `LLMRouter` 구현 (role/task → 모델 자동 선택)
- `/api/v1/media/image/generate` 엔드포인트
- `ComfyUIProvider` 구현 (Desktop ComfyUI 연결)
- **미래 확장**: OpenAI/Anthropic/Gemini/DALL·E Provider 스켈레톤

**디렉토리 구조**:
```
backend/app/
├── api/v1/endpoints/
│   ├── llm_gateway.py
│   └── media_gateway.py
├── services/
│   ├── llm/
│   │   ├── gateway.py
│   │   ├── router.py
│   │   └── providers/
│   │       ├── base.py          # Provider 인터페이스
│   │       ├── ollama.py        # ✅ 구현
│   │       ├── openai.py        # TODO 스켈레톤
│   │       ├── anthropic.py     # TODO 스켈레톤
│   │       └── gemini.py        # TODO 스켈레톤
│   └── media/
│       ├── gateway.py
│       └── providers/
│           ├── base.py
│           ├── comfyui.py       # ✅ 구현
│           ├── dalle.py         # TODO 스켈레톤
│           └── nanobanana.py    # TODO 스켈레톤
└── core/
    ├── config.py
    └── provider_config.yaml     # Provider 활성화 설정
```

### Phase 2: Agent 리팩터링 (1.25일, 10시간)

**핵심 작업**:
- `LLMGatewayClient` 공통 클라이언트 구현
- `MediaGatewayClient` 공통 클라이언트 구현
- 6개 Agent 리팩터링:
  - BriefAgent (role="brief")
  - BrandAgent (role="brand")
  - StrategistAgent (role="strategist")
  - CopywriterAgent (role="copywriter")
  - VisionGeneratorAgent (role="vision", LLM+Media 사용)
  - ReviewerAgent (role="reviewer")

**변경 사항**:
```python
# ❌ 수정 전 (직접 Ollama 호출)
import ollama
response = ollama.generate(model="qwen2.5:7b", prompt=...)

# ✅ 수정 후 (Gateway 사용)
from app.services.clients.llm_client import LLMGatewayClient
llm_client = LLMGatewayClient()
response = await llm_client.generate(
    role="brief",
    task="marketing_brief",
    payload={...}
)
```

### Phase 3: P0 E2E 스크립트 (0.75일, 6시간)

**파일**: `backend/scripts/run_p0_product_detail_flow.py`

**플로우**:
1. BrandAgent → 브랜드 요약
2. BriefAgent → 마케팅 브리프
3. StrategistAgent → 섹션 구조
4. CopywriterAgent → 카피 작성
5. VisionGeneratorAgent → 메인 이미지 (ComfyUI 생성)
6. ReviewerAgent → 카피 리뷰
7. 최종 JSON 파일 저장

**실행 방법**:
```bash
# Mock 모드 (빠름, 30초)
GENERATOR_MODE=mock python backend/scripts/run_p0_product_detail_flow.py

# Live 모드 (실제 생성, 2-3분)
GENERATOR_MODE=live python backend/scripts/run_p0_product_detail_flow.py
```

### Phase 4: 테스트 지원 (0.25일, 2시간)

- Mock 응답 데이터 품질 개선
- 타임아웃 설정 최적화 (Mock: 5초, Live: 180초)

---

## ⭐ 확장 가능성 (가장 중요!)

### 1. Provider 인터페이스 설계

모든 LLM Provider는 동일한 인터페이스 구현:

```python
class LLMProvider(ABC):
    @abstractmethod
    async def generate(...) -> LLMProviderResponse:
        pass
```

**새 Provider 추가 시**:
1. `providers/openai.py` 파일 생성
2. `LLMProvider` 인터페이스 구현
3. `provider_config.yaml`에서 활성화
4. **Gateway 코드 수정 불필요!**

### 2. 설정 기반 라우팅

**파일**: `provider_config.yaml`

```yaml
providers:
  llm:
    active:
      - ollama  # 현재 활성
    available:
      - openai  # 주석 해제만 하면 활성화
      - anthropic
      - gemini

llm_routing:
  rules:
    - role: [strategist, copywriter]
      provider: ollama
      model: qwen2.5:14b

  # 미래 규칙 (주석 해제만)
  # future_rules:
  #   - role: [strategist]
  #     mode: final
  #     provider: anthropic
  #     model: claude-3-5-sonnet-20241022
```

### 3. 미래 Provider 스켈레톤

**파일**: `providers/openai.py`

```python
class OpenAIProvider(LLMProvider):
    async def generate(...):
        raise NotImplementedError(
            "OpenAIProvider is not implemented yet. "
            "See provider_config.yaml to enable it later."
        )
```

**나중에 해야 할 일**:
1. `pip install openai`
2. `generate()` 메서드 구현 (OpenAI SDK 사용)
3. `.env`에서 `OPENAI_API_KEY` 주석 해제
4. `provider_config.yaml`에서 `openai` 활성화

---

## ✅ 완료 기준

### Phase 1
- [ ] `/api/v1/llm/generate` Mock/Live 모드 정상 동작
- [ ] Ollama 연결 성공 (qwen2.5:7b/14b 호출 가능)
- [ ] `/api/v1/media/image/generate` ComfyUI 연결 성공
- [ ] OpenAI/Anthropic/Gemini Provider 스켈레톤 파일 존재
- [ ] `provider_config.yaml`에 미래 Provider 주석 포함

### Phase 2
- [ ] 6개 Agent에서 `import ollama` 완전 제거
- [ ] 모든 Agent가 `LLMGatewayClient` 사용
- [ ] VisionGeneratorAgent가 LLM + Media Gateway 사용

### Phase 3
- [ ] E2E 스크립트 Mock 모드 30초 이내
- [ ] E2E 스크립트 Live 모드 3분 이내
- [ ] 최종 JSON에 6개 Agent 결과 포함
- [ ] 이미지 URL 접근 가능 (ComfyUI 생성 이미지)

### Phase 4
- [ ] Mock 응답 = Live 응답 구조 (필드명/타입 동일)
- [ ] Timeout 설정 Mode별 자동 적용

---

## 🚨 반드시 지킬 원칙

### ✅ 해야 할 것
1. ✅ Provider 인터페이스(ABC) 사용
2. ✅ 모든 설정을 YAML/환경변수로
3. ✅ Mock 모드는 Gateway 레벨에서만
4. ✅ 미래 Provider 스켈레톤 포함
5. ✅ API Contract 불변성 유지

### ❌ 절대 금지
1. ❌ Agent에서 `import ollama` 직접 사용
2. ❌ 모델명 하드코딩 (`qwen2.5:7b` 문자열 직접 사용)
3. ❌ Provider별 로직을 Gateway API에 노출
4. ❌ 확장을 고려하지 않은 if/else 분기
5. ❌ `provider_config.yaml` 없이 코드에서 라우팅

---

## 📚 참고 문서

### 필수 읽기 (우선순위 순)

1. **이 문서** (요약본) - 3분 읽기
   - 전체 작업 개요 파악

2. [BACKEND_LLM_GATEWAY_WORK_ORDER.md](./BACKEND_LLM_GATEWAY_WORK_ORDER.md) - 20분 읽기
   - 상세 작업 지시서 (코드 예시 포함)
   - Phase별 체크리스트

3. [SPEC-001: LLM Gateway Spec](../specs/LLM_GATEWAY_SPEC_v1.0.md) - 15분 읽기
   - LLM Gateway API 상세 스펙

4. [SPEC-002: Media Gateway Spec](../specs/MEDIA_GATEWAY_SPEC_v1.0.md) - 15분 읽기
   - Media Gateway API 상세 스펙

### 배경 이해용

5. [LLM_CONNECTION_ANALYSIS_REPORT.md](../reports/LLM_CONNECTION_ANALYSIS_REPORT.md)
   - 왜 Gateway Pattern인지 분석

6. [ARCH-002: Gateway Pattern](../architecture/002_GATEWAY_PATTERN.md)
   - Gateway 설계 원칙

7. [DEC-001: Why Gateway](../decisions/2025-11-16_001_WHY_GATEWAY.md)
   - 의사결정 기록

---

## 📅 일정

| 날짜 | 오전 | 오후 | 완료 기준 |
|-----|-----|-----|----------|
| **Day 1** | LLM Gateway 시작 | Ollama Provider 구현 | LLM Gateway API 동작 |
| **Day 2** | Ollama 연결 완료 | Media Gateway 시작 | Ollama 연결 성공 |
| **Day 3** | ComfyUI Provider | Agent 리팩터링 시작 | Media Gateway 완성 |
| **Day 4** | Agent 리팩터링 완료 | E2E 스크립트 작성 | 6개 Agent 완료 |
| **Day 5** | E2E 검증 | Mock 응답 개선 | E2E 성공 |

---

## 🆘 A팀 지원

### A팀이 준비할 것
- [ ] Desktop Docker Ollama 상태 확인 (http://100.120.180.42:11434)
- [ ] ComfyUI 실행 상태 확인 (http://100.120.180.42:8188)
- [ ] ComfyUI 워크플로 파일 준비 (`product_shot_v1`)

### B팀 → A팀 전달
- [ ] Phase 1 완료 시: Postman Collection, 테스트 가이드
- [ ] Phase 2 완료 시: Agent별 입력/출력 JSON 샘플
- [ ] Phase 3 완료 시: E2E 스크립트 실행 방법

---

## 📊 핵심 통계

- **총 작업 시간**: 37시간 (4.75일)
- **Phase 1 (Gateway)**: 19시간 (가장 중요)
- **Phase 2 (Agent)**: 10시간
- **Phase 3 (E2E)**: 6시간
- **Phase 4 (테스트)**: 2시간

- **생성 파일 수**: 약 20개 (Provider 스켈레톤 포함)
- **수정 파일 수**: 약 10개 (Agent 리팩터링)
- **테스트 커버리지**: Mock 189개, Live 5-10개

---

## 💬 요약 (30초 버전)

**무엇을**: LLM Gateway + Media Gateway 구축
**왜**: 테스트 타임아웃 해결, 실제 LLM/ComfyUI 연결
**어떻게**: 006번 방식 - Ollama + ComfyUI만 구현, 하지만 확장 가능하게
**언제까지**: 5일
**핵심**: Provider 패턴으로 나중에 GPT/Claude 추가 시 최소 수정

---

**작성자**: A팀 QA
**승인 필요**: PM 확인
**전달 대상**: B팀 Backend 개발자
**상세 문서**: [BACKEND_LLM_GATEWAY_WORK_ORDER.md](./BACKEND_LLM_GATEWAY_WORK_ORDER.md)
