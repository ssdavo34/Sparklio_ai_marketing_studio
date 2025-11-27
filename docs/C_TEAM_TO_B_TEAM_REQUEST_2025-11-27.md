# C팀 → B팀 협조 요청서 v2.0

**작성일**: 2025-11-27 (목요일)
**작성팀**: C팀 (Frontend)
**수신팀**: B팀 (Backend)
**우선순위**: P0 (긴급)
**참조 문서**:
- [C_TEAM_CONCEPT_QUALITY_ANALYSIS_2025-11-27.md](./C_TEAM_CONCEPT_QUALITY_ANALYSIS_2025-11-27.md)
- [CONCEPT_SPEC.md](./CONCEPT_SPEC.md) ⭐ **새로 추가**
- [CONCEPT_AGENT_V2_UPGRADE_PLAN.md](./CONCEPT_AGENT_V2_UPGRADE_PLAN.md) ⭐ **새로 추가**

---

## 🆕 업데이트 내역 (v2.0)

**2025-11-27 오후 업데이트**:
1. ✅ **CONCEPT_SPEC.md 추가** - Sparklio Concept System v1 스펙 정의
2. ✅ **CONCEPT_AGENT_V2_UPGRADE_PLAN.md 추가** - ConceptAgent 고도화 계획
3. ✅ **요청 내용 확장** - 단순 엔드포인트 추가 → **ConceptV1 스키마 전체 구현**

---

## 📌 요청 배경

**현재 문제**:
- Chat에서 사용자가 주제를 입력하면 CopywriterAgent만 호출됨
- CopywriterAgent 출력을 Frontend에서 억지로 "3개 컨셉"으로 분할
- 결과적으로 **진정한 마케팅 컨셉**이 아닌 **feature 나열**만 제공됨
- **타겟 고객, 톤앤매너, 비주얼 스타일, 색상 팔레트** 등 핵심 요소 누락

**해결 방향**:
- Chat에서 **ConceptAgent**를 직접 호출할 수 있는 API 엔드포인트 추가
- Demo Day 파이프라인의 ConceptAgent 로직 재사용
- Frontend에서 고품질 마케팅 컨셉 생성 가능

**기대 효과**:
- ✅ 컨셉 품질 **대폭 향상** (전문적인 마케팅 전략 관점)
- ✅ 타겟, 톤앤매너, 비주얼 스타일 자동 생성
- ✅ 색상 팔레트 제안 (HEX 코드)
- ✅ 전략적 다양성 확보 (감성적/이성적, 가격/품질 강조 등)

---

## 🎯 요청 내용

### 요청 1: 새 API 엔드포인트 추가 ⭐

**엔드포인트**: `POST /api/v1/concepts/from-prompt`

**요청 Body**:
```json
{
  "prompt": "AI를 활용한 마케팅 자동화 도구를 홍보하고 싶어요",
  "concept_count": 3,
  "brand_context": "Sparklio AI - 마케팅 자동화 플랫폼"
}
```

**스키마 (제안)**:
```python
class ConceptFromPromptRequest(BaseModel):
    prompt: str = Field(
        ...,
        description="사용자 입력 프롬프트",
        min_length=5,
        max_length=500
    )
    concept_count: int = Field(
        default=3,
        ge=1,
        le=5,
        description="생성할 컨셉 수 (1-5)"
    )
    brand_context: Optional[str] = Field(
        None,
        description="브랜드 컨텍스트 (선택)"
    )
```

**응답 Body**:
```json
{
  "concepts": [
    {
      "concept_name": "시간 절약 강조",
      "concept_description": "바쁜 마케터를 위한 자동화 솔루션...",
      "target_audience": "중소기업 마케팅 담당자",
      "key_message": "하루 3시간, AI가 대신합니다",
      "tone_and_manner": "효율성, 신뢰감",
      "visual_style": "모던한 오피스, 깔끔한 UI",
      "color_palette": ["#4F46E5", "#10B981", "#F59E0B"],
      "keywords": ["자동화", "시간절약", "효율"]
    },
    {
      "concept_name": "비용 절감 강조",
      "concept_description": "광고비를 줄이고 효과는 높이는...",
      "target_audience": "스타트업 대표",
      "key_message": "광고비 50% 절감, 성과는 2배",
      "tone_and_manner": "합리적, 실용적",
      "visual_style": "그래프, 데이터 중심",
      "color_palette": ["#059669", "#DC2626", "#F59E0B"],
      "keywords": ["ROI", "절감", "성과"]
    },
    {
      "concept_name": "혁신 기술 강조",
      "concept_description": "최신 AI 기술로 마케팅 혁신...",
      "target_audience": "혁신을 추구하는 마케터",
      "key_message": "AI가 만드는 마케팅의 미래",
      "tone_and_manner": "혁신적, 미래지향적",
      "visual_style": "테크 느낌, 그라디언트",
      "color_palette": ["#8B5CF6", "#3B82F6", "#06B6D4"],
      "keywords": ["AI", "혁신", "미래"]
    }
  ],
  "reasoning": "3가지 서로 다른 접근으로 컨셉을 생성했습니다..."
}
```

