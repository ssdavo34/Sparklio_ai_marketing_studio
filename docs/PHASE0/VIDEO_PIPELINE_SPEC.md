# Video Generation Pipeline Specification

> **Version**: 1.0
> **Date**: 2025-11-14 (금요일) 16:54
> **Status**: Draft
> **Owner**: Team A (Docs & Architecture)
> **Purpose**: P1 광고 영상 생성 파이프라인 기술 명세

---

## 1. Executive Summary

Sparklio의 광고 영상 생성 파이프라인은 **Chat-driven 입력 → Multi-Agent 전략 수립 → Local GPU 영상 생성 → Cloud/Hybrid 편집** 구조로 작동합니다.

핵심 차별점:
- **Qwen (Local LLM)**: 광고 콘티/씬 구성/카피 자동 생성
- **ComfyUI + AnimateDiff**: 로컬 GPU 기반 모션 클립 생성
- **Hybrid Router**: VEo3 (Cloud) vs AnimateDiff (Local) 자동 선택
- **Mac mini 서버**: LLM API 라우팅 및 작업 큐 관리
- **Desktop GPU Worker**: 실제 이미지/영상 생성 노드

---

## 2. System Architecture

### 2.1 3-Node Hybrid Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                     │
│  - Video Studio Editor UI                              │
│  - Storyboard Preview                                  │
│  - Timeline Editor                                     │
└────────────┬────────────────────────────────────────────┘
             │ WebSocket + REST
             ↓
┌─────────────────────────────────────────────────────────┐
│  Mac mini (M2 Server) - FastAPI + Celery               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Smart LLM Router                                 │  │
│  │  - Qwen (집PC:11434) ← Local LLM                │  │
│  │  - GPT-4o (Cloud) ← Strategic decisions         │  │
│  │  - Claude 3.5 Sonnet (Cloud) ← Copy refinement  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Multi-Agent Orchestrator                         │  │
│  │  - StrategistAgent → 광고 전략 수립              │  │
│  │  - ScenePlannerAgent → 씬 구성 설계              │  │
│  │  - CopywriterAgent → 카피/자막 생성              │  │
│  │  - VideoDirectorAgent → 타임라인 편성            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Task Queue (Celery + Redis)                      │  │
│  │  - video.storyboard.generate                     │  │
│  │  - video.image.generate_batch                    │  │
│  │  - video.motion.generate_clip                    │  │
│  │  - video.assembly.ffmpeg                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────┘
             │ HTTP/Tailscale
             ↓
┌─────────────────────────────────────────────────────────┐
│  Desktop (RTX 4070) - GPU Worker                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ollama + Qwen2.5-7B (Port 11434)                │  │
│  │  - Video Director Prompt Engine                  │  │
│  │  - Scene Description Generator                   │  │
│  │  - OpenAI Compatible API                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ComfyUI (Port 8188)                              │  │
│  │  - SDXL + LoRA (이미지 생성)                     │  │
│  │  - AnimateDiff + Motion Modules (모션 생성)     │  │
│  │  - ControlNet (일관성 유지)                      │  │
│  │  - IPAdapter (브랜드 요소 고정)                  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Worker Process (Python)                          │  │
│  │  - ComfyUI API Client                            │  │
│  │  - FFmpeg Video Assembly                         │  │
│  │  - Frame Sequence Manager                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Video Generation Flow (E2E)

### 3.1 User Input → Storyboard

**입력** (Chat or Form):
```json
{
  "brand_id": "uuid",
  "product": "Daily Eye Care Moisturizer",
  "target_audience": "20-30대 직장인",
  "goal": "제품 인지도 + 전환",
  "duration": 15,
  "tone": "professional_warm",
  "channels": ["instagram_reels", "youtube_shorts"]
}
```

**처리 Agent**: `StrategistAgent` + `ScenePlannerAgent`

**LLM Router 로직**:
- **초안 전략 수립**: Qwen (Local) - 빠르고 비용 0
- **고난도 브랜딩**: GPT-4o (Cloud) - 복잡한 USP 추출
- **카피 정제**: Claude 3.5 Sonnet (Cloud) - 톤 일관성

