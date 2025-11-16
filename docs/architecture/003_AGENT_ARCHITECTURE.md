---
doc_id: ARCH-003
title: Agent Architecture - 6개 Agent 설계
created: 2025-11-16
updated: 2025-11-16
status: approved
phase: Phase 1 - Gateway 구축
priority: P0
authors: A팀 (Claude + QA)
supersedes: K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\005. 6개의 에이전트로 llm 연결 방법.md
related:
  - ARCH-001: System Overview
  - ARCH-002: Gateway Pattern
  - SPEC-001: LLM Gateway Spec
---

# Agent Architecture - 6개 Agent 설계

## TL;DR (30초 요약)

**6개 Agent**: Brief / Brand / Strategist / Copywriter / Vision / Reviewer

**핵심 원칙**:
- 모든 Agent는 Gateway만 호출 (직접 모델 호출 금지)
- Agent = "입력 정리 → Gateway 호출 → 응답 포맷 정리"
- VisionGeneratorAgent만 LLM + Media Gateway 둘 다 사용

---

## 목차

1. [Agent 개요](#agent-개요)
2. [6개 Agent 상세](#6개-agent-상세)
3. [Agent → Gateway 매핑](#agent--gateway-매핑)
4. [P0 E2E 시나리오](#p0-e2e-시나리오)
5. [Agent 구현 가이드](#agent-구현-가이드)

---

## Agent 개요

### Agent의 역할

Agent는 **특정 마케팅 작업을 수행하는 독립적인 모듈**입니다.

**하지 않는 것**:
- ❌ 직접 LLM/ComfyUI 호출
- ❌ 모델 선택 (Router가 함)
- ❌ 프롬프트 엔지니어링의 세부 튜닝 (Gateway가 함)

**하는 것**:
- ✅ 입력 데이터 정리 및 검증
- ✅ Gateway 호출 (role + task 명시)
- ✅ 응답을 비즈니스 로직에 맞게 후처리
- ✅ 에러 처리 및 재시도

### Agent 구조

```python
class BaseAgent(ABC):
    def __init__(self):
        self.llm_client = LLMGatewayClient()
        self.media_client = MediaGatewayClient()  # 필요 시

    @abstractmethod
    async def execute(self, input_data: Dict) -> Dict:
        """
        1. 입력 검증
        2. Gateway 호출
        3. 응답 후처리
        4. 결과 반환
        """
        pass
```

---

## 6개 Agent 상세

### 1. BriefAgent

**역할**: 초기 마케팅 브리프 생성

**입력**:
```jsonc
{
  "brand": {
    "id": "brand_001",
    "name": "테스트 브랜드",
    "industry": "헬스케어",
    "tone": "warm_minimal"
  },
  "product": {
    "name": "테스트 단백질",
    "category": "건강보조식품",
    "features": ["고단백", "저당", "간편"]
  },
  "target": "20-30대 직장인"
}
```

**Gateway 호출**:
```python
response = await self.llm_client.generate(
    role="brief",
    task="marketing_brief",
    mode="json",
    payload=input_data
)
```

**출력**:
```jsonc
{
  "brief_id": "brief_001",
  "target_audience": "20-30대 직장인, 운동 관심",
  "positioning": "간편하게 즐기는 프리미엄 단백질",
  "key_messages": [
    "바쁜 일상 속 간편한 영양 보충",
    "고품질 단백질 함량",
    "맛있고 건강하게"
  ],
  "tone": "친근하면서도 신뢰감 있는"
}
```

---

### 2. BrandAgent

**역할**: 브랜드 가이드 요약 및 톤/스타일 추출

**입력**:
```jsonc
{
  "brand_id": "brand_001",
  "brand_materials": [
    "브랜드 가이드.pdf",
    "기존 마케팅 자료.pptx"
  ],
  "context": "새 상품 출시 캠페인"
}
```

**Gateway 호출**:
```python
# Task 1: 브랜드 요약
summary_response = await self.llm_client.generate(
    role="brand",
    task="brand_summary",
    mode="json",
    payload={"materials": materials_text}
)

# Task 2: 톤/스타일 가이드
voice_response = await self.llm_client.generate(
    role="brand",
    task="brand_voice",
    mode="json",
    payload={"summary": summary_response}
)
```

**출력**:
```jsonc
{
  "brand_summary": {
    "mission": "건강한 라이프스타일 지원",
    "core_values": ["신뢰", "혁신", "간편함"],
    "differentiators": ["과학적 연구 기반", "프리미엄 원료"]
  },
  "brand_voice": {
    "tone": "warm_minimal",
    "keywords": ["믿을 수 있는", "함께하는", "간편한"],
    "avoid": ["과장된 표현", "전문 용어 남발"]
  }
}
```

---

### 3. StrategistAgent

**역할**: 콘텐츠 플랜 및 섹션 구조 설계

**입력**:
```jsonc
{
  "brief": { /* BriefAgent 출력 */ },
  "brand": { /* BrandAgent 출력 */ },
  "content_type": "product_detail_page"
}
```

**Gateway 호출**:
```python
response = await self.llm_client.generate(
    role="strategist",
    task="content_plan",
    mode="json",
    payload={
        "brief": brief,
        "brand": brand,
        "content_type": content_type
    }
)
```

**출력**:
```jsonc
{
  "sections": [
    {
      "id": "hero",
      "type": "hero_section",
      "purpose": "첫인상 및 핵심 메시지 전달",
      "required_elements": ["메인 이미지", "헤드라인", "서브헤드"]
    },
    {
      "id": "features",
      "type": "feature_list",
      "purpose": "제품 특징 3가지 소개",
      "required_elements": ["아이콘", "제목", "설명"]
    },
    {
      "id": "specs",
      "type": "specification",
      "purpose": "제품 스펙 상세",
      "required_elements": ["스펙 테이블"]
    }
  ],
  "layout_suggestion": "F-pattern, hero → features → specs"
}
```

---

### 4. CopywriterAgent

**역할**: 실제 카피 텍스트 작성

**입력**:
```jsonc
{
  "brief": { /* BriefAgent 출력 */ },
  "brand": { /* BrandAgent 출력 */ },
  "sections": { /* StrategistAgent 출력 */ },
  "section_to_write": "hero"
}
```

**Gateway 호출**:
```python
response = await self.llm_client.generate(
    role="copywriter",
    task="product_detail",
    mode="text",
    payload={
        "brief": brief,
        "brand": brand,
        "section": section_to_write
    }
)
```

**출력**:
```jsonc
{
  "section_id": "hero",
  "copy": {
    "headline": "바쁜 당신을 위한 30초 영양 충전",
    "subheadline": "고단백, 저당, 맛까지 완벽한 테스트 단백질",
    "cta": "지금 시작하기"
  }
}
```

---

### 5. VisionGeneratorAgent

**역할**: 이미지 프롬프트 생성 + ComfyUI 이미지 생성

**특징**: 유일하게 **LLM Gateway + Media Gateway** 둘 다 사용

**입력**:
```jsonc
{
  "brief": { /* BriefAgent 출력 */ },
  "brand": { /* BrandAgent 출력 */ },
  "section": {
    "id": "hero",
    "purpose": "메인 히어로 이미지"
  }
}
```

**플로우**:

**Step 1: LLM Gateway 호출 (이미지 프롬프트 생성)**
```python
prompt_response = await self.llm_client.generate(
    role="vision",
    task="image_prompt",
    mode="json",
    payload={
        "brief": brief,
        "brand": brand,
        "purpose": section["purpose"]
    }
)

# 응답 예시
{
  "prompt": "화이트 배경 위에 놓인 단백질 파우더 통, 깔끔하고 프리미엄한 느낌, 스튜디오 조명",
  "negative_prompt": "ugly, low quality, blurry",
  "style": "minimal, studio lighting",
  "aspect_ratio": "16:9"
}
```

**Step 2: Media Gateway 호출 (실제 이미지 생성)**
```python
image_response = await self.media_client.generate_image(
    provider="comfyui",
    kind="product_shot",
    prompt=prompt_response["prompt"],
    options={
        "aspect_ratio": "16:9",
        "workflow": "product_shot_v1",
        "num_images": 1
    }
)

# 응답 예시
{
  "image_id": "img_20251116_0001",
  "url": "https://.../images/img_20251116_0001.png",
  "meta": {
    "workflow": "product_shot_v1",
    "aspect_ratio": "16:9"
  }
}
```

**출력**:
```jsonc
{
  "section_id": "hero",
  "image": {
    "id": "img_20251116_0001",
    "url": "https://.../images/img_20251116_0001.png",
    "prompt_used": "화이트 배경 위에...",
    "metadata": {
      "aspect_ratio": "16:9",
      "workflow": "product_shot_v1"
    }
  }
}
```

---

### 6. ReviewerAgent

**역할**: 생성된 카피 리뷰 및 스타일 체크

**입력**:
```jsonc
{
  "brand": { /* BrandAgent 출력 */ },
  "copy": { /* CopywriterAgent 출력 */ }
}
```

**Gateway 호출**:
```python
response = await self.llm_client.generate(
    role="reviewer",
    task="style_check",
    mode="json",
    payload={
        "brand_voice": brand["brand_voice"],
        "copy": copy
    }
)
```

**출력**:
```jsonc
{
  "overall_score": 4.5,
  "tone_match": true,
  "warnings": [
    {
      "type": "word_choice",
      "location": "headline",
      "issue": "'완벽한' 표현이 다소 과장될 수 있음",
      "suggestion": "'탁월한' 또는 구체적 수치 사용 고려"
    }
  ],
  "compliance_check": {
    "health_claims": "통과",
    "risky_words": []
  }
}
```

---

## Agent → Gateway 매핑

### LLM Gateway 매핑표

| Agent | role | task 예시 | 사용 모델 (Phase 1) |
|-------|------|-----------|---------------------|
| **BriefAgent** | `brief` | `marketing_brief` | qwen2.5:7b |
| **BrandAgent** | `brand` | `brand_summary`, `brand_voice` | qwen2.5:7b |
| **StrategistAgent** | `strategist` | `content_plan`, `deck_outline` | qwen2.5:14b |
| **CopywriterAgent** | `copywriter` | `product_detail`, `sns_caption` | qwen2.5:14b |
| **VisionGeneratorAgent** | `vision` | `image_prompt` | qwen2.5:7b |
| **ReviewerAgent** | `reviewer` | `style_check`, `consistency_check` | qwen2.5:7b |

### Media Gateway 사용

| Agent | Media Gateway 사용 | 엔드포인트 |
|-------|-------------------|------------|
| **VisionGeneratorAgent** | ✅ 사용 | `/api/v1/media/image/generate` |
| 나머지 5개 Agent | ❌ 미사용 | - |

---

## P0 E2E 시나리오

### "상품 상세 + 이미지 1장" 플로우

```
1. BrandAgent
   ↓ brand_summary + brand_voice

2. BriefAgent
   ↓ marketing_brief (타깃, 포지셔닝, 핵심 메시지)

3. StrategistAgent
   ↓ sections (hero, features, specs)

4. CopywriterAgent (hero 섹션)
   ↓ copy (헤드라인, 서브헤드, CTA)

5. VisionGeneratorAgent (hero 이미지)
   ↓ LLM: image_prompt
   ↓ Media: ComfyUI 이미지 생성
   ↓ image_id + url

6. ReviewerAgent
   ↓ review (스코어, 경고, 제안)

7. 최종 출력
   → Editor / Canvas Studio로 전달
```

### 실행 스크립트

```python
# backend/scripts/run_p0_product_detail_flow.py

async def run_p0_flow():
    # 1. BrandAgent
    brand = await BrandAgent().execute(brand_input)

    # 2. BriefAgent
    brief = await BriefAgent().execute({
        "brand": brand,
        "product": product_input
    })

    # 3. StrategistAgent
    strategy = await StrategistAgent().execute({
        "brief": brief,
        "brand": brand
    })

    # 4. CopywriterAgent
    copy = await CopywriterAgent().execute({
        "brief": brief,
        "brand": brand,
        "section": strategy["sections"][0]  # hero
    })

    # 5. VisionGeneratorAgent
    image = await VisionGeneratorAgent().execute({
        "brief": brief,
        "brand": brand,
        "section": strategy["sections"][0]
    })

    # 6. ReviewerAgent
    review = await ReviewerAgent().execute({
        "brand": brand,
        "copy": copy
    })

    # 7. 최종 출력
    return {
        "brand": brand,
        "brief": brief,
        "strategy": strategy,
        "copy": copy,
        "image": image,
        "review": review
    }
```

### 실행 방법

```bash
# Mock 모드 (빠름, 30초)
GENERATOR_MODE=mock python backend/scripts/run_p0_product_detail_flow.py

# Live 모드 (실제 Ollama + ComfyUI, 2-3분)
GENERATOR_MODE=live python backend/scripts/run_p0_product_detail_flow.py
```

---

## Agent 구현 가이드

### Agent 파일 구조

```
backend/app/agents/
├── __init__.py
├── base_agent.py                 # BaseAgent ABC
├── brief_agent.py                # BriefAgent
├── brand_agent.py                # BrandAgent
├── strategist_agent.py           # StrategistAgent
├── copywriter_agent.py           # CopywriterAgent
├── vision_generator_agent.py     # VisionGeneratorAgent
└── reviewer_agent.py             # ReviewerAgent
```

### BaseAgent 템플릿

```python
# backend/app/agents/base_agent.py

from abc import ABC, abstractmethod
from typing import Dict, Any
from app.services.clients.llm_client import LLMGatewayClient
from app.services.clients.media_client import MediaGatewayClient

class BaseAgent(ABC):
    def __init__(self):
        self.llm_client = LLMGatewayClient()
        self.media_client = MediaGatewayClient()

    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Agent 실행 메인 메서드

        1. 입력 검증
        2. Gateway 호출
        3. 응답 후처리
        4. 결과 반환
        """
        pass

    def validate_input(self, input_data: Dict, required_fields: list):
        """입력 검증"""
        for field in required_fields:
            if field not in input_data:
                raise ValueError(f"Missing required field: {field}")

    async def call_llm(self, role: str, task: str, payload: Dict) -> Dict:
        """LLM Gateway 호출 래퍼"""
        return await self.llm_client.generate(
            role=role,
            task=task,
            mode="json",
            payload=payload
        )
```

### Agent 구현 예시

```python
# backend/app/agents/brief_agent.py

from .base_agent import BaseAgent
from typing import Dict, Any

class BriefAgent(BaseAgent):
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # 1. 입력 검증
        self.validate_input(input_data, ["brand", "product", "target"])

        # 2. LLM Gateway 호출
        response = await self.call_llm(
            role="brief",
            task="marketing_brief",
            payload={
                "brand": input_data["brand"],
                "product": input_data["product"],
                "target": input_data["target"]
            }
        )

        # 3. 응답 후처리
        brief = response["output"]["parsed"]

        # 4. 결과 반환
        return {
            "brief_id": f"brief_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            **brief
        }
```

---

## 핵심 원칙

### ✅ 해야 할 것

1. **Gateway만 호출**
   ```python
   # ✅ 올바름
   response = await self.llm_client.generate(role="...", task="...")
   ```

2. **입력 검증**
   ```python
   # ✅ 필수
   self.validate_input(input_data, ["brand", "product"])
   ```

3. **에러 처리**
   ```python
   # ✅ 권장
   try:
       response = await self.llm_client.generate(...)
   except GatewayTimeoutError as e:
       logger.error(f"Gateway timeout: {e}")
       # 재시도 또는 기본값 반환
   ```

### ❌ 절대 금지

1. **직접 모델 호출**
   ```python
   # ❌ 금지
   import ollama
   response = ollama.generate(...)
   ```

2. **모델명 지정**
   ```python
   # ❌ 금지
   response = await client.generate(model="qwen2.5:14b", ...)

   # ✅ 필수
   response = await client.generate(role="strategist", task="...")
   # Router가 자동으로 qwen2.5:14b 선택
   ```

3. **Agent 간 직접 호출**
   ```python
   # ❌ 금지
   brand_agent = BrandAgent()
   brand = await brand_agent.execute(...)

   # ✅ 권장
   # Orchestrator 또는 상위 레이어에서 순차 호출
   ```

---

## 관련 문서

### 필수 읽기
- [ARCH-001: System Overview](./001_SYSTEM_OVERVIEW.md)
- [ARCH-002: Gateway Pattern](./002_GATEWAY_PATTERN.md)

### 구현 가이드
- [B팀 작업 지시서](../requests/BACKEND_LLM_GATEWAY_WORK_ORDER.md)

### Spec
- [SPEC-001: LLM Gateway Spec](../specs/LLM_GATEWAY_SPEC_v1.0.md)

---

**작성**: 2025-11-16 by A팀 (Claude + QA)
**승인**: PM
**다음 리뷰**: Phase 2 완료 후
