# B팀 요청서: V8 NanoBanana API 디버깅

**작성일**: 2025-11-29 17:30
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Critical)
**상태**: 긴급

---

## 핵심 의문

**Gemini 웹 UI에서는 동일 프롬프트로 이미지가 잘 생성되는데, API에서는 안 됨**

![Gemini 웹 성공](스크린샷 참조 - "눈 내리는 배경에 패딩 점퍼를 입은 모델" 성공)

---

## 현재 NanoBanana 동작

### 입력
```
프롬프트: "눈 내리는 배경에 패딩 점퍼를 입은 모델"
모델: gemini-2.5-flash-image
response_modalities: ['IMAGE']
```

### 출력
```
[NanoBanana] Content may be blocked: FinishReason.STOP
>>> V6 scene 1 got image: None
```

**→ `FinishReason.STOP` (정상 종료)인데 이미지가 None**

---

## 디버깅 요청

### 1. Gemini 응답 전체 출력

```python
# nanobanana_provider.py - generate() 함수 내부
response = self.client.models.generate_content(
    model=model_name,
    contents=[enhanced_prompt],
    config=config
)

# ===== 디버그 로그 추가 =====
print(f">>> NANO DEBUG: response type = {type(response)}")
print(f">>> NANO DEBUG: response = {response}")
print(f">>> NANO DEBUG: response.text = {getattr(response, 'text', 'N/A')}")
print(f">>> NANO DEBUG: response.parts = {response.parts}")
print(f">>> NANO DEBUG: response.candidates = {response.candidates}")

if response.candidates:
    candidate = response.candidates[0]
    print(f">>> NANO DEBUG: candidate.content = {candidate.content}")
    print(f">>> NANO DEBUG: candidate.finish_reason = {candidate.finish_reason}")
    print(f">>> NANO DEBUG: candidate.safety_ratings = {candidate.safety_ratings}")

if response.parts:
    for i, part in enumerate(response.parts):
        print(f">>> NANO DEBUG: part[{i}] = {part}")
        print(f">>> NANO DEBUG: part[{i}].inline_data = {getattr(part, 'inline_data', 'N/A')}")
        print(f">>> NANO DEBUG: part[{i}].text = {getattr(part, 'text', 'N/A')}")
```

### 2. 모델명 확인

현재: `gemini-2.5-flash-image`

가능한 모델들:
- `gemini-2.0-flash-exp` (실험적 이미지 생성)
- `gemini-1.5-pro` (이미지 분석만, 생성 X)
- `imagen-3.0-generate-001` (Imagen API)

```python
# 사용 가능한 모델 확인
for model in client.models.list():
    print(model.name, model.supported_generation_methods)
```

### 3. response_modalities 테스트

```python
# 현재
config = types.GenerateContentConfig(
    response_modalities=['IMAGE'],
    ...
)

# 테스트 1: Text + Image
config = types.GenerateContentConfig(
    response_modalities=['TEXT', 'IMAGE'],
    ...
)

# 테스트 2: 소문자
config = types.GenerateContentConfig(
    response_modalities=['image'],
    ...
)
```

### 4. API 키 권한 확인

Google AI Studio에서:
1. API 키 페이지 접속
2. 해당 키의 "제한사항" 확인
3. "이미지 생성" 권한 있는지 확인

---

## 빠른 테스트 코드

```python
# 컨테이너 내부에서 직접 테스트
docker exec -it sparklio-backend python3 << 'EOF'
import os
from google import genai
from google.genai import types

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# 테스트 프롬프트
prompt = "A snowy winter scene with a person wearing a puffer jacket"

# 이미지 생성 시도
response = client.models.generate_content(
    model="gemini-2.0-flash-exp",  # 또는 다른 모델
    contents=[prompt],
    config=types.GenerateContentConfig(
        response_modalities=['IMAGE']
    )
)

print("Response:", response)
print("Parts:", response.parts)
print("Text:", getattr(response, 'text', 'N/A'))

if response.parts:
    for part in response.parts:
        if hasattr(part, 'inline_data') and part.inline_data:
            print("Image found! mime_type:", part.inline_data.mime_type)
            print("Image data length:", len(part.inline_data.data))
        elif hasattr(part, 'text'):
            print("Text part:", part.text[:200])
EOF
```

---

## 예상 원인

| 가능성 | 확인 방법 |
|--------|----------|
| **모델명 오류** | `gemini-2.5-flash-image`가 존재하지 않음 | 모델 리스트 확인 |
| **API 버전 차이** | 웹 UI는 최신 버전, SDK는 구버전 | google-genai 패키지 버전 확인 |
| **권한 부족** | API 키에 이미지 생성 권한 없음 | Google AI Studio 확인 |
| **응답 파싱 오류** | 이미지가 있는데 파싱 실패 | response 전체 출력 |

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
