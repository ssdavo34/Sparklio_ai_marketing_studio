# DEMO Day 마스터 체크리스트

**문서 버전**: v1.0
**작성일**: 2025-11-26
**작성자**: C팀 (Frontend)
**목적**: DEMO Day 완벽 준비를 위한 종합 체크리스트

---

## 1. 문서 현황

### 1.1 작성 완료된 문서

| 문서명 | 작성자 | 목적 | 상태 |
|--------|--------|------|------|
| [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md) | A팀 | 전체 PRD | ✅ |
| [FRONTEND_DEMO_FLOW.md](./FRONTEND_DEMO_FLOW.md) | A팀 | 프론트엔드 플로우 | ✅ |
| [CONCEPT_BOARD_SPEC.md](./CONCEPT_BOARD_SPEC.md) | A팀 | Concept Board 스펙 | ✅ |
| [CHAT_ONEPAGE_STUDIO_PRINCIPLES.md](./CHAT_ONEPAGE_STUDIO_PRINCIPLES.md) | A팀 | Chat 원칙 | ✅ |
| [DEMO_TEAM_COLLABORATION_REPORT_2025-11-26.md](./DEMO_TEAM_COLLABORATION_REPORT_2025-11-26.md) | C팀 | 협업 보고서 | ✅ |
| [B_TEAM_REVIEW_OF_C_TEAM_REPORT_2025-11-26.md](./B_TEAM_REVIEW_OF_C_TEAM_REPORT_2025-11-26.md) | B팀 | API 스키마 확정 | ✅ |
| [A_TEAM_DEMO_PREPARATION_GUIDE_2025-11-26.md](./A_TEAM_DEMO_PREPARATION_GUIDE_2025-11-26.md) | C팀 | A팀 가이드 | ✅ |
| [C_TEAM_IMPLEMENTATION_TODO_2025-11-26.md](./C_TEAM_IMPLEMENTATION_TODO_2025-11-26.md) | C팀 | C팀 TODO | ✅ |
| **본 문서** | C팀 | 마스터 체크리스트 | ✅ |

### 1.2 문서 관계도

```
SPARKLIO_DEMO_V1_PRD.md (A팀)
    │
    ├── FRONTEND_DEMO_FLOW.md (A팀)
    ├── CONCEPT_BOARD_SPEC.md (A팀)
    ├── CHAT_ONEPAGE_STUDIO_PRINCIPLES.md (A팀)
    │
    └── 팀간 협업 문서
        ├── DEMO_TEAM_COLLABORATION_REPORT (C팀 → 전체)
        ├── B_TEAM_REVIEW_OF_C_TEAM_REPORT (B팀 → C팀)
        ├── A_TEAM_DEMO_PREPARATION_GUIDE (C팀 → A팀)
        ├── C_TEAM_IMPLEMENTATION_TODO (C팀 내부)
        └── DEMO_DAY_MASTER_CHECKLIST (전체)
```

---

## 2. 팀별 작업 현황

### 2.1 B팀 (Backend) - API 개발

| 작업 | 우선순위 | 상태 | 담당 |
|------|---------|------|------|
| DB 모델 (Campaign, Concept, Asset) | P0 | 대기 | B팀 |
| `POST /api/v1/demo/meeting-to-campaign` | P0 | 대기 | B팀 |
| `GET /api/v1/demo/concept-board/{id}` | P0 | 대기 | B팀 |
| `GET /api/v1/tasks/{id}/stream` (SSE) | P0 | 대기 | B팀 |
| 산출물 상세 조회 API 4종 | P0 | 대기 | B팀 |
| Agent 통합 (Gemini) | P0 | 대기 | B팀 |
| Mock 데이터 JSON 파일 제공 | P0 | 대기 | B팀 |

### 2.2 C팀 (Frontend) - UI 개발

