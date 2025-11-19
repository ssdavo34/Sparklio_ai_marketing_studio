from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
import datetime
import asyncio
import logging
from app.services.agents import get_editor_agent, AgentRequest

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Models ---

class ChatAnalysisRequest(BaseModel):
    message: str
    brandId: Optional[str] = None

class Suggestion(BaseModel):
    id: str
    type: str
    label: str
    description: str
    preview_image: Optional[str] = None
    payload: Optional[dict] = None

class ChatAnalysisResponse(BaseModel):
    analysis: str
    suggestions: List[Suggestion]

class GenerateDocumentRequest(BaseModel):
    chatSessionId: str
    brandId: Optional[str] = None

class GenerateDocumentResponse(BaseModel):
    documentId: str
    document: dict  # Simplified for mock

# --- Logic ---

@router.post('/analyze', response_model=ChatAnalysisResponse)
async def analyze_chat(request: ChatAnalysisRequest):
    """
    Analyze chat message using EditorAgent to generate commands.
    """
    try:
        # EditorAgent를 사용하여 자연어 -> 명령 변환
        agent = get_editor_agent()
        
        agent_request = AgentRequest(
            task="generate_commands",
            payload={
                "natural_language": request.message,
                "context": "spark_chat"
            },
            options={"model": "gpt-4o"} # 고성능 모델 권장
        )
        
        response = await agent.execute(agent_request)
        
        # Agent 응답에서 commands와 message 추출
        commands = []
        message = "명령을 생성했습니다."
        
        for output in response.outputs:
            if output.name == "commands" and isinstance(output.value, list):
                commands = output.value
            elif output.name == "message":
                message = output.value
                
        # 제안 구조 생성
        return ChatAnalysisResponse(
            analysis="사용자 요청을 분석하여 편집 명령을 생성했습니다.",
            suggestions=[
                Suggestion(
                    id="sug_generated",
                    type="command_execution",
                    label="요청 실행",
                    description=message,
                    preview_image="/images/preview_placeholder.png",
                    payload={"commands": commands}
                )
            ]
        )

    except Exception as e:
        logger.error(f"Chat analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/generate-document', response_model=GenerateDocumentResponse)
async def generate_document(request: GenerateDocumentRequest):
    """
    Mock API for generating a document.
    Returns a mock EditorDocument structure.
    """
    document_id = str(uuid4())
    
    # Mock EditorDocument structure
    mock_document = {
        "id": document_id,
        "title": "Generated Instagram Ad",
        "mode": "ad-studio",
        "pages": [
            {
                "id": str(uuid4()),
                "name": "Page 1",
                "kind": "ad",
                "width": 1080,
                "height": 1080,
                "objects": [
                    {
                        "id": str(uuid4()),
                        "type": "text",
                        "role": "headline",
                        "text": "New Arrival: Air Max 2025",
                        "x": 100, "y": 100,
                        "width": 880, "height": 100,
                        "fontSize": 60, "fontWeight": "bold", "textAlign": "center",
                        "fill": "#000000",
                        "zIndex": 2
                    },
                    {
                        "id": str(uuid4()),
                        "type": "text",
                        "role": "body",
                        "text": "Experience the ultimate comfort and style.",
                        "x": 100, "y": 250,
                        "width": 880, "height": 80,
                        "fontSize": 40, "textAlign": "center",
                        "fill": "#333333",
                        "zIndex": 2
                    },
                    {
                        "id": str(uuid4()),
                        "type": "text",
                        "role": "cta",
                        "text": "Shop Now",
                        "x": 340, "y": 800,
                        "width": 400, "height": 80,
                        "fontSize": 36, "fontWeight": "bold", "textAlign": "center",
                        "fill": "#FFFFFF",
                        "backgroundColor": "#000000",
                        "zIndex": 2
                    },
                    {
                        "id": str(uuid4()),
                        "type": "shape",
                        "role": "cta-bg",
                        "shapeKind": "rect",
                        "x": 340, "y": 790,
                        "width": 400, "height": 100,
                        "fill": "#000000",
                        "cornerRadius": 20,
                        "zIndex": 1
                    }
                ],
                "background": { "type": "color", "color": "#F5F5F5" }
            }
        ],
        "createdAt": datetime.datetime.utcnow().isoformat(),
        "updatedAt": datetime.datetime.utcnow().isoformat(),
    }

    return GenerateDocumentResponse(
        documentId=document_id,
        document=mock_document
    )
