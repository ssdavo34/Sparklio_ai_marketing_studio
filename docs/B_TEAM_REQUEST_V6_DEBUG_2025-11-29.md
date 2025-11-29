# B팀 요청서: V6 디버그 패치 + Mock 이미지 모드

**작성일**: 2025-11-29 16:45
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Critical)
**상태**: 긴급 - 두 가지 동시 진행 요청

---

## 현재 상황 요약

### 확실히 드러난 사실

| 항목 | 상태 | 증거 |
|------|------|------|
| PLAN 응답 | ✅ 정상 | `generate_new_image: true`, `image_prompt` 모두 있음 |
| RENDER 파이프라인 | ✅ 동작 | `status: completed`, `video_url` 반환됨 |
| `_prepare_images_v3` 진입 | ✅ 확인됨 | `!!! _prepare_images_v3 CALLED !!!` 출력됨 |
| VisionGenerator 호출 | ❌ 안 됨 | 관련 로그 전혀 없음 |
| 결과 | ❌ placeholder만 | "Scene Placeholder" 6장짜리 영상 |

### 핵심 문제

**VisionGenerator 블록 조건문을 통과하지 못함:**

```python
scenes_to_generate = [
    s for s in plan_draft.scenes
    if s.generate_new_image and s.scene_index not in image_urls
]

if scenes_to_generate and input_data.generation_mode != VideoGenerationMode.REUSE:
    # ← 여기 안 들어감!
```

**가능한 원인:**
1. `scenes_to_generate`가 빈 리스트
2. `scene.generate_new_image`가 Pydantic 변환 중 `False`로 변환
3. `image_urls`가 이미 채워져 있다고 인식
4. `generation_mode`가 `REUSE`로 들어옴

**`logger.info`가 출력 안 되므로 `print`로 디버깅 필수!**

---

## 요청 1: V6 디버그 패치 (print로 원인 노출)

**파일**: `backend/app/services/agents/video_director.py`
**위치**: `_prepare_images_v3` 함수 내부

### 1-1. 씬별 상세 정보 출력 (plan_draft 초기화 직후)

```python
# plan_draft, image_urls 초기화 직후에 추가
print(">>> V6 plan_draft.scenes len:", len(plan_draft.scenes))
for s in plan_draft.scenes:
    print(
        f">>> V6 scene {s.scene_index}: "
        f"gen={getattr(s, 'generate_new_image', None)}, "
        f"url={bool(getattr(s, 'image_url', None))}, "
        f"id={bool(getattr(s, 'image_id', None))}, "
        f"prompt={(s.image_prompt[:40] + '...') if getattr(s, 'image_prompt', None) else 'None'}"
    )
```

### 1-2. 조건 검사 결과 출력

```python
# 기존 image_urls 수집 이후
print(">>> V6 image_urls keys after collection:", list(image_urls.keys()))

scenes_to_generate = [
    s for s in plan_draft.scenes
    if getattr(s, "generate_new_image", False) and s.scene_index not in image_urls
]

print(">>> V6 scenes_to_generate indices:", [s.scene_index for s in scenes_to_generate])
print(">>> V6 generation_mode:", input_data.generation_mode)
print(">>> V6 condition: will_call_vision =",
      bool(scenes_to_generate) and input_data.generation_mode != VideoGenerationMode.REUSE)
```

### 1-3. VisionGenerator 블록 강제 ON (임시 디버깅용)

