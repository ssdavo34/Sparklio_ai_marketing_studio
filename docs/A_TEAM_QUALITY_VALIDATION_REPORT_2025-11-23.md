# A팀 품질 검증 리포트
**작성일**: 2025-11-23
**작성자**: A팀 (QA & Architecture)
**대상**: CopywriterAgent Golden Set 검증 결과 및 v2 개선 방향

---

## Executive Summary

**결론**: 현재 CopywriterAgent는 실제 서비스 사용이 불가능한 수준입니다.

### 핵심 지표
- **Pass Rate**: 0% (0/10 cases passed)
- **Average Score**: 3.3/10 (기대치: 7.0+)
- **Score Range**: 0.0 ~ 4.9/10
- **Critical Failures**: 중국어 혼입, JSON 파싱 실패, 모든 subheadline "제품 설명" 고정

### 비즈니스 임팩트
만약 실제 마케팅 담당자가 이 결과물을 받는다면:
- ❌ 100% 수동 수정 필요
- ❌ 중국어 혼입 케이스는 완전히 사용 불가능
- ❌ JSON 파싱 실패 시 시스템 오류로 재시도 필요
- ❌ "제품 설명" subheadline은 전혀 마케팅 카피가 아님

**A팀 판정**: 🚫 **배포 불가 (Production Blocked)**

---

## 1. 검증 방법

### 1.1 Golden Set 구성
- **파일 경로 (현재)**: `backend/tests/golden_sets/copywriter_golden_set.json`
- **파일 경로 (최종)**: `backend/tests/golden_sets/copywriter/ad_copy_simple_golden_set.json`
- **케이스 수**: 10개
- **카테고리**: 테크(3), 뷰티(1), 패션/스포츠(2), 헬스케어(1), 식품(1), 액세서리(1), 럭셔리(1)

> **경로 규칙**: `backend/tests/golden_sets/{agent_name}/{task_name}_golden_set.json`
>
> - 현재는 임시로 단일 파일 사용 중
> - v2 확정 후 task별로 분리 예정

### 1.2 평가 기준
각 필드별 유사도 점수 (0~10점):
- **headline**: 20자 이내, 제품명 그대로 사용 금지, 감성적 카피
- **subheadline**: 30자 이내, "제품 설명" 등 일반 표현 금지
- **body**: 80자 이내, 자연스러운 한국어
- **bullets**: 각 20자 이내, 최대 3개
- **cta**: 15자 이내, 행동 유도 문구

**종합 점수**: (headline×0.25 + subheadline×0.20 + body×0.25 + bullets×0.20 + cta×0.10)

### 1.3 실행 명령
```bash
cd backend
python tests/golden_set_validator.py --agent copywriter
```

---

## 2. 치명적 문제점 분석

### 2.1 Subheadline 완전 고정 (10/10 실패)

**문제**: 모든 케이스에서 subheadline이 "제품 설명"으로 고정됨

| Case | 실제 출력 | 기대 출력 | 점수 |
|------|----------|----------|------|
| golden_001 | 제품 설명 | 프리미엄 ANC 기술로 집중력 극대화 | 0.8/10 |
| golden_002 | 제품 설명 | 히알루론산의 강력한 보습력 | 1.1/10 |
| golden_003 | 제품 설명 | 에어로 러닝화로 달리기의 즐거움을 | 0.9/10 |
| ... | ... | ... | ... |

**원인 추정**:
1. 시스템 프롬프트에 subheadline 생성 지침 부재
2. Few-shot 예시 없음
3. Validation에서 "제품 설명"을 Auto-fix하지 못함

**비즈니스 임팩트**: 마케팅 카피로서 완전히 무의미, 100% 수동 수정 필요

---

### 2.2 Headline이 제품명만 반복 (9/10 실패)

**문제**: Headline이 감성적 카피가 아닌 제품명/카테고리명 수준

| Case | 실제 출력 | 기대 출력 | 유사도 |
|------|----------|----------|--------|
| golden_001 | 울트라 무선 이어폰 Pro | 완벽한 소음 차단의 시작 | 2.2/10 |
| golden_002 | 히알루론산 세럼 | 72시간 촉촉함의 비밀 | 1.0/10 |
| golden_005 | 스마트워치 울트라 | 당신의 액티브한 하루 | 1.0/10 |

**원인 추정**:
- 프롬프트에 "제품명을 그대로 쓰지 마라" 명시 부족
- "감성적 카피" 예시 없음

