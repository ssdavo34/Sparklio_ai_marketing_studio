from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
import datetime
import asyncio

router = APIRouter()

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

# --- Mock Data & Logic ---

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
    Mock API for analyzing meeting content.
    Returns a fixed mock transcript and summary.
    """
    # Simulate AI processing time
    await asyncio.sleep(2) 

    return MeetingAnalyzeResponse(
        meetingId=request.meetingId,
        transcript=[
            TranscriptItem(speaker="김철수 (PM)", text="자, 오늘 회의 시작합시다. 이번 여름 시즌 캠페인 기획안 다들 보셨나요?", timestamp="00:05"),
            TranscriptItem(speaker="이영희 (마케터)", text="네, 봤습니다. '시원한 여름' 컨셉이 좋긴 한데, 좀 더 구체적인 타겟팅이 필요해 보여요.", timestamp="00:15"),
            TranscriptItem(speaker="박민수 (디자이너)", text="맞아요. 2030 세대를 겨냥한다면 비주얼적으로 좀 더 힙한 느낌을 줘야 할 것 같습니다.", timestamp="00:28"),
            TranscriptItem(speaker="김철수 (PM)", text="좋은 의견입니다. 그럼 인스타그램이랑 틱톡 숏폼 위주로 콘텐츠를 구성해볼까요?", timestamp="00:40"),
            TranscriptItem(speaker="이영희 (마케터)", text="네, 숏폼 챌린지도 같이 기획하면 좋을 것 같아요. 인플루언서 협업도 고려해보죠.", timestamp="00:52"),
        ],
        summary="이번 회의에서는 여름 시즌 캠페인의 방향성에 대해 논의했습니다. '시원한 여름' 컨셉을 유지하되, 2030 세대를 타겟으로 하여 인스타그램과 틱톡 등 숏폼 콘텐츠에 집중하기로 했습니다. 또한 인플루언서 협업과 챌린지 기획을 통해 바이럴 효과를 극대화할 예정입니다.",
        actionItems=[
            "2030 타겟 숏폼 콘텐츠 기획안 작성 (이영희)",
            "여름 시즌 캠페인 비주얼 무드보드 제작 (박민수)",
            "인플루언서 리스트업 및 섭외 요청 (김철수)"
        ]
    )
