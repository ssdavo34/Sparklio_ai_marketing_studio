from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for MVP
PRESENTATIONS_DB: Dict[str, Dict[str, Any]] = {}

# =============================================================================
# Models
# =============================================================================

class SlideModel(BaseModel):
    slide_number: int
    slide_type: str
    title: str
    subtitle: Optional[str] = None
    content: Optional[Any] = None  # Can be string or list or structured object
    bullets: Optional[List[str]] = None
    speaker_notes: Optional[str] = None
    layout: Optional[str] = "title_center"  # V2: 5종 템플릿 (title_center, two_column, three_bullets, full_image, stats)
    background_image_url: Optional[str] = None
    visual_hint: Optional[str] = None  # V2: Unsplash 검색 키워드 (이미지 생성용)

class PresentationCreateRequest(BaseModel):
    title: str
    slides: List[SlideModel]
    concept_id: Optional[str] = None

class PresentationUpdateRequest(BaseModel):
    title: Optional[str] = None
    slides: Optional[List[SlideModel]] = None

class PresentationResponse(BaseModel):
    id: str
    title: str
    slides: List[SlideModel]
    concept_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deck_type: Optional[str] = None
    aspect_ratio: Optional[str] = None
    project_id: Optional[str] = None
    design_guidelines: Optional[Dict[str, Any]] = None  # V2: 디자인 가이드라인 (컬러, 폰트)

class PresentationGenerateRequest(BaseModel):
    topic: str
    deck_type: str = "pitch"
    slide_count: int = 12
    aspect_ratio: str = "16:9"
    project_id: Optional[str] = None
    concept_id: Optional[str] = None


# =============================================================================
# Endpoints
# =============================================================================

# =============================================================================
# Endpoints
# =============================================================================

from app.services.agents.presentation import get_presentation_agent

@router.post("/generate", response_model=PresentationResponse)
async def generate_presentation(request: PresentationGenerateRequest):
    """프레젠테이션 생성 (Agent 호출)"""
    
    # 1. Agent 준비
    agent = get_presentation_agent()
    
    # 2. Agent 입력 구성
    # Concept 정보가 없으면 기본값 생성
    concept_data = {
        "concept_name": request.topic,
        "concept_description": f"{request.topic}에 대한 {request.deck_type} 프레젠테이션",
        "target_audience": "일반 청중",
        "key_message": request.topic,
        "tone_and_manner": "Professional, Persuasive",
        "visual_style": "Modern, Clean"
    }
    
    agent_payload = {
        "concept": concept_data,
        "product_name": request.topic, # 임시로 topic을 product_name으로 사용
        "presentation_type": request.deck_type,
        "slide_count": request.slide_count,
        "include_speaker_notes": True
    }
    
    # 3. Agent 실행
    from app.services.agents.base import AgentRequest
    
    agent_request = AgentRequest(
        task="generate_presentation",
        payload=agent_payload
    )
    
    try:
        response = await agent.execute(agent_request)
        
        # Agent 출력을 Presentation 모델로 변환
        # response.outputs[0].value는 PresentationOutput dict
        output_data = response.outputs[0].value
        
        slides_data = []
        for slide in output_data.get("slides", []):
            # V2: 레이아웃 정규화 (5종 템플릿만 허용)
            raw_layout = slide.get("layout", "title_center")
            valid_layouts = ["title_center", "two_column", "three_bullets", "full_image", "stats"]
            # 기존 레이아웃 → 새 템플릿 매핑
            layout_mapping = {
                "standard": "two_column",
                "process": "two_column",
                "full_image": "full_image",
                "stats": "stats",
            }
            normalized_layout = layout_mapping.get(raw_layout, raw_layout)
            if normalized_layout not in valid_layouts:
                normalized_layout = "two_column"  # 기본값

            slides_data.append(SlideModel(
                slide_number=slide.get("slide_number"),
                slide_type=slide.get("slide_type"),
                title=slide.get("title"),
                subtitle=slide.get("subtitle"),
                bullets=slide.get("body_points"),
                speaker_notes=slide.get("speaker_notes"),
                layout=normalized_layout,
                visual_hint=slide.get("visual_suggestion"),  # V2: 이미지 검색용
                content=slide.get("visual_suggestion")
            ))
            
        # 4. DB 저장
        presentation_id = str(uuid.uuid4())
        now = datetime.utcnow()

        # V2: 디자인 가이드라인 추출
        design_guidelines = output_data.get("design_guidelines", {
            "primary_color": "#4F46E5",
            "secondary_color": "#10B981",
            "font_style": "Pretendard",
            "image_style": "Modern Business"
        })

        presentation_data = {
            "id": presentation_id,
            "title": output_data.get("title", request.topic),
            "slides": [s.model_dump() for s in slides_data],
            "concept_id": request.concept_id,
            "created_at": now,
            "updated_at": now,
            # 추가 메타데이터
            "deck_type": request.deck_type,
            "aspect_ratio": request.aspect_ratio,
            "project_id": request.project_id,
            "design_guidelines": design_guidelines  # V2: 컬러, 폰트 정보
        }
        
        PRESENTATIONS_DB[presentation_id] = presentation_data
        
        return presentation_data
        
    except Exception as e:
        import traceback
        logger.error(f"Presentation generation failed: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Presentation generation failed: {str(e)}")

@router.post("/", response_model=PresentationResponse)
async def create_presentation(request: PresentationCreateRequest):
    """프레젠테이션 생성 (저장)"""
    presentation_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    presentation_data = {
        "id": presentation_id,
        "title": request.title,
        "slides": [slide.model_dump() for slide in request.slides],
        "concept_id": request.concept_id,
        "created_at": now,
        "updated_at": now
    }
    
    PRESENTATIONS_DB[presentation_id] = presentation_data
    
    return presentation_data

@router.get("/{presentation_id}", response_model=PresentationResponse)
async def get_presentation(presentation_id: str):
    """프레젠테이션 조회"""
    if presentation_id not in PRESENTATIONS_DB:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    return PRESENTATIONS_DB[presentation_id]

@router.patch("/{presentation_id}", response_model=PresentationResponse)
async def update_presentation(presentation_id: str, request: PresentationUpdateRequest):
    """프레젠테이션 수정"""
    if presentation_id not in PRESENTATIONS_DB:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    presentation = PRESENTATIONS_DB[presentation_id]
    
    if request.title is not None:
        presentation["title"] = request.title
    
    if request.slides is not None:
        presentation["slides"] = [slide.model_dump() for slide in request.slides]
        
    presentation["updated_at"] = datetime.utcnow()
    
    return presentation

@router.get("/", response_model=List[PresentationResponse])
async def list_presentations():
    """모든 프레젠테이션 조회"""
    return list(PRESENTATIONS_DB.values())
