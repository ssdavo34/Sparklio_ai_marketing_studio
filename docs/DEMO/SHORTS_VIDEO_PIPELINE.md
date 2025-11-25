# Shorts Video Pipeline

**문서 버전**: v1.0
**작성일**: 2025-11-25
**작성자**: A팀 (백엔드/문서 총괄)
**목적**: 쇼츠/광고 영상 자동 생성 파이프라인 정의

**상위 문서**: [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md)
**관련 문서**: [AGENTS_DEMO_SPEC.md](./AGENTS_DEMO_SPEC.md), [BACKEND_DEMO_APIS.md](./BACKEND_DEMO_APIS.md)

---

## 1. 목표

> **"콘셉트 기반으로 20-30초 쇼츠 영상을 자동 생성"**

**파이프라인 구성**:
```
텍스트 (Concept) → 스크립트 → 이미지 → 영상
```

**최종 산출물**:
- Shorts Script (씬 단위 스토리보드)
- 키프레임 이미지 (각 씬별)
- MP4 영상 (9:16 세로 비율, 720p 또는 1080p)

---

## 2. 전체 플로우

### 2.1 파이프라인 단계

```
1. ShortsScriptAgent
   └─> Concept → Shorts Script (씬 단위)
       Output: 6-7개 씬, Hook → Problem → Solution → Feature → Benefit → CTA

2. VisualPromptAgent (각 씬별 병렬)
   └─> 씬 → ComfyUI 프롬프트
       Output: 프롬프트 문자열 + 파라미터

3. ComfyUI 호출 (각 씬별 병렬)
   └─> 프롬프트 → 키프레임 이미지
       Output: PNG/WebP 이미지 (1024x1024 or 1080x1920)

4. VideoBuilder (ffmpeg)
   └─> 키프레임 이미지 + 자막 → MP4 영상
       Output: shorts-001.mp4 (9:16, 720p/1080p)
```

### 2.2 소요 시간 (예상)

| 단계 | 시간 | 병렬화 |
|-----|------|-------|
| ShortsScriptAgent | 10-15초 | - |
| VisualPromptAgent | 3-5초 × 6씬 | 병렬 (총 3-5초) |
| ComfyUI 이미지 생성 | 15-20초 × 6씬 | 병렬 (총 60-90초) |
| VideoBuilder (ffmpeg) | 10-20초 | - |
| **전체** | **2-3분** | |

---

## 3. ShortsScriptAgent 스펙

### 3.1 역할

**Concept 기반 쇼츠 스크립트 생성** (씬 단위)

### 3.2 입력

```python
{
  "concept": {
    "concept_id": "concept-a",
    "title": "상큼한 하루 리프레시",
    "core_message": "제주 감귤의 상큼함으로 하루를 상쾌하게",
    "tone_keywords": ["밝은", "경쾌한", "활기찬"]
  },
  "duration": 25,  # seconds, default: 20-30
  "brand_kit": {
    "name": "제주 감귤 브랜드",
    "colors": ["#FFA500", "#FFD700"]
  }
}
```

### 3.3 출력

```python
{
  "shorts_id": "shorts-001",
  "concept_id": "concept-a",
  "title": "상큼한 하루 리프레시 - 쇼츠",
  "duration": 25,
  "scenes": [
    {
      "scene_number": 1,
      "duration": "0-4초",
      "role": "Hook",
      "visual": "아침 침대에서 일어나는 모습",
      "narration": "아침마다 피곤하신가요?",
      "onscreen_text": "피곤한 아침..."
    },
    {
      "scene_number": 2,
      "duration": "4-8초",
      "role": "Problem",
      "visual": "시중 젤리 제품들 (합성 첨가물 표시)",
      "narration": "시중 젤리는 합성 첨가물이 가득!",
      "onscreen_text": "합성 첨가물 NO!"
    },
    {
      "scene_number": 3,
      "duration": "8-12초",
      "role": "Solution",
      "visual": "제주 감귤 농장, 신선한 감귤",
      "narration": "국내산 제주 감귤 100%로 만든 건강한 젤리",
      "onscreen_text": "국내산 감귤 100%"
    },
    {
      "scene_number": 4,
      "duration": "12-17초",
      "role": "Feature",
      "visual": "젤리 클로즈업, 반짝이는 비주얼",
      "narration": "비타민 C 풍부, 어린이도 안심!",
      "onscreen_text": "비타민 C 가득!"
    },
    {
      "scene_number": 5,
      "duration": "17-22초",
      "role": "Benefit",
      "visual": "젤리 먹고 활기차게 하루 시작하는 모습",
      "narration": "상큼한 한 입으로 하루를 리프레시!",
      "onscreen_text": "상큼한 하루 리프레시"
    },
    {
      "scene_number": 6,
      "duration": "22-25초",
      "role": "CTA",
      "visual": "제품 패키지 + 구매 링크",
      "narration": "지금 바로 만나보세요!",
      "onscreen_text": "지금 구매하기 →"
    }
  ]
}
```

