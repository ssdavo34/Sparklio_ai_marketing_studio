# ComfyUI Integration Specification

> **Version**: 1.0
> **Date**: 2025-11-14 (금요일) 17:00
> **Status**: Draft
> **Owner**: Team A (Docs & Architecture)
> **Purpose**: ComfyUI + Brand LoRA + ControlNet 통합 가이드

---

## 1. Executive Summary

Sparklio는 **ComfyUI**를 Desktop GPU Worker의 핵심 이미지/영상 생성 엔진으로 사용합니다.

**핵심 통합 포인트**:
- **Mac mini FastAPI** → ComfyUI REST API 호출
- **Brand Kit** → Custom LoRA 모델 자동 적용
- **ControlNet** → 씬 간 일관성 유지
- **AnimateDiff** → 이미지 → 모션 클립 변환
- **Workflow Templates** → JSON 기반 파이프라인 자동화

---

## 2. ComfyUI Server Setup

### 2.1 Installation (Desktop RTX 4070)

```bash
# ComfyUI 설치
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# ComfyUI-Manager 설치 (필수)
cd custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager
cd ..

# 실행
python main.py --listen 0.0.0.0 --port 8188
```

**Tailscale 연동**:
```bash
# Mac mini에서 접근 가능하도록 Tailscale DNS 등록
curl http://sparklio-desktop:8188
```

---

### 2.2 Required Custom Nodes

**필수 설치** (ComfyUI-Manager UI에서 검색 → Install):

1. **AnimateDiff Evolved**
   - 용도: 모션 클립 생성
   - 필요 모델: `mm_sd15_v2.ckpt`, `mm_sdxl_v10_beta.ckpt`

2. **ControlNet Preprocessors**
   - 용도: Depth, Canny, Lineart 전처리
   - 모델: `control_v11p_sd15_depth`, `control_sd15_canny`

3. **IPAdapter Plus**
   - 용도: 브랜드 마스코트/제품 이미지 일관성
   - 모델: `ip-adapter_sd15.safetensors`

4. **ComfyUI-Advanced-ControlNet**
   - 용도: Multi-ControlNet 동시 적용

5. **Efficiency Nodes for ComfyUI**
   - 용도: 워크플로우 간소화

**선택 설치**:
- `ComfyUI-VideoHelperSuite`: 영상 출력 헬퍼
- `ComfyUI-Frame-Interpolation`: 프레임 보간 (8fps → 24fps)

---

### 2.3 Model Downloads

**체크포인트** (`ComfyUI/models/checkpoints/`):
```
- juggernaut_reborn.safetensors (SDXL 기반, 광고 이미지 최적)
- sd_xl_base_1.0.safetensors (기본 SDXL)
```

**LoRA 모델** (`ComfyUI/models/loras/`):
```
- sparklio_brand_{brand_id}.safetensors (브랜드별 자동 생성)
```

**ControlNet 모델** (`ComfyUI/models/controlnet/`):
```
- control_v11p_sd15_depth.pth
- control_sd15_canny.pth
- control_sd15_lineart.pth
```

**AnimateDiff 모델** (`ComfyUI/custom_nodes/ComfyUI-AnimateDiff-Evolved/models/`):
```
- mm_sd15_v2.ckpt
- mm_sdxl_v10_beta.ckpt
```

---

## 3. API Integration

### 3.1 ComfyUI REST API

**기본 엔드포인트**:
```
POST http://sparklio-desktop:8188/prompt
GET  http://sparklio-desktop:8188/history/{prompt_id}
GET  http://sparklio-desktop:8188/view?filename={image_name}
```

