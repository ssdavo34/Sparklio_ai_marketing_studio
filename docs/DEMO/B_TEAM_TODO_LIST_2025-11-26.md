# B팀 Demo Day TODO List
**작성일**: 2025-11-26
**상태**: 작업 진행 중

---

## 우선순위 범례
- 🔴 **P0**: Demo 필수 (반드시 완료)
- 🟡 **P1**: Demo 권장 (시간 되면)
- 🟢 **P2**: Nice-to-have (여유 있으면)

---

## 🔴 P0: Demo 필수 작업

### 1. Demo API 엔드포인트 구현

#### 1.1 POST /api/v1/demo/meeting-to-campaign
| 항목 | 상태 | 담당 |
|------|------|------|
| 라우터 생성 (`app/api/v1/demo.py`) | ⬜ 대기 | B팀 |
| Request/Response 스키마 | ⬜ 대기 | B팀 |
| 서비스 로직 (`DemoPipelineService`) | ⬜ 대기 | B팀 |
| Task 큐 연동 (Redis) | ⬜ 대기 | B팀 |

```python
# 예상 구조
@router.post("/demo/meeting-to-campaign")
async def create_demo_campaign(
    request: DemoCampaignRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> DemoCampaignResponse:
    task_id = await demo_service.start_campaign_generation(request, db)
    return DemoCampaignResponse(task_id=task_id, status="processing")
```

#### 1.2 GET /api/v1/tasks/{task_id}/stream (SSE)
| 항목 | 상태 | 담당 |
|------|------|------|
| SSE 라우터 생성 | ⬜ 대기 | B팀 |
| Redis Pub/Sub 구독 | ⬜ 대기 | B팀 |
| 이벤트 타입 정의 (progress, concept, complete, error) | ⬜ 대기 | B팀 |
| 연결 유지 및 heartbeat | ⬜ 대기 | B팀 |

```python
# 예상 구조
@router.get("/tasks/{task_id}/stream")
async def stream_task_progress(task_id: str):
    async def event_generator():
        async for event in redis_subscriber.listen(f"task:{task_id}"):
            yield f"event: {event.type}\ndata: {event.data}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

#### 1.3 GET /api/v1/demo/concept-board/{campaign_id}
| 항목 | 상태 | 담당 |
|------|------|------|
| 라우터 생성 | ⬜ 대기 | B팀 |
| Campaign/Concept 조회 로직 | ⬜ 대기 | B팀 |
| Asset 정보 집계 | ⬜ 대기 | B팀 |

---

### 2. Agent 구현 (Gemini 2.0 Flash)

#### 2.1 ConceptAgent
| 항목 | 상태 | 담당 |
|------|------|------|
| Gemini API 연동 | ⬜ 대기 | B팀 |
| 프롬프트 설계 (3개 컨셉 생성) | ⬜ 대기 | B팀 |
| 출력 스키마 (Pydantic) | ⬜ 대기 | B팀 |
| 에러 핸들링 | ⬜ 대기 | B팀 |

```python
# 기대 출력
class Concept(BaseModel):
    concept_id: str
    concept_name: str
    concept_description: str
    target_audience: str
    key_message: str
    tone_and_manner: str
    visual_style: str
