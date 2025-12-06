# Shorts Factory 아키텍처

## 개요

Shorts Factory는 Sparklio AI Marketing Studio에서 영상 생성 기능만 분리한 독립 프로젝트입니다.

## 시스템 구성

### 1. Frontend (Next.js)

- **포트**: 3002
- **역할**: 사용자 인터페이스
- **주요 컴포넌트**:
  - `VideoStudio`: 메인 영상 에디터
  - `ScriptEditor`: 스크립트 편집
  - `VideoPreview`: 영상 미리보기
  - `GenerationPanel`: 생성 제어

### 2. Backend (FastAPI)

- **포트**: 8001
- **역할**: API 서버, 비즈니스 로직

#### 핵심 서비스

```
app/services/
├── video/
│   ├── builder.py        # 영상 조립 (ffmpeg)
│   └── shorts_generator.py  # 통합 생성기
├── audio/
│   └── whisper.py        # 음성 인식 (STT)
└── media/providers/
    ├── base.py           # Provider 추상 클래스
    └── hunyuan.py        # HunyuanVideo (T2V, I2V)
```

### 3. GPU Server (Desktop)

- **IP**: 100.120.180.42
- **ComfyUI**: 8188 - 이미지/영상 워크플로우
- **Whisper**: 9000 - 음성 인식

### 4. Storage Server (Mac mini)

- **IP**: 100.123.51.5
- **PostgreSQL**: 5432 - 프로젝트 데이터
- **MinIO**: 9000 - 파일 스토리지
- **Redis**: 6379 - 캐싱

## 영상 생성 플로우

```
1. 프로젝트 생성
   └─ /api/v1/videos/ (POST)

2. 스크립트 생성 (LLM)
   ├─ 씬 구성 자동 생성
   ├─ 나레이션 텍스트
   └─ 이미지 프롬프트

3. 이미지 생성 (선택적)
   └─ ZImage / ComfyUI

4. AI 영상 생성 (선택적)
   └─ HunyuanVideo (Image-to-Video)

5. TTS 나레이션 생성
   └─ Edge TTS (무료)

6. 최종 영상 조립
   └─ ffmpeg
```

## HunyuanVideo 연동

### Text-to-Video

```python
result = await provider.generate(
    prompt="A flower gently sways in the breeze",
    task="text_to_video",
    media_type="video",
    options={
        "width": 720,
        "height": 480,
        "frames": 125,  # 5초 @ 25fps
        "steps": 30
    }
)
```

### Image-to-Video

```python
result = await provider.generate(
    prompt="Gentle camera movement with subtle zoom",
    task="image_to_video",
    media_type="video",
    options={
        "image_url": "https://...",
        "width": 720,
        "height": 480,
        "frames": 75  # 3초
    }
)
```

## 데이터 모델

### Project

```typescript
interface Project {
  id: string
  title: string
  topic: string
  status: ProjectStatus
  scenes: Scene[]
  video_url?: string
  created_at: Date
}
```

### Scene

```typescript
interface Scene {
  scene_number: number
  duration_seconds: number
  narration: string
  image_prompt: string
  motion_prompt: string
  text_overlay?: string
  image_url?: string
  video_url?: string
}
```

## 확장 계획

1. **데이터베이스 연동**: 프로젝트 영속화
2. **파일 스토리지**: MinIO 연동
3. **배치 처리**: 여러 영상 동시 생성
4. **템플릿 시스템**: 프리셋 스타일
5. **BGM 라이브러리**: 배경 음악 선택

---

**작성일**: 2025-12-06
