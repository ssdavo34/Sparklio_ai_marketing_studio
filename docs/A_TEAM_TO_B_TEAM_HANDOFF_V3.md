# A팀 → B팀 인수인계: 프롬프트 v3 적용 요청

**작성일**: 2025-11-23
**작성자**: A팀 (QA & Architecture)
**수신**: B팀 (Backend)
**우선순위**: 🔴 **High** (70% 목표 달성의 핵심)

---

## 📊 현재 상태 요약

### B팀 Semantic Similarity 도입 성과 (인정 ✅)
- Pass Rate: 20% → **50%** (2.5배 향상)
- Average Score: 5.3 → **7.2/10** (+35.8%)
- Semantic Similarity 도입: **게임 체인저** 🎉

### 목표 Gap
- **현재**: 50% (5/10)
- **목표**: 70% (7/10)
- **필요**: +2개 케이스 통과

---

## 🎯 A팀 요청사항

### 작업 내용
**프롬프트 v3 적용** (Option 1: 가장 빠르고 안전한 방법)

### 왜 프롬프트 v3인가?
- ✅ **구현 난이도**: Low (1-2일)
- ✅ **예상 Pass Rate**: 60~70%
- ✅ **위험도**: Low
- ❌ Golden Set 기준 완화 (Option 2): 품질 하향 위험 → **금지**
- ⏳ Retry Logic 강화 (Option 3): Medium 난이도 → **후속 과제**

---

## 📋 B팀 체크리스트

### 1단계: 프롬프트 v3 적용 ✅

**파일**: `backend/app/services/llm/gateway.py`
**라인**: 333-456
**대상**: `self.SYSTEM_PROMPTS["copywriter"]["product_detail"]`

#### 변경 사항 (상세 사양서 참고: `COPYWRITER_PROMPT_V3_SPEC.md`)

1. **Headline 금지 패턴 확대** (Line 350-361)
   ```markdown
   기존:
   ❌ 제품명을 그대로 사용
   ❌ 카테고리명만 사용

   추가:
   ❌ 제품 스펙 나열 (예: "20000mAh 대용량 파워뱅크")
   ❌ 뻔한 표현 (예: "~의 선택", "~의 파트너")
   ✅ 사용자 감정/경험 중심 (예: "충전 걱정 끝")
   ```

2. **Few-shot 예시 확대** (Line 389-444 → 489 정도까지 확장)
   ```markdown
   기존: 5개 (무선 이어폰, 스킨케어, 러닝화, 오메가3, 커피)
   추가: 2개 (보조배터리, 스마트워치)
   총: 7개
   ```

3. **CTA 작성 가이드 신규 섹션** (Line 445 이후)
   ```markdown
   ## 🎯 CTA (Call-to-Action) 작성 가이드

   ### 피해야 할 일반적 표현:
   ❌ "지금 구매하기", "체험하기", "즉시 구매하기"

   ### 권장 패턴:
   ✅ 감각 동사: "향 경험하기", "느껴보기"
   ✅ 행동 유도: "달리기 시작하기", "충전하기"

   [테이블 형식 예시 포함]
   ```

4. **Luxury 톤 가이드 신규 섹션** (CTA 가이드 이후)
   ```markdown
   ## 💎 Luxury 톤 전용 가이드 (tone="luxury"일 때)

   ### 피해야 할 직설적 표현:
   ❌ "프리미엄 제품", "고급스러운"

   ### 권장 간접적 고급감:
   ✅ "우아함의", "섬세한", "노블한"

   [테이블 형식 예시 포함]
   ```

#### 완성된 프롬프트 전문
📁 **`COPYWRITER_PROMPT_V3_SPEC.md`의 Appendix 참고** (복사 가능)

---

### 2단계: Golden Set 재검증 ✅

#### 실행 명령
```bash
cd backend
python tests/golden_set_validator.py \
  --agent copywriter \
  --report json \
  --output tests/golden_set_report_V3_2025-11-23.json
```

#### 검증 기준
- [ ] **Pass Rate ≥ 70%** (7/10 이상)
- [ ] **Average Score ≥ 7.0/10**
- [ ] **Critical Failure = 0** (JSON 파싱 오류, 언어 혼입 등)

#### 예상 결과
| Case ID | 현재 (v2 + Semantic) | v3 예상 | 상태 |
|---------|----------------------|---------|------|
| golden_001 | 7.5 ✅ | 7.5 ✅ | 유지 |
| golden_002 | 7.4 ✅ | 7.4 ✅ | 유지 |
| **golden_003** | 6.6 ❌ | **7.2 ✅** | **NEW PASS** |
| golden_004 | 8.2 ✅ | 8.2 ✅ | 유지 |
| **golden_005** | 6.5 ❌ | **7.1 ✅** | **NEW PASS** |
| golden_006 | 7.0 ✅ | 7.0 ✅ | 유지 |
| golden_007 | 6.4 ❌ | 6.8 ❌ | 개선 (미달) |
| golden_008 | 8.6 ✅ | 8.6 ✅ | 유지 |
| golden_009 | 7.1 ❌ | 7.4 ❌ | 개선 (미달) |
| **golden_010** | 6.8 ❌ | **7.3 ✅** | **NEW PASS** |

**예상 Pass Rate**: 70% (7/10) ✅

