# B팀 요청서: 디버그 로그 미출력 문제 분석 (V4)

**작성일**: 2025-11-29 14:20
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Blocking)
**상태**: 분석 필요
**관련 이슈**: V1~V3 요청서의 후속

---

## 문제 요약

B팀이 추가한 디버그 로그가 **전혀 출력되지 않음**.
코드에는 로그가 존재하지만, 실제 실행 시 해당 로그가 나타나지 않음.

---

## 상세 분석

### 코드에 존재하는 로그 (확인됨)

```python
# video_director.py - _prepare_images_v3 함수 (line 853)
logger.info(f"[VideoDirector] _prepare_images_v3: generation_mode={input_data.generation_mode}")

# line 872
logger.info(f"[VideoDirector] Scenes to generate: {len(scenes_to_generate)}")

# line 876
logger.info(f"[VideoDirector] Starting VisionGenerator for {len(scenes_to_generate)} scenes")
```

### 실제 출력되는 로그

```
[VideoDirector] No image for scene 1
[VideoDirector] No image for scene 2
[VideoDirector] No image for scene 3
[VideoDirector] No image for scene 4
[VideoDirector] No image for scene 5
[VideoDirector] No image for scene 6
[VideoDirectorAgent] RENDER mode failed: 1 validation error for VideoTimelinePlanV1
```

### 누락된 로그 (출력되어야 하지만 안 됨)

```
[VideoDirectorAgent] RENDER mode: generating video  (line 689)
[VideoDirector] _prepare_images_v3: generation_mode=...  (line 853)
[VideoDirector] Scenes to generate: ...  (line 872)
```

---

## 의문점

### 1. 코드 경로 불일치?

`[VideoDirector] No image for scene X` 로그는 `_plan_draft_to_timeline` 함수에서 나옴 (line 949).
이 함수는 `_execute_render_mode` 안에서 `_prepare_images_v3` **이후에** 호출됨.

**그런데** `_prepare_images_v3`의 시작 로그가 안 나옴.

### 2. 가능한 원인들

1. **Python 바이트코드 캐시**: `.pyc` 파일이 옛날 버전
2. **Docker 볼륨 마운트 문제**: 컨테이너 내부와 호스트 파일 불일치
3. **코드 실행 순서 문제**: 예상과 다른 함수가 호출되고 있음
4. **Logging level**: INFO가 아닌 다른 레벨로 필터링됨

---

## 요청 사항

### 1. Python 캐시 강제 제거

```bash
# 컨테이너 내부에서 .pyc 파일 삭제
docker exec sparklio-backend find /app -name "*.pyc" -delete
docker exec sparklio-backend find /app -name "__pycache__" -type d -exec rm -rf {} +
```

### 2. 로그 레벨 확인

```python
# video_director.py 상단에 추가
import logging
logging.getLogger(__name__).setLevel(logging.DEBUG)
```

### 3. 함수 시작점에 강제 출력

```python
async def _prepare_images_v3(self, input_data: VideoDirectorInputV3) -> Dict[int, str]:
    print(f"!!! _prepare_images_v3 CALLED !!!")  # print는 항상 출력됨
    logger.info(f"[VideoDirector] _prepare_images_v3: generation_mode={input_data.generation_mode}")
    # ...
```

### 4. Docker 재빌드

```bash
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml build --no-cache backend
docker compose -f docker-compose.yml up -d backend
```

---

## 검증 명령어

### 컨테이너 내부 코드 확인

```bash
docker exec sparklio-backend grep -n '_prepare_images_v3' /app/app/services/agents/video_director.py
```

### 실시간 로그 모니터링

```bash
docker logs -f sparklio-backend 2>&1 | grep -E "VideoDirector|_prepare|RENDER"
```

---

## 테스트 정보

- **Project ID**: 새로 생성 필요
- **Mode**: creative
- **현재 상태**: PLAN 성공 → RENDER 실패

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **환경**: Windows Laptop → Mac mini (100.123.51.5:8000)
