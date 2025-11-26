# A팀 DEMO Day 준비 가이드

**문서 버전**: v1.0
**작성일**: 2025-11-26
**작성자**: C팀 (Frontend)
**대상**: A팀 (QA/문서 총괄)
**목적**: Demo Day 준비를 위한 A팀 작업 가이드

---

## 1. 현재 상황 요약

### 1.1 팀간 협의 완료 사항

| 협의 항목 | 결정 사항 | 문서 |
|----------|----------|------|
| 기존 코드 재활용 | 70% 재활용 확정 | C팀 협업 보고서 |
| API 스키마 | 전체 확정 | B팀 리뷰 문서 |
| 기술 스택 | Gemini + Nanobanana + Edge TTS | B팀 리뷰 문서 |
| 작업 분담 | B팀 API, C팀 UI, A팀 QA/문서 | 협업 보고서 |

### 1.2 기술 스택 최종 확정

| 영역 | 기술 | 비용 |
|------|------|------|
| LLM | **Gemini 2.0 Flash** | 무료 (15 RPM, 100만 토큰/일) |
| 이미지 생성 | **Nanobanana API** | 무료 티어 |
| 음성(TTS) | **Edge TTS** | 무료 (무제한) |
| BGM | 사전 다운로드 (Pixabay/FreePD) | 무료 |
| STT | **Whisper** (기존) | 로컬 |

---

## 2. A팀 작업 목록

### 2.1 P0 (필수 - Demo 전 완료)

| 작업 | 설명 | 산출물 | 예상 소요 |
|------|------|--------|----------|
| **데모 시나리오 스크립트** | 발표자가 따라할 단계별 스크립트 | `DEMO_SCENARIO_SCRIPT.md` | 1일 |
| **Mock 데이터 검증** | B팀 제공 Mock 데이터 검토 | 검토 완료 체크 | 0.5일 |
| **QA 체크리스트** | 각 단계별 테스트 항목 | `DEMO_QA_CHECKLIST.md` | 0.5일 |
| **Fallback 시나리오** | 에러 발생 시 대처 방안 | `DEMO_FALLBACK_PLAN.md` | 0.5일 |

### 2.2 P1 (권장)

| 작업 | 설명 | 산출물 |
|------|------|--------|
| 발표 슬라이드 | 학원 발표용 PPT | `presentation.pptx` |
| 리허설 진행 | 팀 전체 데모 리허설 | 리허설 피드백 |
| 타이밍 체크 | 전체 플로우 소요 시간 측정 | 시간표 |

---

## 3. 데모 시나리오 (초안)

### 3.1 전체 플로우 (예상 5-7분)

```
[0:00 - 0:30] 인트로
├── "회의 한 번으로 마케팅 캠페인 풀패키지" 소개
└── 화면: /studio/demo 첫 화면

[0:30 - 1:30] Step 1: Meeting From URL
├── YouTube URL 입력 (제주 감귤 회의 영상)
├── Chat: "회의 내용을 불러오고 있어요..."
├── SSE 진행상황 표시 (다운로드 → 분석)
└── 결과: Meeting Summary 표시

[1:30 - 3:00] Step 2: Campaign 생성
├── [캠페인 만들기] 버튼 클릭
├── Chat: "캠페인 브리프 작성 중..."
├── SSE 진행상황 (Concept A/B 생성, 4종 산출물)
└── 결과: Concept Board 자동 표시

[3:00 - 4:30] Step 3: Concept Board 탐색
├── Concept A 카드 설명
├── Concept B 카드 비교
├── [슬라이드 보기] 버튼 클릭 → Slides Preview
├── [상세 보기] 버튼 클릭 → Detail Preview
└── [인스타 보기] 버튼 클릭 → Instagram Preview

[4:30 - 5:30] Step 4: Shorts 미리보기
├── [쇼츠 보기] 버튼 클릭
├── Shorts Script 표시 (6개 씬)
├── (Optional) 키프레임 이미지 표시
└── (Optional) 영상 재생

[5:30 - 6:00] 마무리
├── 전체 플로우 요약
├── "회의 한 번으로 8종 마케팅 자료 완성"
└── Q&A
```

### 3.2 단계별 스크립트

#### Step 1: Meeting From URL

**발표자 멘트**:
> "자, 이제 실제로 보여드리겠습니다.
> 여기 제주 감귤 젤리 신제품 기획 회의 영상이 있습니다.
> URL을 입력하면..."

**화면 동작**:
1. Chat 입력창에 YouTube URL 붙여넣기
2. 전송 버튼 클릭
3. Chat에 진행상황 메시지 표시:
   - "회의 영상을 다운로드 중입니다..."
   - "회의 내용을 분석 중입니다..."
   - "회의 요약이 완료되었습니다!"
4. 중앙 뷰: Meeting Summary 표시

**예상 시간**: 60초 (실제 처리 30초 + 설명)

---

