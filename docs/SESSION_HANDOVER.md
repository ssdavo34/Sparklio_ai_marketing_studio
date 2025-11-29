# 세션 인수인계 (2025-11-30 10:40 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `bb3f097` - Video Pipeline V2 + project_outputs
- **Mac Mini 배포**: ✅ 완료
- **서버 상태**: ✅ healthy

---

## 오늘 완료한 작업 (2025-11-30)

### P0 (이전 세션)
- 3종 URL 저장 시스템 (`original_url`, `preview_url`, `thumb_url`)
- Alembic 마이그레이션 `2025_11_30_asset_urls`

### P1 Backend (B팀)
1. **Video Pipeline V2 백엔드**
   - `VideoTimelinePlanV1`, `VideoPlanDraftV1` 스키마
   - `VideoDirector V3` (PLAN/RENDER 모드)
   - `VideoBuilder V2` (Ken Burns, transitions, xfade)
   - `/api/v1/video6/*` 엔드포인트

2. **project_outputs 테이블**
   - `ProjectOutput` 모델
   - Alembic 마이그레이션 `2025_11_30_project_outputs`

3. **레거시 에셋 리사이즈 스크립트**
   - `scripts/migrate_asset_thumbnails.py`

### P1 Frontend (C팀)
1. **Video6 컴포넌트**
   - `Video6Modal.tsx` - Canva 스타일 전체 화면 모달
   - `Video6Panel.tsx` - 6장 패널 UI
   - `useVideo6.ts` - 상태 관리 훅
   - `video-pipeline-api.ts` - API 클라이언트

2. **ActivityBar 연결**
   - 하단 Video 아이콘 버튼 추가
   - `useVideo6ModalStore.ts` - 모달 상태 관리

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|------|------|------|
| Alembic multiple heads | ⚠️ 존재 | `demo_20251126`과 `2025_11_30_project_outputs` 두 head |
| Video6 In-Memory Storage | ⚠️ MVP | 추후 DB로 이관 필요 |

---

## 다음 작업 우선순위

### P0 (Critical)
1. **E2E 테스트**: Video Pipeline V2 전체 플로우 테스트
   - 프로젝트 생성 → PLAN → 수정 → RENDER → 다운로드

### P1 (High)
2. **Video6 DB 저장**: In-Memory → project_outputs 테이블 연동
3. **레거시 에셋 마이그레이션**: `migrate_asset_thumbnails.py` 실행
4. **Ken Burns 효과 튜닝**: FFmpeg zoompan 파라미터 최적화

### P2 (Medium)
5. **BGM 라이브러리**: 무료/라이센스 BGM 수집 및 연동
6. **프리셋 템플릿**: 영상 스타일 프리셋 추가 (corporate, playful, minimal)
7. **썸네일 자동 생성**: 영상 완료 후 자동 썸네일

### P3 (Low)
8. **Video Analytics**: 생성 시간, 성공률 등 통계
9. **Batch Export**: 여러 영상 일괄 내보내기

---

## 주요 파일 위치

| 파일 | 용도 |
|------|------|
| `backend/app/schemas/video_timeline.py` | Video Pipeline V2 스키마 |
| `backend/app/services/agents/video_director.py` | VideoDirector V3 |
| `backend/app/services/video_builder_v2.py` | VideoBuilder V2 (FFmpeg) |
| `backend/app/api/v1/endpoints/video_pipeline.py` | `/api/v1/video6/*` |
| `backend/app/models/project_output.py` | ProjectOutput 모델 |
| `frontend/components/video6/` | Video6 컴포넌트 |
| `frontend/hooks/useVideo6.ts` | Video6 상태 관리 |

---

## 중요 명령어

```bash
# Mac Mini 배포
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

# Alembic 마이그레이션 (특정 revision)
ssh woosun@100.123.51.5 "/usr/local/bin/docker exec sparklio-backend alembic upgrade 2025_11_30_project_outputs"

# 레거시 에셋 마이그레이션 (dry-run)
ssh woosun@100.123.51.5 "/usr/local/bin/docker exec sparklio-backend python scripts/migrate_asset_thumbnails.py --dry-run"

# Video6 API 테스트
curl http://100.123.51.5:8000/api/v1/video6/test/status
```

---

**마지막 업데이트**: 2025-11-30 10:40 by B팀
