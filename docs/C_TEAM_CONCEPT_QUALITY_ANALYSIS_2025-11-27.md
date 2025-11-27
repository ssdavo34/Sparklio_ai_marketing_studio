# Concept Board 품질 개선 분석 보고서

**작성일**: 2025-11-27 (목요일)
**작성팀**: C팀 (Frontend)
**목적**: Chat → LLM → Concept Board 플로우 분석 및 품질 개선 방안 도출

---

## 📌 현재 플로우 분석

### 1. 전체 플로우 구조

```
사용자 입력 (Chat)
    ↓
Frontend: ChatPanel.tsx
    ↓ generate(kind, prompt)
Frontend: useGenerate Hook
    ↓ apiClient.generate()
Frontend: api-client.ts
    ↓ POST /api/v1/generate
Backend: GeneratorService
    ↓ CopywriterAgent.execute()
Backend: CopywriterAgent
    ↓ LLMGateway.generate()
Backend: LLM (Ollama/Gemini)
    ↓ JSON 응답
Backend: OutputValidator (품질 검증)
    ↓ 재시도 로직 (최대 3회)
Frontend: GenerateResponse
    ↓ addGenerateResponseToPolotno()
Frontend: Polotno Canvas + ConceptBoard View
```

---

## 🔍 핵심 문제점 파악

### 문제 1: Chat → Concept Board 플로우에서 **ConceptAgent 미사용**

**현상**:
- 사용자가 Chat에서 주제를 입력할 때 `useGenerate()` hook을 사용
- 이 hook은 `/api/v1/generate` 엔드포인트를 호출
- 이 엔드포인트는 **CopywriterAgent**만 호출함
- **ConceptAgent는 Demo Day 파이프라인(`/api/v1/demo/meeting-to-campaign`)에서만 사용됨**

**증거**:
```typescript
// Frontend: useGenerate.ts (line 94-102)
res = await apiClient.generate({
  kind,
  brandId: brandId || "brand_demo",
  input: { prompt }, // 단순 프롬프트만 전달
  options: {
    tone: "professional",
    length: "medium",
  },
});
```

```python
# Backend: CopywriterAgent (line 98-104)
llm_response = await self.llm_gateway.generate(
    role=self.name,  # "copywriter"
    task=request.task,
    payload=enhanced_payload,
    mode="json",
    options=llm_options
)
```

**결과**:
- CopywriterAgent는 **단일 제품 카피 생성**에 특화됨 (product_detail, sns, brand_kit)
- ConceptAgent가 제공하는 **3개 다양한 컨셉 + 비주얼 스타일 + 색상 팔레트**를 제공하지 못함

---

### 문제 2: Frontend의 Concept 생성 로직이 **임의 분할 방식**

**현상**:
- ChatPanel.tsx의 `addGenerateResponseToPolotno()` 함수 (line 127-303)
- CopywriterAgent의 단일 응답을 **억지로 3개 컨셉으로 분할**

**코드 증거**:
```typescript
// ChatPanel.tsx (line 198-238)
if (allFeatures.length > 0) {
  // product_features에서 최대 3개를 뽑아서 각각 "컨셉"으로 만듦
  allFeatures.slice(0, 3).forEach((featureTitle: string) => {
    concepts.push({
      headline: featureTitle,  // ❌ 단순히 feature를 headline으로
      subheadline: productTitle,
      description: productDescription,
      bullets: usps,
    });
  });
}

// 컨셉이 없으면 메인 컨셉에서 3가지 "변형" 생성
if (concepts.length === 0 && (productTitle || productDescription)) {
  // ❌ 같은 내용을 3번 반복 (headline만 바꿈)
  concepts.push({
    headline: productTitle,
    subheadline: targetAudience ? `${targetAudience}를 위한` : '당신을 위한',
    description: productDescription,
    bullets: usps,
  });

  if (usps && usps.length > 0) {
    concepts.push({
      headline: usps[0],  // ❌ USP를 headline으로 치환
      subheadline: productTitle,
      description: productDescription,
      bullets: usps.slice(1),
    });
  }
}
```