```python
# 기존 조건문을 임시로 강제 통과
# if scenes_to_generate and input_data.generation_mode != VideoGenerationMode.REUSE:
if True:  # ← 임시 강제 ON
    print(">>> V6 FORCE VisionGenerator block, scenes_to_generate =",
          [s.scene_index for s in scenes_to_generate],
          "mode=", input_data.generation_mode)

    try:
        from app.services.agents.vision_generator import get_vision_generator_agent, ImageGenerationRequest

        prompts = [
            ImageGenerationRequest(
                prompt_text=s.image_prompt or "Marketing visual",
                negative_prompt="blurry, low quality, text, watermark",
                aspect_ratio="9:16",
                style="realistic"
            )
            for s in (scenes_to_generate or plan_draft.scenes)  # 비어 있어도 전체 씬 대상으로
        ]

        print(">>> V6 calling VisionGenerator with", len(prompts), "prompts")

        agent = get_vision_generator_agent(
            llm_gateway=self.llm_gateway,
            media_gateway=self.media_gateway
        )

        response = await agent.execute(AgentRequest(
            task="generate_images",
            payload={
                "prompts": [p.model_dump() for p in prompts],
                "provider": "nanobanana",
                "batch_mode": True,
                "max_concurrent": 3
            }
        ))

        print(">>> V6 VisionGenerator raw response:", response)

        value = response.outputs[0].value if response.outputs else {}
        generated_images = value.get("images", [])

        print(">>> V6 VisionGenerator images len:", len(generated_images))

        for i, scene in enumerate(plan_draft.scenes):
            if i < len(generated_images) and generated_images[i].get("status") == "completed":
                url = generated_images[i].get("image_url")
                image_urls[scene.scene_index] = url
                print(f">>> V6 scene {scene.scene_index} got image:", url)
            else:
                print(f">>> V6 scene {scene.scene_index} has no generated image")

    except Exception as e:
        import traceback
        print(">>> V6 VisionGenerator ERROR:", e)
        traceback.print_exc()
```

---

## 요청 2: Mock 이미지 모드 (데모용)

**목적**: VisionGenerator 성공 여부와 관계없이 "이미지가 있는 영상" 확보

### 코드 (VisionGenerator 블록 아래에 추가)

```python
import os

MOCK_IMAGE_MODE = os.getenv("VIDEO_MOCK_IMAGES", "0") == "1"

if MOCK_IMAGE_MODE:
    print(">>> V6 MOCK_IMAGE_MODE ON - using placeholder images for all scenes")

    for scene in plan_draft.scenes:
        if scene.scene_index not in image_urls:
            # 외부 placeholder 서비스 사용
            image_urls[scene.scene_index] = (
                f"https://picsum.photos/720/1280?random={scene.scene_index}"
            )
            print(f">>> V6 scene {scene.scene_index} uses placeholder:", image_urls[scene.scene_index])
```

### 사용 방법

```bash
# docker-compose.yml 또는 .env에 추가
VIDEO_MOCK_IMAGES=1

# 또는 Docker 재시작 시
docker compose -f docker-compose.yml up -d backend -e VIDEO_MOCK_IMAGES=1
```

### 장점

- VisionGenerator가 실패해도 최소한 **영상에 이미지가 나옴**
- 데모/발표용으로 즉시 사용 가능
- 나중에 NanoBanana 연동 완료되면 환경변수만 끄면 됨

---

## 예상 결과

### V6 디버그 패치 적용 후 예상 로그

```
>>> V6 plan_draft.scenes len: 6
>>> V6 scene 1: gen=True, url=False, id=False, prompt=겨울 배경, 차가운 바람을 느끼는 인물의...
>>> V6 scene 2: gen=True, url=False, id=False, prompt=세련된 핸드크림 제품 진열대...
...
>>> V6 image_urls keys after collection: []
>>> V6 scenes_to_generate indices: [1, 2, 3, 4, 5, 6]
>>> V6 generation_mode: VideoGenerationMode.CREATIVE
>>> V6 condition: will_call_vision = True
>>> V6 FORCE VisionGenerator block...
>>> V6 calling VisionGenerator with 6 prompts
>>> V6 VisionGenerator raw response: ...
```

이 로그가 나오면 **어디서 실패하는지 정확히 파악 가능**.

---

## 테스트 절차

1. V6 패치 적용 후 Docker 재시작
2. 프론트엔드에서 CREATIVE 모드 → PLAN → RENDER
3. `docker logs sparklio-backend --tail 200 | grep "V6"` 로 로그 확인
4. Mock 모드 필요 시 `VIDEO_MOCK_IMAGES=1` 설정 후 재테스트

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 Project ID**: vp_9f0f843a (최신)
- **Frontend**: Windows Laptop (localhost:3001)
- **Backend**: Mac mini (100.123.51.5:8000)