### 3.4 Prompt 구조

```
System: You are a professional shorts video script writer for TikTok/YouTube Shorts.

User:
다음 콘셉트를 바탕으로 {duration}초 쇼츠 스크립트를 작성해주세요.
Hook → Problem → Solution → Feature → Benefit → CTA 구조를 따르세요.

[콘셉트]
{concept}

[브랜드 정보]
{brand_kit}

[출력 형식]
- 씬 번호
- 길이 (초)
- 역할 (Hook/Problem/Solution/Feature/Benefit/CTA)
- 화면 설명 (구체적으로)
- 내레이션 (간결하게)
- 자막 (10자 이내)

[주의사항]
- 각 씬은 3-5초 길이
- 화면 설명은 이미지 생성에 사용되므로 구체적으로
- 내레이션은 자연스럽게 읽을 수 있는 길이
- 자막은 핵심만 짧게
```

### 3.5 사용 LLM

- **OpenAI GPT-4o** (`gpt-4o`)
- Temperature: 0.4 (구조화된 출력)

---

## 4. VisualPromptAgent 스펙

### 4.1 역할

**씬 설명 → ComfyUI 프롬프트 생성**

### 4.2 입력

```python
{
  "scene": {
    "scene_number": 1,
    "visual": "아침 침대에서 일어나는 모습",
    "role": "Hook"
  },
  "concept": {
    "tone_keywords": ["밝은", "경쾌한"]
  },
  "brand_kit": {
    "colors": ["#FFA500", "#FFD700"]
  }
}
```

### 4.3 출력

```python
{
  "prompt": "Bright morning scene, person waking up in bed, sunlight through window, warm orange and yellow tones, cheerful atmosphere, high quality, cinematic lighting",
  "negative_prompt": "dark, gloomy, low quality, blurry, ugly, distorted",
  "parameters": {
    "width": 1080,
    "height": 1920,  # 9:16 세로 비율
    "steps": 30,
    "cfg_scale": 7.0,
    "seed": -1  # random
  }
}
```

### 4.4 Prompt 생성 전략

**구조**:
```
{scene visual} + {tone keywords} + {color palette} + {quality keywords}
```

**예시**:
- Scene: "아침 침대에서 일어나는 모습"
- Tone: "밝은, 경쾌한"
- Color: "#FFA500 (오렌지), #FFD700 (골드)"
- Quality: "high quality, cinematic lighting"

→ "Bright morning scene, person waking up in bed, sunlight through window, warm orange and yellow tones, cheerful atmosphere, high quality, cinematic lighting"

**Negative Prompt**:
- 기본: "dark, gloomy, low quality, blurry, ugly, distorted"
- Tone 반대: 밝은 → dark, gloomy 제거

### 4.5 사용 LLM

- **OpenAI GPT-4o mini** (`gpt-4o-mini`)
- Temperature: 0.6 (창의적 프롬프트)

---

## 5. ComfyUI 통합

### 5.1 ComfyUI 설정

**서버 정보**:
- URL: `http://100.123.51.6:8188`
- GPU: RTX 4070 SUPER 12GB VRAM
- 모델: Stable Diffusion XL 또는 Flux

### 5.2 워크플로우

**기본 워크플로우** (JSON):
```json
{
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "seed": -1,
      "steps": 30,
      "cfg": 7.0,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1.0,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    }
  },
  // ... (전체 워크플로우)
}
```

### 5.3 API 호출

