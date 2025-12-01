# Video Pipeline GAP 분석 보고서

**작성일**: 2025-12-01
**작성자**: B팀 (Backend)
**비교 대상**: VIDEO_PIPELINE_FLOW_V2.md vs 현재 구현
**상태**: ✅ 모든 항목 구현 완료

---

## 1. 요약

VIDEO_PIPELINE_FLOW_V2.md 문서와 현재 코드베이스를 비교한 결과:

| 항목 | 상태 | 비고 |
|------|------|------|
| 4단계 확인 플로우 | ✅ 완료 | 모든 상태 정의됨 |
| VideoDirectorMode | ✅ 완료 | PLAN/RENDER |
| VideoGenerationMode | ✅ 완료 | REUSE/HYBRID/CREATIVE |
| MotionPromptAgent | ✅ 완료 | motion_prompt.py |
| VeoProvider | ✅ 완료 | gateway.py 등록 |
| API Schemas | ✅ 완료 | video_timeline.py |
| 환경변수 (Real/Mock) | ✅ 완료 | config.py에 추가됨 |
| render_mode 필드 | ✅ 완료 | VideoRenderRequest 확장 |
| RENDER_QUEUED 상태 | ✅ 완료 | VideoProjectStatus에 추가 |
| Cost Guard | ✅ 완료 | cost_guard.py 생성 |
| video_jobs DB | ✅ 완료 | video_job.py 모델 생성 |
| Error Codes | ✅ 완료 | VideoRenderError enum |

---

## 2. 구현 완료 항목

### 2.1 환경변수 추가

**파일**: `backend/app/core/config.py`

```python
# Video Render Mode Control (4단계 확인 플로우 지원)
video_allow_real: bool = Field(False, env="VIDEO_ALLOW_REAL")
video_default_mode: str = Field("mock", env="VIDEO_DEFAULT_MODE")
render_daily_cost_limit: float = Field(100.0, env="RENDER_DAILY_COST_LIMIT")
```

### 2.2 VideoRenderRequest 확장

**파일**: `backend/app/schemas/video_timeline.py`

```python
class VideoRenderRequest(BaseModel):
    plan_draft: VideoPlanDraftV1
    render_mode: RenderMode = RenderMode.MOCK  # 기본값: mock (안전)
    dry_run: bool = False  # True면 비용만 계산
```

### 2.3 RenderMode & VideoRenderError Enum

**파일**: `backend/app/schemas/video_timeline.py`

```python
class RenderMode(str, Enum):
    MOCK = "mock"
    REAL = "real"

class VideoRenderError(str, Enum):
    IMAGE_SAFETY_BLOCKED = "image_safety_blocked"
    VIDEO_PROVIDER_TIMEOUT = "video_provider_timeout"
    COST_LIMIT_EXCEEDED = "cost_limit_exceeded"
    INVALID_MOTION_PROMPT = "invalid_motion_prompt"
    PROVIDER_RATE_LIMITED = "provider_rate_limited"
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    # ... (총 15개 에러 코드)
```

### 2.4 RENDER_QUEUED 상태

**파일**: `backend/app/schemas/video_timeline.py`

```python
class VideoProjectStatus(str, Enum):
    # ...
    RENDER_QUEUED = "render_queued"  # 렌더 대기열에 추가됨
    RENDERING = "rendering"
```

### 2.5 VideoJob DB 모델

**파일**: `backend/app/models/video_job.py`

```python
class VideoJob(Base):
    __tablename__ = "video_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True)
    status = Column(String(50))
    render_mode = Column(String(10))
    estimated_cost = Column(Float)
    actual_cost = Column(Float)
    cost_breakdown = Column(JSONB)
    provider_job_ids = Column(JSONB)
    error_code = Column(String(50))
    error_message = Column(Text)
    # ...

class VideoDailyCost(Base):
    __tablename__ = "video_daily_costs"
    # 일일 비용 추적
```

### 2.6 Cost Guard 서비스

**파일**: `backend/app/services/video/cost_guard.py`

```python
class VideoCostGuard:
    def validate_render_mode(self, requested_mode: RenderMode)
    def estimate_cost(self, plan_draft, render_mode, provider)
    async def get_daily_cost(self, brand_id, user_id)
    async def check_cost_limit(self, plan_draft, render_mode, ...)
```

---

## 3. 파일 변경 내역

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `backend/app/core/config.py` | 수정 | 환경변수 3개 추가 |
| `backend/app/schemas/video_timeline.py` | 수정 | RenderMode, VideoRenderError enum 추가, VideoRenderRequest 확장 |
| `backend/app/models/video_job.py` | 신규 | VideoJob, VideoDailyCost 모델 |
| `backend/app/models/__init__.py` | 수정 | VideoJob, VideoDailyCost export |
| `backend/app/services/video/__init__.py` | 신규 | video 서비스 패키지 초기화 |
| `backend/app/services/video/cost_guard.py` | 신규 | Cost Guard 서비스 |

---

## 4. 남은 작업

### 4.1 Alembic 마이그레이션 (P1)

`video_jobs`, `video_daily_costs` 테이블 생성을 위한 마이그레이션 필요:

```bash
cd backend
alembic revision --autogenerate -m "Add video_jobs and video_daily_costs tables"
alembic upgrade head
```

### 4.2 Cost Guard 통합 (P1)

VideoDirector의 render 엔드포인트에 Cost Guard 체크 로직 통합 필요:

```python
# video_pipeline.py endpoint
from app.services.video import get_cost_guard

@router.post("/{project_id}/render")
async def render_video(request: VideoRenderRequest):
    cost_guard = get_cost_guard()

    # 1. Cost Guard 체크
    check_result = await cost_guard.check_cost_limit(
        plan_draft=request.plan_draft,
        render_mode=request.render_mode,
    )

    if not check_result.allowed:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": check_result.error_code,
                "message": check_result.error_message,
            }
        )

    # 2. dry_run 처리
    if request.dry_run:
        return VideoRenderResponse(
            job_id="dry_run",
            status=VideoProjectStatus.RENDER_QUEUED,
            render_mode=request.render_mode,
            dry_run=True,
            estimated_cost=check_result.estimated_cost,
            ...
        )

    # 3. 실제 렌더 시작
    ...
```

---

## 5. 테스트 체크리스트

- [ ] `RenderMode.MOCK` 요청 시 무료로 처리
- [ ] `RenderMode.REAL` + `VIDEO_ALLOW_REAL=false` 시 거부
- [ ] `dry_run=True` 시 비용만 계산하고 렌더하지 않음
- [ ] 일일 비용 한도 초과 시 `COST_LIMIT_EXCEEDED` 에러
- [ ] VideoJob 생성 및 상태 추적
- [ ] Provider fallback (Veo → Luma → Runway)

---

## 6. 환경변수 설정 가이드

`.env` 파일에 추가:

```env
# Video Render Mode Control
VIDEO_ALLOW_REAL=false          # 실제 AI 영상 생성 허용 (true/false)
VIDEO_DEFAULT_MODE=mock         # 기본 렌더 모드 (mock/real)
RENDER_DAILY_COST_LIMIT=100.0   # 일일 비용 한도 ($)
```

**주의**: 프로덕션 환경에서 `VIDEO_ALLOW_REAL=true` 설정 시 실제 비용이 발생합니다.

---

**문서 작성 완료**: 2025-12-01
**다음 단계**: Alembic 마이그레이션 실행 및 Cost Guard 통합