```

#### 2.2 ShortsScriptAgent
| 항목 | 상태 | 담당 |
|------|------|------|
| 씬 단위 스크립트 생성 프롬프트 | ⬜ 대기 | B팀 |
| 타이밍 계산 로직 | ⬜ 대기 | B팀 |
| 출력 스키마 | ⬜ 대기 | B팀 |

---

### 3. SSE Progress 시스템

| 항목 | 상태 | 담당 |
|------|------|------|
| Redis Pub/Sub 설정 | ⬜ 대기 | B팀 |
| 진행률 계산 로직 | ⬜ 대기 | B팀 |
| 각 단계별 이벤트 발행 | ⬜ 대기 | B팀 |

**진행 단계 정의:**
```
STEP 1: 회의 분석 중 (0-20%)
STEP 2: 핵심 메시지 추출 중 (20-40%)
STEP 3: 마케팅 컨셉 생성 중 (40-70%)
STEP 4: 에셋 생성 중 (70-100%)
```

---

## 🟡 P1: Demo 권장 작업

### 4. MeetingPreCleaner
| 항목 | 상태 | 담당 |
|------|------|------|
| 테테스트/필러 단어 제거 | ⬜ 대기 | B팀 |
| 화자 구분 정리 | ⬜ 대기 | B팀 |

### 5. Asset API 4종
| API | 상태 | 담당 |
|-----|------|------|
| GET /assets/presentations/{id} | ⬜ 대기 | B팀 |
| GET /assets/product-details/{id} | ⬜ 대기 | B팀 |
| GET /assets/instagram-ads/{concept_id} | ⬜ 대기 | B팀 |
| GET /assets/shorts-scripts/{id} | ⬜ 대기 | B팀 |

### 6. Campaign/Concept DB 모델
| 항목 | 상태 | 담당 |
|------|------|------|
| Campaign 모델 | ⬜ 대기 | B팀 |
| Concept 모델 | ⬜ 대기 | B팀 |
| Asset 모델 (4종) | ⬜ 대기 | B팀 |
| Alembic 마이그레이션 | ⬜ 대기 | B팀 |

---

## 🟢 P2: Nice-to-have

### 7. VisualPromptAgent
| 항목 | 상태 | 담당 |
|------|------|------|
| Nanobanana용 프롬프트 생성 | ⬜ 대기 | B팀 |
| 이미지 스타일 가이드 | ⬜ 대기 | B팀 |

### 8. VideoBuilder
| 항목 | 상태 | 담당 |
|------|------|------|
| Edge TTS 음성 생성 | ⬜ 대기 | B팀 |
| BGM 믹싱 | ⬜ 대기 | B팀 |
| ffmpeg 영상 조립 | ⬜ 대기 | B팀 |

---

## 완료된 작업 ✅

| 작업 | 완료 시각 | 커밋 |
|------|----------|------|
| TranscriptionResult 버그 수정 | 10:30 | `b9ea42d` |
| C팀 협조요청 응답서 작성 | 11:00 | `0ddd322` |
| B팀 상세 검토 보고서 작성 | 11:30 | `f31a1e9` |
| Mock 데이터 5개 생성 | 12:00 | `88032bd` |

---

## 기술 스택 (확정)

| 구분 | 선택 | 비고 |
|------|------|------|
| LLM | Gemini 2.0 Flash | google-generativeai |
| 이미지 | Nanobanana API | 기존 연동 |
| TTS | Edge TTS | edge-tts 패키지 |
| BGM | 사전 다운로드 | `/assets/bgm/` |

---

## 파일 구조 (예정)

```
backend/app/
├── api/v1/
│   ├── demo.py              # Demo API 라우터 (NEW)
│   └── tasks.py             # SSE 스트리밍 (NEW)
├── services/
│   ├── demo_pipeline.py     # Demo 파이프라인 (NEW)
│   └── sse_publisher.py     # SSE 이벤트 발행 (NEW)
├── agents/
│   ├── concept_agent.py     # ConceptAgent (NEW)
│   └── shorts_script_agent.py  # ShortsScriptAgent (NEW)
├── models/
│   ├── campaign.py          # Campaign 모델 (NEW)
│   └── concept.py           # Concept 모델 (NEW)
└── schemas/
    └── demo.py              # Demo 스키마 (NEW)
```

---

## 작업 순서 (권장)

1. **스키마 정의** → 2. **DB 모델** → 3. **Agent** → 4. **서비스** → 5. **API**

```
[스키마] ──→ [DB모델] ──→ [Agent] ──→ [Service] ──→ [API]
   ↓            ↓           ↓           ↓           ↓
 demo.py    campaign.py  concept_   demo_       demo.py
            concept.py   agent.py   pipeline.py tasks.py
```

---

*마지막 업데이트: 2025-11-26 12:00*
