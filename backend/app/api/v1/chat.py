from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
import datetime

router = APIRouter()

# --- Pydantic Models ---

class ChatAnalysisRequest(BaseModel):
    message: str
    brandId: Optional[str] = None

class SuggestedSection(BaseModel):
    role: str
    suggestion: str

class ChatAnalysisResponse(BaseModel):
    chatSessionId: str
    contentType: str
    suggestedStructure: List[SuggestedSection]

class GenerateDocumentRequest(BaseModel):
    chatSessionId: str
    brandId: Optional[str] = None

class GenerateDocumentResponse(BaseModel):
    documentId: str
    document: dict  # Simplified for mock

# --- Mock Data & Logic ---

@router.post('/analyze', response_model=ChatAnalysisResponse)
async def analyze_chat(request: ChatAnalysisRequest):
    """
    Mock API for analyzing chat messages.
    Returns a fixed suggestion for 'instagram-ad' regardless of input.
    """
    # Simulate processing time
    # await asyncio.sleep(1) 

    return ChatAnalysisResponse(
        chatSessionId=str(uuid4()),
        contentType="instagram-ad",
        suggestedStructure=[
            SuggestedSection(role="headline", suggestion="New Arrival: Air Max 2025"),
            SuggestedSection(role="product-image", suggestion="Hero Image of Air Max"),
            SuggestedSection(role="body", suggestion="Experience the ultimate comfort and style."),
            SuggestedSection(role="cta", suggestion="Shop Now"),
        ]
    )

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
                        "backgroundColor": "#000000", # Note: Text object doesn't usually have bg color in Konva, but for mock logic
                        "zIndex": 2
                    },
                    {
                        "id": str(uuid4()),
                        "type": "shape",
                        "role": "cta-bg", # Mocking button bg as a separate shape for now or just assuming Text has it
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