**문제점**:
1. **진정한 "컨셉"이 아님** - 단순히 제품 feature를 나열한 것
2. **다양성 부족** - 같은 description/bullets를 3번 반복
3. **타겟 고객, 톤앤매너, 비주얼 스타일 없음** - 마케팅 컨셉의 핵심 요소 누락
4. **전략적 차별화 없음** - "감성적 vs 이성적", "가격 강조 vs 품질 강조" 같은 접근 방식 차이 없음

---

### 문제 3: ConceptAgent와 CopywriterAgent의 출력 구조 차이

**ConceptAgent 출력** (concept.py):
```python
class ConceptOutput(BaseModel):
    concept_name: str           # 컨셉 이름 (5-15자)
    concept_description: str    # 컨셉 설명 (2-3문장)
    target_audience: str        # 타겟 고객
    key_message: str            # 핵심 메시지 (10-30자)
    tone_and_manner: str        # 톤앤매너
    visual_style: str           # 비주얼 스타일
    color_palette: List[str]    # 색상 팔레트 (HEX)
    keywords: List[str]         # 연관 키워드
```

**CopywriterAgent 출력** (추정):
```typescript
{
  headline: string,
  subheadline?: string,
  body: string,
  bullets: string[],
  cta?: string
}
```

**결과**:
- ConceptAgent는 **마케팅 전략 관점**의 컨셉
- CopywriterAgent는 **카피라이팅 관점**의 텍스트
- 현재는 카피라이팅 결과를 억지로 컨셉으로 변환 중

---

## 💡 품질 개선 방안

### 방안 1: Chat에서 ConceptAgent 호출 추가 ⭐ **추천**

**구현**:
1. 새 API 엔드포인트 추가 (B팀 협조 필요)
   - `POST /api/v1/concepts/from-prompt`
   - 입력: `{ prompt: string, concept_count?: number }`
   - 출력: `ConceptAgentOutput` (concepts 배열)

2. Frontend에 `useConceptGenerate()` hook 추가
   ```typescript
   export function useConceptGenerate() {
     async function generateConcepts(prompt: string, count: number = 3) {
       const res = await fetch('/api/v1/concepts/from-prompt', {
         method: 'POST',
         body: JSON.stringify({ prompt, concept_count: count })
       });
       return await res.json();
     }
   }
   ```

3. ChatPanel.tsx 수정
   - "컨셉 생성" 모드 추가
   - `generateConcepts()` 호출
   - ConceptBoard로 직접 전달 (Polotno 우회)

**장점**:
- ✅ ConceptAgent의 **전문적인 컨셉 생성** 활용
- ✅ **타겟 고객, 톤앤매너, 비주얼 스타일, 색상 팔레트** 자동 생성
- ✅ **전략적 다양성** 확보 (감성적/이성적, 가격/품질 강조 등)
- ✅ B팀이 이미 구현한 Agent 재사용

**단점**:
- ❌ B팀 협조 필요 (새 엔드포인트 추가)
- ❌ Frontend hook 추가 작업 필요

**우선순위**: P0 (즉시 적용 권장)

---

### 방안 2: CopywriterAgent 프롬프트 개선 (임시 방안)

**구현**:
1. CopywriterAgent에 "컨셉 생성 모드" 추가
2. 프롬프트에 다음 지시 추가:
   - "3가지 서로 다른 접근 방식으로 컨셉을 생성하세요"
   - "각 컨셉은 타겟 고객, 톤앤매너, 핵심 메시지를 포함하세요"

**장점**:
- ✅ 빠른 적용 가능 (B팀 작업 최소화)

**단점**:
- ❌ CopywriterAgent는 카피라이팅 전문 - 컨셉 전략은 ConceptAgent의 역할
- ❌ 품질이 ConceptAgent보다 낮을 가능성
- ❌ 임시방편

**우선순위**: P2 (방안 1 구현까지 임시 사용)

---

### 방안 3: Frontend 파싱 로직 개선 (최소 조치)

**구현**:
1. `addGenerateResponseToPolotno()` 함수 개선
2. 더 똑똑한 컨셉 분할 로직:
   - product_features가 3개 이상이면 각각을 다른 "각도"로 설명
   - tone, target_audience를 활용해 변형 생성

