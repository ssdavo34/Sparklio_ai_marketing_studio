# B팀 요청서: Video Pipeline V2 최종 이슈 정리

**작성일**: 2025-11-29 15:10
**작성자**: C팀 (Frontend)
**상태**: End-to-End 테스트 완료 (부분 성공)

---

## 테스트 결과 요약

| 단계 | 상태 | 비고 |
|------|------|------|
| 프로젝트 생성 | ✅ 성공 | 201 Created |
| PLAN 모드 | ✅ 성공 | 6개 씬 생성 |
| RENDER 모드 | ⚠️ 부분 성공 | Placeholder 비디오 생성됨 |
| 비디오 재생 | ✅ 성공 | URL 변환 후 정상 재생 |

---

## 해결 필요 이슈

### 1. VisionGenerator 이미지 생성 실패 (P0)

**현상**: 6개 씬 모두 `generate_new_image: true`이지만, 실제 이미지가 생성되지 않음

**백엔드 로그**:
```
!!! _prepare_images_v3 CALLED !!!
!!! generation_mode=VideoGenerationMode.CREATIVE !!!
[VideoDirector] Using placeholder for scene 1
[VideoDirector] No image for scene 2
[VideoDirector] No image for scene 3
[VideoDirector] No image for scene 4
[VideoDirector] No image for scene 5
[VideoDirector] No image for scene 6
```

**결과**: "Scene Placeholder" 텍스트만 있는 3초 비디오 생성

**요청 사항**:
- VisionGenerator가 실제 이미지를 생성하도록 수정
- NanoBanana/DALL-E 연동 확인
- 이미지 생성 실패 시 상세 로그 추가

---

### 2. MinIO URL 외부 접근 문제 (임시 해결됨)

**문제**: 백엔드가 `http://minio:9000/...` (Docker 내부 URL) 반환

**임시 해결**:
- C팀에서 프론트엔드에서 URL 변환 함수 추가
- MinIO 버킷 `dev-sparklio-assets`를 public read로 설정

**영구 해결 필요**:
```python
# 백엔드에서 외부 접근 가능 URL 반환
MINIO_PUBLIC_URL=http://100.123.51.5:9000  # 환경변수 추가
```

---

### 3. 렌더링 진행률 표시 안 됨 (P1)

**현상**: 렌더링 중 progress가 0%에서 바로 100%로 점프

**원인**: `/status` API가 `progress` 필드를 반환하지 않음

**현재 응답**:
```json
{
  "project_id": "vp_xxx",
  "status": "completed",
  "video_url": "..."
  // progress 필드 없음
}
```

**요청 응답**:
```json
{
  "project_id": "vp_xxx",
  "status": "rendering",
  "progress": 45,           // 0-100
  "current_step": "이미지 생성 중 (3/6)",
  "video_url": null
}
```

---

## C팀 완료 사항

1. ✅ Video6 UI 전체 플로우 구현
2. ✅ PLAN/RENDER API 연동
3. ✅ 에러 핸들링 및 "다시 시도" 버튼
4. ✅ MinIO URL 변환 (임시 해결)
5. ✅ 진행률 표시 UI (백엔드 데이터 대기)

---

## 테스트 환경

- **Frontend**: Windows Laptop (localhost:3001)
- **Backend**: Mac mini (100.123.51.5:8000)
- **MinIO**: Mac mini (100.123.51.5:9000)
- **브랜치**: feature/editor-migration-polotno

---

## 다음 단계

1. **B팀**: VisionGenerator 이미지 생성 수정
2. **B팀**: MinIO Public URL 환경변수 추가
3. **B팀**: Status API에 progress 필드 추가
4. **C팀**: 실제 이미지가 있는 비디오 테스트

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 Project ID**: vp_7cb100ea (최신)
