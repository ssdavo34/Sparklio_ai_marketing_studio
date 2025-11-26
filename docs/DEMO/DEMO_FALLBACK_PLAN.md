# DEMO Fallback Plan

**문서 버전**: v1.0
**작성일**: 2025-11-26
**작성자**: A팀 (QA/문서)
**목적**: 라이브 데모 장애 발생 시 대응 계획

---

## 1. 개요

### 1.1 Fallback 원칙

> **"라이브 데모는 항상 실패할 수 있다. 준비된 발표자는 실패해도 당황하지 않는다."**

### 1.2 Fallback 레벨

| 레벨 | 상황 | 대응 |
|------|------|------|
| Level 1 | 일시적 지연 | 멘트로 시간 벌기 |
| Level 2 | 특정 기능 실패 | 해당 단계 Skip + Mock 데이터 |
| Level 3 | 전체 시스템 장애 | 녹화 영상 재생 |

---

## 2. 에러 시나리오별 대응

### 2.1 YouTube 다운로드 실패

**증상**:
- Meeting From URL 요청 후 오랜 시간 응답 없음
- "다운로드 실패" 에러 메시지

**원인**:
- 네트워크 문제
- YouTube 접근 차단
- yt-dlp 버전 문제

**대응**:

```
[발표자 멘트]
"네트워크 상황이 좋지 않네요.
미리 준비한 회의 데이터로 보여드릴게요."
```

**행동**:
1. 미리 생성해둔 Meeting ID 사용
2. `GET /api/v1/meetings/{pre-created-id}` 호출
3. 또는 Mock 데이터 로드

**준비물**:
- Pre-created Meeting ID: `_________` (발표 전 생성)
- 로컬 비디오 파일: `/backup/test-meeting.mp4`

---

### 2.2 Gemini API 한도 초과 / 오류

**증상**:
- Campaign 생성 중 멈춤
- 429 Rate Limit 에러
- 500 Internal Server Error

**원인**:
- 무료 티어 한도 (15 RPM, 100만 토큰/일)
- Gemini API 일시 장애

**대응**:

```
[발표자 멘트]
"AI가 고민 중이네요. 품질 좋은 결과를 위해 시간이 조금 걸립니다."
(30초 대기)

"미리 생성해둔 결과를 보여드릴게요."
```

**행동**:
1. Mock Concept Board 데이터 로드
2. `/mock-data/concept-board-sample.json` 표시
3. UI는 실제와 동일하게 동작

**준비물**:
- Mock JSON 파일 5개 (검증 완료)
- Fallback 모드 토글 (프론트엔드)

---

### 2.3 SSE 스트리밍 연결 실패

**증상**:
- 진행상황 메시지 표시 안됨
- 화면이 멈춘 것처럼 보임

**원인**:
- EventSource 연결 실패
- CORS 문제
- 네트워크 불안정

**대응**:

```
[발표자 멘트]
"진행상황 표시가 업데이트되지 않네요.
백그라운드에서 정상 처리 중입니다. 잠시만 기다려주세요."
```

**행동**:
1. 폴링 방식으로 전환 (3초 간격)
2. 완료 시 결과 표시
3. 또는 Mock 데이터로 전환

---

### 2.4 Concept Board 로드 실패

**증상**:
- Campaign 완료 후 Concept Board 표시 안됨
- 빈 화면 또는 에러

**대응**:

```
[발표자 멘트]
"화면 전환에 문제가 있네요.
미리 준비한 결과물로 보여드릴게요."
```

**행동**:
1. Mock Concept Board 표시
2. 또는 스크린샷 이미지 표시
3. `/backup/concept-board-screenshot.png`

---

### 2.5 산출물 Preview 실패

**증상**:
- 슬라이드/상세/인스타/쇼츠 버튼 클릭 후 로드 안됨

**대응**:

```
[발표자 멘트]
"이 부분은 잠시 건너뛰고, 다른 산출물을 보여드릴게요."
```

**행동**:
1. 다른 산출물 버튼 시도
2. 실패 시 스크린샷 표시
3. `/backup/screenshots/` 폴더

---

### 2.6 전체 시스템 장애

**증상**:
- Backend 서버 다운
- Frontend 화면 로드 안됨
- 네트워크 완전 단절

**대응**:

```
[발표자 멘트]
"기술적 문제가 발생했네요. 라이브 데모의 숙명이죠. (웃음)
미리 녹화해둔 데모 영상으로 보여드리겠습니다."
```

**행동**:
1. 사전 녹화 영상 재생
2. `/backup/demo-recording.mp4`
3. 영상 재생하며 설명 계속

**준비물**:
- 전체 플로우 녹화 영상 (5-6분)
- 영상 재생 가능한 별도 탭/앱

