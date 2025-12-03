# Z-Image Server 설치 가이드

빠른 이미지 생성을 위한 로컬 GPU 서버

## 개요

| 항목 | 내용 |
|------|------|
| 설치 위치 | `D:\ai\zimage` |
| 포트 | 7860 |
| GPU | RTX 4070 (또는 VRAM 8GB 이상) |
| 모델 | SDXL (Stable Diffusion XL) |

## 설치 방법

### 1. 설치 스크립트 실행

데스크탑 GPU 서버에서:

```cmd
cd K:\sparklio_ai_marketing_studio\tools\zimage
install.bat
```

### 2. 서버 실행

```cmd
D:\ai\zimage\run.bat
```

첫 실행 시 SDXL 모델이 자동 다운로드됩니다 (~6GB)

### 3. 테스트

```bash
# 헬스 체크
curl http://localhost:7860/health

# 이미지 생성 테스트
curl -X POST http://localhost:7860/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute cat sitting on a desk, professional photo",
    "width": 1024,
    "height": 1024,
    "steps": 8
  }'
```

## Provider 비교

| Provider | 비용 | 속도 | 품질 | 필터 |
|----------|------|------|------|------|
| **Z-Image** | 무료 (로컬) | 빠름 (8스텝) | 우수 | 없음 |
| ComfyUI | 무료 (로컬) | 보통 | 우수 | 없음 |
| NanoBanana | API 비용 | 보통 | 우수 | 있음 |

## 환경 변수 설정

`backend/.env`에 추가:

```env
# Z-Image 설정
ZIMAGE_BASE_URL=http://100.120.180.42:7860
ZIMAGE_TIMEOUT=120
ZIMAGE_DEFAULT_MODEL=sdxl
ZIMAGE_DEFAULT_STEPS=8

# 이미지 생성 Provider 선택
IMAGE_PROVIDER=zimage  # zimage | comfyui | nanobanana | auto
```

## 사용법

### API 호출

```python
# Python 예시
import httpx

response = httpx.post(
    "http://100.120.180.42:7860/api/generate",
    json={
        "prompt": "A modern product photo of wireless earbuds",
        "negative_prompt": "low quality, blurry",
        "width": 1024,
        "height": 1024,
        "steps": 8,
        "cfg_scale": 7.0
    }
)

result = response.json()
image_base64 = result["image"]
```

### Sparklio에서 사용

Sparklio 백엔드가 자동으로 Z-Image를 사용합니다:

```python
from app.services.media.gateway import get_media_gateway

gateway = get_media_gateway()
result = await gateway.generate_image(
    prompt="A cute cat",
    provider="zimage"  # 또는 "auto"
)
```

## 문제 해결

### CUDA 오류

```cmd
# CUDA 버전 확인
nvcc --version

# PyTorch CUDA 확인
python -c "import torch; print(torch.cuda.is_available())"
```

### VRAM 부족

1. `steps` 줄이기 (4-8 권장)
2. 해상도 줄이기 (512x512)
3. 다른 GPU 작업 종료

### 모델 다운로드 실패

```cmd
# 수동 다운로드
pip install huggingface_hub
huggingface-cli download stabilityai/stable-diffusion-xl-base-1.0
```

## 파일 구조

```
D:\ai\zimage\
├── venv/              # Python 가상환경
├── models/            # (선택) 로컬 모델 캐시
├── server.py          # FastAPI 서버
├── run.bat            # 실행 스크립트
└── requirements.txt   # 의존성 목록
```

## 참고

- [SDXL 모델](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0)
- [Diffusers 문서](https://huggingface.co/docs/diffusers)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
