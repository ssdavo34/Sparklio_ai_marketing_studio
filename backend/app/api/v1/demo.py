"""
Demo Day API Router

데모 데이용 캠페인 생성 및 관리 API

작성일: 2025-11-26
작성자: B팀 (Backend)
참조: B_TEAM_TODO_LIST_2025-11-26.md

주요 엔드포인트:
- POST /api/v1/demo/meeting-to-campaign: 회의 → 캠페인 생성
- GET /api/v1/demo/concept-board/{campaign_id}: 컨셉 보드 조회
- GET /api/v1/tasks/{task_id}/stream: SSE 진행 상황 스트림
"""

import uuid
import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.demo import (
    DemoCampaignRequest,
    DemoCampaignResponse,
    DemoTaskStatus,
    DemoAssetStatus,
    ConceptBoardResponse,
    ConceptDetail,
    ConceptAssets,
    AssetInfo,
    InstagramAdsInfo,
    ShortsScriptInfo,
    MeetingSummaryBrief,
    SSEProgressEvent,
    SSEConceptEvent,
    SSECompleteEvent,
    SSEErrorEvent,
)
from app.models.meeting import Meeting
from app.models.campaign import Campaign, Concept, ConceptAsset, CampaignStatus, AssetType, AssetStatus

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Demo Campaign API
# =============================================================================

