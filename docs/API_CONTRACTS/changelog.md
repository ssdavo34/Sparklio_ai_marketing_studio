# API Contracts 변경 이력

**최초 작성**: 2025-11-14 (금요일) 16:00
**관리자**: Team A

---

## 2025-11-14 (금요일) 16:00
- **변경 파일**: `README.md`, `changelog.md`
- **변경 내용**: API Contracts 디렉토리 최초 생성
- **담당자**: Team A
- **영향 범위**: 전체 팀 - API 계약서 작성 규칙 확립
- **Breaking Change**: 없음

---

## 2025-11-14 (금요일) 17:55
- **변경 파일**: `video_pipeline.json`, `comfyui.json`
- **변경 내용**: Video Pipeline 및 ComfyUI Integration API 계약서 추가
- **담당자**: Team A
- **세부 내역**:
  - **video_pipeline.json**: 4개 엔드포인트 정의
    - `POST /video/storyboard`: 스토리보드 생성 (Qwen 14B)
    - `POST /video/images`: 씬 이미지 생성 (ComfyUI + SDXL + Brand LoRA)
    - `POST /video/motion`: 모션 클립 생성 (AnimateDiff)
    - `POST /video/assemble`: 최종 영상 조립 (FFmpeg)
    - `GET /video/status/{jobId}`: 작업 상태 조회
  - **comfyui.json**: ComfyUI 서버 통신 API 정의
    - Core API: `/prompt`, `/history`, `/view`, `/queue`
    - Sparklio Extension API:
      - `/sparklio/generate/ad-image`: 광고 이미지 생성
      - `/sparklio/generate/motion-clip`: 모션 클립 생성
      - `/sparklio/lora/train`: Brand LoRA 학습
      - `/sparklio/lora/list`: LoRA 모델 목록
      - `/sparklio/workflows/templates`: 워크플로우 템플릿
    - System API: `/system/health`
- **영향 범위**:
  - Team B: Backend 구현 시 이 계약서 참조
  - Team C: Frontend에서 이 API 호출 구현
- **Breaking Change**: 없음 (신규 API)
- **참조 문서**:
  - `docs/PHASE0/VIDEO_PIPELINE_SPEC.md`
  - `docs/PHASE0/COMFYUI_INTEGRATION.md`

---

**향후 모든 API 변경은 이 파일에 기록됩니다.**