| 작업 | 우선순위 | 상태 | 담당 |
|------|---------|------|------|
| `ConceptBoardView.tsx` | P0 | 대기 | C팀 |
| `MeetingSummaryView.tsx` | P0 | 대기 | C팀 |
| NextActions 버튼 (Chat 확장) | P0 | 대기 | C팀 |
| `useCenterViewStore.ts` | P0 | 대기 | C팀 |
| `useSSEProgress.ts` | P0 | 대기 | C팀 |
| `demo-api.ts` | P0 | 대기 | C팀 |
| `types/demo.ts` | P0 | 대기 | C팀 |
| `SlidesPreviewView.tsx` | P1 | 대기 | C팀 |
| `DetailPreviewView.tsx` | P1 | 대기 | C팀 |
| `InstagramPreviewView.tsx` | P1 | 대기 | C팀 |
| `ShortsPreviewView.tsx` | P1 | 대기 | C팀 |

### 2.3 A팀 (QA/문서) - 준비

| 작업 | 우선순위 | 상태 | 담당 |
|------|---------|------|------|
| 데모 시나리오 스크립트 | P0 | 대기 | A팀 |
| Mock 데이터 검증 | P0 | 대기 | A팀 |
| QA 체크리스트 | P0 | 대기 | A팀 |
| Fallback 시나리오 | P0 | 대기 | A팀 |
| 테스트 YouTube URL 확보 | P0 | 대기 | A팀 |
| 발표 슬라이드 | P1 | 대기 | A팀 |
| 리허설 진행 | P1 | 대기 | A팀 |

---

## 3. 기술 스택 최종 확정

| 영역 | 기술 | 비용 | 확정 |
|------|------|------|------|
| LLM | Gemini 2.0 Flash | 무료 | ✅ |
| 이미지 생성 | Nanobanana API | 무료 | ✅ |
| TTS | Edge TTS | 무료 | ✅ |
| BGM | 사전 다운로드 | 무료 | ✅ |
| STT | Whisper (로컬) | 로컬 | ✅ |
| Frontend | Next.js 14 + React 18 | - | ✅ |
| Backend | FastAPI + PostgreSQL | - | ✅ |

---

## 4. API 인터페이스 확정

### 4.1 Campaign 생성

```
POST /api/v1/demo/meeting-to-campaign
Request: { meeting_id, brand_id?, num_concepts? }
Response: { task_id, campaign_id, status, estimated_seconds }
```

### 4.2 SSE 스트리밍

```
GET /api/v1/tasks/{task_id}/stream
Events: progress, completed, error
Data: { step, message, progress, campaign_id?, error? }
```

### 4.3 Concept Board 데이터

```
GET /api/v1/demo/concept-board/{campaign_id}
Response: { campaign_id, meeting, brand, brief, concepts[], status }
```

### 4.4 산출물 상세

```
GET /api/v1/assets/presentations/{id}
GET /api/v1/assets/product-details/{id}
GET /api/v1/assets/instagram-ads/{concept_id}
GET /api/v1/assets/shorts-scripts/{id}
```

---

## 5. 일정 (5일 플랜)

### Day 1
| 팀 | 작업 |
|----|------|
| B팀 | DB 모델 + API 엔드포인트 구조 |
| C팀 | Concept Board UI (Mock) + 타입 정의 |
| A팀 | 데모 시나리오 스크립트 작성 |

### Day 2
| 팀 | 작업 |
|----|------|
| B팀 | Demo API 구현 + SSE |
| C팀 | NextActions + 뷰 전환 + SSE Hook |
| A팀 | Mock 데이터 검증 + QA 체크리스트 |

### Day 3
| 팀 | 작업 |
|----|------|
| B팀 | Agent 통합 + 테스트 |
| C팀 | Demo API 연동 + 4종 Preview |
| A팀 | Fallback 준비 + 테스트 URL |

### Day 4
| 팀 | 작업 |
|----|------|
| 전체 | 통합 테스트 |
| 전체 | 버그 수정 |
| 전체 | 리허설 |

### Day 5
| 팀 | 작업 |
|----|------|
| **전체** | **DEMO DAY** |

---

## 6. 통합 체크리스트