```python
import requests
import json

def generate_image(prompt, negative_prompt, width=1080, height=1920):
    workflow = load_workflow_template()

    # 프롬프트 설정
    workflow["6"]["inputs"]["text"] = prompt
    workflow["7"]["inputs"]["text"] = negative_prompt
    workflow["5"]["inputs"]["width"] = width
    workflow["5"]["inputs"]["height"] = height

    # ComfyUI 호출
    response = requests.post(
        "http://100.123.51.6:8188/prompt",
        json={"prompt": workflow}
    )

    prompt_id = response.json()["prompt_id"]

    # 결과 폴링
    while True:
        status = requests.get(f"http://100.123.51.6:8188/history/{prompt_id}")
        if status.json().get(prompt_id, {}).get("status", {}).get("completed"):
            break
        time.sleep(2)

    # 이미지 다운로드
    images = status.json()[prompt_id]["outputs"]["9"]["images"]
    image_url = f"http://100.123.51.6:8188/view?filename={images[0]['filename']}"

    return image_url
```

### 5.4 성능 최적화

**병렬 처리**:
- 각 씬별 이미지 생성을 병렬로 실행 (최대 6개 동시)
- GPU 메모리 고려: RTX 4070 SUPER는 최대 3-4개 동시 처리 가능

**캐싱**:
- 동일한 프롬프트는 캐싱 (동일 Concept 재생성 시)

---

## 6. VideoBuilder 스펙 (ffmpeg)

### 6.1 역할

**키프레임 이미지 + 자막 → MP4 영상 조립**

### 6.2 입력

```python
{
  "shots": [
    {
      "scene_number": 1,
      "image_url": "https://minio.../keyframe-1.png",
      "duration": 4,  # seconds
      "onscreen_text": "피곤한 아침..."
    },
    {
      "scene_number": 2,
      "image_url": "https://minio.../keyframe-2.png",
      "duration": 4,
      "onscreen_text": "합성 첨가물 NO!"
    },
    // ... 총 6개 씬
  ],
  "output_format": "mp4",
  "resolution": "1080x1920",  # 9:16
  "fps": 30
}
```

### 6.3 출력

```python
{
  "video_url": "https://minio.../shorts-001.mp4",
  "format": "mp4",
  "resolution": "1080x1920",
  "duration": 25,  # seconds
  "file_size": 12345678  # bytes
}
```

### 6.4 ffmpeg 처리 과정

#### Step 1: 이미지 → 비디오 컷 생성 (각 씬별)

```bash
# 씬 1: 4초 길이 비디오
ffmpeg -loop 1 -t 4 -i keyframe-1.png \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -pix_fmt yuv420p \
  scene-1.mp4

# 씬 2: 4초 길이 비디오
ffmpeg -loop 1 -t 4 -i keyframe-2.png \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -pix_fmt yuv420p \
  scene-2.mp4

# ... (나머지 씬)
```

#### Step 2: 자막 오버레이

```bash
ffmpeg -i scene-1.mp4 \
  -vf "drawtext=fontfile=/path/to/NotoSansKR-Bold.ttf:text='피곤한 아침...':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-150:box=1:boxcolor=black@0.5:boxborderw=10" \
  -c:a copy \
  scene-1-subtitle.mp4
```

#### Step 3: 씬 전환 효과 + 병합

```bash
# concat.txt 파일 생성
file 'scene-1-subtitle.mp4'
file 'scene-2-subtitle.mp4'
file 'scene-3-subtitle.mp4'
file 'scene-4-subtitle.mp4'
file 'scene-5-subtitle.mp4'
file 'scene-6-subtitle.mp4'

# 병합 (fade 효과 포함)
ffmpeg -f concat -safe 0 -i concat.txt \
  -filter_complex "\
    [0:v]fade=t=out:st=3:d=1[v0]; \
    [1:v]fade=t=in:st=0:d=1[v1]; \
    [v0][v1]concat=n=2:v=1:a=0[v01]; \
    [2:v]fade=t=in:st=0:d=1[v2]; \
    [v01][v2]concat=n=2:v=1:a=0[v012]; \
    ... \
  " \
  -c:v libx264 -preset fast -crf 23 \
  -pix_fmt yuv420p \
  shorts-001.mp4
```

### 6.5 Python 래퍼 함수

