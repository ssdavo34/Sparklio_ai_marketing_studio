# B팀 → A팀 업무 보고서
**작성일**: 2025-11-26
**작성자**: B팀 (Backend)
**대상**: A팀 (QA)

---

## 1. 오늘 완료된 작업

### 1.1 버그 수정
| 항목 | 상태 | 커밋 |
|------|------|------|
| `TranscriptionResult.elapsed_seconds` 버그 | ✅ 완료 | `b9ea42d` |
| - 원인: `elapsed_seconds` 대신 `latency_ms` 필드 사용 | | |
| - 수정: `meeting_url_pipeline.py:172` | | |
| - JSONB 직렬화 오류도 함께 수정 | | |

### 1.2 C팀 협업 문서
| 문서 | 상태 | 커밋 |
|------|------|------|
| B팀 상세 검토 보고서 | ✅ 완료 | `f31a1e9` |
| Mock 데이터 파일 5개 | ✅ 완료 | `88032bd` |

---

## 2. 기술 스택 확정 (Demo Day)

| 구분 | 선택 | 이유 |
|------|------|------|
| **LLM** | Gemini 2.0 Flash | 무료 + 충분한 성능 |
| **이미지 생성** | Nanobanana API | 기존 연동 완료, 안정적 |
| **TTS** | Edge TTS | 무료 + 한국어 품질 우수 |
| **BGM** | 사전 다운로드 | 저작권 무료 음원 |

---

## 3. API 명세 확정

### 3.1 Demo 메인 API
```
POST /api/v1/demo/meeting-to-campaign
├── Request: { meeting_id, options }
└── Response: { task_id, status }

GET /api/v1/tasks/{task_id}/stream (SSE)
├── progress 이벤트: { step, progress, message }
├── concept 이벤트: { concepts: [...] }
└── complete 이벤트: { campaign_id }

GET /api/v1/demo/concept-board/{campaign_id}
└── Response: { campaign, concepts, assets }
```

### 3.2 Asset API (4종)
```
GET /api/v1/assets/presentations/{id}
GET /api/v1/assets/product-details/{id}
GET /api/v1/assets/instagram-ads/{concept_id}
GET /api/v1/assets/shorts-scripts/{id}
```

---

## 4. QA 체크포인트 요청

### 4.1 API 기능 테스트
| 테스트 항목 | 우선순위 | 예상 준비 시점 |
|-------------|----------|----------------|
| meeting-to-campaign API | P0 | B팀 API 완료 후 |
| SSE 스트리밍 연결 | P0 | B팀 API 완료 후 |
| Concept Board 데이터 조회 | P0 | B팀 API 완료 후 |
| Asset 4종 API | P1 | P0 완료 후 |

### 4.2 통합 테스트
| 테스트 항목 | 설명 |
|-------------|------|
| End-to-End 흐름 | 회의 URL → 캠페인 생성 → 컨셉 선택 → 에셋 확인 |
| SSE 안정성 | 연결 유지, 재연결, 에러 핸들링 |
| 에러 케이스 | 잘못된 URL, 긴 회의, 네트워크 끊김 |

### 4.3 A팀 테스트 환경 준비
- **Mac mini 서버**: 100.123.51.5:8000
- **GPU 서버 (Whisper)**: 100.120.180.42:9000 (수동 시작 필요)
- **테스트 회의 URL**: 별도 제공 예정

---

## 5. 현재 진행 상황

### B팀 진행률
```
완료: ████░░░░░░ 20%
- [x] 버그 수정
- [x] C팀 협업 문서
- [x] Mock 데이터 생성
- [ ] Demo API 구현 (진행 예정)
- [ ] Agent 구현 (진행 예정)
```

### C팀 진행률 (보고받은 내용)
```
완료: ██░░░░░░░░ 10%
- [x] 기존 코드 분석
- [x] B팀 협조 요청
- [ ] Concept Board UI (Mock으로 시작)
- [ ] 에셋 Preview UI
```

---

## 6. 타임라인 (조정됨)

| 시간 | B팀 | C팀 | A팀 |
|------|-----|-----|-----|
| 오전 | ✅ 버그 수정, 협업 문서 | 코드 분석 | - |
| 오후 1 | Demo API 구현 | Concept Board (Mock) | - |
| 오후 2 | SSE, Agent 구현 | 에셋 Preview UI | - |
| 저녁 | API 완료, C팀 연동 | API 연동 | 통합 테스트 시작 |

---

## 7. A팀 요청사항

1. **QA 체크리스트 업데이트**
   - Demo API 명세 기반으로 테스트 케이스 작성 요청

2. **테스트 환경 접근 확인**
   - Mac mini 서버 접근 가능한지 확인 필요
   - Tailscale 연결 상태 체크

3. **버그 리포트 채널**
   - 발견된 이슈는 즉시 Slack으로 전달 요청

---

## 8. 연락처

- **B팀 Slack**: #backend-demo
- **긴급 연락**: 담당자 직접 연락

---

*B팀 작업 진행 중. 추가 업데이트 시 별도 공지.*
