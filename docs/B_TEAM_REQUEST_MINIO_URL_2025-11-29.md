# B팀 요청서: MinIO URL 외부 접근 불가 문제

**작성일**: 2025-11-29 14:35
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Blocking)
**상태**: 대기중

---

## 문제 요약

RENDER 완료 후 반환되는 비디오 URL이 **Docker 내부 호스트명**을 사용하여 브라우저에서 접근 불가.

---

## 에러 상세

### 브라우저 콘솔
```
GET http://minio:9000/dev-sparklio-assets/video/vb_8e10fc4a/output-b...
net::ERR_NAME_NOT_RESOLVED
```

### 반환된 URL (잘못됨)
```
http://minio:9000/dev-sparklio-assets/video/vb_8e10fc4a/output.mp4
```

### 필요한 URL (올바름)
```
http://100.123.51.5:9000/dev-sparklio-assets/video/vb_8e10fc4a/output.mp4
```

---

## 원인

Docker 컨테이너 환경변수:
```
MINIO_ENDPOINT=minio:9000  # Docker 내부 호스트명
```

백엔드가 이 값을 그대로 URL에 사용하여 반환.

---

## 해결 방안

### 방법 1: Public URL 환경변수 추가 (권장)

```bash
# docker/mac-mini/.env 또는 docker-compose.yml
MINIO_ENDPOINT=minio:9000           # 내부 통신용 (기존 유지)
MINIO_PUBLIC_URL=http://100.123.51.5:9000  # 외부 접근용 (추가)
```

백엔드 코드에서:
```python
# URL 반환 시
internal_url = f"http://{MINIO_ENDPOINT}/bucket/file.mp4"
public_url = internal_url.replace(f"http://{MINIO_ENDPOINT}", MINIO_PUBLIC_URL)
return public_url
```

### 방법 2: VideoBuilder에서 URL 변환

```python
# video_builder.py
def _get_public_url(self, internal_url: str) -> str:
    """Docker 내부 URL을 외부 접근 가능 URL로 변환"""
    return internal_url.replace("minio:9000", "100.123.51.5:9000")
```

---

## 테스트 환경

- **Project ID**: vp_db032378
- **Video URL (현재)**: `http://minio:9000/dev-sparklio-assets/video/vb_8e10fc4a/output...`
- **브라우저**: Windows Laptop (localhost:3001)
- **MinIO 서버**: Mac mini (100.123.51.5:9000)

---

## 진행 상황

| 단계 | 상태 | 비고 |
|------|------|------|
| 프로젝트 생성 | ✅ | 정상 |
| PLAN 모드 | ✅ | 6개 씬 생성 |
| RENDER 모드 | ✅ | 비디오 생성 완료 |
| 비디오 재생 | ❌ | URL 호스트명 문제 |

---

## 참고

MinIO 외부 접근 테스트:
```bash
# Mac mini에서 직접 확인
curl -I http://100.123.51.5:9000/dev-sparklio-assets/video/vb_8e10fc4a/output.mp4
```

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **환경**: Windows Laptop → Mac mini (100.123.51.5)
