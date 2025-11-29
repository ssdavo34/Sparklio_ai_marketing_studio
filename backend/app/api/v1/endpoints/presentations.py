from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

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
    layout: Optional[str] = "standard"
    background_image_url: Optional[str] = None

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

# =============================================================================
# Endpoints
# =============================================================================

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
