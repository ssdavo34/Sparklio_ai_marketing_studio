# B팀 긴급 요청서: V7 최종 - Gemini 차단 + Mock 모드 + LLM 연동

**작성일**: 2025-11-29 17:00
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Critical)
**상태**: 긴급 - 3가지 문제 동시 해결 필요

---

## 테스트 결과 (V6 로그 분석)

### ✅ 정상 동작 확인
```
>>> V6 _prepare_images_v3 CALLED
>>> V6 generation_mode=VideoGenerationMode.CREATIVE
>>> V6 plan_draft.scenes len: 6
>>> V6 scene 1: gen=True, url=False, id=False, prompt=눈 내리는 배경에 패딩 점퍼를 입은 모델...
>>> V6 scenes_to_generate indices: [1, 2, 3, 4, 5, 6]
>>> V6 condition: will_call_vision = True
>>> V6 ENTERING VisionGenerator block (FORCED)
>>> V6 calling VisionGenerator with 6 prompts
>>> V6 VisionGenerator response received
>>> V6 VisionGenerator images len: 6
```

**→ VisionGenerator 호출까지는 정상!**

### ❌ 실패 지점
```
>>> V6 scene 1 got image: None...
>>> V6 scene 2 got image: None...
>>> V6 scene 3 got image: None...
>>> V6 scene 4 got image: None...
>>> V6 scene 5 got image: None...
>>> V6 scene 6 got image: None...

[NanoBanana] Content may be blocked: FinishReason.STOP (x6)
```

**→ Gemini가 6개 이미지 모두 콘텐츠 정책으로 차단!**

---

## 문제 1: Gemini 콘텐츠 차단

### 원인
- Gemini Imagen이 "마케팅 이미지" 생성을 거부
- `FinishReason.STOP` = 콘텐츠 정책 위반 판정

### 차단된 프롬프트 예시
```
눈 내리는 배경에 패딩 점퍼를 입은 모델
상점 안에서 패딩 점퍼를 고르는 고객들
눈 내리는 도시에서 패딩 점퍼를 입고 걷는 모델들
```

### 해결 방안

#### 방안 A: Safety Settings 최대 완화
```python
# nanobanana_provider.py
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]
```

#### 방안 B: 프롬프트 영어 변환 + 추상화
```python
# 한글 → 영어
# "패딩 점퍼를 입은 모델" → "person wearing winter jacket"

# 마케팅 키워드 제거
# "특가 세일" → "seasonal scene"
```

#### 방안 C: DALL-E Fallback (권장)
```python
if nanobanana_result is None or nanobanana_result.get("status") == "blocked":
    # OpenAI DALL-E로 fallback
    return await dalle_provider.generate(prompt)
```

---

## 문제 2: Mock 이미지 모드 미작동

### 확인 결과
```bash
docker exec sparklio-backend env | grep VIDEO_MOCK
# 결과 없음 - 환경변수 미설정
```

### 해결 방법

#### docker-compose.yml에 환경변수 추가
```yaml
# docker/mac-mini/docker-compose.yml
services:
  backend:
    environment:
      - VIDEO_MOCK_IMAGES=1  # ← 추가
```

#### 또는 .env 파일에 추가
```bash
# docker/mac-mini/.env
VIDEO_MOCK_IMAGES=1
```

#### 재시작
```bash
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml up -d backend
```

---

## 문제 3: PLAN 스크립트가 빈약함

### 현재 스크립트 (너무 단순)
```
Scene 1: "겨울 특가 세일 시작!"
Scene 2: "다양한 색상과 스타일!"
Scene 3: "특별 할인 중!"
```

### 기대 스크립트 (LLM 생성)
```
Scene 1: "추운 겨울, 따뜻한 스타일을 찾고 계신가요?"
Scene 2: "프리미엄 다운 충전재로 -20도에서도 따뜻하게"
Scene 3: "다양한 컬러와 사이즈로 나만의 스타일 완성"
```

### 확인 필요
1. PLAN API에서 LLM(GPT/Claude)이 실제로 호출되는지?
2. 호출된다면 프롬프트가 제대로 전달되는지?
3. LLM 응답이 제대로 파싱되는지?

### 디버그 로그 추가 요청
```python
# video_director.py - _execute_plan_mode 또는 관련 함수
print(f">>> PLAN LLM call: topic={topic}")
print(f">>> PLAN LLM response: {llm_response[:500]}...")
print(f">>> PLAN parsed scenes: {len(scenes)}")
```

---

## 즉시 해결 가능한 방법 (데모용)

### 1단계: Mock 이미지 활성화
```bash
# docker-compose.yml에 추가 후
docker compose restart backend
```

### 2단계: Mock 이미지가 video_director에서 적용되는지 확인
```python
# _prepare_images_v3 끝에 추가
import os
MOCK_IMAGE_MODE = os.getenv("VIDEO_MOCK_IMAGES", "0") == "1"

if MOCK_IMAGE_MODE:
    print(">>> MOCK MODE: filling placeholder images")
    for scene in plan_draft.scenes:
        if scene.scene_index not in image_urls:
            image_urls[scene.scene_index] = f"https://picsum.photos/720/1280?random={scene.scene_index}"
            print(f">>> scene {scene.scene_index} = placeholder")
```

---

## 우선순위

| 순위 | 문제 | 해결 방법 | 예상 시간 |
|------|------|----------|----------|
| 1 | Mock 이미지 미작동 | 환경변수 추가 + 재시작 | 5분 |
| 2 | Gemini 차단 | DALL-E fallback 또는 프롬프트 영어화 | 30분 |
| 3 | 스크립트 빈약 | LLM 호출 확인 및 디버깅 | 1시간 |

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 Project ID**: vp_d3fcee41 (최신)