**출력** (Storyboard JSON):
```json
{
  "title": "Daily Eye Care Moisturizer - 15s Ad",
  "duration_seconds": 15,
  "format": "9:16",
  "scenes": [
    {
      "id": "scene_001",
      "purpose": "Hook / Attention",
      "duration_seconds": 3,
      "narration": "눈이 피곤한 현대인",
      "onscreen_text": "10초만 투자하세요",
      "image_prompt": "close-up tired eyes, soft lighting, HD, cinematic",
      "motion_style": "slow zoom-in",
      "brand_elements": ["logo_bottom_right"]
    },
    {
      "id": "scene_002",
      "purpose": "Problem",
      "duration_seconds": 3,
      "narration": "건조함과 피로감",
      "onscreen_text": "당신의 눈, 괜찮나요?",
      "image_prompt": "office desk, dry air, stressed eyes, warm tone",
      "motion_style": "parallax movement",
      "brand_elements": []
    },
    {
      "id": "scene_003",
      "purpose": "Solution",
      "duration_seconds": 4,
      "narration": "Daily Eye Care의 세라마이드 포뮬라",
      "onscreen_text": "10초 흡수, 8시간 보습",
      "image_prompt": "product shot, serum drop, natural light, premium feel",
      "motion_style": "rotation + glow effect",
      "brand_elements": ["product_3d", "logo"]
    },
    {
      "id": "scene_004",
      "purpose": "Social Proof",
      "duration_seconds": 3,
      "narration": "피부과 전문의 추천",
      "onscreen_text": "임상 테스트 완료",
      "image_prompt": "before-after comparison, professional certification badge",
      "motion_style": "slide transition",
      "brand_elements": ["certification_badge"]
    },
    {
      "id": "scene_005",
      "purpose": "CTA",
      "duration_seconds": 2,
      "narration": "",
      "onscreen_text": "지금 무료 샘플 신청",
      "image_prompt": "product package, call to action overlay",
      "motion_style": "pulse effect",
      "brand_elements": ["logo", "cta_button"]
    }
  ],
  "metadata": {
    "bgm_mood": "calm_inspiring",
    "transition_style": "smooth_fade",
    "brand_colors": ["#F2EDE8", "#7C4D3A"],
    "estimated_cost": "$0.50"
  }
}
```

---

### 3.2 Storyboard → Key Images

**처리 Agent**: `VisionGeneratorAgent`

**Routing 로직**:
- **브랜드 특화 이미지** (scene 1,2,4): ComfyUI + LoRA (Local)
- **제품 3D 이미지** (scene 3): ComfyUI + ControlNet (Local)
- **고품질 썸네일** (scene 5): DALL-E 3 (Cloud, 옵션)

**Celery Task**:
```python
@celery.task
async def generate_scene_images(storyboard_json: dict) -> dict:
    """씬별 key image 생성"""
    results = {}

    for scene in storyboard_json['scenes']:
        # Router 선택
        if scene['brand_elements']:
            engine = 'comfyui_lora'  # Local + Brand LoRA
        else:
            engine = 'comfyui_sdxl'   # Local SDXL

        # ComfyUI API 호출
        workflow = build_comfyui_workflow(
            prompt=scene['image_prompt'],
            lora_model=brand_kit.get_lora_path(),
            controlnet=scene.get('controlnet_mode'),
            width=1080, height=1920  # 9:16
        )

        image_path = await comfy_client.execute(workflow)

        results[scene['id']] = {
            'image_path': image_path,
            'engine': engine,
            'generation_time': time.time() - start
        }

    return results
```

**출력** (Image Batch):
```json
{
  "scene_001": {
    "image_path": "/outputs/scene_001_v1.png",
    "engine": "comfyui_sdxl",
    "generation_time": 12.5
  },
  "scene_002": {...},
  "scene_003": {...}
}
```

---

### 3.3 Key Images → Motion Clips

**처리 Agent**: `VideoDirectorAgent`

**Routing 로직**:
- **짧은 모션** (2-4초): AnimateDiff (Local)
- **고품질 장면** (5초+): VEo3 or Sora2 (Cloud, 옵션)
- **Budget Mode**: 모든 씬 정지 이미지 + Ken Burns Effect