#### Step 2: Campaign 생성

**발표자 멘트**:
> "회의 요약이 완료됐습니다.
> 핵심 메시지는 '국내산 제주 감귤 100%', '합성 첨가물 무첨가'...
> 이제 [캠페인 만들기] 버튼을 누르면..."

**화면 동작**:
1. [캠페인 만들기] 버튼 클릭
2. Chat에 진행상황 메시지 표시:
   - "캠페인 브리프를 작성 중입니다..."
   - "콘셉트를 생성하고 있어요... Concept A: '상큼한 하루 리프레시'"
   - "Concept A 기반 산출물 생성 중... (1/4)"
   - "모든 산출물이 준비되었습니다!"
3. 중앙 뷰: Concept Board 자동 전환

**예상 시간**: 90초 (실제 처리 60-90초)

---

#### Step 3: Concept Board 탐색

**발표자 멘트**:
> "보시는 것처럼 2개의 콘셉트가 생성됐습니다.
> Concept A는 '상큼한 하루 리프레시'...
> Concept B는 '아이와 함께하는 비타민 간식'...
> 각 콘셉트별로 4종의 산출물이 준비되어 있습니다."

**화면 동작**:
1. Concept A 카드 마우스 오버 (하이라이트)
2. [슬라이드 보기] 클릭 → Slides Preview
3. 슬라이드 넘기기 (1→2→3)
4. [컨셉보드로 돌아가기] 클릭
5. [상세 보기] 클릭 → Detail Preview
6. [인스타 보기] 클릭 → Instagram Preview

**예상 시간**: 90초

---

#### Step 4: Shorts 미리보기

**발표자 멘트**:
> "마지막으로 쇼츠 스크립트를 보시겠습니다.
> 20-30초 분량의 쇼츠 광고 스크립트가 씬 단위로 생성됩니다."

**화면 동작**:
1. [쇼츠 보기] 클릭
2. Shorts Script 6개 씬 표시
3. (Optional) 키프레임 이미지 스크롤
4. (Optional) 영상 재생 버튼 클릭

**예상 시간**: 60초

---

## 4. Mock 데이터 검증 체크리스트

### 4.1 B팀 제공 Mock 데이터 경로

```
frontend/public/mock-data/
├── concept-board-sample.json     # Concept Board 전체 데이터
├── presentation-sample.json      # Presentation 5장
├── product-detail-sample.json    # 상세페이지 텍스트
├── instagram-ads-sample.json     # 인스타 카드 3종
└── shorts-script-sample.json     # 쇼츠 스크립트 6씬
```

### 4.2 Mock 데이터 검증 항목

| 파일 | 검증 항목 | 체크 |
|------|----------|------|
| concept-board-sample.json | Concept 2개 존재 | [ ] |
| | 각 Concept에 linked_assets 존재 | [ ] |
| | 한글 텍스트 깨짐 없음 | [ ] |
| presentation-sample.json | 슬라이드 5장 존재 | [ ] |
| | cover/problem/solution/benefits/cta 구조 | [ ] |
| product-detail-sample.json | title, one_liner, benefits, description, cta 존재 | [ ] |
| instagram-ads-sample.json | 카드 3개 존재 | [ ] |
| | 각 카드에 headline, subcopy, cta 존재 | [ ] |
| shorts-script-sample.json | 씬 6개 존재 | [ ] |
| | 각 씬에 narration, onscreen_text 존재 | [ ] |

---

## 5. QA 체크리스트

### 5.1 Pre-Demo 체크 (발표 전날)

| 항목 | 체크 |
|------|------|
| **서버 상태** | |
| Backend 서버 정상 작동 | [ ] |
| Frontend dev 서버 정상 작동 | [ ] |
| Whisper STT 서버 정상 작동 | [ ] |
| **네트워크** | |
| YouTube 다운로드 테스트 | [ ] |
| Gemini API 연결 테스트 | [ ] |
| **데이터** | |
| Mock 데이터 로드 테스트 | [ ] |
| 한글 표시 정상 | [ ] |

### 5.2 Demo Flow 체크

| Step | 동작 | 예상 결과 | 체크 |
|------|------|----------|------|
| 1 | YouTube URL 입력 | Meeting 생성됨 | [ ] |
| 2 | Meeting 분석 | Summary 표시 | [ ] |
| 3 | 캠페인 만들기 클릭 | SSE 진행상황 표시 | [ ] |
| 4 | 캠페인 완료 | Concept Board 표시 | [ ] |
| 5 | 슬라이드 보기 클릭 | Slides Preview 표시 | [ ] |
| 6 | 상세 보기 클릭 | Detail Preview 표시 | [ ] |
| 7 | 인스타 보기 클릭 | Instagram Preview 표시 | [ ] |
| 8 | 쇼츠 보기 클릭 | Shorts Preview 표시 | [ ] |
| 9 | 컨셉보드 돌아가기 | Concept Board 복귀 | [ ] |

