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
                meta_info={
                    "color_palette": concept_data.get("color_palette", []),
                    "keywords": concept_data.get("keywords", [])
                }
            )
            db.add(concept)
            db.flush()  # concept.id 생성을 위해 flush

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

            # ShortsScriptAgent로 각 컨셉별 스크립트 생성
            try:
                await _generate_shorts_scripts_for_concepts(
                    db=db,
                    campaign_id=campaign_id,
                    product_name=campaign.name
                )
            except Exception as e:
                logger.warning(f"[Demo Pipeline] Shorts script generation failed: {e}")
                # Asset 생성 실패해도 파이프라인은 계속 진행

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

async def _generate_shorts_scripts_for_concepts(
    db: Session,
    campaign_id: str,
    product_name: str
):
    """
    각 컨셉에 대해 ShortsScriptAgent로 스크립트 생성

    Args:
        db: Database session
        campaign_id: Campaign ID
        product_name: 제품/서비스명
    """
    from app.services.agents import get_shorts_script_agent, AgentRequest

    # 컨셉 조회
    concepts = db.query(Concept).filter(
        Concept.campaign_id == uuid.UUID(campaign_id)
    ).all()

    if not concepts:
        logger.warning(f"[Asset Generation] No concepts found for campaign {campaign_id}")
        return

    shorts_agent = get_shorts_script_agent()

    for concept in concepts:
        # Shorts Asset 조회
        shorts_asset = db.query(ConceptAsset).filter(
            ConceptAsset.concept_id == concept.id,
            ConceptAsset.asset_type == AssetType.SHORTS_SCRIPT
        ).first()

        if not shorts_asset:
            logger.warning(f"[Asset Generation] No shorts asset found for concept {concept.id}")
            continue

        try:
            # ShortsScriptAgent 실행
            shorts_request = AgentRequest(
                task="generate_shorts_script",
                payload={
                    "concept": {
                        "concept_name": concept.name,
                        "concept_description": concept.description,
                        "target_audience": concept.target_audience,
                        "key_message": concept.key_message,
                        "tone_and_manner": concept.tone_and_manner,
                        "visual_style": concept.visual_style,
                        "keywords": concept.meta_info.get("keywords", []) if concept.meta_info else []
                    },
                    "product_name": product_name,
                    "target_duration": 45
                }
            )

            shorts_response = await shorts_agent.execute(shorts_request)

            # 결과 저장
            script_data = shorts_response.outputs[0].value
            shorts_asset.status = AssetStatus.COMPLETED
            shorts_asset.content = script_data
            shorts_asset.extra_info = {
                "duration_seconds": script_data.get("total_duration", 45),
                "scene_count": len(script_data.get("scenes", [])),
                "generated_at": datetime.utcnow().isoformat()
            }
            db.commit()

            logger.info(
                f"[Asset Generation] Shorts script generated for concept {concept.id}: "
                f"{script_data.get('total_duration', 45)}s, {len(script_data.get('scenes', []))} scenes"
            )

        except Exception as e:
            logger.error(f"[Asset Generation] Failed to generate shorts for concept {concept.id}: {e}")
            shorts_asset.status = AssetStatus.FAILED
            shorts_asset.error_message = str(e)
            db.commit()


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


# =============================================================================
# Shorts Video Generation API
# =============================================================================