**스키마 (제안)**:
```python
class ConceptFromPromptResponse(BaseModel):
    concepts: List[ConceptOutput]  # app.services.agents.concept의 ConceptOutput 재사용
    reasoning: str = Field(..., description="컨셉 도출 근거")
```

---

### 구현 예시 (참고용)

**파일**: `backend/app/api/v1/concepts.py` (신규 생성)

```python
"""
Concept API

Chat에서 직접 ConceptAgent를 호출할 수 있는 엔드포인트
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List

from app.database import get_db
from app.services.agents.concept import get_concept_agent, ConceptOutput
from app.services.agents.base import AgentRequest
from app.services.llm import get_llm_gateway

router = APIRouter(prefix="/concepts", tags=["concepts"])


class ConceptFromPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=500)
    concept_count: int = Field(default=3, ge=1, le=5)
    brand_context: Optional[str] = None


class ConceptFromPromptResponse(BaseModel):
    concepts: List[ConceptOutput]
    reasoning: str


@router.post("/from-prompt", response_model=ConceptFromPromptResponse)
async def create_concepts_from_prompt(
    request: ConceptFromPromptRequest,
    db: Session = Depends(get_db)
):
    """
    프롬프트 기반 컨셉 생성

    Chat에서 사용자 입력을 받아 ConceptAgent로 3개의 마케팅 컨셉 생성

    Args:
        request: 프롬프트, 컨셉 수, 브랜드 컨텍스트

    Returns:
        3개의 마케팅 컨셉 (타겟, 톤앤매너, 비주얼, 색상 포함)
    """
    try:
        # LLM Gateway
        llm_gateway = get_llm_gateway()

        # ConceptAgent 초기화
        concept_agent = get_concept_agent(llm_gateway=llm_gateway)

        # 프롬프트를 meeting_summary 형식으로 변환
        # (ConceptAgent는 meeting_summary를 입력으로 받음)
        meeting_summary = {
            "title": "사용자 요청",
            "key_points": [request.prompt],
            "core_message": request.prompt
        }

        # ConceptAgent 실행
        agent_response = await concept_agent.execute(
            AgentRequest(
                task="generate_concepts",
                payload={
                    "meeting_summary": meeting_summary,
                    "concept_count": request.concept_count,
                    "brand_context": request.brand_context
                }
            )
        )

        # 결과 파싱
        output = agent_response.outputs[0].value

        return ConceptFromPromptResponse(
            concepts=output["concepts"],
            reasoning=output.get("reasoning", "")
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Concept generation failed: {str(e)}"
        )
```

**라우터 등록**: `backend/app/api/v1/__init__.py`
```python
from .concepts import router as concepts_router

# 기존 라우터에 추가
api_router.include_router(concepts_router)
```

---

## 📋 작업 체크리스트

### B팀 작업

- [ ] `backend/app/api/v1/concepts.py` 파일 생성
- [ ] `POST /api/v1/concepts/from-prompt` 엔드포인트 구현
- [ ] `ConceptFromPromptRequest`, `ConceptFromPromptResponse` 스키마 정의
- [ ] ConceptAgent 호출 로직 추가 (demo.py 참고)
- [ ] 라우터 등록 (`app/api/v1/__init__.py`)
- [ ] Mac mini 서버 배포
- [ ] API 테스트 (Postman / curl)
- [ ] C팀에 완료 알림

### Mac mini 배포 방법

```bash
# 1. Mac mini SSH 접속
ssh woosun@100.123.51.5

# 2. 프로젝트 경로 이동
cd ~/sparklio_ai_marketing_studio

# 3. Git Pull (최신 코드 동기화)
git pull origin main  # 또는 작업 브랜치

# 4. Backend 재시작 (Docker)
cd docker/mac-mini
export PATH=$PATH:/usr/local/bin
docker compose restart backend

# 5. 로그 확인
docker logs sparklio-backend --tail 50 -f
# Ctrl+C로 종료
```

### 테스트 방법

**로컬 Windows (K: 드라이브)에서 테스트**:

