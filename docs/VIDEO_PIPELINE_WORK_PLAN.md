# Video Pipeline V2 작업 계획

**작성일**: 2025-11-29
**참여 팀**: B팀 (Backend), C팀 (Frontend)
**E2E 테스트**: 유저와 함께 진행

---

## 작업 흐름 다이어그램

```
Phase 1 (B팀 단독)
    │
    ├── 스키마 파일 생성
    ├── VideoDirector PLAN/RENDER 분기
    └── API 엔드포인트 생성
            │
            ▼
Phase 2 (B팀 → C팀 직렬)
    │
    ├── [B팀] VideoBuilder MVP
    │       │
    │       ▼ (B팀 완료 후)
    └── [C팀] 모드 선택 UI + Asset Pool 연동
                │
                ▼
Phase 3 (B팀, C팀 병렬)
    │
    ├── [B팀] Ken Burns, 전환, 자막, BGM
    │         (독립적, API 변경 없음)
    │
    └── [C팀] PLAN UI, 이미지 선택, 플레이어
              (독립적, 기존 API 사용)
                │
                ▼
Phase 4 (유저와 함께)
    │
    ├── E2E 통합 테스트
    └── 실제 영상 생성 테스트
```

---

## Phase 1: 기반 작업 (B팀 단독)

> **C팀 대기**: Phase 1 완료 전까지 C팀은 다른 작업 진행

| 순서 | 작업 | 담당 | 의존성 | 예상 산출물 |
|------|------|------|--------|-------------|
| 1-1 | VideoTimelinePlanV1, VideoPlanDraftV1 스키마 | B팀 | 없음 | `backend/app/schemas/video_timeline.py` |
| 1-2 | VideoDirector PLAN/RENDER 분기 | B팀 | 1-1 | `video_director.py` 수정 |
| 1-3 | /plan, /render, /status API | B팀 | 1-2 | `backend/app/api/v1/video6.py` |

**Phase 1 완료 조건:**
- [ ] `POST /api/v1/video6/projects` 동작
- [ ] `POST /api/v1/video6/{id}/plan` → VideoPlanDraftV1 반환
- [ ] `GET /api/v1/video6/{id}/assets` → Asset Pool 조회

---

## Phase 2: MVP 구현 (직렬 - B팀 선행)

> **충돌 방지**: B팀이 API 스펙을 확정한 후 C팀이 연동

### Phase 2-B: Backend MVP (B팀)

| 순서 | 작업 | 담당 | 의존성 | 비고 |
|------|------|------|--------|------|
| 2-B-1 | VideoBuilder MVP | B팀 | Phase 1 | cut 전환, 고정 이미지, 단순 BGM |
| 2-B-2 | StoryboardBuilder available_assets 확장 | B팀 | 2-B-1 | 이미지 선택 로직 |

**Phase 2-B 완료 조건:**
- [ ] `POST /api/v1/video6/{id}/render` → mp4 URL 반환
- [ ] 3~6개 이미지 → 15~30초 영상 생성 가능

### Phase 2-C: Frontend 기초 연동 (C팀) - B팀 Phase 2-B 완료 후

| 순서 | 작업 | 담당 | 의존성 | 비고 |
|------|------|------|--------|------|
| 2-C-1 | 모드 선택 세그먼트 UI | C팀 | Phase 2-B | REUSE/HYBRID/CREATIVE 3버튼 |
| 2-C-2 | Asset Pool 조회 API 연동 | C팀 | Phase 2-B | 기존 이미지 목록 표시 |
| 2-C-3 | /plan 호출 + 결과 표시 | C팀 | Phase 2-B | 기본 스크립트 확인 |

**Phase 2-C 완료 조건:**
- [ ] 유저가 3가지 모드 중 선택 가능
- [ ] Asset Pool에서 이미지 목록 조회 가능
- [ ] /plan 호출 시 스크립트 초안 표시

---

## Phase 3: 기능 확장 (병렬 작업 가능)

> **병렬 가능 이유**: B팀은 VideoBuilder 내부 개선, C팀은 UI 작업으로 충돌 없음

### Phase 3-B: VideoBuilder 고도화 (B팀)

| 순서 | 작업 | 담당 | 의존성 | 비고 |
|------|------|------|--------|------|
| 3-B-1 | Ken Burns 효과 | B팀 | Phase 2-B | zoompan filter |
| 3-B-2 | xfade 전환 효과 2~3종 | B팀 | Phase 2-B | crossfade, slide_left, slide_up |
| 3-B-3 | 자막 레이어 애니메이션 | B팀 | Phase 2-B | drawtext + alpha |
| 3-B-4 | BGM 라우드니스 보정 | B팀 | Phase 2-B | loudnorm filter |

