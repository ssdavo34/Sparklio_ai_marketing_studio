# Golden Sets - 회귀 테스트용 기대 출력 샘플

**작성일**: 2025-11-23
**작성자**: B팀 (Backend)

---

## 📦 골든 세트란?

골든 세트(Golden Set)는 Agent의 기대 출력을 정의한 표준 샘플 데이터입니다. 회귀 테스트, 품질 검증, 성능 벤치마크에 사용됩니다.

---

## 📁 파일 구조

```
golden_sets/
├── README.md                        # 이 파일
├── copywriter_golden_set.json       # CopywriterAgent 골든 세트 (10개)
└── (향후 추가 예정)
    ├── reviewer_golden_set.json     # ReviewerAgent 골든 세트
    ├── optimizer_golden_set.json    # OptimizerAgent 골든 세트
    └── designer_golden_set.json     # DesignerAgent 골든 세트
```

---

## 🎯 골든 세트 구성 (CopywriterAgent)

### 10개 시나리오

1. **golden_001**: 무선 이어폰 - 테크 제품
2. **golden_002**: 스킨케어 제품 - 뷰티
3. **golden_003**: 러닝화 - 패션/스포츠
4. **golden_004**: 건강기능식품 - 헬스케어
5. **golden_005**: 스마트워치 - 웨어러블
6. **golden_006**: 노트북 - 전자제품
7. **golden_007**: 커피 원두 - 식품
8. **golden_008**: 요가 매트 - 피트니스
9. **golden_009**: 향수 - 럭셔리
10. **golden_010**: 보조배터리 - 액세서리

### 시나리오 커버리지

- **제품 카테고리**: 전자제품, 뷰티, 스포츠, 식품, 헬스케어, 패션, 럭셔리
- **톤앤매너**: professional, friendly, energetic, luxury, casual
- **타겟 오디언스**: 2030 직장인, 여성, 러닝 애호가, 건강 관리자, 전문가 등

---

## 🧪 사용 방법

### 1. 자동 검증 스크립트 실행

```bash
# CopywriterAgent 검증
python tests/golden_set_validator.py --agent copywriter

# HTML 리포트 생성
python tests/golden_set_validator.py --agent copywriter --report html --output report.html

# 실패 케이스만 출력
python tests/golden_set_validator.py --agent copywriter --only-failures
```

### 2. 수동 검증 (Python)

```python
import json
from app.services.agents import get_copywriter_agent, AgentRequest

# 골든 세트 로드
with open("tests/golden_sets/copywriter_golden_set.json") as f:
    golden_set = json.load(f)

# 첫 번째 케이스 실행
case = golden_set["golden_cases"][0]
agent = get_copywriter_agent()

request = AgentRequest(
    task=case["input"]["task"],
    payload=case["input"]["payload"],
    options=case["input"]["options"]
)

response = await agent.execute(request)

# 결과 비교
actual = response.outputs[0].value
expected = case["expected_output"]

print(f"Expected: {expected['headline']}")
print(f"Actual:   {actual['headline']}")
```

---

## 📊 품질 메트릭

### 검증 기준

| 필드 | 최대 길이 | 최소 길이 | 필수 여부 |
|------|-----------|-----------|-----------|
| headline | 20자 | 5자 | ✅ |
| subheadline | 30자 | 10자 | ✅ |
| body | 80자 | 20자 | ✅ |
| bullets | 20자/개 | - | ✅ (3개) |
| cta | 15자 | 4자 | ✅ |

### 점수 계산

- **유사도 점수**: SequenceMatcher를 사용한 텍스트 유사도 (0-10)
- **길이 검증**: 최대 길이 초과 시 감점
- **전체 점수**: 필드별 가중 평균
  - headline: 25%
  - subheadline: 15%
  - body: 25%
  - bullets: 20%
  - cta: 15%

### 합격 기준

- **개별 케이스**: `overall_score >= quality_metrics.min_score`
- **전체 Pass Rate**: > 80% (목표: 90%)
- **평균 점수**: > 7.0 (목표: 8.0)

---

## 🔄 골든 세트 업데이트 가이드

### 언제 업데이트하나요?

1. **Agent 프롬프트 변경** 시
2. **출력 스펙 변경** 시
3. **새로운 시나리오 추가** 필요 시
4. **품질 기준 변경** 시

### 업데이트 절차

1. `copywriter_golden_set.json` 수정
2. 검증 스크립트 실행:
   ```bash
   python tests/golden_set_validator.py --agent copywriter
   ```
3. Pass Rate > 80% 확인
4. Git 커밋:
   ```bash
   git add tests/golden_sets/
   git commit -m "feat: Update copywriter golden set"
   ```

### 새 시나리오 추가 템플릿

```json
{
  "id": "golden_XXX",
  "scenario": "제품명 - 카테고리",
  "input": {
    "task": "product_detail",
    "payload": {
      "product_name": "...",
      "features": ["...", "...", "..."],
      "target_audience": "...",
      "category": "..."
    },
    "options": {
      "tone": "professional",
      "length": "medium"
    }
  },
  "expected_output": {
    "headline": "...",
    "subheadline": "...",
    "body": "...",
    "bullets": ["...", "...", "..."],
    "cta": "..."
  },
  "quality_metrics": {
    "headline_length": 10,
    "body_length": 50,
    "bullets_count": 3,
    "tone": "professional",
    "min_score": 7.0
  }
}
```

---

## 📈 벤치마크 결과

### 최근 검증 결과 (2025-11-23)

| Agent | Total Cases | Passed | Failed | Pass Rate | Avg Score |
|-------|-------------|--------|--------|-----------|-----------|
| Copywriter | 10 | - | - | -% | -/10 |

*아직 검증 미실행*

---

## 🆘 문제 해결

### Q: 검증 스크립트 실행 시 에러

**A**: Python 경로 확인
```bash
# 프로젝트 루트에서 실행
cd k:/sparklio_ai_marketing_studio/backend
python tests/golden_set_validator.py --agent copywriter
```

### Q: Pass Rate가 낮아요

**A**: 다음을 확인하세요:
1. LLM 모델이 변경되었는지 (qwen2.5:7b → gpt-4o-mini 등)
2. 프롬프트가 수정되었는지
3. 기대 출력이 너무 엄격한지 (`min_score` 조정 고려)

### Q: 새 Agent 골든 세트 추가 방법

**A**:
1. `tests/golden_sets/{agent_name}_golden_set.json` 생성
2. `copywriter_golden_set.json` 구조 참고
3. 최소 10개 시나리오 작성
4. 검증 스크립트 실행

---

**작성자**: B팀 (Backend)
**관련 문서**: `docs/AGENT_SPECIFICATIONS.md`