**AnimateDiff Workflow**:
```python
@celery.task
async def generate_motion_clip(scene_id: str, image_path: str, motion_style: str) -> str:
    """AnimateDiff로 모션 클립 생성"""

    # Motion Module 선택
    motion_module = {
        'slow zoom-in': 'mm_sdxl_v10_beta',
        'parallax movement': 'mm_sd15_v2',
        'rotation + glow effect': 'mm_sdxl_v10_beta',
        'slide transition': 'mm_sd15_v2',
        'pulse effect': 'mm_sdxl_v10_beta'
    }[motion_style]

    # ComfyUI AnimateDiff Workflow
    workflow = {
        'nodes': {
            '1': {'class_type': 'LoadImage', 'inputs': {'image': image_path}},
            '2': {'class_type': 'AnimateDiffLoader', 'inputs': {'model_name': motion_module}},
            '3': {'class_type': 'AnimateDiffSampler', 'inputs': {
                'model': ['2', 0],
                'image': ['1', 0],
                'frame_count': 24,  # 24 frames @ 8fps = 3초
                'motion_scale': 0.7
            }},
            '4': {'class_type': 'SaveImage', 'inputs': {'images': ['3', 0]}}
        }
    }

    frames_folder = await comfy_client.execute(workflow)

    return frames_folder  # /outputs/scene_001_frames/
```

**출력** (Frame Sequences):
```json
{
  "scene_001": {
    "frames_folder": "/outputs/scene_001_frames/",
    "frame_count": 24,
    "fps": 8,
    "duration": 3.0
  },
  "scene_002": {...}
}
```

---

### 3.4 Motion Clips → Final Video

**처리**: FFmpeg Assembly

**Celery Task**:
```python
@celery.task
async def assemble_final_video(storyboard: dict, frames_data: dict) -> str:
    """FFmpeg로 최종 영상 합성"""

    clips = []

    for scene in storyboard['scenes']:
        scene_id = scene['id']
        frames_folder = frames_data[scene_id]['frames_folder']
        duration = scene['duration_seconds']
        text_overlay = scene['onscreen_text']

        # 씬별 클립 생성 (프레임 → mp4)
        clip_path = f"/tmp/{scene_id}.mp4"
        cmd = [
            'ffmpeg', '-r', '8',
            '-i', f'{frames_folder}/%04d.png',
            '-vf', f"drawtext=text='{text_overlay}':fontsize=48:x=(w-text_w)/2:y=h-100",
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
            '-t', str(duration),
            clip_path
        ]
        subprocess.run(cmd, check=True)
        clips.append(clip_path)

    # 클립 연결
    concat_list = '|'.join(clips)
    final_output = f"/outputs/video_{uuid.uuid4()}.mp4"

    cmd = [
        'ffmpeg', '-i', f'concat:{concat_list}',
        '-c', 'copy', final_output
    ]
    subprocess.run(cmd, check=True)

    return final_output
```

**출력** (Final Video):
```json
{
  "video_url": "https://cdn.sparklio.ai/videos/ad_12345.mp4",
  "duration": 15.0,
  "resolution": "1080x1920",
  "format": "9:16",
  "file_size_mb": 8.5,
  "generation_time_total": 180
}
```

---

## 4. API Contracts

### 4.1 POST `/video/storyboard`

**Request**:
```json
{
  "brand_id": "uuid",
  "product": "string",
  "target_audience": "string",
  "goal": "string",
  "duration": 15,
  "tone": "professional_warm",
  "channels": ["instagram_reels"]
}
```

**Response**:
```json
{
  "storyboard_id": "uuid",
  "storyboard": { /* Storyboard JSON */ },
  "estimated_cost": 0.50,
  "estimated_time": 180
}
```

---

### 4.2 POST `/video/generate`

**Request**:
```json
{
  "storyboard_id": "uuid",
  "engine_preference": "hybrid",  // auto | local | cloud
  "quality": "standard"  // draft | standard | premium
}
```

**Response**:
```json
{
  "job_id": "uuid",
  "status": "queued",
  "estimated_completion": "2025-11-14T17:10:00Z"
}
```

---

### 4.3 GET `/video/status/{job_id}`

**Response**:
```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 0.65,
  "current_step": "generating_motion_clips",
  "scenes_completed": 3,
  "scenes_total": 5,
  "eta_seconds": 45
}
```

---

### 4.4 GET `/video/result/{job_id}`

**Response**:
```json
{
  "job_id": "uuid",
  "status": "completed",
  "video_url": "https://cdn.sparklio.ai/videos/ad_12345.mp4",
  "thumbnail_url": "https://cdn.sparklio.ai/thumbnails/ad_12345.jpg",
  "metadata": {
    "duration": 15.0,
    "resolution": "1080x1920",
    "scenes_count": 5,
    "total_cost": 0.48,
    "generation_time": 178
  }
}
```

