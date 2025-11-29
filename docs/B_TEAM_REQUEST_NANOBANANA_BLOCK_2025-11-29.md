# B팀 요청서: NanoBanana 이미지 생성 차단 문제

**작성일**: 2025-11-29 15:25
**작성자**: C팀 (Frontend)
**우선순위**: P0 (Blocking)
**상태**: 긴급

---

## 문제 요약

NanoBanana (Gemini) 이미지 생성이 **콘텐츠 정책으로 차단**됨.

---

## 백엔드 로그

```
!!! _prepare_images_v3 CALLED !!!
[NanoBanana] Content may be blocked: FinishReason.STOP
[NanoBanana] Content may be blocked: FinishReason.STOP
[NanoBanana] Content may be blocked: FinishReason.STOP
[NanoBanana] Content may be blocked: FinishReason.STOP
[NanoBanana] Content may be blocked: FinishReason.STOP
[NanoBanana] Content may be blocked: FinishReason.STOP
[VideoDirector] No image for scene 2
[VideoDirector] No image for scene 3
[VideoDirector] No image for scene 4
[VideoDirector] No image for scene 5
[VideoDirector] No image for scene 6
```

**결과**: 6개 씬 모두 이미지 생성 실패 → Placeholder 비디오만 생성

---

## 사용된 프롬프트 (PLAN에서 생성)

```
Scene 1: A sleek Mac Mini M4 spinning under bright lights in a modern office.
Scene 2: A dynamic split-screen showcasing fast processing and multitasking on a Mac Mini M4.
Scene 3: A user enjoying gaming and design on a Mac Mini M4.
...
```

---

## 원인 분석

`FinishReason.STOP`은 Gemini가 콘텐츠 정책 위반으로 생성을 **거부**한 것입니다.

**가능한 원인:**
1. **브랜드명 포함**: "Mac Mini M4" (Apple 상표)
2. **제품 홍보성 콘텐츠**: 마케팅 이미지 생성 거부
3. **Safety Settings**: 너무 엄격하게 설정됨

---

## 해결 방안

### 방법 1: Safety Settings 완화

```python
# nanobanana_provider.py
safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE"
    },
    # ... 모든 카테고리를 BLOCK_NONE으로
]
```

### 방법 2: 프롬프트 수정

```python
# 브랜드명 제거 또는 일반화
original: "A sleek Mac Mini M4 spinning..."
modified: "A sleek compact computer spinning..."
```

### 방법 3: DALL-E Fallback 활성화

NanoBanana 실패 시 OpenAI DALL-E로 fallback:
```python
if nanobanana_failed:
    return await dalle_provider.generate(prompt)
```

### 방법 4: Mock Provider로 테스트 이미지

개발 환경에서 실제 이미지 대신 테스트 이미지 사용:
```python
# Unsplash에서 무료 이미지 가져오기
return f"https://source.unsplash.com/1080x1920/?{keyword}"
```

---

## 테스트 정보

- **Project ID**: vp_a9562678
- **Topic**: 블랙프라이데이 맥미니 M4 특가 이벤트
- **Scenes**: 6개 (모두 generate_new_image: true)

---

## 요청 사항

1. NanoBanana safety settings 확인/완화
2. 실패 시 대체 provider (DALL-E 또는 Mock) 적용
3. 프롬프트에서 브랜드명 제거 옵션 추가

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