**장점**:
- ✅ C팀만으로 즉시 적용 가능

**단점**:
- ❌ 근본적인 해결책이 아님 - "진짜 컨셉"을 만들 수 없음
- ❌ CopywriterAgent 출력은 컨셉이 아닌 카피

**우선순위**: P3 (비권장 - 방안 1이 더 좋음)

---

## 🎯 권장 솔루션

### Phase 1: 즉시 적용 (이번 주)

1. **B팀에 요청서 작성**
   - `POST /api/v1/concepts/from-prompt` 엔드포인트 추가
   - ConceptAgent 호출 (기존 Demo Day 로직 재사용)
   - 입력: `{ prompt: string, concept_count: number }`
   - 출력: `{ concepts: ConceptOutput[] }`

2. **C팀 작업**
   - `useConceptGenerate()` hook 추가
   - ChatPanel에 "컨셉 생성" vs "카피 생성" 모드 토글
   - ConceptBoard와 연결

### Phase 2: UI/UX 개선 (다음 주)

1. **컨셉 카드 강화**
   - 비주얼 스타일 프리뷰
   - 색상 팔레트 표시
   - 타겟 고객 / 톤앤매너 뱃지

2. **컨셉 편집 기능**
   - 사용자가 컨셉명, 핵심 메시지 수정 가능
   - 색상 팔레트 커스터마이징

### Phase 3: 고급 기능 (나중에)

1. **컨셉 비교 모드**
   - 3개 컨셉을 나란히 비교
   - 각 컨셉의 강점/약점 분석

2. **A/B 테스트 제안**
   - 어떤 컨셉이 타겟에 더 효과적일지 AI 추천

---

## 📋 B팀 요청사항 요약

### 요청 1: 새 API 엔드포인트 추가

**엔드포인트**: `POST /api/v1/concepts/from-prompt`

**요청 스키마**:
```python
class ConceptFromPromptRequest(BaseModel):
    prompt: str = Field(..., description="사용자 입력 프롬프트")
    concept_count: int = Field(default=3, ge=1, le=5)
    brand_context: Optional[str] = None
```

**응답 스키마**:
```python
class ConceptFromPromptResponse(BaseModel):
    concepts: List[ConceptOutput]  # ConceptAgent 출력 그대로 사용
    reasoning: str
```

**구현 방법**:
```python
# demo.py의 ConceptAgent 호출 로직 재사용
async def concepts_from_prompt(
    request: ConceptFromPromptRequest,
    db: Session = Depends(get_db)
):
    # 프롬프트를 meeting_summary 형식으로 변환
    meeting_summary = {
        "title": "사용자 요청",
        "key_points": [request.prompt],
        "core_message": request.prompt
    }

    # ConceptAgent 호출
    concept_agent = get_concept_agent(llm_gateway)
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

    # 결과 반환
    output = agent_response.outputs[0].value
    return ConceptFromPromptResponse(
        concepts=output["concepts"],
        reasoning=output["reasoning"]
    )
```

**우선순위**: P0
**예상 작업 시간**: 1-2시간

---

## ✅ 결론

**현재 문제의 핵심**:
- Chat에서 ConceptAgent를 사용하지 않고 CopywriterAgent만 사용
- CopywriterAgent 출력을 Frontend에서 억지로 "컨셉"으로 분할
- 결과적으로 **진정한 마케팅 컨셉**이 아닌 **feature 나열**만 제공

**해결책**:
- B팀: `POST /api/v1/concepts/from-prompt` 엔드포인트 추가 (1-2시간)
- C팀: `useConceptGenerate()` hook + ChatPanel 수정 (2-3시간)
- 효과: **품질 대폭 향상** (타겟, 톤앤매너, 비주얼, 색상 자동 생성)

**다음 단계**:
1. B팀에 협조 요청서 전달
2. C팀 hook 개발 착수
3. 통합 테스트

---

**작성 완료**: 2025-11-27 (목요일)
**다음 문서**: C_TEAM_TO_B_TEAM_REQUEST_2025-11-27.md