**Python Client** (`backend/services/comfyui_client.py`):
```python
import aiohttp
import json
from typing import Dict, Any

class ComfyUIClient:
    def __init__(self, base_url: str = "http://sparklio-desktop:8188"):
        self.base_url = base_url
        self.client_id = str(uuid.uuid4())

    async def queue_prompt(self, workflow: Dict[str, Any]) -> str:
        """워크플로우 실행 큐에 추가"""
        payload = {
            "prompt": workflow,
            "client_id": self.client_id
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/prompt", json=payload) as resp:
                result = await resp.json()
                prompt_id = result['prompt_id']

        return prompt_id

    async def wait_for_completion(self, prompt_id: str, timeout: int = 300) -> Dict:
        """작업 완료 대기 및 결과 수신"""
        start_time = time.time()

        while True:
            if time.time() - start_time > timeout:
                raise TimeoutError(f"ComfyUI job {prompt_id} timed out")

            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/history/{prompt_id}") as resp:
                    history = await resp.json()

            if prompt_id in history:
                job = history[prompt_id]
                if job['status']['completed']:
                    return job['outputs']

            await asyncio.sleep(2)

    async def get_image(self, filename: str) -> bytes:
        """생성된 이미지 다운로드"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/view?filename={filename}") as resp:
                return await resp.read()

    async def execute_workflow(self, workflow: Dict) -> str:
        """워크플로우 실행 및 이미지 경로 반환"""
        prompt_id = await self.queue_prompt(workflow)
        outputs = await self.wait_for_completion(prompt_id)

        # SaveImage 노드에서 파일명 추출
        for node_id, output in outputs.items():
            if 'images' in output:
                filename = output['images'][0]['filename']
                return f"/outputs/{filename}"

        raise ValueError("No output image found")
```

---

## 4. Workflow Templates

### 4.1 Template: Ad Image Generation (SDXL + LoRA)

**파일**: `comfyui_workflows/ad_image_sdxl_lora.json`

```python
def build_ad_image_workflow(
    prompt: str,
    brand_lora_path: str,
    width: int = 1080,
    height: int = 1920,
    seed: int = -1
) -> Dict:
    """광고 이미지 생성 워크플로우"""

    return {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "juggernaut_reborn.safetensors"
            }
        },
        "2": {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["1", 0],
                "clip": ["1", 1],
                "lora_name": brand_lora_path,
                "strength_model": 0.8,
                "strength_clip": 0.7
            }
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["2", 1],
                "text": f"{prompt}, professional advertising photography, high quality, HD"
            }
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["2", 1],
                "text": "low quality, blurry, watermark, text, logo"
            }
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            }
        },
        "6": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["2", 0],
                "seed": seed,
                "steps": 30,
                "cfg": 7.5,
                "sampler_name": "dpmpp_2m_sde_gpu",
                "scheduler": "karras",
                "positive": ["3", 0],
                "negative": ["4", 0],
                "latent_image": ["5", 0]
            }
        },
        "7": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["6", 0],
                "vae": ["1", 2]
            }
        },
        "8": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["7", 0],
                "filename_prefix": "sparklio_ad"
            }
        }
    }
```

---

### 4.2 Template: AnimateDiff Motion Clip

**파일**: `comfyui_workflows/animatediff_motion.json`

```python
def build_animatediff_workflow(
    image_path: str,
    motion_module: str = "mm_sdxl_v10_beta.ckpt",
    frame_count: int = 24,
    motion_scale: float = 0.7
) -> Dict:
    """AnimateDiff 모션 클립 생성 워크플로우"""

    return {
        "1": {
            "class_type": "LoadImage",
            "inputs": {
                "image": image_path
            }
        },
        "2": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "juggernaut_reborn.safetensors"
            }
        },
        "3": {
            "class_type": "AnimateDiffLoader",
            "inputs": {
                "model_name": motion_module
            }
        },
        "4": {
            "class_type": "AnimateDiffModuleLoader",
            "inputs": {
                "model": ["2", 0],
                "motion_module": ["3", 0]
            }
        },
        "5": {
            "class_type": "AnimateDiffSampler",
            "inputs": {
                "model": ["4", 0],
                "image": ["1", 0],
                "frame_count": frame_count,
                "motion_scale": motion_scale,
                "context_length": 16,
                "seed": -1
            }
        },
        "6": {
            "class_type": "VHS_VideoCombine",  # VideoHelperSuite
            "inputs": {
                "images": ["5", 0],
                "frame_rate": 8,
                "format": "image/png",
                "pingpong": False,
                "save_output": True
            }
        }
    }
```

**Note**: 출력은 프레임 시퀀스로, FFmpeg가 최종 mp4로 조립합니다.

---