**Phase 3-B 완료 조건:**
- [ ] Ken Burns 효과가 적용된 영상 생성 가능
- [ ] 전환 효과 선택 가능
- [ ] 자막이 fade in/out으로 표시
- [ ] BGM 볼륨이 일정하게 정규화

### Phase 3-C: UI 고도화 (C팀) - 병렬 진행

| 순서 | 작업 | 담당 | 의존성 | 비고 |
|------|------|------|--------|------|
| 3-C-1 | PLAN 결과 확인/수정 UI | C팀 | Phase 2-C | 씬 리스트, 캡션 수정 |
| 3-C-2 | 이미지 선택 그리드 UI | C팀 | Phase 2-C | 드래그앤드롭, 순서 변경 |
| 3-C-3 | 렌더링 상태 표시 + 결과 플레이어 | C팀 | Phase 2-C | 진행률, 비디오 플레이어 |

**Phase 3-C 완료 조건:**
- [ ] 유저가 씬 순서/캡션 수정 가능
- [ ] 이미지 드래그앤드롭으로 씬에 배치 가능
- [ ] 렌더링 진행률 표시 + 완료 시 재생 가능

---

## Phase 4: E2E 테스트 (유저와 함께)

> **Phase 3 B+C 모두 완료 후 진행**

| 순서 | 작업 | 담당 | 시나리오 |
|------|------|------|----------|
| 4-1 | E2E 통합 테스트 | 유저 + B팀 + C팀 | 전체 플로우 검증 |
| 4-2 | 실제 영상 생성 테스트 | 유저 + B팀 | 다양한 이미지/옵션 조합 |
| 4-3 | 골든셋 정의 | 유저 | 카페/제품/일상 3종 |

### 테스트 시나리오

**시나리오 1: REUSE 모드**
```
1. 기존 프레젠테이션에서 이미지 4장 선택
2. 모드: REUSE 선택
3. /plan 호출 → 스크립트 확인
4. /render 호출 → 영상 생성
5. 결과 영상 확인
```

**시나리오 2: HYBRID 모드**
```
1. 기존 이미지 2장 선택 + 신규 2장 생성 요청
2. 모드: HYBRID 선택
3. /plan 호출 → 스크립트 + 이미지 프롬프트 확인
4. /render 호출 → 이미지 생성 + 영상 생성
5. 결과 영상 확인
```

---

## 충돌 방지 가이드

### 파일별 담당 팀

| 파일/폴더 | 담당 | 비고 |
|-----------|------|------|
| `backend/app/schemas/video_timeline.py` | B팀 | 신규 생성 |
| `backend/app/api/v1/video6.py` | B팀 | 신규 생성 |
| `backend/app/services/agents/video_*.py` | B팀 | 수정 |
| `frontend/components/video6/` | C팀 | 신규 폴더 |
| `frontend/hooks/useVideo6.ts` | C팀 | 신규 생성 |

### 인터페이스 변경 시 커뮤니케이션

1. **B팀이 API 스펙 변경 시**:
   - `docs/VIDEO_PIPELINE_DESIGN_V2.md` 업데이트
   - C팀에게 Slack/PR로 알림

2. **C팀이 요청사항 있을 시**:
   - `frontend/docs/C_TEAM_REQUEST_*.md` 작성
   - B팀에게 Slack/PR로 알림

---

## 일정 체크포인트

| 체크포인트 | 완료 조건 | 담당 |
|-----------|----------|------|
| CP1 | Phase 1 완료 (API 스펙 확정) | B팀 |
| CP2 | Phase 2 완료 (MVP 동작) | B팀 → C팀 |
| CP3 | Phase 3 완료 (기능 확장) | B팀, C팀 병렬 |
| CP4 | Phase 4 완료 (E2E 통과) | 유저 + 양팀 |

---

## 빠른 참조

### B팀 명령어
```bash
# 로컬 백엔드 실행
cd backend && uvicorn app.main:app --reload --port 8001

# API 테스트
curl http://localhost:8001/api/v1/video6/health
```

### C팀 명령어
```bash
# 프론트엔드 실행
cd frontend && npm run dev

# 타입 체크
npm run typecheck
```

---

**문서 끝**

마지막 업데이트: 2025-11-29 by B팀