```bash
# 1. Health Check
curl http://100.123.51.5:8000/health

# 2. Concept 생성 테스트
curl -X POST http://100.123.51.5:8000/api/v1/concepts/from-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "AI 마케팅 자동화 도구를 홍보하고 싶어요",
    "concept_count": 3,
    "brand_context": "Sparklio AI"
  }'

# 3. 응답 확인
# - concepts 배열에 3개 항목
# - 각 concept에 concept_name, target_audience, key_message 등 포함
# - color_palette는 HEX 코드 배열
```

**또는 Mac mini에서 직접 테스트**:

```bash
# SSH 접속 후
ssh woosun@100.123.51.5

# localhost로 테스트 (더 빠름)
curl -X POST http://localhost:8000/api/v1/concepts/from-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "AI 마케팅 자동화 도구를 홍보하고 싶어요",
    "concept_count": 3,
    "brand_context": "Sparklio AI"
  }'
```

---

## 🔄 C팀 후속 작업 (B팀 완료 후)

### 1. `useConceptGenerate()` hook 추가

**파일**: `frontend/lib/hooks/useConceptGenerate.ts`

```typescript
import { useState } from 'react';

interface ConceptOutput {
  concept_name: string;
  concept_description: string;
  target_audience: string;
  key_message: string;
  tone_and_manner: string;
  visual_style: string;
  color_palette: string[];
  keywords: string[];
}

interface ConceptResponse {
  concepts: ConceptOutput[];
  reasoning: string;
}

export function useConceptGenerate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateConcepts(
    prompt: string,
    conceptCount: number = 3,
    brandContext?: string
  ): Promise<ConceptResponse> {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('http://100.123.51.5:8000/api/v1/concepts/from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          concept_count: conceptCount,
          brand_context: brandContext
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  return { generateConcepts, isLoading, error };
}
```

### 2. ChatPanel.tsx 수정

- "컨셉 생성" vs "카피 생성" 모드 토글 추가
- 컨셉 생성 모드에서 `useConceptGenerate()` 사용
- ConceptBoard로 직접 전달

---

## ⏰ 예상 작업 시간

| 팀 | 작업 | 예상 시간 |
|----|------|----------|
| **B팀** | 엔드포인트 구현 + 테스트 + 배포 | **1-2시간** |
| **C팀** | Hook 추가 + ChatPanel 수정 + 테스트 | 2-3시간 |
| **전체** | 통합 테스트 + 버그 수정 | 1시간 |
| **총계** | | **4-6시간** |

---

## 🎯 기대 효과

### Before (현재)
```
사용자: "AI 마케팅 도구를 홍보하고 싶어요"
  ↓ CopywriterAgent
결과:
- headline: "AI 마케팅 도구"
- description: "효율적인 마케팅..."
- bullets: ["자동화", "시간절약", "비용절감"]

❌ 3개 컨셉? → Feature 3개를 억지로 분할
❌ 타겟 고객? → 없음
❌ 톤앤매너? → 없음
❌ 비주얼 스타일? → 없음
❌ 색상 팔레트? → 없음
```

### After (개선 후)
```
사용자: "AI 마케팅 도구를 홍보하고 싶어요"
  ↓ ConceptAgent
결과:
컨셉 1: "시간 절약 강조"
  - 타겟: 중소기업 마케터
  - 톤: 효율성, 신뢰감
  - 비주얼: 모던 오피스
  - 색상: #4F46E5, #10B981, #F59E0B
  - 메시지: "하루 3시간, AI가 대신합니다"

컨셉 2: "비용 절감 강조"
  - 타겟: 스타트업 대표
  - 톤: 합리적, 실용적
  - 비주얼: 그래프, 데이터
  - 색상: #059669, #DC2626, #F59E0B
  - 메시지: "광고비 50% 절감, 성과는 2배"

컨셉 3: "혁신 기술 강조"
  - 타겟: 혁신 추구 마케터
  - 톤: 혁신적, 미래지향적
  - 비주얼: 테크, 그라디언트
  - 색상: #8B5CF6, #3B82F6, #06B6D4
  - 메시지: "AI가 만드는 마케팅의 미래"

✅ 진정한 마케팅 컨셉
✅ 전략적 다양성
✅ 완전한 정보 (타겟, 톤, 비주얼, 색상)
```

---

## 📞 연락처

**작성자**: C팀 Claude
**협조 요청**: B팀
**우선순위**: P0 (긴급)
**관련 문서**: [C_TEAM_CONCEPT_QUALITY_ANALYSIS_2025-11-27.md](./C_TEAM_CONCEPT_QUALITY_ANALYSIS_2025-11-27.md)

---

**작성 완료**: 2025-11-27 (목요일)
**다음 단계**: B팀 확인 및 작업 착수 대기