### 4.3 Template: ControlNet Depth Consistency

**용도**: 씬 간 구도 일관성 유지

```python
def build_controlnet_depth_workflow(
    prompt: str,
    reference_image_path: str,  # 이전 씬 이미지
    depth_strength: float = 0.8
) -> Dict:
    """ControlNet Depth로 구도 일관성 유지"""

    return {
        "1": {
            "class_type": "LoadImage",
            "inputs": {"image": reference_image_path}
        },
        "2": {
            "class_type": "ControlNetApply",
            "inputs": {
                "conditioning": ["4", 0],  # positive prompt
                "control_net": ["3", 0],
                "image": ["1", 0],
                "strength": depth_strength
            }
        },
        "3": {
            "class_type": "ControlNetLoader",
            "inputs": {
                "control_net_name": "control_v11p_sd15_depth.pth"
            }
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["5", 1],
                "text": prompt
            }
        },
        # ... 나머지 KSampler, VAEDecode, SaveImage 노드
    }
```

---

## 5. Brand Kit Integration

### 5.1 Brand LoRA Generation

**처리 시점**: 브랜드 최초 등록 시

**입력**:
```json
{
  "brand_id": "uuid",
  "brand_images": [
    "https://cdn.sparklio.ai/brands/logo.png",
    "https://cdn.sparklio.ai/brands/product_01.png",
    "https://cdn.sparklio.ai/brands/style_guide.png"
  ],
  "brand_colors": ["#F2EDE8", "#7C4D3A"],
  "style_keywords": ["minimal", "natural", "premium"]
}
```

**처리** (`backend/agents/brand_model_updater_agent.py`):
```python
async def train_brand_lora(brand_id: str, brand_images: List[str]) -> str:
    """브랜드 LoRA 모델 학습"""

    # 1. 이미지 다운로드 및 전처리
    training_images = await prepare_training_images(brand_images)

    # 2. LoRA 학습 (Kohya SS or AutoTrain)
    lora_model_path = await train_lora_model(
        base_model="juggernaut_reborn.safetensors",
        images=training_images,
        epochs=1000,
        learning_rate=1e-4,
        output_name=f"sparklio_brand_{brand_id}.safetensors"
    )

    # 3. ComfyUI loras 폴더에 복사
    target_path = f"/ComfyUI/models/loras/sparklio_brand_{brand_id}.safetensors"
    shutil.copy(lora_model_path, target_path)

    return target_path
```

**출력**: `sparklio_brand_{brand_id}.safetensors`

---

### 5.2 Brand Kit Application

**Celery Task**:
```python
@celery.task
async def apply_brand_kit(scene: dict, brand_kit: dict) -> dict:
    """씬에 브랜드 킷 자동 적용"""

    # LoRA 경로
    lora_path = brand_kit.get('lora_model_path')

    # 브랜드 컬러 주입
    prompt = scene['image_prompt']
    colors_prompt = f", brand colors: {', '.join(brand_kit['brand_colors'])}"
    enhanced_prompt = prompt + colors_prompt

    # ControlNet 일관성 체크
    if scene.get('requires_consistency'):
        controlnet_mode = 'depth'
        reference_image = brand_kit.get('reference_product_image')
    else:
        controlnet_mode = None
        reference_image = None

    # 워크플로우 빌드
    workflow = build_ad_image_workflow(
        prompt=enhanced_prompt,
        brand_lora_path=lora_path,
        controlnet_mode=controlnet_mode,
        reference_image=reference_image
    )

    return workflow
```

---

## 6. Quality Control

### 6.1 Image Quality Checks

**VisionAnalyzerAgent 통합**:
```python
async def analyze_generated_image(image_path: str, brand_kit: dict) -> dict:
    """생성 이미지 품질 분석"""

    # 1. 색상 일치도
    image_colors = extract_dominant_colors(image_path)
    color_match_score = calculate_color_similarity(
        image_colors, brand_kit['brand_colors']
    )

    # 2. 해상도/선명도
    resolution_score = check_resolution(image_path, min_width=1080)
    sharpness_score = calculate_sharpness(image_path)

    # 3. 브랜드 요소 존재 여부
    if brand_kit.get('logo_detection_enabled'):
        logo_detected = detect_logo(image_path, brand_kit['logo_template'])
    else:
        logo_detected = None

    return {
        'overall_score': (color_match_score + resolution_score + sharpness_score) / 3,
        'color_match': color_match_score,
        'resolution': resolution_score,
        'sharpness': sharpness_score,
        'logo_detected': logo_detected,
        'pass': color_match_score > 0.8 and resolution_score > 0.9
    }
```

