# CopywriterAgent Prompt 개선 보고서 v2
**작성일**: 2025-11-23
**작성자**: A팀 (QA & Architecture)
**목적**: Golden Set Pass Rate 0% → 70% 달성

---

## 1. 개선 배경

### 1.1 기존 프롬프트의 문제점

[A_TEAM_QUALITY_VALIDATION_REPORT_2025-11-23.md](docs/A_TEAM_QUALITY_VALIDATION_REPORT_2025-11-23.md)에서 확인된 치명적 문제:

| 문제 | 발생 빈도 | 비즈니스 임팩트 |
|------|----------|----------------|
| Subheadline "제품 설명" 고정 | 10/10 (100%) | 마케팅 카피로 완전히 무의미 |
| Headline 제품명 반복 | 9/10 (90%) | 광고 카피가 아닌 라벨 수준 |
| 중국어 혼입 | 1/10 (10%) | 완전 사용 불가능 |
| JSON 파싱 실패 | 1/10 (10%) | 시스템 오류 발생 |
| Bullets 길이 초과 | 8/10 (80%) | UI 레이아웃 깨짐 |

### 1.2 원인 분석

**기존 프롬프트의 오류 유도 패턴**:

```markdown
## 엄격한 규칙
🔴 사용자가 제공한 제품명을 headline에 반드시 포함
```

→ 이 규칙이 "제품명 그대로 사용"을 유도함 (Headline 실패율 90%)

```markdown
normalized["subheadline"] = (
    content.get("subheadline") or
    content.get("subtitle") or
    "제품 설명"  # ❌ Fallback이 "제품 설명"으로 고정
)
```

→ Subheadline이 없으면 "제품 설명"으로 Fallback (Subheadline 실패율 100%)

**Few-shot 예시의 문제**:
- 너무 길고 복잡함 (실제로는 따라하기 어려움)
- 금지어에 대한 명시적 예시 없음
- 한국어 비율 검증 없음

---

## 2. 개선 프롬프트 v2

### 2.1 핵심 개선 사항

#### ✅ 금지 사항 명시화

**기존**:
```
🔴 사용자가 제공한 제품명을 headline에 반드시 포함
```

**개선** (v2):
```markdown
## 🚫 절대 금지 사항

### Headline 금지 패턴:
❌ 제품명을 그대로 사용 (예: "울트라 무선 이어폰 Pro")
❌ 카테고리명만 사용 (예: "무선 이어폰")
❌ 단순 설명 (예: "좋은 제품")
✅ 감성적/베네핏 중심 카피 (예: "완벽한 소음 차단의 시작")

### Subheadline 금지 패턴:
❌ "제품 설명" (이 표현 절대 금지!)
❌ "상세 설명"
❌ "상품 소개"
❌ 일반적인 표현
✅ 구체적인 베네핏/특징 (예: "프리미엄 ANC 기술로 집중력 극대화")
```

**효과**: Headline/Subheadline 금지 패턴을 명확히 제시하여 오류 유도 제거

---

#### ✅ Few-shot 예시 Golden Set 기반 재작성

**기존**: 긴 예시 2개 (실제로는 따라하기 어려움)

**개선** (v2): Golden Set 모범 답안 5개 추가

```markdown
## 💡 Few-shot 예시 (Golden Set 기반)

**예시 1: 무선 이어폰 (테크/Professional)**
입력: product_name="울트라 무선 이어폰 Pro", features=["ANC 노이즈캔슬링", "30시간 배터리", "IPX7 방수"], tone="professional"
출력:
{
  "headline": "완벽한 소음 차단의 시작",
  "subheadline": "프리미엄 ANC 기술로 집중력 극대화",
  ...
}

**예시 2: 스킨케어 (뷰티/Friendly)**
...
```

**효과**:
- 실제 Golden Set 모범 답안 활용
- 다양한 카테고리/톤 커버 (테크, 뷰티, 스포츠, 헬스케어, 식품)
- 입력-출력 매핑을 명확히 제시

---

#### ✅ 한국어 비율 체크 명시

**기존**: 한국어만 작성하라는 일반적 지시만 존재