@router.post("/demo/meeting-to-campaign", response_model=DemoCampaignResponse)
async def create_demo_campaign(
    request: DemoCampaignRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    회의 → 캠페인 생성 (비동기)

    1. Meeting 조회
    2. Task ID 생성
    3. Campaign 레코드 생성 (status: PENDING)
    4. BackgroundTask로 파이프라인 실행
    5. Task ID 반환 (SSE 스트림용)

    Args:
        request: DemoCampaignRequest (meeting_id, options)

    Returns:
        DemoCampaignResponse (task_id, status)
    """
    # 1. Meeting 조회
    meeting = db.query(Meeting).filter(Meeting.id == request.meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting not found: {request.meeting_id}")

    # 회의 분석 결과 확인
    if not meeting.analysis_result:
        raise HTTPException(
            status_code=400,
            detail="Meeting has not been analyzed yet. Please run MeetingAgent first."
        )

    # 2. Task ID 생성
    task_id = f"demo_{uuid.uuid4().hex[:12]}"

    # 3. Campaign 레코드 생성
    campaign = Campaign(
        meeting_id=meeting.id,
        owner_id=meeting.owner_id,
        brand_id=meeting.brand_id,
        name=f"{meeting.title} 캠페인",
        status=CampaignStatus.PENDING,
        task_id=task_id,
        meeting_summary={
            "title": meeting.title,
            "duration_minutes": meeting.duration_seconds // 60 if meeting.duration_seconds else None,
            "key_points": meeting.analysis_result.get("agenda", []),
            "core_message": meeting.analysis_result.get("summary", "")[:200]
        }
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    logger.info(f"[Demo] Created campaign {campaign.id} with task_id {task_id}")

    # 4. BackgroundTask로 파이프라인 실행
    background_tasks.add_task(
        run_demo_pipeline,
        campaign_id=str(campaign.id),
        task_id=task_id,
        meeting_id=str(meeting.id),
        options=request.options.model_dump() if request.options else {}
    )

    # 5. Task ID 반환
    return DemoCampaignResponse(
        task_id=task_id,
        status=DemoTaskStatus.PROCESSING,
        message=f"캠페인 생성이 시작되었습니다. task_id: {task_id}"
    )


@router.get("/demo/concept-board/{campaign_id}", response_model=ConceptBoardResponse)
async def get_concept_board(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    """
    Concept Board 조회

    캠페인 + 컨셉 목록 + 에셋 정보 반환

    Args:
        campaign_id: 캠페인 ID

    Returns:
        ConceptBoardResponse
    """
    # Campaign 조회
    try:
        campaign_uuid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign_id format")

    campaign = db.query(Campaign).filter(Campaign.id == campaign_uuid).first()
    if not campaign:
        raise HTTPException(status_code=404, detail=f"Campaign not found: {campaign_id}")

    # Concepts 조회
    concepts = db.query(Concept).filter(
        Concept.campaign_id == campaign_uuid
    ).order_by(Concept.order).all()

    # ConceptDetail 목록 생성
    concept_details = []
    for concept in concepts:
        # Assets 조회
        assets = db.query(ConceptAsset).filter(
            ConceptAsset.concept_id == concept.id
        ).all()

        # 에셋 정보 구성
        asset_dict = {a.asset_type: a for a in assets}

        concept_assets = ConceptAssets(
            presentation=_build_asset_info(asset_dict.get(AssetType.PRESENTATION)),
            product_detail=_build_asset_info(asset_dict.get(AssetType.PRODUCT_DETAIL)),
            instagram_ads=_build_instagram_info(asset_dict.get(AssetType.INSTAGRAM_ADS)),
            shorts_script=_build_shorts_info(asset_dict.get(AssetType.SHORTS_SCRIPT))
        )

        concept_detail = ConceptDetail(
            concept_id=str(concept.id),
            concept_name=concept.name,
            concept_description=concept.description or "",
            target_audience=concept.target_audience or "",
            key_message=concept.key_message or "",
            tone_and_manner=concept.tone_and_manner or "",
            visual_style=concept.visual_style or "",
            thumbnail_url=concept.thumbnail_url,
            assets=concept_assets
        )
        concept_details.append(concept_detail)

    # Meeting Summary 구성
    meeting_summary = MeetingSummaryBrief(
        title=campaign.meeting_summary.get("title", campaign.name) if campaign.meeting_summary else campaign.name,
        duration_minutes=campaign.meeting_summary.get("duration_minutes") if campaign.meeting_summary else None,
        participants=campaign.meeting_summary.get("participants") if campaign.meeting_summary else None,
        key_points=campaign.meeting_summary.get("key_points", []) if campaign.meeting_summary else [],
        core_message=campaign.meeting_summary.get("core_message", "") if campaign.meeting_summary else ""
    )

    return ConceptBoardResponse(
        campaign_id=str(campaign.id),
        campaign_name=campaign.name,
        status=DemoTaskStatus(campaign.status.value),
        created_at=campaign.created_at,
        meeting_summary=meeting_summary,
        concepts=concept_details
    )


# =============================================================================
# SSE Task Stream
# =============================================================================

@router.get("/tasks/{task_id}/stream")
async def stream_task_progress(
    task_id: str,
    db: Session = Depends(get_db)
):
    """
    SSE Progress Stream

    Task 진행 상황을 실시간으로 스트리밍

    이벤트 타입:
    - progress: 진행률 업데이트
    - concept: 컨셉 생성 완료
    - complete: 전체 완료
    - error: 에러 발생

    Args:
        task_id: Task ID

    Returns:
        StreamingResponse (text/event-stream)
    """
    # Campaign 조회 (task_id로)
    campaign = db.query(Campaign).filter(Campaign.task_id == task_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    async def event_generator():
        """SSE 이벤트 생성기"""
        import asyncio
        import json

        # Redis Pub/Sub 대신 polling 방식 (Demo 간소화)
        last_status = None
        poll_count = 0
        max_polls = 300  # 최대 5분 (1초 간격)

        while poll_count < max_polls:
            poll_count += 1

            # DB 새로고침
            db.refresh(campaign)
            current_status = campaign.status

            # 상태 변화 감지
            if current_status != last_status:
                last_status = current_status

                if current_status == CampaignStatus.PROCESSING:
                    event = SSEProgressEvent(
                        step="processing",
                        progress=20,
                        message="캠페인 생성 중..."
                    )
                    yield f"event: progress\ndata: {json.dumps(event.model_dump())}\n\n"

                elif current_status == CampaignStatus.CONCEPT_READY:
                    # Concepts 조회
                    concepts = db.query(Concept).filter(
                        Concept.campaign_id == campaign.id
                    ).all()

                    concept_previews = [
                        {
                            "concept_id": str(c.id),
                            "concept_name": c.name,
                            "key_message": c.key_message or "",
                            "thumbnail_url": c.thumbnail_url
                        }
                        for c in concepts
                    ]

                    event = SSEConceptEvent(concepts=concept_previews)
                    yield f"event: concept\ndata: {json.dumps(event.model_dump())}\n\n"

                    progress_event = SSEProgressEvent(
                        step="concept_ready",
                        progress=60,
                        message=f"{len(concepts)}개 컨셉 생성 완료"
                    )
                    yield f"event: progress\ndata: {json.dumps(progress_event.model_dump())}\n\n"

                elif current_status == CampaignStatus.ASSET_GENERATING:
                    event = SSEProgressEvent(
                        step="asset_generating",
                        progress=80,
                        message="에셋 생성 중..."
                    )
                    yield f"event: progress\ndata: {json.dumps(event.model_dump())}\n\n"

                elif current_status == CampaignStatus.COMPLETED:
                    event = SSECompleteEvent(
                        campaign_id=str(campaign.id),
                        concept_count=db.query(Concept).filter(
                            Concept.campaign_id == campaign.id
                        ).count(),
                        redirect_url=f"/demo/concept-board/{campaign.id}"
                    )
                    yield f"event: complete\ndata: {json.dumps(event.model_dump())}\n\n"
                    break

                elif current_status == CampaignStatus.FAILED:
                    event = SSEErrorEvent(
                        error_code="CAMPAIGN_FAILED",
                        message=campaign.error_message or "캠페인 생성 실패",
                        recoverable=False
                    )
                    yield f"event: error\ndata: {json.dumps(event.model_dump())}\n\n"
                    break

            # Heartbeat (30초마다)
            if poll_count % 30 == 0:
                yield f": heartbeat\n\n"

            await asyncio.sleep(1)

        # 타임아웃
        if poll_count >= max_polls:
            event = SSEErrorEvent(
                error_code="TIMEOUT",
                message="작업 시간이 초과되었습니다",
                recoverable=True
            )
            yield f"event: error\ndata: {json.dumps(event.model_dump())}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# =============================================================================
# Background Pipeline
# =============================================================================

async def run_demo_pipeline(
    campaign_id: str,
    task_id: str,
    meeting_id: str,
    options: dict
):
    """
    Demo 파이프라인 실행 (Background Task)

    1. Meeting 분석 결과 조회
    2. ConceptAgent 실행 (3개 컨셉 생성)
    3. Concept 레코드 저장
    4. (선택) Asset 생성
    5. Campaign 상태 업데이트

    Args:
        campaign_id: 캠페인 ID
        task_id: Task ID
        meeting_id: 회의 ID
        options: 생성 옵션
    """
    import asyncio
    from app.core.database import SessionLocal
    from app.services.agents import get_concept_agent, AgentRequest

    db = SessionLocal()

    try:
        logger.info(f"[Demo Pipeline] Starting for campaign {campaign_id}")

        # Campaign 조회
        campaign = db.query(Campaign).filter(Campaign.id == uuid.UUID(campaign_id)).first()
        if not campaign:
            logger.error(f"Campaign not found: {campaign_id}")
            return

        # 상태 업데이트: PROCESSING
        campaign.status = CampaignStatus.PROCESSING
        db.commit()

        # Meeting 조회
        meeting = db.query(Meeting).filter(Meeting.id == uuid.UUID(meeting_id)).first()
        if not meeting or not meeting.analysis_result:
            campaign.status = CampaignStatus.FAILED
            campaign.error_message = "Meeting analysis result not found"
            db.commit()
            return

        # 1. ConceptAgent 실행
        try:
            concept_agent = get_concept_agent()
            concept_request = AgentRequest(
                task="generate_concepts",
                payload={
                    "meeting_summary": {
                        "title": meeting.title,
                        "key_points": meeting.analysis_result.get("agenda", []),
                        "core_message": meeting.analysis_result.get("summary", "")
                    },
                    "concept_count": options.get("concept_count", 3)
                }
            )

            concept_response = await concept_agent.execute(concept_request)

            # Concepts 데이터 추출
            concepts_output = concept_response.outputs[0].value
            concepts_data = concepts_output.get("concepts", [])

        except Exception as e:
            logger.error(f"[Demo Pipeline] ConceptAgent failed: {e}")
            campaign.status = CampaignStatus.FAILED
            campaign.error_message = f"Concept generation failed: {str(e)}"
            db.commit()
            return

        # 2. Concept 레코드 저장
        for i, concept_data in enumerate(concepts_data):
            concept = Concept(
                campaign_id=campaign.id,
                name=concept_data.get("concept_name", f"컨셉 {i+1}"),
                description=concept_data.get("concept_description", ""),
                target_audience=concept_data.get("target_audience", ""),
                key_message=concept_data.get("key_message", ""),
                tone_and_manner=concept_data.get("tone_and_manner", ""),
                visual_style=concept_data.get("visual_style", ""),
                order=i,
                metadata={
                    "color_palette": concept_data.get("color_palette", []),
                    "keywords": concept_data.get("keywords", [])
                }
            )
            db.add(concept)

            # 각 컨셉에 대해 빈 Asset 레코드 생성
            for asset_type in AssetType:
                asset = ConceptAsset(
                    concept_id=concept.id,
                    asset_type=asset_type,
                    status=AssetStatus.PENDING,
                    title=f"{concept.name} - {asset_type.value}"
                )
                db.add(asset)

        # 상태 업데이트: CONCEPT_READY
        campaign.status = CampaignStatus.CONCEPT_READY
        db.commit()

        logger.info(f"[Demo Pipeline] Created {len(concepts_data)} concepts for campaign {campaign_id}")

        # 3. (선택) Asset 생성 - options에 generate_assets가 True면 실행
        if options.get("generate_assets", True):
            campaign.status = CampaignStatus.ASSET_GENERATING
            db.commit()

            # TODO: Asset 생성 로직 (P1)
            # - PresentationAgent
            # - ProductDetailAgent
            # - InstagramAdsAgent
            # - ShortsScriptAgent (이미 구현됨)

            await asyncio.sleep(2)  # Demo용 딜레이

        # 4. 상태 업데이트: COMPLETED
        campaign.status = CampaignStatus.COMPLETED
        db.commit()

        logger.info(f"[Demo Pipeline] Completed for campaign {campaign_id}")

    except Exception as e:
        logger.error(f"[Demo Pipeline] Error: {e}", exc_info=True)
        if campaign:
            campaign.status = CampaignStatus.FAILED
            campaign.error_message = str(e)
            db.commit()

    finally:
        db.close()


# =============================================================================
# Helper Functions
# =============================================================================

def _build_asset_info(asset: Optional[ConceptAsset]) -> Optional[AssetInfo]:
    """Asset 정보 빌드"""
    if not asset:
        return None
    return AssetInfo(
        id=str(asset.id),
        status=DemoAssetStatus(asset.status.value),
        preview_url=asset.preview_url
    )


def _build_instagram_info(asset: Optional[ConceptAsset]) -> Optional[InstagramAdsInfo]:
    """Instagram Ads 정보 빌드"""
    if not asset:
        return None
    return InstagramAdsInfo(
        id=str(asset.id),
        status=DemoAssetStatus(asset.status.value),
        count=asset.extra_info.get("count", 3) if asset.extra_info else 3,
        preview_urls=None  # TODO: 실제 이미지 URL
    )


def _build_shorts_info(asset: Optional[ConceptAsset]) -> Optional[ShortsScriptInfo]:
    """Shorts Script 정보 빌드"""
    if not asset:
        return None
    return ShortsScriptInfo(
        id=str(asset.id),
        status=DemoAssetStatus(asset.status.value),
        duration_seconds=asset.extra_info.get("duration_seconds", 45) if asset.extra_info else 45
    )
