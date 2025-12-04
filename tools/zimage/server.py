"""
Z-Image Server

빠른 이미지 생성을 위한 경량 REST API 서버
- SDXL 기반 고품질 이미지 생성
- 8스텝 기본 (빠른 생성)
- RTX 4070 최적화

포트: 7860 (기본)
"""

import os
import io
import base64
import random
import time
import logging
from typing import Optional
from contextlib import asynccontextmanager

import torch
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zimage")

# ============================================================================
# Configuration
# ============================================================================

MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"
# 로컬 모델 경로 (다운로드 후 사용 가능)
LOCAL_MODEL_PATH = os.environ.get("ZIMAGE_MODEL_PATH", None)

# 디바이스 설정
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

logger.info(f"Device: {DEVICE}, Dtype: {DTYPE}")

# ============================================================================
# Global Variables
# ============================================================================

pipe = None  # Diffusion Pipeline

# ============================================================================
# Request/Response Models
# ============================================================================

class GenerateRequest(BaseModel):
    """이미지 생성 요청"""
    prompt: str = Field(..., description="생성할 이미지 프롬프트")
    negative_prompt: str = Field(
        "low quality, blurry, distorted, ugly, bad anatomy",
        description="네거티브 프롬프트"
    )
    width: int = Field(1024, ge=256, le=2048, description="이미지 너비")
    height: int = Field(1024, ge=256, le=2048, description="이미지 높이")
    steps: int = Field(8, ge=1, le=50, description="샘플링 스텝 수")
    cfg_scale: float = Field(7.0, ge=1.0, le=20.0, description="CFG 스케일")
    seed: int = Field(-1, description="랜덤 시드 (-1이면 자동)")
    model: str = Field("sdxl", description="사용할 모델")
    sampler: str = Field("euler", description="샘플러")
    scheduler: str = Field("normal", description="스케줄러")


class GenerateResponse(BaseModel):
    """이미지 생성 응답"""
    image: str = Field(..., description="Base64 인코딩된 이미지")
    seed: int = Field(..., description="사용된 시드")
    generation_time: float = Field(..., description="생성 시간 (초)")
    width: int
    height: int
    model: str


class HealthResponse(BaseModel):
    """헬스 체크 응답"""
    status: str
    device: str
    model_loaded: bool
    vram_used: Optional[float] = None
    vram_total: Optional[float] = None


# ============================================================================
# Pipeline Initialization
# ============================================================================

def load_pipeline():
    """Diffusion 파이프라인 로드"""
    global pipe

    from diffusers import StableDiffusionXLPipeline, EulerDiscreteScheduler

    logger.info(f"Loading SDXL pipeline from {MODEL_ID}...")
    start_time = time.time()

    # 파이프라인 로드
    if LOCAL_MODEL_PATH and os.path.exists(LOCAL_MODEL_PATH):
        logger.info(f"Using local model: {LOCAL_MODEL_PATH}")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            LOCAL_MODEL_PATH,
            torch_dtype=DTYPE,
            use_safetensors=True,
            variant="fp16" if DTYPE == torch.float16 else None
        )
    else:
        logger.info(f"Downloading from HuggingFace: {MODEL_ID}")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=DTYPE,
            use_safetensors=True,
            variant="fp16" if DTYPE == torch.float16 else None
        )

    # 디바이스로 이동
    pipe = pipe.to(DEVICE)

    # 메모리 최적화
    if DEVICE == "cuda":
        pipe.enable_model_cpu_offload()
        try:
            pipe.enable_xformers_memory_efficient_attention()
            logger.info("xformers enabled")
        except Exception as e:
            logger.warning(f"xformers not available: {e}")

    # Euler 스케줄러 설정 (빠른 생성용)
    pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config)

    elapsed = time.time() - start_time
    logger.info(f"Pipeline loaded in {elapsed:.2f}s")

    return pipe


# ============================================================================
# FastAPI App
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 파이프라인 관리"""
    global pipe
    logger.info("Starting Z-Image server...")
    pipe = load_pipeline()
    yield
    logger.info("Shutting down Z-Image server...")
    del pipe
    if DEVICE == "cuda":
        torch.cuda.empty_cache()


app = FastAPI(
    title="Z-Image Server",
    description="Fast image generation API using SDXL",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """서버 헬스 체크"""
    vram_used = None
    vram_total = None

    if DEVICE == "cuda":
        vram_used = torch.cuda.memory_allocated() / 1024**3  # GB
        vram_total = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB

    return HealthResponse(
        status="healthy" if pipe is not None else "loading",
        device=DEVICE,
        model_loaded=pipe is not None,
        vram_used=vram_used,
        vram_total=vram_total
    )


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """이미지 생성"""
    global pipe

    if pipe is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    start_time = time.time()

    # 시드 처리
    seed = request.seed if request.seed >= 0 else random.randint(0, 2**32 - 1)
    # Note: enable_model_cpu_offload() 사용 시 generator는 CPU에서 생성해야 함
    generator = torch.Generator(device="cpu").manual_seed(seed)

    logger.info(f"Generating: {request.width}x{request.height}, steps={request.steps}, seed={seed}")

    try:
        # 이미지 생성
        result = pipe(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width,
            height=request.height,
            num_inference_steps=request.steps,
            guidance_scale=request.cfg_scale,
            generator=generator,
        )

        image = result.images[0]

        # Base64 인코딩
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        generation_time = time.time() - start_time
        logger.info(f"Generated in {generation_time:.2f}s")

        return GenerateResponse(
            image=image_base64,
            seed=seed,
            generation_time=generation_time,
            width=request.width,
            height=request.height,
            model=request.model
        )

    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "name": "Z-Image Server",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "generate": "/api/generate"
        }
    }


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("ZIMAGE_PORT", 7860))
    host = os.environ.get("ZIMAGE_HOST", "0.0.0.0")

    logger.info(f"Starting Z-Image server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