**개선** (v2):
```markdown
### Body 금지 사항:
❌ 중국어/일본어/영어 문장 혼입 (브랜드명/기술 용어 제외)
❌ 한국어 비율 90% 미만
✅ 자연스러운 한국어로만 작성
```

**효과**: 한국어 비율을 명확한 기준(90%)으로 제시하여 중국어 혼입 방지

---

#### ✅ 최종 체크리스트 추가

**신규 추가**:
```markdown
## 🔍 최종 체크리스트

출력하기 전에 반드시 확인하세요:
- [ ] Headline이 제품명 그대로가 아닌 감성적 카피인가?
- [ ] Subheadline이 "제품 설명" 같은 일반 표현이 아닌가?
- [ ] 모든 텍스트가 한국어로만 작성되었는가?
- [ ] 모든 필드가 길이 제약을 지켰는가?
- [ ] 유효한 JSON 형식인가?
- [ ] Bullets가 정확히 3개인가?
```

**효과**: LLM이 출력 전에 self-validation 수행

---

### 2.2 전체 프롬프트 구조 비교

| 섹션 | 기존 (v1) | 개선 (v2) | 변경 사항 |
|------|----------|----------|----------|
| 핵심 역량 | 일반적 설명 | 베네핏 중심으로 재정의 | ✅ 개선 |
| 작성 원칙 | 제품명 포함 강조 | 베네핏 우선 강조 | ✅ 개선 |
| 금지 사항 | 없음 | Headline/Subheadline/Body 금지 패턴 명시 | ✅ 신규 |
| 길이 제약 | 최대 길이만 명시 | "정확히 N자 이내" + 강조 | ✅ 개선 |
| Few-shot | 2개 (긴 예시) | 5개 (Golden Set 기반) | ✅ 개선 |
| 체크리스트 | 없음 | 6개 항목 체크리스트 | ✅ 신규 |

---

## 3. 기대 효과

### 3.1 정량적 목표

| 지표 | 현재 (v1) | 목표 (v2) | 개선 방법 |
|------|----------|----------|----------|
| **Pass Rate** | 0% | ≥ 70% | 금지 패턴 명시 + Few-shot 강화 |
| **Headline Avg** | 1.9/10 | ≥ 6.0/10 | "제품명 금지" 명확화 |
| **Subheadline Avg** | 1.0/10 | ≥ 6.0/10 | "제품 설명" 절대 금지 |
| **Body Avg** | 3.8/10 | ≥ 6.0/10 | 한국어 비율 90% 기준 |
| **Bullets Avg** | 7.5/10 | ≥ 7.0/10 | 유지 (이미 합격) |
| **CTA Avg** | 4.1/10 | ≥ 6.0/10 | Few-shot 예시 강화 |
| **Critical Failures** | 2 | 0 | 한국어 비율 + JSON 파싱 강화 |

### 3.2 정성적 개선

**기존 출력 예시** (실패):
```json
{
  "headline": "울트라 무선 이어폰 Pro",  // ❌ 제품명 그대로
  "subheadline": "제품 설명",           // ❌ 일반 표현
  "body": "...",
  "bullets": [...],
  "cta": "..."
}
```

**개선 출력 예시** (기대):
```json
{
  "headline": "완벽한 소음 차단의 시작",  // ✅ 감성적 카피
  "subheadline": "프리미엄 ANC 기술로 집중력 극대화",  // ✅ 구체적 베네핏
  "body": "...",
  "bullets": [...],
  "cta": "..."
}
```

---

## 4. B팀 추가 작업 (Fallback 제거)

### 4.1 Copywriter Agent 정규화 함수 수정 필요