---

## 5. ComfyUI Integration

### 5.1 Required Nodes

**필수 노드**:
- `ComfyUI-Manager`: 노드 관리
- `AnimateDiff`: 모션 생성 엔진
- `AnimateDiff Motion Modules`: mm_sd15_v2, mm_sdxl_v10
- `ControlNet`: Depth, Canny, Lineart
- `IPAdapter`: 브랜드 요소 일관성
- `Efficiency Nodes`: 워크플로우 최적화

**선택 노드**:
- `ComfyUI-VideoHelperSuite`: 영상 출력 유틸리티
- `ComfyUI-Frame-Interpolation`: 프레임 보간

---

### 5.2 Workflow Template (Storyboard → Image)

**K:\sparklio_ai_marketing_studio\comfyui_workflows\ad_image_generation.json**:
```json
{
  "workflow_name": "Ad Image Generation (SDXL + LoRA)",
  "nodes": {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {"ckpt_name": "juggernaut_reborn.safetensors"}
    },
    "2": {
      "class_type": "LoraLoader",
      "inputs": {
        "model": ["1", 0],
        "lora_name": "{brand_lora_path}",
        "strength_model": 0.8
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "clip": ["1", 1],
        "text": "{positive_prompt}"
      }
    },
    "4": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["2", 0],
        "positive": ["3", 0],
        "steps": 30,
        "cfg": 7.5,
        "sampler_name": "dpmpp_2m_sde_gpu",
        "scheduler": "karras"
      }
    },
    "5": {
      "class_type": "SaveImage",
      "inputs": {"images": ["4", 0]}
    }
  }
}
```

---

## 6. Performance Targets

### 6.1 Generation Time

| 작업 | 목표 (P90) | 엔진 |
|------|-----------|------|
| Storyboard 생성 | < 10s | Qwen (Local) |
| Key Image 생성 (5장) | < 60s | ComfyUI (Local) |
| Motion Clip 생성 (5씬) | < 120s | AnimateDiff (Local) |
| FFmpeg Assembly | < 10s | Desktop Worker |
| **Total E2E** | **< 3분** | Hybrid |

### 6.2 Cost Targets

| 시나리오 | 비용 (USD) |
|---------|-----------|
| Local Only (Qwen + ComfyUI + AnimateDiff) | $0.01* |
| Hybrid (Qwen + GPT-4o + ComfyUI) | $0.15 |
| Cloud Premium (GPT-5 + VEo3) | $6.00 |

*전기료 + GPU 상각 기준

---

## 7. Quality Metrics

### 7.1 Video Quality

- **Resolution**: 최소 1080p (9:16)
- **Frame Rate**: 24fps (AnimateDiff: 8fps → 보간 24fps)
- **Bitrate**: 5-10 Mbps
- **Color Consistency**: 브랜드 팔레트 ±5% 오차

### 7.2 Brand Consistency

- **Logo Placement**: 100% 정확도
- **Tone Match**: ReviewerAgent 스코어 > 0.85
- **Text Readability**: 자막 가독성 > 90%

---

## 8. Error Handling

### 8.1 Retry Strategy

```python
RETRY_CONFIG = {
    'comfyui_generation': {
        'max_attempts': 3,
        'backoff': 'exponential',
        'timeout': 300
    },
    'ffmpeg_assembly': {
        'max_attempts': 2,
        'backoff': 'linear',
        'timeout': 60
    }
}
```

### 8.2 Fallback Chain

1. **AnimateDiff 실패** → 정지 이미지 + Ken Burns Effect
2. **Qwen 오프라인** → GPT-4o (Cloud) Fallback
3. **GPU Worker 다운** → 작업 큐 대기 + 사용자 알림

---

## 9. Future Enhancements (P2+)

- [ ] **Real-time Preview**: WebSocket 기반 실시간 미리보기
- [ ] **Voice Narration**: TTS 통합 (ElevenLabs, Azure TTS)
- [ ] **BGM Auto-match**: 분위기 기반 음악 자동 매칭
- [ ] **Multi-format Export**: 1:1, 16:9, 9:16 동시 출력
- [ ] **A/B Testing**: 씬 변형 자동 생성 및 성과 비교

---

**문서 버전**: 1.0
**최종 수정**: 2025-11-14 (금요일) 16:54
**작성자**: Team A
**상세 구현**: P1 Phase (Week 3-5)
