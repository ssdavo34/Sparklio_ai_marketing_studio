# Backend LLM Prompt 수정 요청서

**작성자:** C팀 Frontend Team
**작성일:** 2025년 11월 17일 월요일 19:45
**대상:** B팀 Backend Team
**우선순위:** P0 (Blocker)
**목적:** LLM이 사용자 입력(prompt)을 올바르게 반영하도록 수정

---

## 🚨 발견된 문제

### 재현 방법

1. Frontend Chat 패널에서 입력:
   ```
   지성 피부용 진정 토너 상세 페이지를 만들어줘
   ```

2. Backend로 전송된 Request:
   ```json
   {
     "kind": "product_detail",
     "brandId": "brand_demo",
     "input": {
       "prompt": "지성 피부용 진정 토너 상세 페이지를 만들어줘"
     },
     "options": {
       "tone": "professional",
       "length": "medium"
     }
   }
   ```

3. **LLM이 생성한 결과:**
   ```json
   {
     "text": {
       "headline": "모바일 충전기 PowerPak",  // ❌ 완전히 다른 제품!
       "subheadline": "제품 설명",
       "body": "고속 충전과 긴 사용 시간을 제공하는 모바일 충전기...",
       ...
     }
   }
   ```

### 문제

- **사용자 입력:** 지성 피부용 진정 토너
- **LLM 생성:** 모바일 충전기 PowerPak

**완전히 다른 제품이 생성되었습니다.**

---

## ✅ 올바른 동작

### 예상 결과

사용자가 입력한 `prompt`의 내용을 **반드시 반영**해야 합니다:

**입력:**
```
지성 피부용 진정 토너 상세 페이지를 만들어줘
```

**기대 출력:**
```json
{
  "text": {
    "headline": "지성 피부 진정 토너",  // ✅ 사용자 입력 반영
    "subheadline": "피부 트러블 완화, 모공 케어",
    "body": "지성 피부를 위한 진정 효과가 뛰어난 토너입니다. 모공 관리와 피부 진정에 효과적이며...",
    "bullets": [
      "지성 피부 전용",
      "모공 케어",
      "트러블 진정"
    ],
    "cta": "지금 구매하기"
  }
}
```

---

## 🔧 수정 방법

### 1. LLM Prompt 템플릿 수정

**현재 (추측):**
```python
# Backend CopywriterAgent의 prompt (추측)
prompt = f"""
당신은 마케팅 카피라이터입니다.
제품 상세 페이지를 작성해주세요.

예시:
headline: "모바일 충전기 PowerPak"
subheadline: "제품 설명"
...
"""
```

**문제점:**
- 사용자 입력 `input.prompt`를 전혀 사용하지 않음
- 고정된 예시만 반환

---

**수정 후 (권장):**

```python
# Backend CopywriterAgent의 prompt
user_prompt = request.input.get("prompt", "")  # 사용자 입력

prompt = f"""
당신은 마케팅 카피라이터입니다.
사용자가 요청한 제품 상세 페이지를 작성해주세요.

사용자 요청:
{user_prompt}

위 요청을 바탕으로 다음 형식으로 작성해주세요:

1. headline (제목): 사용자가 요청한 제품명을 간결하게 표현
2. subheadline (부제): 제품의 핵심 가치 제안 (1줄)
3. body (본문): 제품의 주요 특징 및 장점 설명 (3-5문장)
4. bullets (핵심 포인트): 제품의 주요 특징 3-5개 (각 항목 5-10자)
5. cta (행동 유도 버튼): "구매하기", "자세히 보기" 등

출력 형식 (JSON):
{{
  "headline": "제품명",
  "subheadline": "핵심 가치 제안",
  "body": "제품 설명 본문",
  "bullets": ["특징1", "특징2", "특징3"],
  "cta": "구매하기"
}}

중요:
- 반드시 사용자가 요청한 제품명과 특징을 반영하세요
- 고정된 예시를 사용하지 마세요
- 사용자 입력을 최우선으로 반영하세요
"""

# LLM 호출
response = llm.invoke(prompt)
```

---

### 2. 입력 필드 활용 (구조화된 입력)