```python
import subprocess
import os

def build_video(shots, output_path):
    temp_dir = "/tmp/shorts_build"
    os.makedirs(temp_dir, exist_ok=True)

    # Step 1: 각 씬별 비디오 생성
    scene_files = []
    for i, shot in enumerate(shots):
        scene_num = i + 1
        image_path = download_image(shot["image_url"])
        scene_file = f"{temp_dir}/scene-{scene_num}.mp4"

        # 이미지 → 비디오
        subprocess.run([
            "ffmpeg", "-y",
            "-loop", "1",
            "-t", str(shot["duration"]),
            "-i", image_path,
            "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            scene_file
        ])

        # Step 2: 자막 오버레이
        scene_subtitle_file = f"{temp_dir}/scene-{scene_num}-subtitle.mp4"
        subprocess.run([
            "ffmpeg", "-y",
            "-i", scene_file,
            "-vf", f"drawtext=fontfile=/path/to/NotoSansKR-Bold.ttf:text='{shot['onscreen_text']}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-150:box=1:boxcolor=black@0.5:boxborderw=10",
            "-c:a", "copy",
            scene_subtitle_file
        ])

        scene_files.append(scene_subtitle_file)

    # Step 3: concat.txt 생성
    concat_file = f"{temp_dir}/concat.txt"
    with open(concat_file, "w") as f:
        for scene_file in scene_files:
            f.write(f"file '{scene_file}'\n")

    # Step 4: 병합
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        output_path
    ])

    # Cleanup
    for scene_file in scene_files:
        os.remove(scene_file)
    os.remove(concat_file)

    return output_path
```

### 6.6 성능

- **6개 씬 기준**: 10-20초
- **출력 파일 크기**: 10-20MB (25초, 720p 기준)

---

## 7. 챗 연동 방법

### 7.1 Chat 입력 → Shorts 생성

**유저 입력**:
```
Concept A로 20초짜리 쇼츠 만들어줘
```

**Chat 응답 시퀀스**:
```typescript
// Message 1
{
  role: 'assistant',
  content: 'Concept A 기준으로 쇼츠 스크립트를 만들고 있어요...'
}

// Message 2
{
  role: 'assistant',
  content: '쇼츠 스크립트가 완성되었습니다!\n총 6개 씬, 25초 분량입니다.',
  nextActions: [
    { label: '쇼츠 프리뷰 보기', action: 'open_shorts', payload: { conceptId: 'concept-a' } },
    { label: '키프레임 이미지 생성', action: 'generate_keyframes' },
  ]
}

// Message 3 (키프레임 생성 선택 시)
{
  role: 'assistant',
  content: '키프레임 이미지를 생성하고 있어요... (1/6)'
}

// ... (2/6, 3/6, ..., 6/6)

// Message 4
{
  role: 'assistant',
  content: '모든 키프레임 이미지가 준비되었습니다!\n이제 영상을 조립할게요.'
}

// Message 5
{
  role: 'assistant',
  content: '영상을 조립 중입니다... (ffmpeg 처리 중)'
}

// Message 6 (완료)
{
  role: 'assistant',
  content: '✨ 쇼츠 영상이 완성되었습니다!\n아래에서 바로 재생할 수 있어요.',
  nextActions: [
    { label: '영상 재생', action: 'play_video' },
    { label: '영상 다운로드', action: 'download_video' },
  ]
}
```

---

## 8. 데모 V1 최소 범위

### 8.1 필수 구현 (Must Have)

- ✅ ShortsScriptAgent (텍스트 스크립트 생성)
- ✅ Shorts Script Preview (씬 단위 리스트 표시)

### 8.2 선택 구현 (Nice to Have)

- 🔲 VisualPromptAgent (ComfyUI 프롬프트 생성)
- 🔲 ComfyUI 통합 (키프레임 이미지 생성)
- 🔲 VideoBuilder (ffmpeg 영상 조립)

**발표 시 전략**:
- **필수**: 스크립트 생성 + 텍스트 프리뷰 보여주기
- **선택**: 시간 여유 있을 시 키프레임 이미지까지
- **미래 비전**: "영상 조립까지 자동화 예정" 언급

---

**문서 상태**: ✅ 완성
**다음 문서**: [DEMO_QA_CHECKLIST.md](./DEMO_QA_CHECKLIST.md)
**버전**: v1.0
**최종 수정**: 2025-11-25
