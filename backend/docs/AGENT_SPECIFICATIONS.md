# Agent Specifications - 완전판

**작성일**: 2025-11-23
**작성자**: B팀 (Backend)
**버전**: 1.0
**상태**: ✅ 고도화 완료 (1/3)

---

## 📋 목차

1. [CopywriterAgent](#1-copywriteragent)
2. [ReviewerAgent](#2-revieweragent)
3. [OptimizerAgent](#3-optimizeragent)
4. [DesignerAgent](#4-designeragent)
5. [공통 인터페이스](#5-공통-인터페이스)
6. [프롬프트 가이드라인](#6-프롬프트-가이드라인)

---

## 1. CopywriterAgent

### 1.1 역할

텍스트 콘텐츠 생성 전문 Agent. 제품 설명, SNS 콘텐츠, 브랜드 메시지 등 다양한 마케팅 텍스트를 생성합니다.

### 1.2 입력 스펙

#### AgentRequest
```python
{
    "task": str,  # product_detail | sns | brand_message | headline | ad_copy
    "payload": {
        "product_name": str,           # 제품명 (필수)
        "features": List[str],         # 주요 특징 (선택)
        "target_audience": str,        # 타겟 오디언스 (선택)
        "category": str,               # 카테고리 (선택)
        "description": str             # 추가 설명 (선택)
    },
    "options": {
        "tone": str,                   # professional | friendly | luxury | casual | energetic
        "length": str                  # short | medium | long
    }
}
```

#### 입력 예시 (product_detail)
```json
{
    "task": "product_detail",
    "payload": {
        "product_name": "울트라 무선 이어폰 Pro",
        "features": ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"],
        "target_audience": "2030 직장인",
        "category": "전자제품"
    },
    "options": {
        "tone": "professional",
        "length": "medium"
    }
}
```

### 1.3 출력 스펙

#### AgentResponse
```python
{
    "agent": "copywriter",
    "task": str,
    "outputs": [
        {
            "type": "json",
            "name": "product_copy",
            "value": {
                "headline": str,       # 헤드라인 (최대 20자)
                "subheadline": str,    # 서브헤드라인 (최대 30자)
                "body": str,           # 본문 (최대 80자)
                "bullets": List[str],  # 불릿 포인트 (최대 3개, 각 20자)
                "cta": str             # 행동 유도 문구 (최대 15자)
            },
            "meta": {
                "format": "structured_copy"
            }
        }
    ],
    "usage": {
        "llm_tokens": int,
        "total_tokens": int,
        "elapsed_seconds": float
    },
    "meta": {
        "llm_provider": str,  # "ollama" | "openai" | "anthropic"
        "llm_model": str,     # "qwen2.5:7b" | "gpt-4o-mini" | ...
        "task": str,
        "tone": str
    }
}
```

#### 출력 예시
```json
{
    "agent": "copywriter",
    "task": "product_detail",
    "outputs": [
        {
            "type": "json",
            "name": "product_copy",
            "value": {
                "headline": "완벽한 소음 차단의 시작",
                "subheadline": "프리미엄 ANC 기술로 집중력 극대화",
                "body": "울트라 무선 이어폰 Pro는 30시간 배터리와 IPX7 방수로 언제 어디서나 최고의 사운드를 제공합니다.",
                "bullets": [
                    "ANC 노이즈캔슬링",
                    "30시간 배터리",
                    "IPX7 방수"
                ],
                "cta": "지금 바로 체험하기"
            },
            "meta": {
                "format": "structured_copy"
            }
        }
    ],
    "usage": {
        "llm_tokens": 450,
        "total_tokens": 450,
        "elapsed_seconds": 2.35
    },
    "meta": {
        "llm_provider": "ollama",
        "llm_model": "qwen2.5:7b",
        "task": "product_detail",
        "tone": "professional"
    }
}
```

### 1.4 프롬프트 템플릿

#### System Prompt (LLM Gateway에서 주입)
```
당신은 전문 카피라이터입니다.
제품의 핵심 가치와 차별점을 강조하여 매력적인 설명을 작성하세요.
```

#### User Prompt (task=product_detail)
```
# 작업
제품 상세 설명 작성

# 입력 정보
- 제품명: {product_name}
- 주요 특징: {features}
- 타겟 오디언스: {target_audience}
- 카테고리: {category}

# 출력 구조
{
  "headline": "임팩트 있는 헤드라인 (10자 이내)",
  "subheadline": "서브헤드라인 (20자 이내)",
  "body": "본문 설명 (80자 이내)",
  "bullets": ["특징1 (20자 이내)", "특징2", "특징3"],
  "cta": "행동 유도 문구 (15자 이내)"
}

# 톤앤매너
{_tone_guide}

# 지시사항
- Canvas 1080x1080에 최적화된 짧은 텍스트
- 헤드라인: 최대 20자
- 본문: 최대 80자
- 불릿: 최대 3개, 각 20자 이내
- JSON 형식으로 출력
```

### 1.5 성능 메트릭

| 메트릭 | 목표값 | 측정 방법 |
|--------|--------|-----------|
| 응답 시간 | < 5초 | `elapsed_seconds` |
| 토큰 사용량 | < 800 | `total_tokens` |
| 헤드라인 길이 | ≤ 20자 | `len(headline)` |
| 본문 길이 | ≤ 80자 | `len(body)` |
| 불릿 개수 | 3개 | `len(bullets)` |
| JSON 파싱 성공률 | > 95% | 골든 세트 테스트 |

### 1.6 의존성

- **LLM Gateway**: 필수
- **LLM Provider**: Ollama (기본), OpenAI (폴백), Anthropic (옵션)
- **Default Model**: `qwen2.5:7b`

---

## 2. ReviewerAgent

### 2.1 역할

생성된 콘텐츠의 품질, 적합성, 개선 사항을 검토하는 Agent. Copywriter의 출력물을 검증하고 개선 제안을 제공합니다.

### 2.2 입력 스펙

#### AgentRequest
```python
{
    "task": str,  # content_review | copy_review | brand_consistency | grammar_check | effectiveness_analysis
    "payload": {
        "content": dict,               # 검토할 콘텐츠 (필수)
        "criteria": List[str],         # 검토 기준 (선택)
        "brand_guidelines": dict       # 브랜드 가이드라인 (선택)
    },
    "options": {}
}
```

#### 입력 예시 (content_review)
```json
{
    "task": "content_review",
    "payload": {
        "content": {
            "headline": "완벽한 소음 차단의 시작",
            "body": "울트라 무선 이어폰 Pro는...",
            "bullets": ["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"]
        },
        "criteria": ["quality", "brand_fit", "effectiveness"]
    }
}
```

### 2.3 출력 스펙

#### AgentResponse
```python
{
    "agent": "reviewer",
    "task": str,
    "outputs": [
        {
            "type": "json",
            "name": "review_result",
            "value": {
                "overall_score": int,       # 1-10
                "strengths": List[str],     # 강점 리스트
                "weaknesses": List[str],    # 약점 리스트
                "improvements": List[str],  # 개선 제안
                "detailed_feedback": str    # 상세 피드백
            },
            "meta": {
                "task": str,
                "format": "review_analysis"
            }
        }
    ],
    "usage": {
        "llm_tokens": int,
        "total_tokens": int,
        "elapsed_seconds": float
    },
    "meta": {
        "llm_provider": str,
        "llm_model": str,
        "task": str
    }
}
```

#### 출력 예시
```json
{
    "agent": "reviewer",
    "task": "content_review",
    "outputs": [
        {
            "type": "json",
            "name": "review_result",
            "value": {
                "overall_score": 8,
                "strengths": [
                    "헤드라인이 임팩트 있고 명확함",
                    "주요 특징을 잘 강조함",
                    "CTA가 명확함"
                ],
                "weaknesses": [
                    "본문이 약간 길어서 Canvas에서 잘릴 수 있음"
                ],
                "improvements": [
                    "본문을 70자 이내로 축약 권장"
                ],
                "detailed_feedback": "전반적으로 우수한 카피입니다. 다만 Canvas 1080x1080 레이아웃을 고려하면 본문을 약간 줄이는 것이 좋겠습니다."
            },
            "meta": {
                "task": "content_review",
                "format": "review_analysis"
            }
        }
    ],
    "usage": {
        "llm_tokens": 350,
        "total_tokens": 350,
        "elapsed_seconds": 1.8
    }
}
```

### 2.4 프롬프트 템플릿

#### System Prompt
```
당신은 콘텐츠 품질 검토 전문가입니다.
콘텐츠를 객관적으로 검토하고 평가하세요.
강점, 약점, 개선 사항을 구체적으로 제시하세요.
```

#### User Prompt (task=content_review)
```
# 작업
콘텐츠 전반적 검토

# 검토 대상
{content}

# 검토 기준
{criteria}

# 출력 구조
{
  "overall_score": "전체 점수 (1-10)",
  "strengths": ["강점1", "강점2", ...],
  "weaknesses": ["약점1", "약점2", ...],
  "improvements": ["개선사항1", "개선사항2", ...],
  "detailed_feedback": "상세 피드백"
}

# 지시사항
- 객관적이고 구체적인 평가
- 실행 가능한 개선 제안
- JSON 형식으로 출력
```

### 2.5 성능 메트릭

| 메트릭 | 목표값 | 측정 방법 |
|--------|--------|-----------|
| 응답 시간 | < 4초 | `elapsed_seconds` |
| 토큰 사용량 | < 600 | `total_tokens` |
| 개선 제안 개수 | ≥ 1 | `len(improvements)` |
| 점수 범위 | 1-10 | `overall_score` |

---

## 3. OptimizerAgent

### 3.1 역할

기존 콘텐츠를 개선하고 최적화하는 Agent. Reviewer의 피드백을 바탕으로 콘텐츠를 개선합니다.

### 3.2 입력 스펙

#### AgentRequest
```python
{
    "task": str,  # seo_optimize | conversion_optimize | readability_improve | length_adjust | tone_adjust
    "payload": {
        "content": dict | str,         # 원본 콘텐츠 (필수)
        "improvements": List[str],     # 개선 사항 (선택)
        "target_keywords": List[str],  # SEO용 키워드 (선택)
        "target_length": int           # 목표 길이 (선택)
    },
    "options": {}
}
```

### 3.3 출력 스펙

#### AgentResponse
```python
{
    "agent": "optimizer",
    "task": str,
    "outputs": [
        {
            "type": "json",
            "name": "optimized_result",
            "value": {
                "optimized_content": dict | str,  # 최적화된 콘텐츠
                "improvements_applied": List[str], # 적용된 개선사항
                "before_after": dict              # 변경 전후 비교
            },
            "meta": {
                "task": str,
                "format": "optimization"
            }
        }
    ],
    "usage": {
        "llm_tokens": int,
        "total_tokens": int,
        "elapsed_seconds": float
    }
}
```

### 3.4 프롬프트 템플릿

#### System Prompt
```
당신은 콘텐츠 최적화 전문가입니다.
기존 콘텐츠를 개선하고 최적화하세요.
핵심 메시지를 유지하면서 품질을 향상시키세요.
```

#### User Prompt (task=readability_improve)
```
# 작업
가독성 개선

# 원본 콘텐츠
{content}

# 개선 사항
{improvements}

# 출력 구조
{
  "improved_content": {...},
  "readability_score": 8,
  "changes_made": ["변경사항1", "변경사항2"],
  "explanation": "개선 설명"
}

# 지시사항
- 문장 구조 단순화
- 명확한 표현 사용
- 핵심 메시지 유지
- JSON 형식으로 출력
```

### 3.5 성능 메트릭

| 메트릭 | 목표값 | 측정 방법 |
|--------|--------|-----------|
| 응답 시간 | < 5초 | `elapsed_seconds` |
| 개선율 | > 20% | Reviewer 점수 비교 |

---

## 4. DesignerAgent

### 4.1 역할

제품 이미지, 브랜드 로고, SNS 썸네일 등 비주얼 콘텐츠를 생성하는 Agent. Media Gateway (ComfyUI)를 통해 이미지를 생성합니다.

### 4.2 입력 스펙

#### AgentRequest
```python
{
    "task": str,  # product_image | brand_logo | sns_thumbnail | ad_banner | illustration
    "payload": {
        "product_name": str,       # 제품명 (필수)
        "description": str,        # 설명 (선택)
        "style": str               # minimal | modern | vintage | luxury | playful
    },
    "options": {
        "enhance_prompt": bool,    # LLM 프롬프트 개선 (기본: False)
        "width": int,              # 이미지 너비 (기본: 작업별 기본값)
        "height": int,             # 이미지 높이
        "steps": int,              # 추론 스텝 (기본: 30)
        "cfg_scale": float,        # CFG Scale (기본: 7.0)
        "seed": int,               # Seed (선택)
        "negative_prompt": str     # 네거티브 프롬프트 (선택)
    }
}
```

#### 입력 예시 (product_image)
```json
{
    "task": "product_image",
    "payload": {
        "product_name": "울트라 무선 이어폰 Pro",
        "description": "프리미엄 노이즈캔슬링 이어폰",
        "style": "minimal"
    },
    "options": {
        "enhance_prompt": false,
        "width": 1024,
        "height": 1024
    }
}
```

### 4.3 출력 스펙

#### AgentResponse
```python
{
    "agent": "designer",
    "task": str,
    "outputs": [
        {
            "type": "image",
            "name": "product_visual",
            "value": str,  # Base64 인코딩된 이미지
            "meta": {
                "format": "png" | "jpg",
                "width": int,
                "height": int
            }
        }
    ],
    "usage": {
        "media_provider": str,      # "comfyui"
        "images_generated": int,
        "elapsed_seconds": float
    },
    "meta": {
        "media_provider": str,      # "comfyui"
        "media_model": str,         # "juggernautXL_ragnarokBy.safetensors"
        "task": str,
        "prompt": str,              # 사용된 프롬프트
        "style": str
    }
}
```

### 4.4 프롬프트 템플릿

#### 기본 프롬프트 (task=product_image)
```
Professional product photography of {product_name},
centered composition, studio lighting,
white to light gray gradient background,
clean and minimal, high quality, 8k resolution,
commercial advertising style
```

#### 작업별 기본 해상도
```python
{
    "product_image": {"width": 1024, "height": 1024},
    "brand_logo": {"width": 512, "height": 512},
    "sns_thumbnail": {"width": 1200, "height": 630},
    "ad_banner": {"width": 1920, "height": 1080},
    "illustration": {"width": 1024, "height": 1024}
}
```

### 4.5 성능 메트릭

| 메트릭 | 목표값 | 측정 방법 |
|--------|--------|-----------|
| 응답 시간 | < 40초 | `elapsed_seconds` |
| 이미지 생성 성공률 | > 95% | 골든 세트 테스트 |
| 이미지 크기 | ~500KB | Base64 디코딩 후 |
| ComfyUI 응답률 | > 99% | Health check |

### 4.6 의존성

- **Media Gateway**: 필수
- **ComfyUI Server**: Desktop GPU (100.120.180.42:8188)
- **Model**: Juggernaut XL (SDXL)
- **VRAM**: ~4GB

---

## 5. 공통 인터페이스

### 5.1 AgentBase 추상 클래스

```python
class AgentBase(ABC):
    """모든 Agent의 기본 클래스"""

    @property
    @abstractmethod
    def name(self) -> str:
        """Agent 이름 반환"""
        pass

    @abstractmethod
    async def execute(self, request: AgentRequest) -> AgentResponse:
        """Agent 실행"""
        pass

    def _validate_request(self, request: AgentRequest):
        """요청 검증"""
        if not request.task:
            raise AgentError("task is required")
        if not request.payload:
            raise AgentError("payload is required")

    def _create_output(
        self,
        output_type: str,
        name: str,
        value: Any,
        meta: Optional[Dict] = None
    ) -> AgentOutput:
        """AgentOutput 생성 헬퍼"""
        return AgentOutput(
            type=output_type,
            name=name,
            value=value,
            meta=meta or {}
        )
```

### 5.2 공통 데이터 모델

#### AgentRequest
```python
@dataclass
class AgentRequest:
    task: str
    payload: Dict[str, Any]
    options: Optional[Dict[str, Any]] = None
```

#### AgentResponse
```python
@dataclass
class AgentResponse:
    agent: str
    task: str
    outputs: List[AgentOutput]
    usage: Dict[str, Any]
    meta: Dict[str, Any]
```

#### AgentOutput
```python
@dataclass
class AgentOutput:
    type: str  # "json" | "text" | "image"
    name: str
    value: Any
    meta: Dict[str, Any]
```

---

## 6. 프롬프트 가이드라인

### 6.1 텍스트 길이 제약 (Canvas 1080x1080 최적화)

| 필드 | 최대 길이 | 폰트 크기 | 비고 |
|------|-----------|-----------|------|
| headline | 20자 | 48px | 1-2줄 |
| subheadline | 30자 | 28px | 2줄 |
| body | 80자 | 18px | 3-4줄 |
| bullets | 20자/개 | 16px | 최대 3개 |
| cta | 15자 | 20px | 1줄 |

### 6.2 톤앤매너 가이드

| Tone | 특징 | 적합 제품 |
|------|------|-----------|
| professional | 전문적, 신뢰감 | B2B, 금융, 의료 |
| friendly | 친근한, 따뜻한 | 생활용품, 교육 |
| luxury | 프리미엄, 세련된 | 명품, 고급 제품 |
| casual | 편안한, 자연스러운 | 패션, 라이프스타일 |
| energetic | 활기찬, 역동적인 | 스포츠, 음료 |

### 6.3 이미지 프롬프트 Best Practices

#### DO ✅
- 구체적인 제품명 명시
- 배경 스타일 지정 (white background, gradient 등)
- 조명 스타일 명시 (studio lighting, soft light 등)
- 구도 지정 (centered, side view 등)
- 품질 키워드 포함 (high quality, 8k, professional 등)

#### DON'T ❌
- 추상적인 표현 ("beautiful", "amazing" 등)
- 불필요한 수식어 남발
- 너무 긴 프롬프트 (100단어 초과)
- 모순된 지시사항 ("minimal but detailed")

#### 예시 (Good)
```
Professional product photography of wireless earbuds,
centered composition, studio lighting,
white to light gray gradient background,
clean and minimal, high quality, 8k resolution,
commercial advertising style
```

#### 예시 (Bad)
```
Amazing beautiful super cool wireless earbuds,
make it look awesome and professional,
very detailed but also simple,
lots of colors but also minimal
```

---

## 7. 에러 핸들링

### 7.1 공통 에러 유형

```python
class AgentError(Exception):
    """Agent 실행 에러"""
    def __init__(
        self,
        message: str,
        agent: str,
        details: Optional[Dict] = None
    ):
        self.message = message
        self.agent = agent
        self.details = details or {}
```

### 7.2 에러 시나리오

| 에러 유형 | 원인 | 처리 방법 |
|-----------|------|-----------|
| `AgentError` | Agent 실행 실패 | 로그 기록, 사용자에게 에러 메시지 반환 |
| `LLMError` | LLM API 실패 | 폴백 LLM 사용, 재시도 |
| `MediaError` | ComfyUI 연결 실패 | 텍스트만 반환 (Graceful degradation) |
| `ValidationError` | 잘못된 입력 | 사용자에게 검증 에러 반환 |

---

## 8. 테스트 가이드

### 8.1 단위 테스트 (pytest)

```python
@pytest.mark.asyncio
async def test_copywriter_product_detail():
    """CopywriterAgent product_detail 테스트"""
    agent = get_copywriter_agent()

    request = AgentRequest(
        task="product_detail",
        payload={
            "product_name": "무선 이어폰",
            "features": ["노이즈캔슬링", "24시간 배터리"],
            "target_audience": "2030 직장인"
        },
        options={"tone": "professional"}
    )

    response = await agent.execute(request)

    # 검증
    assert response.agent == "copywriter"
    assert len(response.outputs) > 0
    assert "headline" in response.outputs[0].value
    assert len(response.outputs[0].value["headline"]) <= 20
```

### 8.2 골든 세트 테스트

```bash
# 골든 세트 검증 실행
python tests/golden_set_validator.py --agent copywriter

# 전체 Agent 검증
python tests/golden_set_validator.py --all
```

---

## 9. 버전 히스토리

| 버전 | 날짜 | 변경 사항 |
|------|------|-----------|
| 1.0 | 2025-11-23 | 초기 SPEC 문서 작성 (고도화 1/3 완료) |

---

## 10. 참고 문서

- **구현 파일**:
  - [copywriter.py](../app/services/agents/copywriter.py)
  - [reviewer.py](../app/services/agents/reviewer.py)
  - [optimizer.py](../app/services/agents/optimizer.py)
  - [designer.py](../app/services/agents/designer.py)
- **워크플로우 문서**: `docs/WORKFLOW_SPECIFICATIONS.md` (예정)
- **LLM 통합 가이드**: `docs/LLM_INTEGRATION_GUIDE.md`

---

**작성자**: B팀 (Backend)
**검토자**: A팀 (QA)
**승인 날짜**: 2025-11-23