---

## 3. 발표자 대처 멘트 모음

### 3.1 지연 시

| 상황 | 멘트 |
|------|------|
| API 응답 느림 | "AI가 열심히 분석 중입니다. 실제 서비스에서는 캐싱으로 더 빠르게 처리됩니다." |
| 로딩 중 | "고품질 결과를 위해 꼼꼼히 작업하고 있어요." |
| 예상보다 오래 걸림 | "네트워크 상황에 따라 시간이 조금 걸릴 수 있어요." |

### 3.2 에러 발생 시

| 상황 | 멘트 |
|------|------|
| 일반 에러 | "라이브 데모라 가끔 이런 일이 있죠. (웃음) 미리 준비한 결과물로 보여드릴게요." |
| 네트워크 문제 | "네트워크 상황이 좋지 않네요. 다른 방법으로 보여드리겠습니다." |
| 완전 실패 | "기술의 신이 오늘은 쉬는 날인가 봐요. 녹화 영상으로 대체하겠습니다." |

### 3.3 복구 후

| 상황 | 멘트 |
|------|------|
| 복구 성공 | "다행히 복구됐네요. 이어서 보여드리겠습니다." |
| Mock으로 진행 후 | "미리 준비한 데이터지만 실제 서비스와 동일한 결과입니다." |

---

## 4. 백업 자료 체크리스트

### 4.1 필수 준비물

| 자료 | 경로 | 상태 |
|------|------|------|
| Mock JSON 5개 | `frontend/public/mock-data/` | ✅ 준비 완료 |
| Concept Board 스크린샷 | `/backup/concept-board.png` | ⬜ 준비 필요 |
| 슬라이드 Preview 스크린샷 | `/backup/screenshots/slides.png` | ⬜ 준비 필요 |
| 상세페이지 스크린샷 | `/backup/screenshots/detail.png` | ⬜ 준비 필요 |
| 인스타 Preview 스크린샷 | `/backup/screenshots/instagram.png` | ⬜ 준비 필요 |
| 쇼츠 Preview 스크린샷 | `/backup/screenshots/shorts.png` | ⬜ 준비 필요 |
| 전체 플로우 녹화 영상 | `/backup/demo-recording.mp4` | ⬜ 준비 필요 |
| Pre-created Meeting ID | 메모장에 기록 | ⬜ 발표 전 생성 |

### 4.2 백업 폴더 구조

```
/backup/
├── concept-board.png
├── demo-recording.mp4
├── screenshots/
│   ├── meeting-summary.png
│   ├── slides.png
│   ├── detail.png
│   ├── instagram.png
│   └── shorts.png
└── pre-created-data.txt  (Meeting ID 등)
```

---

## 5. Fallback 모드 활성화 방법

### 5.1 프론트엔드 Fallback 토글

```typescript
// URL 파라미터로 Fallback 모드 활성화
http://localhost:3000/studio/demo?fallback=true

// 또는 localStorage
localStorage.setItem('demo_fallback_mode', 'true');
```

### 5.2 Fallback 모드 동작

| 기능 | 일반 모드 | Fallback 모드 |
|------|----------|--------------|
| Meeting From URL | API 호출 | Mock 데이터 로드 |
| Campaign 생성 | API 호출 + SSE | 3초 딜레이 후 Mock 표시 |
| Concept Board | API 데이터 | Mock JSON |
| 산출물 Preview | API 데이터 | Mock JSON |

---

## 6. 발표 전 리허설 시나리오

### 6.1 정상 플로우 리허설

1. 전체 플로우 1회 실행
2. 각 단계 소요 시간 측정
3. 발표자 멘트 연습

### 6.2 Fallback 리허설

1. **의도적 네트워크 차단** 후 대응 연습
2. **Mock 모드 전환** 연습
3. **녹화 영상 재생** 연습
4. 각 에러 상황별 멘트 연습

---

## 7. 비상 연락망

| 역할 | 담당 | 연락처 |
|------|------|--------|
| Backend 이슈 | B팀 | - |
| Frontend 이슈 | C팀 | - |
| 인프라 이슈 | 관리자 | - |

---

## 8. 체크리스트

### 발표 1시간 전

- [ ] 백업 자료 위치 확인
- [ ] 녹화 영상 재생 테스트
- [ ] Fallback 모드 전환 테스트
- [ ] 대처 멘트 복습

### 발표 10분 전

- [ ] 녹화 영상 탭 미리 열어두기
- [ ] 스크린샷 폴더 미리 열어두기
- [ ] Pre-created Meeting ID 클립보드에 복사

---

**문서 상태**: ✅ 완성
**버전**: v1.0
**최종 수정**: 2025-11-26
