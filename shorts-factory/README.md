# Shorts Factory 🎬

AI 기반 숏폼 영상 자동 생성 플랫폼

## 개요

Shorts Factory는 텍스트 프롬프트만으로 숏폼 영상(30초~1분)을 자동으로 생성하는 서비스입니다.

### 주요 기능

- **스크립트 자동 생성**: LLM을 활용해 영상 스크립트 자동 작성
- **AI 이미지 생성**: 각 씬에 맞는 이미지 자동 생성
- **Text-to-Video**: HunyuanVideo로 텍스트 → 영상 변환
- **Image-to-Video**: 이미지를 움직이는 영상으로 변환
- **TTS 나레이션**: Edge TTS로 한국어/영어 음성 생성
- **영상 조립**: ffmpeg로 최종 영상 렌더링

## 시스템 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│   GPU Server    │
│  (Next.js)      │     │   (FastAPI)     │     │   (ComfyUI)     │
│  localhost:3002 │     │  localhost:8001 │     │ 100.120.180.42  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   Mac mini      │
                        │   (Storage)     │
                        │ 100.123.51.5    │
                        └─────────────────┘
```

## 서버 정보

| 서버 | IP | 용도 | 포트 |
|------|-----|------|------|
| **Desktop GPU** | 100.120.180.42 | ComfyUI, HunyuanVideo, Whisper | 8188, 9000 |
| **Mac mini** | 100.123.51.5 | PostgreSQL, Redis, MinIO | 5432, 6379, 9000 |
| **Laptop** | localhost | Frontend, Backend 개발 | 3002, 8001 |

## 빠른 시작

### Backend

```bash
cd shorts-factory/backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일 편집

# 서버 실행
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd shorts-factory/frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### GPU 서버 준비

```bash
# ComfyUI 실행 (Desktop PC)
D:\ai\ComfyUI\run_nvidia_gpu.bat

# Whisper 서버 실행 (Desktop PC)
D:\ai\faster-whisper-server\run.bat
```

## API 엔드포인트

### Videos API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/videos/` | 프로젝트 생성 |
| GET | `/api/v1/videos/{id}/status` | 상태 조회 |
| POST | `/api/v1/videos/{id}/images` | 이미지 생성 |
| POST | `/api/v1/videos/{id}/render` | 영상 렌더링 |
| POST | `/api/v1/videos/text-to-video` | T2V 직접 생성 |
| POST | `/api/v1/videos/image-to-video` | I2V 직접 생성 |

### Audio API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/audio/tts` | TTS 음성 생성 |
| POST | `/api/v1/audio/transcribe` | 음성 인식 (STT) |
| GET | `/api/v1/audio/voices` | 음성 목록 |

## 폴더 구조

```
shorts-factory/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/     # API 엔드포인트
│   │   ├── core/                 # 설정
│   │   ├── services/
│   │   │   ├── video/            # 영상 빌더
│   │   │   ├── audio/            # Whisper
│   │   │   └── media/providers/  # HunyuanVideo
│   │   └── integrations/         # ComfyUI 클라이언트
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                      # Next.js App Router
│   ├── components/video-studio/  # 영상 에디터 UI
│   └── package.json
└── README.md
```

## 환경변수

### Backend (.env)

```env
# ComfyUI (GPU 서버)
COMFYUI_BASE_URL=http://100.120.180.42:8188

# Whisper (GPU 서버)
WHISPER_ENDPOINT=http://100.120.180.42:9000/transcribe

# PostgreSQL (Mac mini)
POSTGRES_HOST=100.123.51.5
POSTGRES_DB=shorts_factory

# Video Mode
VIDEO_MODE=mock  # mock | real
```

## 사용 예시

### 1. 프로젝트 생성

```bash
curl -X POST http://localhost:8001/api/v1/videos/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "신제품 소개",
    "topic": "혁신적인 스마트워치 출시",
    "duration_sec": 30,
    "num_scenes": 5
  }'
```

### 2. Text-to-Video 직접 생성

```bash
curl -X POST "http://localhost:8001/api/v1/videos/text-to-video" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over the ocean",
    "width": 720,
    "height": 480,
    "frames": 125
  }'
```

### 3. TTS 생성

```bash
curl -X POST http://localhost:8001/api/v1/audio/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "안녕하세요, 숏츠 팩토리입니다.",
    "voice": "ko-KR-SunHiNeural"
  }'
```

## 의존성

### Backend
- FastAPI
- httpx (비동기 HTTP)
- edge-tts (무료 TTS)
- tenacity (재시도 로직)

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Zustand (상태 관리)

### GPU 서버
- ComfyUI + HunyuanVideo
- faster-whisper (STT)
- CUDA 12.x

## 관련 프로젝트

- **Sparklio AI Marketing Studio**: 메인 마케팅 플랫폼 (이 프로젝트에서 분리됨)

## 라이선스

MIT License

---

**작성일**: 2025-12-06
**버전**: 1.0.0