만약 Frontend가 구조화된 입력을 제공한다면:

**Frontend Request:**
```json
{
  "kind": "product_detail",
  "input": {
    "product_name": "지성 피부 진정 토너",
    "features": ["모공 케어", "트러블 진정", "저자극"],
    "target_audience": "지성 피부, 20-30대 여성"
  }
}
```

**Backend Prompt:**
```python
product_name = request.input.get("product_name", "")
features = request.input.get("features", [])
target_audience = request.input.get("target_audience", "")

prompt = f"""
당신은 마케팅 카피라이터입니다.

제품명: {product_name}
주요 특징: {", ".join(features)}
타겟 고객: {target_audience}

위 정보를 바탕으로 제품 상세 페이지를 작성해주세요.

출력 형식 (JSON):
{{
  "headline": "{product_name}",
  "subheadline": "핵심 가치 제안 (예: 피부 트러블 완화, 모공 케어)",
  "body": "제품 설명 본문",
  "bullets": {features},
  "cta": "구매하기"
}}
"""
```

---

### 3. 검증 로직 추가

LLM 응답이 사용자 입력과 관련이 있는지 검증:

```python
def validate_llm_response(user_prompt: str, llm_response: dict) -> bool:
    """LLM 응답이 사용자 입력을 반영했는지 검증"""

    # 사용자 프롬프트에서 핵심 키워드 추출
    user_keywords = extract_keywords(user_prompt)
    # 예: ["지성 피부", "진정", "토너"]

    # LLM 응답에서 키워드 확인
    response_text = f"{llm_response.get('headline', '')} {llm_response.get('body', '')}"

    # 최소 1개 이상의 키워드가 포함되어야 함
    matches = [kw for kw in user_keywords if kw.lower() in response_text.lower()]

    if len(matches) == 0:
        logger.warning(f"LLM response does not reflect user input: {user_prompt}")
        logger.warning(f"User keywords: {user_keywords}, Response: {response_text[:100]}")
        return False

    return True

# LLM 응답 검증
if not validate_llm_response(request.input.get("prompt"), text_data):
    # 재시도 또는 에러 반환
    raise ValueError("LLM failed to reflect user input. Please retry.")
```

---

## 📋 체크리스트

### Backend 수정 필요 사항

- [ ] **LLM Prompt 템플릿에 `input.prompt` 반영**
  - 사용자 입력을 Prompt에 명시적으로 포함
  - 고정된 예시 제거

- [ ] **Few-shot 예시 추가** (선택)
  - 다양한 제품 예시 제공
  - LLM이 패턴을 학습하도록 유도

- [ ] **검증 로직 추가** (선택)
  - LLM 응답이 사용자 입력 반영했는지 확인
  - 실패 시 재시도 또는 에러 반환

- [ ] **로깅 추가**
  - LLM Prompt 전체 로깅
  - LLM 응답 로깅
  - 디버깅 용이성 향상

---

## 🧪 테스트 시나리오

### 시나리오 1: 제품명만 입력

**입력:**
```json
{
  "input": {
    "prompt": "고급 스킨케어 세럼"
  }
}
```

**기대 출력:**
```json
{
  "text": {
    "headline": "고급 스킨케어 세럼",
    "body": "고급 스킨케어 세럼의 장점..."
  }
}
```

---

### 시나리오 2: 상세 설명 입력

**입력:**
```json
{
  "input": {
    "prompt": "30대 여성을 위한 주름 개선 아이크림, 레티놀 함유, 저자극"
  }
}
```

**기대 출력:**
```json
{
  "text": {
    "headline": "주름 개선 아이크림",
    "subheadline": "레티놀 함유, 저자극 포뮬러",
    "body": "30대 여성의 눈가 주름을 효과적으로 개선하는 아이크림입니다. 레티놀이 함유되어 있으며, 저자극 포뮬러로 민감한 눈가 피부에도 안심하고 사용할 수 있습니다.",
    "bullets": [
      "주름 개선 효과",
      "레티놀 함유",
      "저자극 포뮬러",
      "30대 여성 전용"
    ]
  }
}
```

---

