# B팀 → C팀 요청서: Video Pipeline 4단계 확인 플로우 UI

**작성일**: 2025-12-01
**작성자**: B팀 (Backend)
**우선순위**: P1
**상태**: 신규 요청

---

## 1. 요청 개요

Video Pipeline API가 4단계 확인 플로우로 업데이트되었습니다. 프론트엔드 UI에서 이 플로우를 지원해야 합니다.

### 4단계 확인 플로우

```
Step 1: 스크립트 → 유저 확인/수정 → 승인
Step 2: 이미지 생성 → 유저 확인/수정/재생성 → 승인
Step 3: 모션 프롬프트 → 유저 확인/수정 → 승인
Step 4: 렌더링 (비용 발생)
```

---

## 2. API 변경 사항

### 2.1 새로운 상태값 (VideoProjectStatus)

```typescript
type VideoProjectStatus =
  | "not_started"
  | "planning"
  | "script_ready"        // Step 1 완료
  | "script_approved"     // Step 1 승인
  | "generating_images"
  | "images_ready"        // Step 2 완료
  | "images_approved"     // Step 2 승인
  | "generating_motion"
  | "motion_ready"        // Step 3 완료
  | "motion_approved"     // Step 3 승인
  | "render_queued"       // Step 4 대기
  | "rendering"           // Step 4 진행
  | "completed"
  | "failed";
```

### 2.2 VideoRenderRequest 변경

```typescript
interface VideoRenderRequest {
  plan_draft: VideoPlanDraftV1;
  render_mode: "mock" | "real";  // 신규 - 기본값: "mock"
  dry_run: boolean;              // 신규 - 기본값: false
}
```

### 2.3 VideoRenderResponse 변경

```typescript
interface VideoRenderResponse {
  job_id: string;
  status: VideoProjectStatus;
  render_mode: "mock" | "real";     // 신규
  estimated_time_sec?: number;
  estimated_cost?: number;           // 신규 - 달러
  dry_run: boolean;                  // 신규
  cost_breakdown?: Record<string, number>;  // 신규 - {"veo": 0.5, ...}
  daily_cost_used?: number;          // 신규 - 오늘 사용한 비용
  daily_cost_limit?: number;         // 신규 - 일일 한도
}
```

### 2.4 새로운 에러 코드

```typescript
type VideoRenderError =
  | "image_safety_blocked"
  | "video_provider_timeout"
  | "cost_limit_exceeded"        // 일일 비용 한도 초과
  | "credit_insufficient"
  | "provider_rate_limited"
  | "provider_unavailable"
  | "invalid_motion_prompt"
  | "missing_images"
  | "missing_motion_prompt"
  | "internal_error";
```

---

## 3. UI 요구사항

### 3.1 Step Progress Indicator

각 단계의 진행 상황을 보여주는 UI:

```
[✓] 스크립트  →  [○] 이미지  →  [ ] 모션  →  [ ] 렌더
```

### 3.2 Step 1: 스크립트 확인/수정

- 상태: `script_ready`
- 씬별 스크립트, 자막 편집 가능
- "승인" 버튼 → `POST /api/v1/video6/{id}/script/approve`

### 3.3 Step 2: 이미지 확인/수정/재생성

- 상태: `images_ready`
- 각 이미지 승인/거부 토글
- 거부 시 재생성 사유 입력
- "재생성" 버튼 → `POST /api/v1/video6/{id}/images/regenerate`
- "승인" 버튼 → `POST /api/v1/video6/{id}/images/approve`

### 3.4 Step 3: 모션 프롬프트 확인/수정

- 상태: `motion_ready`
- 각 씬의 모션 프롬프트 표시 (영문 + 한글)
- 직접 수정 가능
- "승인" 버튼 → `POST /api/v1/video6/{id}/motion/approve`

### 3.5 Step 4: 렌더 비용 확인 및 실행

- **중요**: 렌더 전 비용 확인 UI
- `dry_run=true`로 먼저 비용 확인
- 표시 항목:
  - 예상 비용 (estimated_cost)
  - 일일 사용량 (daily_cost_used / daily_cost_limit)
  - 비용 내역 (cost_breakdown)
- 렌더 모드 선택:
  - Mock (무료, 테스트용)
  - Real (유료, 실제 AI 영상)
- "렌더 시작" 버튼 → `POST /api/v1/video6/{id}/render`

### 3.6 에러 처리