**비즈니스 임팩트**: 광고 카피가 아닌 단순 제품 라벨 수준

---

### 2.3 중국어 혼입 (1/10 케이스)

**문제**: [golden_008](backend/tests/golden_sets/copywriter/ad_copy_simple_golden_set.json#golden_008) (요가 매트) Body에 중국어가 섞임

```json
{
  "body": "친환경 소재로 만든 두툼한 매트, 미끄러짐 없이 즐거운 운동时光，请您提供需要翻译成中文的具体内容，我会为您进行翻译。如果您有特定的文本或段落需要翻译，请直接粘贴在这里。否则，我将根据一般情况为您提供一个示例翻译。"
}
```

**원인 추정**:
1. LLM이 다국어 컨텍스트에서 언어 혼동
2. 프롬프트에 "한국어만 사용" 명시 부족
3. Validation에서 언어 체크 없음

**비즈니스 임팩트**: 완전히 사용 불가능, 시스템 신뢰도 하락

---

### 2.4 JSON 파싱 실패 (1/10 케이스)

**문제**: [golden_010](backend/tests/golden_sets/copywriter/ad_copy_simple_golden_set.json#golden_010) (보조배터리) 완전 실패

```json
{
  "case_id": "golden_010",
  "error": "No JSON output found",
  "score": 0.0
}
```

**원인 추정**:
- LLM 출력이 JSON 형식을 벗어남
- Gateway에서 Auto-fix 실패

**비즈니스 임팩트**: 시스템 오류로 재시도 필요, UX 저하

---

### 2.5 Bullets 길이 초과 (8/10 케이스)

**문제**: Bullets가 20자 제한을 지키지 못함

| Case | Actual Length | Limit | Example |
|------|---------------|-------|---------|
| golden_002 | 21자 | 20자 | "순한 성분 사용 - 민감성 피부도 안심" |
| golden_003 | 21~24자 | 20자 | "경량 디자인 - 빠르게 달릴 수 있어요" |
| golden_005 | 23자 | 20자 | "GPS 내장 - 어디서든 정확한 위치 추적" |

**원인 추정**:
- 프롬프트에 길이 제한 명시 부족
- Sanitize에서 자동 트리밍 없음

**비즈니스 임팩트**: UI 레이아웃 깨짐, 수동 수정 필요

---

## 3. 필드별 점수 분석

### 3.1 전체 평균 점수

| Field | Avg Score | Weight | Target |
|-------|-----------|--------|--------|
| headline | 1.9/10 | 25% | 7.0+ |
| subheadline | 1.0/10 | 20% | 7.0+ |
| body | 3.8/10 | 25% | 7.0+ |
| bullets | 7.5/10 | 20% | 7.0+ |
| cta | 4.1/10 | 10% | 7.0+ |
| **Overall** | **3.3/10** | 100% | **7.0+** |

### 3.2 해석

**유일하게 합격한 필드**: `bullets` (7.5/10)
- 이유: 키워드 나열 형식이라 실패 확률 낮음
- 문제: 그래도 8/10 케이스에서 길이 초과

**가장 심각한 필드**: `subheadline` (1.0/10)
- 완전히 고정된 출력 ("제품 설명")
- 동적 생성 로직 자체가 없음

**두 번째 심각**: `headline` (1.9/10)
- 제품명 반복 수준
- 감성적 카피 생성 실패

---

## 4. A팀 권고사항

### 4.1 긴급 조치 (P0 - 이번 주)

1. **Subheadline 생성 로직 추가**
   - 시스템 프롬프트에 subheadline 지침 추가
   - Few-shot 예시 10개 이상 제공
   - "제품 설명" 금지어 명시

2. **Headline 감성 카피 강화**
   - "제품명을 그대로 사용하지 마라" 명시
   - "베네핏 중심 카피" 예시 제공
   - Golden Set 모범 답안을 Few-shot으로 사용

3. **언어 혼동 방지**
   - "모든 출력은 한국어로만 작성" 명시
   - Sanitize에서 한글 비율 체크 (90% 이상)
   - 중국어/일본어/영어 문장 발견 시 재생성

4. **JSON 파싱 안정화**
   - LLM Gateway에서 JSON mode 강제
   - 파싱 실패 시 3회 재시도
   - Fallback 응답 준비

### 4.2 품질 기준 재정의 (P0 - 이번 주)

#### 배포 가능 기준
- **Pass Rate**: ≥ 70% (현재 0%)
- **Average Score**: ≥ 7.0/10 (현재 3.3/10)
- **필드별 최소 점수**:
  - headline: ≥ 6.0
  - subheadline: ≥ 6.0
  - body: ≥ 6.0
  - bullets: ≥ 7.0 (이미 달성)
  - cta: ≥ 6.0
- **Critical Failures**: 0건
  - 언어 혼입 없음
  - JSON 파싱 100% 성공
  - 길이 제한 100% 준수

#### Golden Set 확장
- 현재 10개 → 20개로 확대
- 카테고리별 최소 2개씩 확보
- Edge case 추가 (긴 제품명, 특수 카테고리 등)

### 4.3 Task/Schema 재설계 (P1 - 다음 주)

TASK_SCHEMA_CATALOG.md에 다음 정의:

1. **copywriter.ad_copy_simple**
   - Input 필수 필드 명확화
   - Output 길이 제약 강제
   - Validation 룰 명문화

2. **copywriter.content_plan**
   - Output 구조를 pages 변환에 최적화
   - 필드명 한/영 통일
   - 타입 정의 명확화

---

## 5. v2 설계 원칙 제안

### 5.1 Agent 4대 스펙 필수화

모든 Agent는 다음 4가지를 **배포 전 필수**로 갖춰야 함:

1. **Task Catalog**
   - 지원 Task 목록
   - Task별 Input/Output Schema

2. **Prompt Spec**
   - 시스템 프롬프트
   - Few-shot 예시 (Golden Set에서 선별)
   - 금지 규칙 명시
   - 길이 규칙 명시

3. **Validation & Sanitize Spec**
   - 길이 제한 체크
   - 금지어 체크
   - 언어 혼동 체크
   - Auto-fix 전략

4. **Golden Set & Metrics**
   - 최소 10개 케이스
   - 평가 기준 (항목별 감점 룰)
   - CI 통합 테스트

### 5.2 계약 기반 설계 (Contract Layer)

A/B/C팀 간 **단일 소스 of Truth**:
- `docs/TASK_SCHEMA_CATALOG.md`: 모든 Task/Schema 정의
- `docs/CONTENT_PLAN_TO_PAGES_SPEC.md`: Frontend 변환 규칙
- `tests/golden_sets/`: 품질 기준 데이터

**변경 프로세스**:
1. A팀이 문서 수정
2. B팀이 코드 반영
3. C팀이 UI 업데이트
4. Golden Set 재검증

---

## 6. 다음 단계

### 6.1 즉시 작업 (이번 주)

1. CopywriterAgent 프롬프트 재작성 (A팀)
2. Validation/Sanitize 로직 구현 (B팀)
3. Golden Set 20개로 확장 (A팀)
4. Pass Rate 70% 달성 확인

### 6.2 단계별 확장 (다음 주)

**Phase 1**: CopywriterAgent `ad_copy_simple` 안정화
- Target: Pass Rate ≥ 70%, Avg Score ≥ 7.0

**Phase 2**: CopywriterAgent `content_plan` 설계
- TASK_SCHEMA_CATALOG 정의
- CONTENT_PLAN_TO_PAGES 변환 로직 검증
- Golden Set 5~10개 작성

**Phase 3**: Top 3~5 Agent 선별 후 동일 프로세스 적용
- Strategist, Designer, Reviewer 우선
- 각 Agent별 Golden Set 준비

---

## 7. 결론

현재 CopywriterAgent는 **코드는 존재하지만 품질은 서비스 불가 수준**입니다.

**B팀의 95% 구현 완료는 "엔진"만 완성한 것**이고,
**A팀이 책임져야 할 "실제 결과물 품질"은 0%에 가깝습니다.**

v2 설계를 통해:
1. **Contract Layer**로 A/B/C팀 계약 명확화
2. **Golden Set 기반 품질 보증**을 CI에 통합
3. **배포 가능/불가 기준**을 명문화

이 3가지를 달성하여, "코드 구현률"이 아닌 **"서비스 품질"**을 기준으로
진척도를 측정하는 체계로 전환해야 합니다.

---

**작성**: A팀
**배포 판정**: 🚫 Production Blocked (Pass Rate 0%, Critical Failures 2건)
**다음 검증 예정**: CopywriterAgent 프롬프트 개선 후 재검증
