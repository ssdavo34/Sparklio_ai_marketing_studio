# 세션 인수인계 (2025-12-01 23:30 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `2ef188a` - dispatch is not defined 에러 수정 및 자막 표시 개선
- **Mac Mini 배포**: ⏳ 동기화 필요
- **서버 상태**: ✅ healthy

---

## 오늘 완료한 작업 (2025-12-01)

### C팀 - Video6 Pipeline V2 완성 ✅

1. **영상 생성 성공** (38초 ~ 50초 영상)
   - TTS 나레이션 정상 작동 (Backend EdgeTTS)
   - BGM 믹싱 정상 작동 (Pixabay 무료 BGM)
   - 자막과 나레이션 동기화 완료
   - Ken Burns 효과 (zoom_in/out, pan) 적용

2. **dispatch 에러 수정** (`frontend/components/video6/Video6PanelV2.tsx`)
   - **문제**: `dispatch is not defined` - useReducer가 아닌 useState 사용 중
   - **해결**: `localStatus` 상태 추가, `setLocalStatus()`로 대체
   - StepProgressIndicator 업데이트 정상화

3. **자막 표시 개선** (3개 파일)
   - `Video6PanelV2.tsx`: `scene.script || scene.caption` 으로 변경
   - `ImageReviewStep.tsx`: 동일하게 수정
   - `MotionReviewStep.tsx`: 동일하게 수정
   - **결과**: TTS 나레이션과 동일한 긴 자막 표시

4. **이미지 저장/다운로드 기능** (`ImageReviewStep.tsx`)
   - "저장" 버튼 → MinIO에 업로드
   - "다운로드" 버튼 → 로컬 PC에 저장

### 이전 세션 완료 작업 (같은 날)

- Presentation Agent V2 고도화 (B팀)
- Polotno 요소 호환성 수정 (rect → svg 변환)
- PresentationTab 개선

---

## 🟢 완료된 기능 (Video6)

| 기능 | 상태 | 비고 |
|------|------|------|
| 스크립트 생성 (GPT-4o) | ✅ | StoryboardBuilder로 긴 나레이션 생성 |
| 이미지 생성 (ComfyUI) | ✅ | Flux.1 모델 사용 |
| 이미지 생성 (NanoBanana) | ⚠️ | 호출은 되지만 결과 확인 필요 |
| TTS 생성 (EdgeTTS) | ✅ | Backend API 사용 |
| BGM 믹싱 | ✅ | Pixabay 무료 BGM |
| 자막 표시 | ✅ | script 필드 우선 사용 |
| 영상 렌더링 (MediaRecorder) | ✅ | 38초~50초 영상 생성 |
| 영상 저장 (MinIO) | ✅ | Mac mini MinIO에 업로드 |
| Step 진행 표시 | ✅ | localStatus로 수정 |

---

## 🔴 현재 알려진 문제

### 1. Presentation Canvas 연동 ❌
- 프레젠테이션 생성 API 성공, 그러나 Canvas에 표시 안됨
- Pages 패널에 썸네일 안 보임
- Chat ↔ Canvas 연결 안됨

### 2. NanoBanana 이미지 확인 필요
- 콘솔 로그에 `[generateImage] Using NanoBanana` 출력됨
- 실제 생성된 이미지가 ComfyUI와 동일해 보임 → 확인 필요

---

## 내일 작업 우선순위 (2025-12-02)

### P0 (Critical) - 에디터 & 채팅창 메인메뉴/캔버스 연결
1. **에디터 메인메뉴 연결** - 각 에디터(Presentation, Video 등)를 메인 메뉴에서 접근 가능하게
2. **Pages 채팅창 연결** - Chat ↔ Canvas 양방향 연결
3. **VEO3 테스트** - 이미지 → 동영상 변환 테스트

### P1 (High)
4. Presentation Canvas 연동 수정
   - `getPolotnoStore()` → `getCanvasStore('presentation')` 마이그레이션
   - Pages 패널에 썸네일 표시

### P2 (Medium)
5. NanoBanana 실제 이미지 생성 확인
6. 프로젝트 DB와 Asset 연결

---

## 주요 파일 위치

### Video6 Pipeline
| 파일 | 용도 |
|------|------|
| `frontend/components/video6/Video6PanelV2.tsx` | 메인 컴포넌트 (1800+ lines) |
| `frontend/components/video6/steps/ImageReviewStep.tsx` | 이미지 확인 Step |
| `frontend/components/video6/steps/MotionReviewStep.tsx` | 모션 확인 Step |
| `frontend/lib/api/comfyui-api.ts` | ComfyUI/NanoBanana API |
| `backend/app/services/agents/storyboard_builder.py` | 스토리보드 생성 |

### Presentation
| 파일 | 용도 |
|------|------|
| `frontend/lib/canvas/slidesTemplate.ts` | 슬라이드 → Polotno 변환 |
| `frontend/components/canvas-studio/panels/left/tabs/PresentationTab.tsx` | 프레젠테이션 생성 UI |

---

## 저장 위치 안내

- **이미지 저장**: Mac mini MinIO (`http://100.123.51.5:9000`, 버킷: `sparklio-assets`)
- **영상 저장**: Mac mini MinIO 동일
- **MinIO 콘솔**: `http://100.123.51.5:9001`

---

## 중요 명령어

```bash
# Mac Mini 배포
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"

# Backend 재시작
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

# 헬스체크
curl http://100.123.51.5:8000/health
```

---

**마지막 업데이트**: 2025-12-01 23:30 by C팀
