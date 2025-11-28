# Video Pipeline 설계 문서 V2

**작성일**: 2025-11-29
**작성자**: B팀 (Backend)
**상태**: Draft

---

## 목차

1. [개요](#1-개요)
2. [핵심 설계 원칙](#2-핵심-설계-원칙)
3. [PLAN/RENDER 2단계 플로우](#3-planrender-2단계-플로우)
4. [이미지 소스 전략 (3가지 모드)](#4-이미지-소스-전략-3가지-모드)
5. [VideoBuilder 역할 및 스펙](#5-videobuilder-역할-및-스펙)
6. [타임라인 스키마](#6-타임라인-스키마)
7. [VideoBuilder 내부 단계](#7-videobuilder-내부-단계)
8. [Ken Burns 효과 설계](#8-ken-burns-효과-설계)
9. [전환 효과 설계](#9-전환-효과-설계)
10. [텍스트 애니메이션 설계](#10-텍스트-애니메이션-설계)
11. [BGM 자동 생성/선택 로직](#11-bgm-자동-생성선택-로직)
12. [최종 인코딩 전략](#12-최종-인코딩-전략)
13. [세그먼트 선택 UI](#13-세그먼트-선택-ui)
14. [구현 계획](#14-구현-계획)
15. [API 엔드포인트](#15-api-엔드포인트)

---

## 1. 개요

### 1.1 목표

> **"타임라인 JSON(VideoTimelinePlanV1)을 입력받아서,
> ffmpeg 기반 VideoBuilder가 Ken Burns + 전환 + 텍스트 + BGM까지 처리하는 구조를
> PLAN / RENDER 2단계 플로우로 완성한다."**

### 1.2 핵심 문제 해결

| 문제 | 해결책 |
|------|--------|
| 영상 생성 비용이 비쌈 | PLAN/RENDER 분리로 확정 전까지는 LLM만 사용 |
| 이미지 재사용 vs 신규 생성 | 3가지 모드로 유저 선택권 제공 |
| ConceptBoard 획일성 우려 | 자유도 레벨 선택으로 해결 |
| Scene-first vs Image-first | 영상 유형에 따라 다르게 처리 |

---

## 2. 핵심 설계 원칙

### 2.1 VideoBuilder는 "렌더링 엔진"이다

**VideoBuilder(video_builder.py)** 의 책임은 딱 하나:

> "확정된 타임라인(이미지, 모션, 전환, 자막, BGM)을 받아
> ffmpeg를 이용해 실제 mp4 파일을 만들어내는 엔진"

- **무엇을 보여줄지(스토리/자막/컷 구성)** → VideoDirector / Storyboard / Copywriter에서 확정
- **VideoBuilder** → 그 설계서를 그대로 픽셀/오디오로 구현만 함

**입력은 JSON 타임라인, 출력은 mp4**로 고정.

### 2.2 기존 구현과의 매핑

> **이 문서는 기존 코드를 갈아엎는 것이 아니라, 기존 파일 위에 확장하는 방식입니다.**

| 파일 | 현재 상태 | V2 변경사항 |
|------|----------|-------------|
| `video_director.py` | 단일 모드 | `VideoDirectorMode.PLAN / RENDER` 분기 추가 |
| `storyboard_builder.py` | 스토리보드 생성 | Input에 `available_assets` 추가, 이미지 선택 로직 |
| `vision_generator.py` | 이미지 생성 | Level 1(REUSE)에서는 호출 안 함, Level 2/3만 사용 |
| `video_builder.py` | 기본 영상 빌드 | `VideoTimelinePlanV1` 기반으로 리팩터링 |

**VideoDirector 확장 예시:**

```python
# video_director.py 변경 (기존 코드 유지 + 확장)

class VideoDirectorMode(str, Enum):
    PLAN = "plan"      # 신규: 스크립트/스토리보드만 생성
    RENDER = "render"  # 신규: 실제 영상 렌더링

async def execute_v3(self, request: AgentRequest) -> AgentResponse:
    mode = request.payload.get("mode", VideoDirectorMode.RENDER)

    if mode == VideoDirectorMode.PLAN:
        # StoryboardBuilder + Copywriter 호출
        # → VideoPlanDraftV1 생성 후 반환 (영상 안 만듦)
        return await self._execute_plan_mode(request)
    else:
        # VisionGenerator + VideoTimelinePlanV1 + VideoBuilder 호출
        # → 실제 mp4 생성
        return await self._execute_render_mode(request)
```

**StoryboardBuilder 확장:**

```python
# storyboard_builder.py Input 확장

class StoryboardInput(BaseModel):
    # 기존 필드 유지
    concept: str
    script: Optional[str] = None

    # V2 추가 필드
    available_assets: Optional[List[str]] = None  # Asset Pool 이미지 ID 목록
    generation_mode: VideoGenerationMode = VideoGenerationMode.HYBRID
```

**VisionGenerator 호출 조건:**

```python
# video_director.py 내부

if generation_mode == VideoGenerationMode.REUSE:
    # VisionGenerator 호출 안 함 - 기존 이미지만 사용
    images = await self._fetch_assets_from_pool(available_assets)
elif generation_mode == VideoGenerationMode.HYBRID:
    # 일부만 VisionGenerator로 생성
    existing = await self._fetch_assets_from_pool(available_assets)
    new_images = await self.vision_generator.execute_v3(...)
    images = existing + new_images
else:  # CREATIVE
    # 전부 VisionGenerator로 생성
    images = await self.vision_generator.execute_v3(...)
```

### 2.3 계층적 자유도 모델

ConceptBoard가 "브랜드 DNA"로, 영상은 "해석"으로 동작:

```
ConceptBoard (브랜드 DNA)
├── 핵심 메시지, 톤, 컬러 팔레트
├── 타겟 오디언스
└── 비주얼 방향성
         ↓
    [자유도 레벨 선택]
         ↓
┌────────────────────────────────────────────────────┐
│ Level 1: 재사용 모드 (빠름, 저비용)                │
│   - 기존 이미지 100% 활용                          │
│   - 제품 쇼케이스, 간단한 소개 영상               │
│                                                    │
│ Level 2: 하이브리드 모드 (균형)                   │
│   - 핵심 이미지 재사용 + 영상전용 이미지 일부 생성│
│   - 대부분의 광고 영상                            │
│                                                    │
│ Level 3: 독립 모드 (창의성 최대)                  │
│   - ConceptBoard 가이드라인만 참조               │
│   - 스토리 → 신 → 이미지 순서로 새로 생성        │
│   - 브랜디드 숏폼, 바이럴 콘텐츠                  │
└────────────────────────────────────────────────────┘
```

---

## 3. PLAN/RENDER 2단계 플로우

### 3.1 왜 분리하는가?

| 단계 | 비용 | 작업 |
|------|------|------|
| PLAN | 저비용 (LLM만) | 스토리보드, 자막, 씬 구성 |
| RENDER | 고비용 (GPU/API) | 이미지 생성, 영상 인코딩 |

유저가 PLAN 결과를 확인하고 수정한 후에만 RENDER 진행 → 비용 절감

### 3.2 플로우 다이어그램

```
[유저 입력]
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    PLAN 단계 (LLM Only)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. VideoDirector(PLAN) 호출                                 │
│    ├── StoryboardBuilder: 씬 구성, 순서, 길이               │
│    ├── CopywriterAgent: 자막/나레이션 초안                  │
│    └── 타임라인 초안 생성                                    │
│                                                             │
│ 2. VideoPlanDraftV1 저장 (DB)                               │
│    └── script_status = 'draft'                              │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
[유저 확인/수정 UI]
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                   RENDER 단계 (GPU/API)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. VideoDirector(RENDER) 호출                               │
│    ├── VisionGeneratorAgent: 필요한 이미지 생성             │
│    └── VideoTimelinePlanV1 완성                             │
│                                                             │
│ 2. VideoBuilder 호출                                         │
│    ├── ffmpeg 렌더링                                        │
│    └── 최종 mp4 생성                                         │
│                                                             │
│ 3. VideoReviewerAgent: 품질 검수                             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
[완성된 영상]
```

### 3.3 VideoDirector 모드 정의

```python
class VideoGenerationMode(str, Enum):
    REUSE = "reuse"        # Level 1: 기존 이미지만
    HYBRID = "hybrid"      # Level 2: 혼합
    CREATIVE = "creative"  # Level 3: 신규 생성

class VideoDirectorMode(str, Enum):
    PLAN = "plan"          # 스크립트/스토리보드만 생성
    RENDER = "render"      # 실제 영상 렌더링
```

---

## 4. 이미지 소스 전략 (3가지 모드)

### 4.1 Scene-first vs Image-first 해결

| 영상 유형 | 순서 | 이유 |
|----------|------|------|
| 제품 쇼케이스 | 이미지 → 신 | 기존 제품 이미지 활용, 신은 그에 맞춰 구성 |
| 스토리텔링 광고 | 신 → 이미지 | 스토리가 먼저, 그에 맞는 이미지 생성 |
| 프로모션 영상 | 하이브리드 | 제품 이미지 + 분위기 이미지 새로 생성 |

### 4.2 모드별 동작

```python
class VideoPlanRequest(BaseModel):
    concept_board_id: str
    mode: VideoGenerationMode = VideoGenerationMode.HYBRID

    # Level 1, 2에서 사용
    available_assets: Optional[List[str]] = None  # 재사용 가능 이미지 ID

    # Level 3에서 사용
    override_story: Optional[str] = None  # ConceptBoard 스토리 대신 사용
```

### 4.3 Asset Pool 개념

```
ConceptBoard
    │
    ├── 프레젠테이션 → [이미지 A, B, C]
    ├── 상세페이지 → [이미지 D, E, F]
    ├── SNS 마케팅 → [이미지 G, H, I]
    └── 쇼츠/광고 영상 → ???
                        │
                        ▼
            ┌─────────────────────────────────┐
            │ Asset Pool에서 선택 가능:       │
            │ A, B, C, D, E, F, G, H, I       │
            │ + 신규 생성 가능                 │
            └─────────────────────────────────┘
```

---

## 5. VideoBuilder 역할 및 스펙

### 5.1 입력 (VideoTimelinePlanV1)

```json
{
  "canvas": {
    "width": 1080,
    "height": 1920,
    "fps": 24
  },
  "global_config": {
    "total_duration_sec": 15,
    "bg_color": "#000000",
    "music_mood": "warm_lofi"
  },
  "audio": {
    "bgm_mode": "auto",
    "bgm_url": null,
    "bgm_generated_id": null
  },
  "scenes": [
    {
      "scene_index": 1,
      "start_sec": 0.0,
      "end_sec": 3.0,
      "type": "image",
      "image": {
        "source_type": "asset",
        "url": "https://...",
        "fit_mode": "cover"
      },
      "motion": {
        "type": "kenburns",
        "pan_start": [0.5, 0.3],
        "pan_end": [0.5, 0.7],
        "zoom_start": 1.0,
        "zoom_end": 1.2,
        "easing": "ease_in_out"
      },
      "transition_out": {
        "type": "crossfade",
        "duration_sec": 0.5
      },
      "texts": [
        {
          "role": "subtitle",
          "text": "오늘, 잠시 멈춰보세요",
          "start_sec": 0.5,
          "end_sec": 2.8,
          "position": "bottom_center",
          "animation": {
            "in": "fade",
            "out": "fade",
            "in_duration_sec": 0.3,
            "out_duration_sec": 0.3
          }
        }
      ]
    }
  ]
}
```

### 5.2 출력 (VideoBuildResult)

```python
@dataclass
class VideoBuildResult:
    video_url: str
    thumbnail_url: str
    duration_sec: float
    fps: int
    file_size_bytes: int
    render_time_sec: float
```

---

## 6. 타임라인 스키마

### 6.1 스키마 파일 구조

**위치**: `backend/app/schemas/video_timeline.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum

# ============================================================================
# Enums
# ============================================================================

class SceneType(str, Enum):
    IMAGE = "image"
    TITLE_CARD = "title_card"
    BLANK = "blank"

class MotionType(str, Enum):
    NONE = "none"
    KENBURNS = "kenburns"

class TransitionType(str, Enum):
    CUT = "cut"
    CROSSFADE = "crossfade"
    SLIDE_LEFT = "slide_left"
    SLIDE_UP = "slide_up"
    ZOOM_OUT = "zoom_out"

class FitMode(str, Enum):
    COVER = "cover"
    CONTAIN = "contain"
    BLUR_BG = "blur_bg"

class TextRole(str, Enum):
    SUBTITLE = "subtitle"
    TITLE = "title"
    CTA = "cta"

class TextPosition(str, Enum):
    TOP_CENTER = "top_center"
    CENTER = "center"
    BOTTOM_CENTER = "bottom_center"

class AnimationType(str, Enum):
    NONE = "none"
    FADE = "fade"
    SLIDE_UP = "slide_up"

class EasingType(str, Enum):
    LINEAR = "linear"
    EASE_IN = "ease_in"
    EASE_OUT = "ease_out"
    EASE_IN_OUT = "ease_in_out"

class BGMMode(str, Enum):
    AUTO = "auto"
    LIBRARY = "library"
    GENERATED = "generated"

# ============================================================================
# Config Models
# ============================================================================

class CanvasConfig(BaseModel):
    width: int = 1080
    height: int = 1920
    fps: int = 24

class GlobalConfig(BaseModel):
    total_duration_sec: float
    bg_color: str = "#000000"
    music_mood: Optional[str] = None

class AudioConfig(BaseModel):
    bgm_mode: BGMMode = BGMMode.AUTO
    bgm_url: Optional[str] = None
    bgm_generated_id: Optional[str] = None

# ============================================================================
# Scene Components
# ============================================================================

class ImageConfig(BaseModel):
    source_type: Literal["asset", "generated"] = "asset"
    url: str
    fit_mode: FitMode = FitMode.COVER

class MotionConfig(BaseModel):
    type: MotionType = MotionType.NONE
    pan_start: List[float] = Field(default=[0.5, 0.5], min_items=2, max_items=2)
    pan_end: List[float] = Field(default=[0.5, 0.5], min_items=2, max_items=2)
    zoom_start: float = 1.0
    zoom_end: float = 1.0
    easing: EasingType = EasingType.EASE_IN_OUT

class TransitionConfig(BaseModel):
    type: TransitionType = TransitionType.CUT
    duration_sec: float = 0.5

class TextAnimationConfig(BaseModel):
    in_type: AnimationType = AnimationType.FADE
    out_type: AnimationType = AnimationType.FADE
    in_duration_sec: float = 0.3
    out_duration_sec: float = 0.3

class TextLayer(BaseModel):
    role: TextRole
    text: str
    start_sec: float
    end_sec: float
    position: TextPosition = TextPosition.BOTTOM_CENTER
    animation: TextAnimationConfig = Field(default_factory=TextAnimationConfig)

# ============================================================================
# Scene
# ============================================================================

class SceneConfig(BaseModel):
    scene_index: int
    start_sec: float
    end_sec: float
    type: SceneType = SceneType.IMAGE
    image: Optional[ImageConfig] = None
    motion: MotionConfig = Field(default_factory=MotionConfig)
    transition_out: TransitionConfig = Field(default_factory=TransitionConfig)
    texts: List[TextLayer] = Field(default_factory=list)

# ============================================================================
# Main Schema
# ============================================================================

class VideoTimelinePlanV1(BaseModel):
    """VideoBuilder의 단일 입력 타입"""
    version: str = "1.0"
    canvas: CanvasConfig = Field(default_factory=CanvasConfig)
    global_config: GlobalConfig  # JSON/YAML에서도 global_config 사용 (alias 제거)
    audio: AudioConfig = Field(default_factory=AudioConfig)
    scenes: List[SceneConfig]
```

> **네이밍 컨벤션**: 코드와 JSON 모두 `global_config`로 통일합니다.
> 이전 버전의 `"global"` alias는 혼동을 유발하므로 제거했습니다.

### 6.2 VideoPlanDraftV1 (유저 수정용)

```python
class SceneDraft(BaseModel):
    """유저가 수정하기 쉬운 단순화된 씬 구조"""
    scene_index: int
    image_id: Optional[str] = None  # Asset Pool의 이미지 ID
    image_url: Optional[str] = None
    caption: str = ""
    duration_sec: float = 3.0
    generate_new_image: bool = False  # True면 새로 생성
    image_prompt: Optional[str] = None  # 새 이미지 프롬프트

class VideoPlanDraftV1(BaseModel):
    """PLAN 단계 결과물 - 유저 수정 가능"""
    version: str = "1.0"
    project_id: str
    mode: VideoGenerationMode

    # 기본 설정
    total_duration_sec: float
    music_mood: str = "warm_lofi"

    # 씬 목록
    scenes: List[SceneDraft]

    # 상태
    script_status: Literal["draft", "user_edited", "approved"] = "draft"

    @validator("scenes")
    def validate_scene_count(cls, v):
        if len(v) < 3:
            raise ValueError("최소 3개 씬 필요")
        if len(v) > 6:
            raise ValueError("최대 6개 씬까지 지원 (V2 제한)")
        return v
```

### 6.3 V2 제약사항

> **현재 버전(V2)의 의도적 제한사항입니다. 이 제한은 MVP 단계에서 복잡도를 줄이기 위한 것입니다.**

| 항목 | 제약 | 이유 |
|------|------|------|
| `scenes.length` | 3 ~ 6개 | 숏폼 영상 기준 (15~30초) |
| `SceneDraft` 이미지 | `image_id` 또는 `image_url` 중 하나 필수 | 빈 씬 방지 |
| `generate_new_image` | V2에서는 REUSE 모드 전용으로 `false` 고정 | 이미지 생성은 HYBRID/CREATIVE 모드에서만 |
| `duration_sec` | 2.0 ~ 5.0초 | 씬당 적정 길이 |

**SceneDraft 검증 로직 예시:**

```python
@validator("scenes", each_item=True)
def validate_scene(cls, scene: SceneDraft):
    # 이미지 소스 필수
    if not scene.image_id and not scene.image_url:
        raise ValueError(f"Scene {scene.scene_index}: image_id 또는 image_url 필수")

    # 길이 제한
    if not (2.0 <= scene.duration_sec <= 5.0):
        raise ValueError(f"Scene {scene.scene_index}: duration은 2~5초 사이여야 함")

    return scene
```

---

## 7. VideoBuilder 내부 단계

VideoBuilder는 내부적으로 7단계로 동작:

```
1. 입력 검증 & 타임라인 전처리
        ↓
2. 이미지 준비 (다운로드/리사이즈/패딩)
        ↓
3. 씬별 이미지 → 영상 클립 생성 (Ken Burns 포함)
        ↓
4. 씬들 연결 + 전환 효과 처리
        ↓
5. 텍스트/자막/타이틀 카드 오버레이
        ↓
6. BGM 생성/선택 + 믹싱 + 라우드니스 보정
        ↓
7. 최종 인코딩 & 썸네일 생성
```

### 7.1 의사코드

```python
async def build_video_from_timeline(
    timeline: VideoTimelinePlanV1,
    job_id: str,
) -> VideoBuildResult:
    workdir = prepare_workdir(job_id)
    validate_timeline(timeline)

    # 1. 이미지 준비
    image_map = await download_and_prepare_images(timeline, workdir)

    # 2. 씬별 클립 생성 (Ken Burns 포함)
    scene_clips = []
    for scene in timeline.scenes:
        clip_path = await render_scene_clip(scene, image_map, workdir)
        scene_clips.append(clip_path)

    # 3. 씬 연결 + 전환
    video_no_text = await concatenate_with_transitions(scene_clips, timeline, workdir)

    # 4. 텍스트/자막/타이틀 오버레이
    video_with_text = await apply_text_layers(video_no_text, timeline, workdir)

    # 5. BGM 준비
    bgm_path = await prepare_bgm_track(timeline, workdir)

    # 6. BGM 믹싱 + 라우드니스 정규화 + 최종 인코딩
    final_video_path = await mux_video_and_audio(video_with_text, bgm_path, timeline, workdir)

    # 7. 썸네일 생성
    thumb_path = await extract_thumbnail(final_video_path, workdir)

    video_url, thumb_url = await upload_to_storage(final_video_path, thumb_path)

    return VideoBuildResult(
        video_url=video_url,
        thumbnail_url=thumb_url,
        duration_sec=timeline.global_config.total_duration_sec,
        fps=timeline.canvas.fps,
    )
```

---

## 8. Ken Burns 효과 설계

### 8.1 파라미터 해석

```json
"motion": {
  "type": "kenburns",
  "pan_start": [0.5, 0.3],
  "pan_end": [0.5, 0.7],
  "zoom_start": 1.0,
  "zoom_end": 1.2,
  "easing": "ease_in_out"
}
```

### 8.2 변환 로직

```python
# t: 0~1 사이 정규화된 시간
zoom(t) = zoom_start + (zoom_end - zoom_start) * E(t)
pan_x(t) = pan_start_x + (pan_end_x - pan_start_x) * E(t)
pan_y(t) = pan_start_y + (pan_end_y - pan_start_y) * E(t)

# E(t): easing 함수
linear:      E(t) = t
ease_in:     E(t) = t^2
ease_out:    E(t) = 1 - (1-t)^2
ease_in_out: E(t) = 3t^2 - 2t^3
```

### 8.3 FFmpeg 구현

```bash
ffmpeg -loop 1 -t 3 -i scene_1_base.png \
  -vf "zoompan=
    zoom='1+0.2*(on/72)':
    x='iw/2 - (iw/zoom)/2':
    y='ih*0.3 + (ih*0.4)*(on/72) - (ih/zoom)/2':
    d=72:
    fps=24:
    s=1080x1920" \
  scene_1_clip.mp4
```

### 8.4 Ken Burns 유틸 함수

```python
def build_kenburns_filter(motion: MotionConfig, duration: float, fps: int) -> str:
    """Ken Burns 파라미터 → ffmpeg zoompan filter 표현식"""
    total_frames = int(duration * fps)

    zoom_expr = f"'({motion.zoom_start}+({motion.zoom_end - motion.zoom_start})*(on/{total_frames}))'"

    # x, y는 pan 위치 기반 계산
    # ...

    return f"zoompan=zoom={zoom_expr}:x={x_expr}:y={y_expr}:d={total_frames}:fps={fps}:s=1080x1920"
```

---

## 9. 전환 효과 설계

### 9.1 지원 타입

| 타입 | xfade transition | 설명 |
|------|-----------------|------|
| cut | (사용 안 함) | 바로 이어붙이기 |
| crossfade | fade | 크로스 페이드 |
| slide_left | slideleft | 좌측으로 밀리며 전환 |
| slide_up | slideup | 위로 밀리며 전환 |
| zoom_out | zoomout | 줌 아웃하며 다음 장면 |

### 9.2 FFmpeg 구현

```bash
# 크로스페이드 예시
ffmpeg -i scene_1_clip.mp4 -i scene_2_clip.mp4 \
  -filter_complex " \
    [0:v][1:v] xfade=transition=fade:duration=0.5:offset=2.5[v]; \
    [0:a][1:a] acrossfade=d=0.5[a]" \
  -map "[v]" -map "[a]" output.mp4
```

### 9.3 전환 체인 빌더

```python
def build_transition_chain(scenes: List[SceneConfig], clips: List[str]) -> str:
    """씬 배열 → ffmpeg filter_complex 문자열"""
    filters = []
    current_offset = 0

    for i in range(len(scenes) - 1):
        scene = scenes[i]
        transition = scene.transition_out

        if transition.type == TransitionType.CUT:
            # concat으로 처리
            continue

        xfade_type = TRANSITION_MAP[transition.type]
        filters.append(
            f"[{i}:v][{i+1}:v]xfade=transition={xfade_type}:"
            f"duration={transition.duration_sec}:offset={current_offset}"
        )
        current_offset += scene.end_sec - scene.start_sec - transition.duration_sec

    return ";".join(filters)
```

---

## 10. 텍스트 애니메이션 설계

### 10.1 자막 (Subtitles)

- 위치: 화면 하단 중앙
- 애니메이션: fade in/out 또는 slide_up

```bash
# FFmpeg drawtext with alpha animation
-vf "drawtext=
  text='오늘, 잠시 멈춰보세요':
  fontfile=/path/NotoSansKR-Bold.otf:
  fontsize=48:
  fontcolor=white:
  x=(w-text_w)/2:
  y=h-150:
  alpha='if(between(t,0.5,2.8),
             if(lt(t,0.8),(t-0.5)/0.3,
               if(gt(t,2.5),(2.8-t)/0.3,1)
             ),
             0
        )'"
```

### 10.2 타이틀 카드 (Title / CTA)

- `scene.type = "title_card"`로 정의
- 배경: 단색(bg_color) 또는 blur_bg

```bash
# 타이틀 카드 예시
-vf "color=c=#000000:size=1080x1920:d=3[bg];
     [bg]drawtext=
       text='우리 카페의 여유를 만나보세요':
       fontfile=/path/NotoSansKR-Regular.otf:
       fontsize=64:
       fontcolor=white:
       x=(w-text_w)/2:
       y='h*0.7 - 50*(t-0.5)':
       alpha='if(between(t,0.5,2.5),1,0)'"
```

---

## 11. BGM 자동 생성/선택 로직

### 11.1 결정 로직

| bgm_mode | 동작 |
|----------|------|
| auto | 라이브러리에서 music_mood 매칭 → 없으면 MusicGen |
| library | bgm_url 직접 사용 |
| generated | bgm_generated_id로 기생성 트랙 조회 |

### 11.2 길이 맞추기

```bash
# BGM이 영상보다 길 경우: trim
ffmpeg -i bgm_input.mp3 -t 15 bgm_trimmed.mp3

# BGM이 영상보다 짧을 경우: loop
ffmpeg -i bgm_input.mp3 \
  -filter_complex "aloop=loop=-1:size=0:start=0,atrim=0:15,asetpts=PTS-STARTPTS" \
  bgm_trimmed.wav
```

### 11.3 라우드니스 정규화

```bash
ffmpeg -i bgm_trimmed.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  bgm_normalized.wav
```

---

## 12. 최종 인코딩 전략

### 12.1 기본 설정

| 항목 | 값 |
|------|---|
| 비디오 코덱 | H.264 (libx264) |
| 프로파일 | high |
| 해상도 | 1080x1920 |
| FPS | 24 |
| 오디오 코덱 | AAC |
| 비트레이트 | 4~6 Mbps |

### 12.2 FFmpeg 명령

```bash
ffmpeg -i composed_video_with_text.mp4 -i bgm_normalized.wav \
  -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -shortest final_output.mp4
```

### 12.3 썸네일 생성

```bash
ffmpeg -i final_output.mp4 -ss 1.0 -vframes 1 thumbnail.png
```

---

## 13. 세그먼트 선택 UI

### 13.1 챗 기반 선택

```
┌─────────────────────────────────────────────────────────────┐
│ 영상 제작을 시작할게요. 어떤 방식으로 진행할까요?           │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │  기존 이미지    │ │   하이브리드    │ │   새로 제작     │ │
│ │     활용       │ │                 │ │                 │ │
│ │ ─────────────  │ │ ─────────────   │ │ ─────────────   │ │
│ │ 프레젠테이션,  │ │ 핵심 이미지는   │ │ 영상 스토리에   │ │
│ │ SNS에서 만든   │ │ 재사용하고      │ │ 맞는 이미지를   │ │
│ │ 이미지 재사용  │ │ 일부만 새로     │ │ 처음부터 생성   │ │
│ │               │ │                 │ │                 │ │
│ │ 빠름 · 무료   │ │ 균형 · 일부비용 │ │ 창의적 · 비용↑  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 챗 흐름 시나리오

```
[AI] 영상 제작 방식을 선택해주세요
     ↓
[유저] "하이브리드"
     ↓
[AI] 재사용할 이미지를 선택해주세요
     (프레젠테이션에서 3장, SNS에서 2장 사용 가능)
     ↓
[유저] 이미지 2장 선택
     ↓
[AI] 나머지 4개 씬은 새로 생성할게요.
     스토리보드 초안입니다. 확인해주세요.
     ↓
[유저] 확인 / 수정
     ↓
[AI] 렌더링을 시작할까요? (예상 비용: $0.50)
```

### 13.3 장점

1. **맥락에 맞는 선택**: 유저가 현재 상황(기존 이미지 유무)을 보고 결정
2. **비용 투명성**: 각 옵션의 비용/시간 차이 명시
3. **점진적 공개**: 한번에 모든 옵션을 보여주지 않고 단계별 진행
4. **되돌리기 가능**: PLAN 단계에서 언제든 방식 변경 가능

---

## 14. 구현 계획

### 14.1 1순위 (MVP)

| 작업 | 담당 | 상태 |
|------|------|------|
| VideoTimelinePlanV1 스키마 작성 | Backend | 대기 |
| VideoPlanDraftV1 스키마 작성 | Backend | 대기 |
| VideoDirector PLAN/RENDER 모드 | Backend | 대기 |
| VideoBuilder MVP (cut + 고정 이미지 + 단순 BGM) | Backend | 대기 |
| /plan, /render, /status API | Backend | 대기 |

**MVP 목표**: "이미지 여러 장 → 스크립트 → 단순한 영상"

### 14.2 2순위 (기능 확장)

| 작업 | 담당 | 상태 |
|------|------|------|
| Ken Burns 효과 추가 | Backend | 대기 |
| xfade 기반 전환 효과 2~3종 | Backend | 대기 |
| 자막 레이어 기본 애니메이션 | Backend | 대기 |
| BGM 라우드니스 보정 | Backend | 대기 |
| PLAN UI (스크립트 확인/수정) | Frontend | 대기 |

### 14.3 3순위 (고도화)

| 작업 | 담당 | 상태 |
|------|------|------|
| title_card 씬 타입 & CTA 애니메이션 | Backend | 대기 |
| MusicGen 연동 | Backend | 대기 |
| ReviewerAgent 품질 자동 조정 | Backend | 대기 |
| Asset Pool UI | Frontend | 대기 |

---

## 15. API 엔드포인트

### 15.1 엔드포인트 목록

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/v1/video6/projects | 프로젝트 생성 |
| POST | /api/v1/video6/{project_id}/plan | PLAN 모드 실행 |
| PUT | /api/v1/video6/{project_id}/plan | 유저 수정본 저장 |
| POST | /api/v1/video6/{project_id}/render | RENDER 모드 실행 |
| GET | /api/v1/video6/{project_id}/status | 상태 조회 |
| GET | /api/v1/video6/{project_id}/assets | Asset Pool 조회 |

### 15.2 요청/응답 예시

**POST /plan**
```json
// Request
{
  "mode": "hybrid",
  "concept_board_id": "cb_123",
  "available_assets": ["img_001", "img_002"],
  "total_duration_sec": 15,
  "music_mood": "warm_lofi"
}

// Response
{
  "project_id": "vp_456",
  "plan_draft": {
    "version": "1.0",
    "scenes": [
      {"scene_index": 1, "image_id": "img_001", "caption": "...", "duration_sec": 3.0},
      {"scene_index": 2, "image_id": null, "generate_new_image": true, "image_prompt": "...", "duration_sec": 3.0}
    ],
    "script_status": "draft"
  }
}
```

**POST /render**
```json
// Request
{
  "plan_draft": { /* 유저가 수정한 VideoPlanDraftV1 */ }
}

// Response
{
  "job_id": "job_789",
  "status": "rendering",
  "estimated_time_sec": 120
}
```

---

## 부록: DB 스키마 변경

### video_projects 테이블

```sql
ALTER TABLE video_projects ADD COLUMN IF NOT EXISTS plan_draft_json JSONB;
ALTER TABLE video_projects ADD COLUMN IF NOT EXISTS script_status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE video_projects ADD COLUMN IF NOT EXISTS video_status VARCHAR(20) DEFAULT 'not_started';
ALTER TABLE video_projects ADD COLUMN IF NOT EXISTS generation_mode VARCHAR(20) DEFAULT 'hybrid';
```

---

**문서 끝**

마지막 업데이트: 2025-11-29 by B팀