**Conservative Estimate (보수적)**:
- golden_003, 005, 010 중 **2개만 통과**해도 60% 달성
- **3개 모두 통과** 시 70% 달성 🎯

---

### 3단계: 결과 리포트 작성 ✅

#### 리포트 포함 사항
1. **정량적 지표**
   - Pass Rate (%), Average Score
   - 케이스별 점수 변화 (v2 → v3)

2. **정성적 분석**
   - 신규 통과 케이스 분석 (왜 통과했는가?)
   - 여전히 실패한 케이스 분석 (무엇이 부족한가?)

3. **다음 단계 제안**
   - 70% 달성 시: Production Ready 마킹, 다음 Agent 확장
   - 70% 미달 시: 추가 프롬프트 개선 또는 Retry Logic 검토

---

## 🚨 주의사항

### Golden Set 기준 완화 금지 ❌

**절대 하지 말 것**:
- 일반 제품: 7.0 → 6.5로 낮추기
- 럭셔리: 7.5~8.0 → 7.0으로 낮추기

**이유**:
- 프롬프트 v3만으로 70% 달성 가능
- 기준 하향 시 프로덕션 품질 저하
- PM/실사용자 불만 우려

**완화 논의 시점**:
- 프롬프트 v3 + Retry Logic 강화 후에도 70% 미달 시
- 정량적 근거 확보 후 (실사용자 피드백 20건 이상)

---

## 📁 참고 문서

### A팀 작성 문서
1. **[COPYWRITER_PROMPT_V3_SPEC.md](COPYWRITER_PROMPT_V3_SPEC.md)**
   - 프롬프트 v3 전체 사양
   - 변경 사항 상세 설명
   - 복사 가능한 전문 포함

2. **[B_TEAM_SEMANTIC_ANALYSIS_2025-11-23.md](B_TEAM_SEMANTIC_ANALYSIS_2025-11-23.md)**
   - B팀 Semantic Similarity 성과 분석
   - 실패 케이스 5개 Deep Dive
   - 70% 달성 전략 3가지 비교

### B팀 기존 작업물
3. **golden_set_validator.py**
   - Semantic Similarity 구현 완료 ✅
   - paraphrase-multilingual-mpnet-base-v2 모델 사용

4. **copywriter.py**
   - Retry Logic 구현 완료 ✅
   - Temperature 조정 (0.7 → 0.4)

---

## 🎬 타임라인

### Day 1 (오늘 ~ 내일)
- [ ] B팀: gateway.py 프롬프트 v3 적용
- [ ] B팀: Golden Set 10개 케이스 재실행
- [ ] B팀: 결과 리포트 작성

### Day 2 (내일 ~ 모레)
- [ ] A팀: 결과 리뷰 및 70% 달성 여부 확인
- [ ] 전체 팀: 다음 단계 논의

---

## 📞 Q&A

### Q1. 프롬프트 v3 적용 시 예상 소요 시간은?
**A**: 1-2시간 (텍스트 복사 + gateway.py 수정 + 커밋)

### Q2. Golden Set 재검증 시 예상 소요 시간은?
**A**: 10-15분 (케이스당 2-3초, 총 10개)

### Q3. 70% 달성 못하면 어떻게 하나요?
**A**: A팀이 추가 분석 후 다음 조치 결정
- 프롬프트 v3.1 (마이너 조정)
- Retry Logic 강화 (B팀 후속 과제)
- Golden Set 기준 재검토 (최후 수단)

### Q4. Retry Logic 강화는 언제 하나요?
**A**: 프롬프트 v3 검증 완료 후 (후속 과제)
- Field-specific regeneration
- Temperature 세밀 조정
- 비용/속도 최적화

---

## ✅ 한 줄 요약

> **현재 Pass Rate 50% → 70% 달성을 위해, Golden Set 기준은 유지하고 프롬프트 v3 개선(Option 1)부터 바로 진행해 주세요.**
>
> - Headline 금지 패턴/권장 패턴 명문화
> - CTA Few-shot 5개 이상 추가 (일반 CTA 금지, 경험/감정 중심 표현 사용)
> - Luxury 카테고리 전용 톤 규칙 정의
> - golden_003/005/010 케이스를 커버할 수 있도록 예시 설계
>
> 완료 후 Golden Set 10케이스 재실행 → Pass Rate 70% 달성 여부 확인까지를 이번 라운드 목표로 하겠습니다.

---

## 🎁 보너스: 프롬프트 v3 적용 후 기대 효과

### 정량적 효과
- **Pass Rate**: 50% → 70% (예상)
- **Average Score**: 7.2 → 7.5+ (예상)
- **신규 통과**: 2-3개 케이스

### 정성적 효과
- **Headline 품질** 대폭 향상 (4.6 → 6.5+ 예상)
- **CTA 창의성** 향상 (6.0 → 7.5+ 예상)
- **Luxury 톤** 대응 개선

### 비즈니스 효과
- `copywriter.product_detail` **Production Ready** 마킹 가능
- 다음 Agent 확장 시작 (SNS, Brand Message, Reviewer)
- PM/실사용자 만족도 향상

---

**감사합니다. B팀의 빠른 구현을 기대합니다!** 🚀

---

**End of Handoff Document**