@router.post("/demo/generate-shorts/{concept_id}")
async def generate_shorts_video(
    concept_id: str,
    background_tasks: BackgroundTasks,
    target_duration: int = Query(default=45, ge=15, le=60, description="목표 영상 길이 (초)"),
    db: Session = Depends(get_db)
):
    """
    숏폼 영상 생성 트리거

    컨셉 기반으로 숏폼 영상 생성 파이프라인 실행:
    1. ShortsScriptAgent: 씬별 스크립트 생성
    2. VisualPromptAgent: 이미지 프롬프트 생성
    3. Nanobanana: 이미지 생성
    4. EdgeTTS: 나레이션 생성
    5. ffmpeg: 영상 조립

    Args:
        concept_id: 컨셉 ID
        target_duration: 목표 영상 길이 (15-60초)

    Returns:
        task_id, status
    """
    # Concept 조회
    try:
        concept_uuid = uuid.UUID(concept_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid concept_id format")

    concept = db.query(Concept).filter(Concept.id == concept_uuid).first()
    if not concept:
        raise HTTPException(status_code=404, detail=f"Concept not found: {concept_id}")

    # Campaign 조회
    campaign = db.query(Campaign).filter(Campaign.id == concept.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Shorts Asset 조회 또는 생성
    shorts_asset = db.query(ConceptAsset).filter(
        ConceptAsset.concept_id == concept_uuid,
        ConceptAsset.asset_type == AssetType.SHORTS_SCRIPT
    ).first()

    if not shorts_asset:
        shorts_asset = ConceptAsset(
            concept_id=concept_uuid,
            asset_type=AssetType.SHORTS_SCRIPT,
            status=AssetStatus.PENDING,
            title=f"{concept.name} - Shorts Video"
        )
        db.add(shorts_asset)
        db.commit()
        db.refresh(shorts_asset)

    # 이미 생성 중이면 에러
    if shorts_asset.status == AssetStatus.GENERATING:
        raise HTTPException(status_code=409, detail="Shorts video is already being generated")

    # Task ID 생성
    task_id = f"shorts_{uuid.uuid4().hex[:12]}"

    # 상태 업데이트
    shorts_asset.status = AssetStatus.GENERATING
    shorts_asset.extra_info = {
        "task_id": task_id,
        "target_duration": target_duration
    }
    db.commit()

    logger.info(f"[Demo] Starting shorts generation for concept {concept_id}, task_id={task_id}")

    # Background Task 실행
    background_tasks.add_task(
        run_shorts_generation_pipeline,
        concept_id=str(concept.id),
        asset_id=str(shorts_asset.id),
        task_id=task_id,
        target_duration=target_duration,
        concept_data={
            "concept_name": concept.name,
            "concept_description": concept.description,
            "target_audience": concept.target_audience,
            "key_message": concept.key_message,
            "tone_and_manner": concept.tone_and_manner,
            "visual_style": concept.visual_style
        },
        product_name=campaign.name
    )

    return {
        "task_id": task_id,
        "asset_id": str(shorts_asset.id),
        "status": "generating",
        "message": f"숏폼 영상 생성이 시작되었습니다. (목표: {target_duration}초)"
    }


@router.get("/demo/shorts-status/{task_id}")
async def get_shorts_generation_status(
    task_id: str,
    db: Session = Depends(get_db)
):
    """
    숏폼 영상 생성 상태 조회

    Args:
        task_id: Task ID

    Returns:
        생성 상태 및 진행률
    """
    # Asset 조회 (task_id로)
    shorts_asset = db.query(ConceptAsset).filter(
        ConceptAsset.extra_info["task_id"].astext == task_id
    ).first()

    if not shorts_asset:
        raise HTTPException(status_code=404, detail=f"Task not found: {task_id}")

    extra_info = shorts_asset.extra_info or {}

    return {
        "task_id": task_id,
        "asset_id": str(shorts_asset.id),
        "status": shorts_asset.status.value,
        "progress": extra_info.get("progress", 0),
        "current_step": extra_info.get("current_step", ""),
        "message": extra_info.get("message", ""),
        "video_url": shorts_asset.download_url,
        "preview_url": shorts_asset.preview_url,
        "duration_seconds": extra_info.get("duration_seconds"),
        "error_message": shorts_asset.error_message
    }


async def run_shorts_generation_pipeline(
    concept_id: str,
    asset_id: str,
    task_id: str,
    target_duration: int,
    concept_data: dict,
    product_name: str
):
    """
    숏폼 영상 생성 파이프라인 실행 (Background Task)

    Args:
        concept_id: 컨셉 ID
        asset_id: Asset ID
        task_id: Task ID
        target_duration: 목표 영상 길이
        concept_data: 컨셉 데이터
        product_name: 제품명
    """
    from app.core.database import SessionLocal
    from app.services.shorts_video_generator import get_shorts_video_generator, GenerationProgress

    db = SessionLocal()

    try:
        logger.info(f"[Shorts Pipeline] Starting for concept {concept_id}")

        # Asset 조회
        shorts_asset = db.query(ConceptAsset).filter(
            ConceptAsset.id == uuid.UUID(asset_id)
        ).first()

        if not shorts_asset:
            logger.error(f"Asset not found: {asset_id}")
            return

        # Progress callback 정의
        async def progress_callback(progress: GenerationProgress):
            """진행 상황 업데이트"""
            shorts_asset.extra_info = {
                **(shorts_asset.extra_info or {}),
                "task_id": task_id,
                "progress": progress.progress,
                "current_step": progress.step,
                "message": progress.message
            }
            db.commit()
            logger.info(f"[Shorts Pipeline] {progress.step}: {progress.progress}% - {progress.message}")

        # ShortsVideoGenerator 실행
        generator = get_shorts_video_generator()

        result = await generator.generate(
            concept=concept_data,
            product_name=product_name,
            key_features=concept_data.get("keywords", []),
            target_duration=target_duration,
            progress_callback=progress_callback
        )

        # 결과 저장
        if result.success:
            shorts_asset.status = AssetStatus.COMPLETED
            shorts_asset.download_url = result.video_path
            shorts_asset.content = result.script
            shorts_asset.extra_info = {
                **(shorts_asset.extra_info or {}),
                "task_id": task_id,
                "progress": 100,
                "current_step": "complete",
                "message": "영상 생성 완료",
                "duration_seconds": result.duration_seconds,
                "image_count": len(result.images),
                "tts_count": len(result.tts_files)
            }
            logger.info(f"[Shorts Pipeline] Completed: {result.video_path}")
        else:
            shorts_asset.status = AssetStatus.FAILED
            shorts_asset.error_message = result.error_message
            shorts_asset.extra_info = {
                **(shorts_asset.extra_info or {}),
                "task_id": task_id,
                "progress": 0,
                "current_step": "error",
                "message": result.error_message
            }
            logger.error(f"[Shorts Pipeline] Failed: {result.error_message}")

        db.commit()

    except Exception as e:
        logger.error(f"[Shorts Pipeline] Error: {e}", exc_info=True)
        if shorts_asset:
            shorts_asset.status = AssetStatus.FAILED
            shorts_asset.error_message = str(e)
            shorts_asset.extra_info = {
                **(shorts_asset.extra_info or {}),
                "task_id": task_id,
                "progress": 0,
                "current_step": "error",
                "message": str(e)
            }
            db.commit()

    finally:
        db.close()