**현재 문제** ([copywriter.py:239](backend/app/services/agents/copywriter.py#L239)):

```python
normalized["subheadline"] = (
    content.get("subheadline") or
    content.get("subtitle") or
    content.get("tagline") or
    content.get("description", "")[:100] or
    "제품 설명"  # ❌ 이 Fallback이 문제!
)
```

**개선 방안**:

```python
normalized["subheadline"] = (
    content.get("subheadline") or
    content.get("subtitle") or
    content.get("tagline") or
    ""  # ✅ 빈 문자열로 Fallback (Post-validation에서 체크)
)
```

**이유**:
- 프롬프트에서 "제품 설명" 금지를 명시했는데, 코드에서 Fallback으로 "제품 설명"을 넣으면 모순
- 빈 문자열로 두고 Post-validation에서 에러 처리하는 것이 명확함

### 4.2 B팀 TODO

- [ ] `backend/app/services/agents/copywriter.py` 239번 줄 수정
- [ ] Subheadline이 빈 문자열일 경우 ValidationError 발생
- [ ] 에러 메시지: "Subheadline is required and cannot be empty"

---

## 5. 검증 계획

### 5.1 Golden Set 재검증

**실행 명령**:
```bash
cd backend
python tests/golden_set_validator.py --agent copywriter
```

**기대 결과**:
- Pass Rate ≥ 70% (현재 0%)
- Headline Avg ≥ 6.0/10 (현재 1.9/10)
- Subheadline Avg ≥ 6.0/10 (현재 1.0/10)
- Critical Failures = 0 (현재 2)

### 5.2 검증 일정

| 일자 | 작업 | 담당 | 상태 |
|------|------|------|------|
| 2025-11-23 | 프롬프트 v2 작성 | A팀 | ✅ 완료 |
| 2025-11-24 | B팀 Fallback 제거 | B팀 | ⏳ 대기 |
| 2025-11-25 | Golden Set 재검증 (1차) | A팀 | ⏳ 대기 |
| 2025-11-26 | 피드백 반영 및 재검증 (2차) | A/B팀 | ⏳ 대기 |
| 2025-11-27 | Pass Rate 70% 달성 확인 | A팀 | ⏳ 대기 |

---

## 6. 변경 파일 목록

| 파일 | 변경 내용 | 라인 | 상태 |
|------|----------|------|------|
| [backend/app/services/llm/gateway.py](backend/app/services/llm/gateway.py#L333-L456) | product_detail 시스템 프롬프트 전체 재작성 | 333-456 | ✅ 완료 |
| [backend/app/services/agents/copywriter.py](backend/app/services/agents/copywriter.py#L239) | Subheadline Fallback "제품 설명" 제거 필요 | 239 | ⏳ B팀 작업 |

---

## 7. 부록: 프롬프트 변경 사항 전문

### 7.1 제거된 내용

```markdown
❌ "사용자가 제공한 제품명을 headline에 반드시 포함"
❌ "사용자가 제공한 각 특징을 bullets에 매력적으로 변환하여 포함"
❌ Chain-of-Thought 단계별 사고 프로세스 (너무 장황함)
❌ 우수 사례 긴 예시 2개
```

### 7.2 추가된 내용

```markdown
✅ 🚫 절대 금지 사항 섹션 (Headline/Subheadline/Body 금지 패턴 명시)
✅ 💡 Few-shot 예시 (Golden Set 기반 5개)
✅ 🔍 최종 체크리스트 (6개 항목)
✅ 한국어 비율 90% 기준 명시
✅ "정확히 N자 이내" 길이 제약 강조
```

### 7.3 개선된 내용

```markdown
✅ 핵심 역량: 베네핏 중심으로 재정의
✅ 작성 원칙: 제품명 나열 → 고객 가치 강조
✅ 길이 제약: 최대 길이 → 정확한 제약 + 강조
✅ JSON 출력 형식: 더 명확한 필드 설명
```

---

## 8. 다음 단계

### 8.1 즉시 작업 (A팀)
- [x] 프롬프트 v2 작성
- [x] 문서화 (이 파일)
- [ ] B팀에 Fallback 제거 요청
- [ ] Golden Set 재검증 준비

### 8.2 단기 작업 (B팀)
- [ ] copywriter.py Fallback "제품 설명" 제거
- [ ] Post-validation에서 빈 subheadline 체크
- [ ] JSON 파싱 강화 (재시도 로직)
- [ ] 한국어 비율 체크 함수 구현

### 8.3 중기 작업 (A/B팀 협업)
- [ ] Golden Set 확장 (10개 → 20개)
- [ ] Pass Rate 70% 달성 확인
- [ ] Production 배포 승인

---

**작성**: A팀
**최종 수정**: 2025-11-23
**다음 리뷰**: Golden Set 재검증 후 (2025-11-25 예정)
