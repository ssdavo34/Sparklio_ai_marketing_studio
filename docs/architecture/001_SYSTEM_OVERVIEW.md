---
doc_id: ARCH-001
title: Sparklio v4 AI Marketing Studio - 시스템 전체 구조
created: 2025-11-16
updated: 2025-11-16
status: approved
phase: Phase 1 - Gateway 구축
priority: P0
authors: A팀 (Claude + QA)
reviewers: PM
supersedes: K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\001. llm 연결.md
related:
  - ARCH-002: Gateway Pattern
  - SPEC-001: LLM Gateway Spec
  - SPEC-002: Media Gateway Spec
---

# Sparklio v4 AI Marketing Studio - 시스템 전체 구조

## TL;DR (30초 요약)

- **4개 Gateway**: LLM / Image / Video / Audio
- **현재 구현**: Ollama (LLM) + ComfyUI (Image) + ffmpeg (Video)
- **미래 확장**: GPT/Claude/Gemini (LLM), DALL·E/Nanobanana (Image), Veo3 (Video), ElevenLabs/Suno (Audio)
- **핵심 원칙**: 모든 상위 레이어(에디터, 에이전트, API)는 **Gateway만 호출**, Provider는 내부에서 교체 가능

---

## 목차

1. [전체 아키텍처](#전체-아키텍처)
2. [4개 Gateway 구조](#4개-gateway-구조)
3. [현재 vs 미래 Provider](#현재-vs-미래-provider)
4. [Agent 시스템과의 통합](#agent-시스템과의-통합)
5. [확장 전략](#확장-전략)

---

## 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend Layer (Canvas Studio / Editor)                    │
│  - React 기반 에디터                                          │
│  - 레이아웃 편집, 텍스트/이미지 배치                            │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP API 호출
┌─────────────────▼──────────────────────────────────────────┐
│  Agent Layer (6개 Agent)                                    │
│  - Brief / Brand / Strategist / Copywriter / Vision / Review│
│  - 에이전트는 Gateway만 호출 (직접 모델 호출 금지)             │
└──────────────────┬──────────────────────────────────────────┘
                   │ Gateway API 호출
┌─────────────────▼──────────────────────────────────────────┐
│  Gateway Layer (4개 Gateway)                                │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │ LLM Gateway  │ Image Gateway│ Video Gateway│Audio GW  │ │
│  │ (텍스트/JSON)│ (이미지 생성) │ (영상 합성)   │(TTS/음악)│ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│                        │ Provider 라우팅                     │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Provider Layer (교체 가능)                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 현재 (Phase 1)                                        │ │
│  │ - OllamaProvider (qwen2.5:7b/14b, mistral, llama3.2) │ │
│  │ - ComfyUIProvider (Desktop ComfyUI)                  │ │
│  │ - FfmpegProvider (영상 합성)                          │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 미래 (Phase 2-4)                                      │ │
│  │ - OpenAI / Anthropic / Gemini Provider               │ │
│  │ - DALL·E / Nanobanana Provider                       │ │
│  │ - Veo3 Provider                                      │ │
│  │ - ElevenLabs / Suno Provider                         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Infra Layer                                                │
│  - Desktop: Ollama (Docker), ComfyUI (Standalone)           │
│  - Mac mini: Backend API (FastAPI)                          │
│  - Tailscale VPN: 네트워크 연결                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4개 Gateway 구조

### 1. LLM Gateway

**역할**: 텍스트 / JSON / 에디터 명령 생성

**엔드포인트**: `POST /api/v1/llm/generate`

**Provider**:
- **현재**: `OllamaProvider`
  - qwen2.5:7b (빠른 작업: 브리프, 에디터)
  - qwen2.5:14b (복잡한 작업: 전략, 카피)
  - mistral-small (고급 추론)
  - llama3.2 (경량 태깅, 요약)

- **미래**:
  - `OpenAIProvider` (GPT-4, GPT-4o)
  - `AnthropicProvider` (Claude 3.5 Sonnet)
  - `GeminiProvider` (Gemini Pro)

**라우팅 전략**:
```yaml
role: strategist | copywriter → qwen2.5:14b
role: brief | brand | reviewer → qwen2.5:7b
role: vision → qwen2.5:7b
task: heavy_reasoning → mistral-small
task: tagging | short_summary → llama3.2
```

### 2. Image Gateway

**역할**: 이미지 생성 / 수정 / 업스케일

**엔드포인트**: `POST /api/v1/media/image/generate`

**Provider**:
- **현재**: `ComfyUIProvider`
  - Desktop ComfyUI (http://100.120.180.42:8188)
  - 워크플로 기반 이미지 생성

- **미래**:
  - `DalleProvider` (OpenAI DALL·E 3)
  - `NanobananaProvider` (나노바나나 이미지 API)

**주요 워크플로**:
- `product_shot_v1`: 상품샷 (화이트 배경)
- `hero_image_v1`: 히어로 이미지
- `concept_board_v1`: 컨셉보드

### 3. Video Gateway

**역할**: 타임라인 기반 영상 생성

**엔드포인트**: `POST /api/v1/media/video/generate`

**Provider**:
- **현재**: `FfmpegProvider`
  - ComfyUI 이미지 + 오디오 → mp4
  - 타임라인 기반 씬 합성

- **미래**:
  - `Veo3Provider` (Google Veo3 영상 생성)

**처리 방식**: 비동기 Job (Celery Worker)

### 4. Audio Gateway

**역할**: 음성(TTS) + 음악/BGM 생성

**엔드포인트**:
- `POST /api/v1/media/audio/tts`
- `POST /api/v1/media/audio/music`

**Provider**:
- **현재**: 구조만 (Mock)

- **미래**:
  - `ElevenLabsProvider` (TTS 음성 내레이션)
  - `SunoProvider` (AI 음악/BGM 생성)

**처리 방식**: 비동기 Job

---

## 현재 vs 미래 Provider

### Phase 1 (현재 실행 가능) - 5일

| Gateway | Provider | 상태 | 비고 |
|---------|----------|------|------|
| LLM | OllamaProvider | ✅ 구현 예정 | Desktop Docker Ollama |
| Image | ComfyUIProvider | ✅ 구현 예정 | Desktop ComfyUI |
| Video | FfmpegProvider | ✅ 구현 예정 | Worker 기반 |
| Audio | Mock | 📝 구조만 | 임시 응답 |

### Phase 2 (TTS/음악 도입) - 3일

| Gateway | Provider | 상태 | 비고 |
|---------|----------|------|------|
| Audio | ElevenLabsProvider | ⏳ 대기 | TTS 우선 |
| Audio | SunoProvider | ⏳ 대기 | BGM 생성 |

### Phase 3 (클라우드 LLM/Image) - 5일

| Gateway | Provider | 상태 | 비고 |
|---------|----------|------|------|
| LLM | OpenAIProvider | 🔮 스켈레톤 | GPT-4o |
| LLM | AnthropicProvider | 🔮 스켈레톤 | Claude 3.5 |
| LLM | GeminiProvider | 🔮 스켈레톤 | Gemini Pro |
| Image | DalleProvider | 🔮 스켈레톤 | DALL·E 3 |
| Image | NanobananaProvider | 🔮 스켈레톤 | 나노바나나 |

### Phase 4 (Veo3 영상 생성) - 3일

| Gateway | Provider | 상태 | 비고 |
|---------|----------|------|------|
| Video | Veo3Provider | 🔮 스켈레톤 | AI 영상 생성 |

---

## Agent 시스템과의 통합

### 6개 Agent → Gateway 매핑

| Agent | LLM Gateway Role | 대표 Task | Media Gateway 사용 |
|-------|------------------|-----------|-------------------|
| **BriefAgent** | `brief` | `marketing_brief` | - |
| **BrandAgent** | `brand` | `brand_summary`, `brand_voice` | - |
| **StrategistAgent** | `strategist` | `content_plan`, `deck_outline` | - |
| **CopywriterAgent** | `copywriter` | `product_detail`, `sns_caption` | - |
| **VisionGeneratorAgent** | `vision` | `image_prompt`, `concept_board` | ✅ Image |
| **ReviewerAgent** | `reviewer` | `style_check`, `consistency_check` | - |

### VisionGeneratorAgent 특수 플로우

```
1. LLM Gateway 호출
   - role: "vision"
   - task: "image_prompt"
   - mode: "json"
   → 결과: { prompt, negative_prompt, style, aspect_ratio }

2. Media Gateway (Image) 호출
   - provider: "comfyui"
   - kind: "product_shot"
   - prompt: (1단계 결과)
   → 결과: { image_id, url }

3. Editor / Asset DB로 전달
```

---

## 확장 전략

### 1. Provider 인터페이스 통일

모든 Provider는 동일한 인터페이스를 구현:

```python
class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt, role, task, mode, options) -> Response:
        pass
```

**새 Provider 추가 시**:
1. 인터페이스 구현
2. `provider_config.yaml` 활성화
3. **Gateway 코드 수정 불필요**

### 2. 설정 기반 라우팅

```yaml
# provider_config.yaml
providers:
  llm:
    active:
      - ollama
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

### 3. Draft / Final 모드

```
draft 모드 (빠른 미리보기)
  → 로컬 Provider 우선 (Ollama, ComfyUI, ffmpeg)

final 모드 (최종 출력)
  → 클라우드 Provider 우선 (GPT-4, Claude, DALL·E, Veo3)
```

### 4. 비용 / 품질 / 속도 최적화

```yaml
# 예시: 작업별 정책
policies:
  - task: product_detail
    mode: draft
    provider: ollama
    model: qwen2.5:7b
    cost: 무료
    speed: 빠름

  - task: product_detail
    mode: final
    provider: anthropic
    model: claude-3-5-sonnet
    cost: 유료
    quality: 최고
```

---

## 인프라 구성

### Desktop (GPU 서버)
- **OS**: Windows
- **Ollama**: Docker 내부 (http://100.120.180.42:11434)
- **ComfyUI**: Standalone (http://100.120.180.42:8188)
- **역할**: LLM 추론, 이미지 생성

### Mac mini (Backend API 서버)
- **OS**: macOS
- **Backend**: FastAPI (http://100.123.51.5:8000)
- **역할**: API Gateway, Worker, DB

### 네트워크
- **Tailscale VPN**: Desktop ↔ Mac mini 연결
- **Desktop → Mac mini**: Ollama/ComfyUI 호출
- **Mac mini → Desktop**: Gateway API 제공

---

## 다음 단계

### Phase 1 완료 기준
- [ ] LLM Gateway API 동작 (Mock + Live)
- [ ] Ollama 연결 성공 (qwen2.5:7b/14b)
- [ ] Media Gateway (Image) 동작
- [ ] ComfyUI 연결 성공
- [ ] 미래 Provider 스켈레톤 파일 존재

### P0 E2E 시나리오
"상품 상세 + 이미지 1장" 플로우:
1. BrandAgent → 브랜드 요약
2. BriefAgent → 마케팅 브리프
3. StrategistAgent → 섹션 구조
4. CopywriterAgent → 카피 작성
5. VisionGeneratorAgent → 메인 이미지 생성 (ComfyUI)
6. ReviewerAgent → 카피 리뷰

**목표**: Mock 30초, Live 3분 이내

---

## 관련 문서

### 필수 읽기
- [ARCH-002: Gateway Pattern](./002_GATEWAY_PATTERN.md)
- [SPEC-001: LLM Gateway Spec](../specs/LLM_GATEWAY_SPEC_v1.0.md)
- [SPEC-002: Media Gateway Spec](../specs/MEDIA_GATEWAY_SPEC_v1.0.md)

### 의사결정 기록
- [DEC-001: Why Gateway Pattern](../decisions/2025-11-16_001_WHY_GATEWAY.md)
- [DEC-002: Ollama First Strategy](../decisions/2025-11-16_002_OLLAMA_FIRST.md)

### 현재 작업
- [CURRENT_PHASE.md](../plans/CURRENT_PHASE.md)
- [B팀 작업 요청서](../requests/2025-11-16_B팀_LLM_GATEWAY_REQUEST.md)

---

**작성**: 2025-11-16 by A팀 (Claude + QA)
**승인**: PM
**다음 리뷰**: Phase 1 완료 후
