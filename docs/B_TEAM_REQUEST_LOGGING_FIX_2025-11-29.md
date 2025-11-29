# B팀 긴급 요청서: logger.info 출력 안 됨

**작성일**: 2025-11-29 16:30
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Critical)
**상태**: 긴급

---

## 문제

`logger.info()` 로그가 Docker 컨테이너에서 **전혀 출력되지 않음**.

---

## 증거

### 코드에 있는 로그 (출력 안 됨)
```python
# _prepare_images_v3 내부 - 전부 logger.info
logger.info(f"[VideoDirector] === _prepare_images_v3 START ===")
logger.info(f"[VideoDirector] Scene {scene.scene_index}: generate_new_image=...")
logger.info(f"[VideoDirector] Scenes to generate: {len(scenes_to_generate)}")
logger.info(f"[VideoDirector] Starting VisionGenerator...")
```

### 실제 출력되는 로그 (print문만)
```
!!! _prepare_images_v3 CALLED !!!
!!! generation_mode=VideoGenerationMode.CREATIVE !!!
[VideoDirector] Using placeholder for scene 1
[VideoDirector] No image for scene 2~6
```

### PLAN 데이터 확인 (정상)
```json
{
  "scenes": [
    {"scene_index": 1, "generate_new_image": true, "image_prompt": "겨울 배경..."},
    {"scene_index": 2, "generate_new_image": true, "image_prompt": "세련된..."},
    ...
  ]
}
```

**→ PLAN 데이터는 정상. 문제는 VisionGenerator 호출 부분이지만 로그가 안 나와서 디버깅 불가!**

---

## 요청 사항

### 핵심 디버그 로그를 `print`로 변경

```python
# _prepare_images_v3 내부

# 1. scenes_to_generate 확인
scenes_to_generate = [
    s for s in plan_draft.scenes
    if s.generate_new_image and s.scene_index not in image_urls
]
print(f"!!! scenes_to_generate count: {len(scenes_to_generate)} !!!")  # ← print로!

# 2. 조건 확인
print(f"!!! Condition: scenes_to_generate={len(scenes_to_generate) > 0}, mode={input_data.generation_mode} !!!")

# 3. VisionGenerator 호출 전
if scenes_to_generate and input_data.generation_mode != VideoGenerationMode.REUSE:
    print(f"!!! ENTERING VisionGenerator block !!!")

    try:
        print(f"!!! Importing VisionGenerator !!!")
        from app.services.agents.vision_generator import get_vision_generator_agent, ImageGenerationRequest

        print(f"!!! Creating agent !!!")
        agent = get_vision_generator_agent(...)

        print(f"!!! Calling agent.execute !!!")
        response = await agent.execute(...)

        print(f"!!! Response received: {response} !!!")
    except Exception as e:
        print(f"!!! EXCEPTION: {e} !!!")
        import traceback
        traceback.print_exc()
else:
    print(f"!!! SKIPPING VisionGenerator: scenes_to_generate={len(scenes_to_generate)}, mode={input_data.generation_mode} !!!")
```

---

## 빠른 확인 방법

컨테이너 내부에서 직접 실행:

```bash
docker exec -it sparklio-backend python3 -c "
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('app.services.agents.video_director')
logger.info('TEST INFO')
print('TEST PRINT')
"
```

이렇게 하면 `logger.info`가 왜 안 나오는지 확인 가능.

---

## 현재 상황

| 항목 | 상태 |
|------|------|
| PLAN 데이터 | ✅ 정상 (generate_new_image=true) |
| _prepare_images_v3 호출 | ✅ 확인됨 (print 출력) |
| logger.info 출력 | ❌ 전혀 안 나옴 |
| VisionGenerator 호출 여부 | ❓ 알 수 없음 (로그 없음) |
| 결과 | ❌ placeholder만 생성됨 |

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 Project ID**: vp_9f0f843a