### 6.1 Demo 전날 체크

#### 서버 환경
- [ ] Backend 서버 정상 작동 (100.123.51.5:8000)
- [ ] Frontend dev 서버 정상 작동 (localhost:3000)
- [ ] Whisper STT 서버 정상 작동
- [ ] PostgreSQL DB 연결 정상

#### API 테스트
- [ ] Meeting 생성 API 작동
- [ ] Meeting 분석 API 작동
- [ ] Campaign 생성 API 작동
- [ ] SSE 스트리밍 작동
- [ ] Concept Board 조회 작동
- [ ] 산출물 상세 조회 작동

#### UI 테스트
- [ ] 3패널 레이아웃 정상
- [ ] Chat 메시지 전송/수신
- [ ] NextActions 버튼 동작
- [ ] 뷰 전환 정상
- [ ] Concept Board 표시 정상
- [ ] 4종 Preview 표시 정상

#### 데이터 테스트
- [ ] Mock 데이터 로드 정상
- [ ] 실제 API 데이터 로드 정상
- [ ] 한글 표시 정상
- [ ] 이미지 로드 정상

### 6.2 Demo 당일 체크

#### 시작 전 (30분 전)
- [ ] 모든 서버 재시작
- [ ] 브라우저 캐시 클리어
- [ ] 테스트 플로우 한 번 실행
- [ ] 백업 자료 준비 확인

#### 발표 중
- [ ] URL 입력 → Meeting 생성 성공
- [ ] Meeting 분석 → Summary 표시
- [ ] 캠페인 만들기 → SSE 진행상황
- [ ] Concept Board 표시
- [ ] 산출물 4종 Preview
- [ ] Q&A 대응

---

## 7. Fallback 계획 요약

| 에러 상황 | 대응 |
|----------|------|
| YouTube 다운로드 실패 | 미리 다운로드한 파일 업로드 |
| Gemini API 한도 초과 | Mock 응답으로 전환 |
| SSE 연결 실패 | 폴링 방식 fallback |
| 이미지 생성 실패 | 플레이스홀더 이미지 |
| 영상 생성 실패 | 스크립트만 표시 |
| 전체 시스템 장애 | 사전 녹화 영상 재생 |

---

## 8. 연락처/담당자

| 영역 | 담당 팀 | 문의 내용 |
|------|---------|----------|
| API 스키마/동작 | B팀 | 엔드포인트, 응답 형식 |
| UI/뷰 전환 | C팀 | 컴포넌트, 상태 관리 |
| 시나리오/QA | A팀 | 테스트, 발표 순서 |

---

## 9. 성공 기준

### 9.1 기술적 성공

- [ ] Meeting From URL → Summary: 30초 이내
- [ ] Campaign 생성 (4종 산출물): 2분 이내
- [ ] SSE 진행상황 실시간 표시
- [ ] 에러 없이 전체 플로우 완주

### 9.2 발표 성공

- [ ] 스토리 자연스러움 (회의→캠페인 플로우)
- [ ] 에이전트 역할 설명 명확
- [ ] 결과물 품질 (실제 사용 가능 수준)
- [ ] 라이브 데모 끊김 없음

---

## 10. 최종 확인

### 10.1 문서 완료 현황

| 문서 | 상태 |
|------|------|
| PRD 및 스펙 문서 | ✅ 완료 |
| 팀간 협업 보고서 | ✅ 완료 |
| API 스키마 확정 | ✅ 완료 |
| A팀 가이드 | ✅ 완료 |
| C팀 TODO | ✅ 완료 |
| 마스터 체크리스트 | ✅ 완료 |

### 10.2 다음 스텝

1. **B팀**: API 구현 시작 (Day 1)
2. **C팀**: Concept Board UI 시작 (Day 1, Mock 사용)
3. **A팀**: 데모 시나리오 작성 (Day 1)

---

**DEMO Day까지 화이팅!**

---

**문서 상태**: ✅ 완성
**버전**: v1.0
**최종 수정**: 2025-11-26