`cost_limit_exceeded` 에러 시:
```
일일 비용 한도를 초과했습니다.
현재 사용: $45.00 / 한도: $100.00
내일 다시 시도하거나 관리자에게 문의하세요.
```

---

## 4. API 엔드포인트 목록

| 엔드포인트 | 메소드 | 설명 |
|-----------|--------|------|
| `/api/v1/video6/projects` | POST | 프로젝트 생성 |
| `/api/v1/video6/{id}/plan` | POST | Step 1 실행 |
| `/api/v1/video6/{id}/script/approve` | POST | Step 1 승인 |
| `/api/v1/video6/{id}/images/generate` | POST | Step 2 실행 |
| `/api/v1/video6/{id}/images/approve` | POST | Step 2 승인 |
| `/api/v1/video6/{id}/images/regenerate` | POST | 이미지 재생성 |
| `/api/v1/video6/{id}/motion/generate` | POST | Step 3 실행 |
| `/api/v1/video6/{id}/motion/approve` | POST | Step 3 승인 |
| `/api/v1/video6/{id}/motion/regenerate` | POST | 모션 재생성 |
| `/api/v1/video6/{id}/render` | POST | Step 4 실행 |
| `/api/v1/video6/{id}/status` | GET | 상태 조회 |

---

## 5. TypeScript 타입 정의

```typescript
// frontend/lib/types/video-pipeline.ts

export type RenderMode = "mock" | "real";

export interface SceneDraft {
  scene_index: number;
  image_id?: string;
  image_url?: string;
  image_approval_status: "pending" | "generated" | "approved" | "rejected" | "regenerating";
  caption: string;
  script?: string;
  duration_sec: number;
  generate_new_image: boolean;
  image_prompt?: string;
  motion_prompt?: string;
  motion_prompt_ko?: string;
  use_ai_video: boolean;
  regenerate_reason?: string;
  generation_attempts: number;
}

export interface VideoPlanDraft {
  version: string;
  project_id: string;
  mode: "reuse" | "hybrid" | "creative";
  total_duration_sec: number;
  music_mood: string;
  scenes: SceneDraft[];
  script_status: "draft" | "user_edited" | "approved";
}

export interface VideoRenderRequest {
  plan_draft: VideoPlanDraft;
  render_mode: RenderMode;
  dry_run: boolean;
}

export interface VideoRenderResponse {
  job_id: string;
  status: VideoProjectStatus;
  render_mode: RenderMode;
  estimated_time_sec?: number;
  estimated_cost?: number;
  dry_run: boolean;
  cost_breakdown?: Record<string, number>;
  daily_cost_used?: number;
  daily_cost_limit?: number;
}

export interface CostGuardError {
  error_code: string;
  message: string;
  daily_cost_used: number;
  daily_cost_limit: number;
}
```

---

## 6. 참고 문서

- [VIDEO_PIPELINE_GAP_ANALYSIS.md](../../docs/VIDEO_PIPELINE_GAP_ANALYSIS.md) - GAP 분석 보고서
- [video_timeline.py](../../backend/app/schemas/video_timeline.py) - 스키마 정의
- [cost_guard.py](../../backend/app/services/video/cost_guard.py) - 비용 제어 서비스

---

## 7. 테스트 시나리오

### 7.1 정상 플로우
1. 프로젝트 생성
2. PLAN 실행 → `script_ready`
3. 스크립트 수정 → 승인 → `script_approved`
4. 이미지 생성 → `images_ready`
5. 이미지 확인 → 승인 → `images_approved`
6. 모션 생성 → `motion_ready`
7. 모션 확인 → 승인 → `motion_approved`
8. dry_run으로 비용 확인
9. render_mode="mock"으로 렌더 시작
10. `completed`

### 7.2 재생성 플로우
- Step 2에서 이미지 거부 → 재생성 요청 → 다시 확인
- Step 3에서 모션 수정 → 저장

### 7.3 에러 플로우
- `render_mode="real"` + `VIDEO_ALLOW_REAL=false` → 거부
- 일일 비용 한도 초과 → `cost_limit_exceeded`

---

## 8. 질문 사항

1. Step Progress UI 디자인 가이드가 있나요?
2. 비용 표시 형식 (달러? 원화?)
3. 모션 프롬프트 편집 UI - 텍스트박스 vs 슬라이더?

---

**문서 작성 완료**: 2025-12-01
**담당 요청**: C팀 (Frontend)