### 5.3 UI/UX 체크

| 항목 | 체크 |
|------|------|
| 3패널 레이아웃 정상 | [ ] |
| Chat 메시지 스크롤 정상 | [ ] |
| NextActions 버튼 클릭 작동 | [ ] |
| Concept Card 호버 효과 | [ ] |
| 뷰 전환 애니메이션 | [ ] |
| 로딩 스피너 표시 | [ ] |
| 에러 메시지 표시 | [ ] |

---

## 6. Fallback 계획

### 6.1 에러별 대응

| 에러 상황 | 대응 방안 |
|----------|----------|
| YouTube 다운로드 실패 | 미리 다운로드한 파일 업로드 사용 |
| Gemini API 한도 초과 | Mock 응답으로 전환 |
| SSE 연결 실패 | 폴링 방식으로 fallback |
| 이미지 생성 실패 | 플레이스홀더 이미지 사용 |
| 영상 생성 실패 | 스크립트만 표시 (영상 건너뛰기) |

### 6.2 백업 자료 준비

| 자료 | 경로 | 용도 |
|------|------|------|
| 사전 녹화 영상 | `/backup/demo-recording.mp4` | 라이브 실패 시 |
| 완성된 Concept Board 스크린샷 | `/backup/concept-board.png` | API 실패 시 |
| 완성된 산출물 스크린샷들 | `/backup/screenshots/` | 각 뷰 실패 시 |

### 6.3 발표자 대처 멘트

**API 느릴 때**:
> "지금 AI가 열심히 분석 중입니다.
> 실제 서비스에서는 더 빠른 응답을 위해 캐싱을 적용할 예정입니다."

**에러 발생 시**:
> "라이브 데모라 가끔 이런 일이 있죠. (웃음)
> 미리 준비한 결과물로 보여드리겠습니다."

---

## 7. 테스트용 데이터

### 7.1 테스트 YouTube URL

| 영상 | URL | 길이 | 용도 |
|------|-----|------|------|
| 제주 감귤 회의 (메인) | `https://youtu.be/XXXXXX` | 5분 | 메인 데모 |
| 짧은 테스트 영상 | `https://youtu.be/YYYYYY` | 1분 | 빠른 테스트 |

> **A팀 요청**: 적절한 테스트 영상 URL 확보 필요

### 7.2 테스트 Brand 정보

```json
{
  "brand_id": "brand-jeju-gamgyul",
  "name": "제주 감귤 브랜드",
  "primary_color": "#FFA500",
  "secondary_color": "#FFD700",
  "logo_url": null
}
```

---

## 8. 일정

### 8.1 A팀 작업 일정

| Day | 작업 | 담당 |
|-----|------|------|
| Day 1 | 데모 시나리오 스크립트 작성 | A팀 |
| Day 2 | Mock 데이터 검증 + QA 체크리스트 | A팀 |
| Day 3 | 통합 테스트 참여 | A팀 + B팀 + C팀 |
| Day 4 | 리허설 + Fallback 준비 | 전체 |
| Day 5 | **DEMO DAY** | 전체 |

### 8.2 주요 마일스톤

| 시점 | 마일스톤 | 담당 |
|------|----------|------|
| Day 2 완료 | B팀 API 1차 완료 | B팀 |
| Day 3 완료 | C팀 UI 1차 완료 | C팀 |
| Day 4 오전 | 통합 테스트 완료 | 전체 |
| Day 4 오후 | 리허설 완료 | 전체 |
| Day 5 | **DEMO** | 전체 |

---

## 9. 커뮤니케이션

### 9.1 관련 문서

| 문서 | 경로 | 담당 |
|------|------|------|
| C팀 협업 보고서 | `DEMO_TEAM_COLLABORATION_REPORT_2025-11-26.md` | C팀 |
| B팀 리뷰 문서 | `B_TEAM_REVIEW_OF_C_TEAM_REPORT_2025-11-26.md` | B팀 |
| 본 문서 | `A_TEAM_DEMO_PREPARATION_GUIDE_2025-11-26.md` | C팀→A팀 |

### 9.2 문의 채널

| 항목 | 담당 |
|------|------|
| API 스키마/동작 | B팀 |
| UI/뷰 전환 | C팀 |
| 시나리오/QA | A팀 |

---

## 10. 체크리스트 요약

### A팀 최종 체크리스트

- [ ] 데모 시나리오 스크립트 완성
- [ ] Mock 데이터 검증 완료
- [ ] QA 체크리스트 작성
- [ ] Fallback 계획 수립
- [ ] 테스트 YouTube URL 확보
- [ ] 백업 자료 준비 (스크린샷, 녹화)
- [ ] 리허설 일정 조율
- [ ] 발표 슬라이드 준비

---

**문서 상태**: ✅ 완성
**다음 액션**: A팀 작업 시작
**버전**: v1.0
**최종 수정**: 2025-11-26
