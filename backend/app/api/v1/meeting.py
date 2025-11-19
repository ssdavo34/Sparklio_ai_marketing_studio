from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
import datetime
import asyncio
import logging
from app.services.agents import get_meeting_ai_agent, AgentRequest

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Models ---

class MeetingUploadResponse(BaseModel):
    meetingId: str
    filename: str
    status: str

class MeetingAnalyzeRequest(BaseModel):
    meetingId: str

class TranscriptItem(BaseModel):
    speaker: str
    text: str
    timestamp: str

class MeetingAnalyzeResponse(BaseModel):
    meetingId: str
    transcript: List[TranscriptItem]
    summary: str
    actionItems: List[str]

# --- Logic ---

@router.post('/upload', response_model=MeetingUploadResponse)
async def upload_meeting_file(file: UploadFile = File(...)):
    """
    Mock API for uploading meeting audio/video files.
    """
    # Simulate file processing
    # In reality, we would save the file to S3/MinIO here
    
    return MeetingUploadResponse(
        meetingId=str(uuid4()),
        filename=file.filename,
        status="uploaded"
    )

@router.post('/analyze', response_model=MeetingAnalyzeResponse)
async def analyze_meeting(request: MeetingAnalyzeRequest):
    """
    Analyze meeting content using MeetingAIAgent.
    """
    try:
        # MeetingAIAgent를 사용하여 회의록 분석
        agent = get_meeting_ai_agent()
        
        # TODO: 실제로는 meeting_id로 DB에서 회의록을 조회해야 함
        # 여기서는 Mock Transcript 사용
        mock_transcript = (
            "A: 이번 신제품 런칭 캠페인은 2030 여성을 타겟으로 합시다.\n"
            "B: 좋아요. 인스타그램과 틱톡을 메인 채널로 가져가는 게 좋겠어요.\n"
            "A: 예산은 5천만원 정도로 잡고, 인플루언서 마케팅에 집중합시다.\n"
            "C: 그럼 제가 인플루언서 리스트업을 다음 주까지 해오겠습니다."
        )
        
        agent_request = AgentRequest(
            task="analyze_transcript",
            payload={
                "transcript": mock_transcript,
                "context": f"meeting_id: {request.meetingId}"
            },
            options={"model": "gpt-4o"}
        )
        
        response = await agent.execute(agent_request)
        
        # Agent 응답에서 결과 추출
        summary = ""
        action_items = []
        
        for output in response.outputs:
            if output.name == "analysis_result" and isinstance(output.value, dict):
                summary = output.value.get("summary", "")
                # action_items가 dict list인 경우 문자열로 변환
                raw_items = output.value.get("action_items", [])
                action_items = [
                    f"{item['task']} ({item.get('assignee', '미정')})" 
                    if isinstance(item, dict) else str(item)
                    for item in raw_items
                ]
                
        # Fallback if agent fails to return structured data
        if not summary:
            summary = "회의록 분석을 완료했습니다."
            
        return MeetingAnalyzeResponse(
            meetingId=request.meetingId,
            transcript=[
                TranscriptItem(speaker="A", text="이번 신제품 런칭 캠페인은...", timestamp="10:00"),
                TranscriptItem(speaker="B", text="좋아요. 인스타그램과...", timestamp="10:01")
            ],
            summary=summary,
            actionItems=action_items
        )

    except Exception as e:
        logger.error(f"Meeting analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
