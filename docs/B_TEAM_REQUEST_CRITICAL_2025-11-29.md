# B팀 긴급 요청서: VisionGenerator → NanoBanana 호출 체인 단절

**작성일**: 2025-11-29 16:00
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Critical Blocking)
**상태**: 긴급 조치 필요

---

## 핵심 문제

**VisionGenerator가 NanoBanana를 실제로 호출하지 않음**

백엔드 코드에 로그가 추가되어 있지만, VisionGenerator가 이미지 생성 로직을 실행하지 않고 즉시 빈 결과를 반환합니다.

---

## 증거

### 1. 출력되는 로그 (컨테이너에서 실제 확인됨)

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

### 2. 출력되지 않는 로그 (코드에 있지만 실행 안 됨)

```
[VideoDirector] Scenes to generate: X         ← 이 로그 없음
[VideoDirector] Starting VisionGenerator...   ← 이 로그 없음
[NanoBanana] Original prompt: ...             ← 이 로그 없음
[NanoBanana] Cleaned prompt: ...              ← 이 로그 없음
```

### 3. 컨테이너 내부 코드 확인

```bash
docker exec sparklio-backend grep -n "NanoBanana" /app/app/services/providers/nanobanana_provider.py
```

- 코드는 존재함
- Safety Settings 완화 및 브랜드명 제거 로직 추가됨
- **하지만 로그가 전혀 출력되지 않음 = 호출되지 않음**

---

## 원인 분석

### 가설 1: `scenes_to_generate` 리스트가 비어있음

```python
# _prepare_images_v3 내부
scenes_to_generate = [s for s in input_data.plan.scenes if s.generate_new_image]
if not scenes_to_generate:
    return {}  # 빈 리스트면 바로 반환
```

**가능성**: PLAN에서 생성된 씬들의 `generate_new_image` 플래그가 `False`로 설정되어 있을 수 있음

### 가설 2: VisionGenerator 인스턴스화 실패

```python
# VisionGenerator 생성 시 예외 발생 가능
vision_generator = VisionGeneratorAgent(...)  # 여기서 실패?
```

### 가설 3: 코드 경로 불일치

`_prepare_images_v3`가 아닌 다른 함수가 호출되고 있을 가능성

---

## 요청 사항

### 1. 즉시 확인 필요

```python
# _prepare_images_v3 시작 부분에 추가
async def _prepare_images_v3(self, input_data: VideoDirectorInputV3) -> Dict[int, str]:
    print(f"!!! _prepare_images_v3 CALLED !!!")
    print(f"!!! generation_mode={input_data.generation_mode} !!!")

    # 👇 이 로그 추가 필요
    scenes_to_generate = [s for s in input_data.plan.scenes if s.generate_new_image]
    print(f"!!! scenes_to_generate count: {len(scenes_to_generate)} !!!")
    for scene in scenes_to_generate:
        print(f"!!!   Scene {scene.scene_index}: generate_new_image={scene.generate_new_image} !!!")
```

### 2. PLAN 결과 검증

PLAN API 응답에서 각 씬의 `generate_new_image` 값을 확인:

```json
{
  "scenes": [
    {"scene_index": 1, "generate_new_image": true},   // 이 값이 true인지?
    {"scene_index": 2, "generate_new_image": true},
    ...
  ]
}
```

### 3. VisionGenerator 호출 로그 추가

```python
# _prepare_images_v3 내부
if scenes_to_generate:
    print(f"!!! About to call VisionGenerator for {len(scenes_to_generate)} scenes !!!")
    try:
        vision_generator = VisionGeneratorAgent(...)
        print(f"!!! VisionGenerator created successfully !!!")
        result = await vision_generator.generate(...)
        print(f"!!! VisionGenerator returned: {result} !!!")
    except Exception as e:
        print(f"!!! VisionGenerator FAILED: {e} !!!")
        import traceback
        traceback.print_exc()
```

---

## 테스트 방법

```bash
# 1. 로그 추가 후 Docker 재시작
docker compose -f docker-compose.yml restart backend

# 2. 실시간 로그 모니터링
docker logs -f sparklio-backend 2>&1 | grep -E "!!!|VisionGenerator|NanoBanana|scenes_to_generate"

# 3. 프론트엔드에서 CREATIVE 모드로 테스트
```

---

## 프론트엔드 임시 조치 완료

C팀에서 완료한 임시 조치:

1. ✅ MinIO URL 변환 함수 (`minio:9000` → `100.123.51.5:9000`)
2. ✅ Presigned URL 서명 제거 (public bucket 설정됨)
3. ✅ 비디오 플레이어 작동 확인 (placeholder 비디오는 재생됨)

**남은 문제**: 백엔드에서 실제 이미지를 생성해야 함

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 Project ID**: vp_a9562678 (최신)
- **Frontend**: Windows Laptop (localhost:3001)
- **Backend**: Mac mini (100.123.51.5:8000)
