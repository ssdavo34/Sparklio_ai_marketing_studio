# 🐛 백엔드 버그 리포트 - Image Generation

**작성일**: 2025-11-28
**작성자**: C팀 (Frontend Team)
**우선순위**: 🔴 High
**담당**: B팀 (Backend Team)

---

## 📋 요약

MediaGateway의 Nano Banana Provider에서 이미지 생성 시 **Image.save() format 인자 오류**가 발생합니다.

---

## 🐛 버그 상세

### 증상

```
Media generation failed: Nano Banana generation failed:
Image.save() got an unexpected keyword argument 'format'
```

### 재현 방법

```bash
curl -X POST http://localhost:8000/api/v1/media/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute cat sitting on a desk",
    "task": "product_image",
    "media_type": "image",
    "options": {
      "width": 512,
      "height": 512
    }
  }'
```

**예상 결과**: 이미지 생성 성공

**실제 결과**:
```json
{
  "detail": "Media generation failed: Nano Banana generation failed: Image.save() got an unexpected keyword argument 'format'"
}
```

### 에러 발생 위치 (추정)

```
backend/app/services/media/providers/nanobanana.py
또는
backend/app/integrations/nanobanana_client.py
```

**추정 원인**:
```python
# ❌ 잘못된 코드
from PIL import Image
image.save(buffer, format='PNG')  # PIL.Image.save()는 format 키워드 인자를 받지 않음

# ✅ 올바른 코드
image.save(buffer, 'PNG')  # 위치 인자로 전달
```

---

## 🔍 영향 범위

### 영향을 받는 기능

- ✅ **VisionGeneratorAgent**: 이미지 생성 불가
- ✅ **MediaGateway**: Nano Banana Provider 사용 불가
- ⚠️ **ComfyUI Provider**: 영향 없음 (별도 구현)
- ⚠️ **Mock Provider**: 영향 없음 (별도 구현)

### 영향을 받는 사용자

- ✅ 프론트엔드 개발자 (C팀)
- ✅ Canvas Studio 사용자
- ✅ 이미지 생성 기능 테스트

### 우회 방법

**임시 해결책**: ComfyUI 또는 Mock Provider 사용

```python
# frontend/.env.local (불필요 - Agent가 자동 폴백)
# NEXT_PUBLIC_IMAGE_LLM=comfyui
```

**프론트엔드 영향**: 없음
- Agent의 자동 폴백 로직이 작동하여 ComfyUI → DALL-E 순으로 시도
- 에러 처리가 올바르게 동작하여 사용자에게 명확한 에러 메시지 표시

---

## 📊 테스트 결과

### 성공한 엔드포인트

```bash
# ✅ Health Check
curl http://localhost:8000/api/v1/media/health
# 응답: {"gateway":"healthy","providers":{"nanobanana":{"status":"healthy"}}}

# ✅ Root
curl http://localhost:8000/
# 응답: {"service":"Sparklio V4 API","version":"4.0.0"}
```

### 실패한 엔드포인트

```bash
# ❌ Nano Banana 이미지 생성
curl -X POST http://localhost:8000/api/v1/media/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A cat","task":"product_image","media_type":"image"}'
# 응답: {"detail":"...Image.save() got an unexpected keyword argument 'format'"}
```

---

## 🔧 권장 수정 사항

### 1. PIL Image.save() 호출 수정

**위치**: `backend/app/services/media/providers/nanobanana.py` (추정)

**Before**:
```python
from PIL import Image
import io

# 잘못된 코드
buffer = io.BytesIO()
image.save(buffer, format='PNG')  # ❌ format= 키워드 인자 사용
```

**After**:
```python
from PIL import Image
import io

# 올바른 코드
buffer = io.BytesIO()
image.save(buffer, 'PNG')  # ✅ 위치 인자로 전달
```

### 2. 에러 로깅 개선

**현재**: 스택 트레이스가 로그에 출력되지 않음

**권장**:
```python
try:
    image.save(buffer, 'PNG')
except Exception as e:
    logger.error(f"[NanoBanana] Image save failed: {e}", exc_info=True)  # 스택 트레이스 포함
    raise
```

### 3. 단위 테스트 추가

```python
# backend/tests/test_nanobanana_provider.py
import pytest
from app.services.media.providers.nanobanana import NanoBananaProvider

def test_image_generation():
    provider = NanoBananaProvider()
    result = provider.generate(prompt="A test image", width=512, height=512)

    assert result is not None
    assert result.get('url') or result.get('base64')
    assert not result.get('error')
```

---

## 📝 추가 정보

### 환경 정보

```
OS: Windows 10
Python: 3.11
Backend Version: v4.0.0
PIL/Pillow Version: (확인 필요)
```

### 관련 코드 (프론트엔드)

프론트엔드에서는 이 에러를 올바르게 처리하고 있습니다:

```typescript
// lib/api/vision-generator-api.ts
try {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new VisionGeneratorError(
      errorData.error || errorData.message,
      response.status,
      errorData
    );
  }
} catch (error) {
  console.error('[VisionGeneratorAPI] Error:', error);
  throw error;
}
```

**사용자에게 표시되는 메시지**:
```
⚠️ 이미지 생성 실패: Media generation failed: ...
```

---

## ✅ 수정 확인 방법

### 1. 백엔드 수정 후 테스트

```bash
# 1. 백엔드 재시작
cd backend
python -m uvicorn app.main:app --reload --port 8000

# 2. curl 테스트
curl -X POST http://localhost:8000/api/v1/media/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute cat",
    "task": "product_image",
    "media_type": "image",
    "options": {"width": 512, "height": 512}
  }'

# 예상 결과:
# {
#   "provider": "nanobanana",
#   "model": "...",
#   "outputs": [
#     {
#       "url": "https://...",
#       "base64": "..."
#     }
#   ]
# }
```

### 2. 프론트엔드 통합 테스트

```bash
# frontend 디렉토리에서
npm run dev

# 브라우저에서
# 1. http://localhost:3000/studio/v3 접속
# 2. Canvas에서 "AI 이미지 생성" 패널 확인
# 3. "전체 생성" 클릭
# 4. 이미지가 성공적으로 생성되는지 확인
```

---

## 🎯 기대 효과

### 수정 전

- ❌ Nano Banana 이미지 생성 실패
- ⚠️ Agent가 ComfyUI로 자동 폴백
- ⚠️ 사용자에게 에러 메시지 표시

### 수정 후

- ✅ Nano Banana 이미지 생성 성공
- ✅ Provider 자동 선택이 올바르게 동작
- ✅ 고품질 이미지 생성
- ✅ 사용자 경험 개선

---

## 📞 연락처

**보고자**: C팀 (Frontend Team)
**담당자**: B팀 (Backend Team)
**우선순위**: 🔴 High
**예상 수정 시간**: 10분

**관련 문서**:
- [VISION_AGENT_INTEGRATION_COMPLETE.md](./VISION_AGENT_INTEGRATION_COMPLETE.md)
- [INTEGRATION_TEST_GUIDE.md](./INTEGRATION_TEST_GUIDE.md)

**참고**:
- PIL/Pillow 공식 문서: https://pillow.readthedocs.io/en/stable/reference/Image.html#PIL.Image.Image.save
- Image.save() signature: `save(fp, format=None, **params)`
  - `fp`: file path 또는 file object
  - `format`: **위치 인자** 또는 키워드 인자로 전달 가능
  - 하지만 `save(buffer, format='PNG')`는 잘못된 사용법

---

**최종 업데이트**: 2025-11-28 17:30
**상태**: 🔴 Open (수정 대기 중)