---

### 6.2 Retry on Quality Failure

```python
@celery.task(bind=True, max_retries=3)
async def generate_with_quality_check(self, scene: dict, brand_kit: dict):
    """품질 체크 포함 이미지 생성"""

    workflow = apply_brand_kit(scene, brand_kit)
    image_path = await comfy_client.execute_workflow(workflow)

    # 품질 분석
    quality_report = await analyze_generated_image(image_path, brand_kit)

    if not quality_report['pass']:
        # 재시도 (seed 변경)
        logger.warning(f"Quality check failed: {quality_report}")
        raise self.retry(countdown=10, exc=QualityCheckError())

    return image_path
```

---

## 7. Performance Optimization

### 7.1 Workflow Caching

```python
# Workflow 템플릿 캐싱
WORKFLOW_CACHE = {}

def get_cached_workflow(template_name: str, **params) -> Dict:
    """워크플로우 캐싱으로 빌드 시간 단축"""

    cache_key = f"{template_name}:{hash(frozenset(params.items()))}"

    if cache_key not in WORKFLOW_CACHE:
        workflow = build_workflow_from_template(template_name, **params)
        WORKFLOW_CACHE[cache_key] = workflow

    return WORKFLOW_CACHE[cache_key]
```

---

### 7.2 Batch Processing

```python
async def generate_images_batch(scenes: List[dict], brand_kit: dict) -> List[str]:
    """씬 배치 처리로 병렬 생성"""

    tasks = []

    for scene in scenes:
        workflow = apply_brand_kit(scene, brand_kit)
        task = comfy_client.execute_workflow(workflow)
        tasks.append(task)

    # 병렬 실행 (ComfyUI는 큐 기반이므로 순차 처리되지만 API 호출은 병렬)
    image_paths = await asyncio.gather(*tasks)

    return image_paths
```

---

## 8. Monitoring & Debugging

### 8.1 ComfyUI Logs

```python
async def monitor_comfyui_health() -> dict:
    """ComfyUI 서버 상태 체크"""

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{COMFY_URL}/system_stats") as resp:
                stats = await resp.json()

        return {
            'status': 'online',
            'gpu_utilization': stats.get('gpu_utilization'),
            'vram_used_gb': stats.get('vram_used') / 1024**3,
            'queue_size': stats.get('queue_remaining')
        }
    except Exception as e:
        return {'status': 'offline', 'error': str(e)}
```

---

### 8.2 Error Recovery

```python
COMMON_ERRORS = {
    'CUDA out of memory': 'reduce_batch_size',
    'Model not found': 'download_missing_model',
    'Workflow validation failed': 'check_node_connections'
}

async def handle_comfyui_error(error: Exception) -> str:
    """ComfyUI 에러 자동 복구"""

    error_msg = str(error)

    for pattern, recovery_action in COMMON_ERRORS.items():
        if pattern in error_msg:
            logger.info(f"Applying recovery action: {recovery_action}")
            await apply_recovery_action(recovery_action)
            return recovery_action

    raise error
```

---

## 9. Future Enhancements (P2+)

- [ ] **Auto-Workflow Optimization**: 씬 특성 기반 자동 파라미터 튜닝
- [ ] **Multi-GPU Support**: 여러 GPU로 병렬 처리
- [ ] **Real-time Preview**: WebSocket 기반 생성 과정 실시간 스트리밍
- [ ] **LoRA Marketplace**: 사전 학습된 스타일 LoRA 제공
- [ ] **ControlNet Multi-mode**: Depth + Canny + Lineart 동시 적용

---

**문서 버전**: 1.0
**최종 수정**: 2025-11-14 (금요일) 17:00
**작성자**: Team A
**상세 구현**: P1 Phase (Week 3-4)