### 시나리오 3: 다른 카테고리 (전자제품)

**입력:**
```json
{
  "input": {
    "prompt": "무선 이어폰, 노이즈 캔슬링, 30시간 배터리"
  }
}
```

**기대 출력:**
```json
{
  "text": {
    "headline": "프리미엄 무선 이어폰",
    "subheadline": "노이즈 캔슬링, 30시간 사용",
    "body": "고성능 노이즈 캔슬링 기능과 30시간의 긴 배터리 수명을 자랑하는 무선 이어폰입니다.",
    "bullets": [
      "노이즈 캔슬링",
      "30시간 배터리",
      "프리미엄 음질"
    ]
  }
}
```

---

## 🎯 성공 기준

- ✅ 사용자 입력 `prompt`의 핵심 키워드가 LLM 응답에 포함됨
- ✅ 제품명이 사용자 입력과 일치
- ✅ 제품 특징이 사용자 입력 반영
- ✅ 고정된 예시("모바일 충전기 PowerPak") 제거

---

## 📞 Frontend 대응 방안

### 현재 Frontend 상태

Frontend는 **자유 프롬프트 입력**을 사용 중:

```typescript
// components/canvas-studio/components/ChatPanel.tsx
const handleGenerate = async () => {
  await generate(
    selectedKind,
    prompt,  // 사용자가 직접 입력한 텍스트
    "brand_demo"
  );
};
```

### Frontend 수정 옵션

#### Option 1: 현재 유지 (권장)

- Backend가 `input.prompt`를 올바르게 처리하도록 수정
- Frontend는 변경 없음

#### Option 2: 구조화된 입력으로 변경

- ChatPanel UI를 구조화된 폼으로 변경
- `product_name`, `features`, `target_audience` 필드 추가
- QA Plan E2E 시나리오와 일치

**Frontend 수정 예시:**

```typescript
// ChatPanel.tsx
const [productName, setProductName] = useState("");
const [features, setFeatures] = useState("");
const [targetAudience, setTargetAudience] = useState("");

const handleGenerate = async () => {
  await generate(
    selectedKind,
    "", // prompt는 빈 값
    "brand_demo",
    {
      product_name: productName,
      features: features.split(",").map(f => f.trim()),
      target_audience: targetAudience
    }
  );
};
```

---

## 🚀 우선순위 및 일정

### P0 (오늘 중 필수)

1. **LLM Prompt에 `input.prompt` 반영**
   - 예상 소요 시간: 30분
   - 파일: `backend/app/agents/copywriter.py` (추측)

2. **테스트 및 검증**
   - 3가지 시나리오 테스트
   - 예상 소요 시간: 30분

### P1 (내일 오전)

3. **검증 로직 추가**
   - 키워드 매칭 검증
   - 예상 소요 시간: 1시간

4. **로깅 개선**
   - LLM Prompt/Response 로깅
   - 예상 소요 시간: 30분

---

## 📝 참고 자료

### LLM Prompt Engineering Best Practices

1. **명확한 지시사항**
   - "사용자가 요청한 제품을 설명하세요" (명확)
   - "제품을 설명하세요" (불명확)

2. **Few-shot Learning**
   - 여러 예시를 제공해 LLM이 패턴 학습

3. **출력 형식 명시**
   - JSON Schema 명시
   - 필드별 설명 포함

4. **제약사항 명시**
   - "고정된 예시를 사용하지 마세요"
   - "사용자 입력을 최우선으로 반영하세요"

---

## ✅ 최종 확인

### Backend 수정 완료 후 테스트 절차

1. Backend 서버 재시작
2. Frontend에서 다음 프롬프트 테스트:
   - "지성 피부용 진정 토너"
   - "노화 방지 세럼"
   - "무선 이어폰"
3. LLM 생성 결과가 입력과 일치하는지 확인
4. Console에 에러 없는지 확인

---

**문서 버전:** v1.0
**최종 수정일:** 2025년 11월 17일 월요일 19:45
**작성자:** C팀 Frontend Lead
**검토자:** B팀 Backend Lead (확인 대기)
**다음 액션:** B팀 LLM Prompt 수정 요청
