# B팀 요청서: VisionGenerator 호출 안 됨 (RENDER 모드)

**작성일**: 2025-11-29 14:00
**작성자**: C팀 (Frontend)
**우선순위**: 🔴 P0 (Blocking)
**상태**: 대기중
**관련 이슈**: 이전 요청서들의 후속 이슈

---

## 요청 요약

RENDER 모드에서 **VisionGenerator가 전혀 호출되지 않음**.
`_prepare_images_v3`에서 이미지 생성 로직이 실행되지 않아 `image_urls`가 빈 상태로 반환됨.

---

## 증상

### 백엔드 로그
```
[VideoDirector] No image for scene 1
[VideoDirector] No image for scene 2
[VideoDirector] No image for scene 3
[VideoDirector] No image for scene 4
[VideoDirector] No image for scene 5
[VideoDirector] No image for scene 6
[VideoDirectorAgent] RENDER mode failed: 1 validation error for VideoTimelinePlanV1
scenes
  List should have at least 1 item after validation, not 0
```

### 주목할 점
- **VisionGenerator 관련 로그가 전혀 없음**
- metadata 에러도 없음 (이전 수정 반영됨)
- `generate_new_image: true`인 씬이 6개 있음

---

## 분석

### plan_draft 상태 (정상)
```json
{
  "scenes": [
    {
      "scene_index": 1,
      "image_id": null,
      "image_url": null,
      "generate_new_image": true,
      "image_prompt": "겨울 풍경, 핸드크림 클로즈업..."
    },
    // ... scene 2~6 모두 generate_new_image: true
  ]
}
```

### 코드 흐름 (video_director.py)

```python
# _prepare_images_v3 (line 840~)
scenes_to_generate = [
    s for s in plan_draft.scenes
    if s.generate_new_image and s.scene_index not in image_urls
]

if scenes_to_generate and input_data.generation_mode != VideoGenerationMode.REUSE:
    # VisionGenerator 호출 - 이 부분이 실행 안 됨!
    from app.services.agents.vision_generator import get_vision_generator_agent
    ...
```

### 가능한 원인

1. **조건문 불일치**: `input_data.generation_mode`가 예상과 다른 값?
2. **예외 발생 후 무시**: try-except 블록에서 예외가 삼켜지고 있을 수 있음
3. **import 실패**: `vision_generator` 모듈 import 실패

---

## 요청 사항

### 1. 디버그 로그 추가

```python
# _prepare_images_v3 메서드 시작 부분
logger.info(f"[VideoDirector] _prepare_images_v3 called")
logger.info(f"[VideoDirector] generation_mode: {input_data.generation_mode}")
logger.info(f"[VideoDirector] scenes_to_generate count: {len(scenes_to_generate)}")

if scenes_to_generate and input_data.generation_mode != VideoGenerationMode.REUSE:
    logger.info("[VideoDirector] Calling VisionGenerator...")
    # ...
```

### 2. 예외 처리 확인

```python
try:
    agent = get_vision_generator_agent(...)
    response = await agent.execute(...)
except Exception as e:
    logger.error(f"[VideoDirector] VisionGenerator failed: {e}")
    # 현재는 예외가 삼켜지고 있을 수 있음
```

---

## 테스트 환경

- **Project ID**: vp_2ecb1ecb
- **Mode**: creative
- **Scenes**: 6개 (모두 generate_new_image: true)

---

## C팀 완료 사항

- ✅ 프론트엔드 UI 완성
- ✅ "다시 시도" 버튼 추가
- ✅ API 스키마 매핑 완료
- ⏳ 백엔드 이미지 생성 대기 중

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 환경**: Windows Laptop (`localhost:3001`)
- **대상 서버**: Mac mini (`100.123.51.5:8000`)
