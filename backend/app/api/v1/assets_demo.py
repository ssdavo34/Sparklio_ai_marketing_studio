"""
Demo Day Asset API Router

에셋 조회 API (4종)

작성일: 2025-11-26
작성자: B팀 (Backend)

엔드포인트:
- GET /api/v1/assets/presentations/{id}
- GET /api/v1/assets/product-details/{id}
- GET /api/v1/assets/instagram-ads/{concept_id}
- GET /api/v1/assets/shorts-scripts/{id}
"""

import uuid
import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.demo import (
    DemoAssetStatus,
    PresentationAssetResponse,
    ProductDetailAssetResponse,
    InstagramAdsAssetResponse,
    ShortsScriptAssetResponse,
    PresentationSlide,
    PresentationStyle,
    ProductDetailSection,
    InstagramAd,
    InstagramAdCreative,
    ShortsScene,
    ShortsAudioConfig,
)
from app.models.campaign import ConceptAsset, Concept, AssetType, AssetStatus

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Presentation Asset API
# =============================================================================

@router.get("/assets/presentations/{asset_id}", response_model=PresentationAssetResponse)
async def get_presentation_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """
    발표자료 에셋 조회

    Args:
        asset_id: 에셋 ID

    Returns:
        PresentationAssetResponse
    """
    asset = _get_asset_or_404(db, asset_id, AssetType.PRESENTATION)

    # 컨텐츠가 없으면 기본값 생성
    content = asset.content or _get_default_presentation_content(asset)
    style = asset.style or _get_default_style()

    slides = []
    for slide_data in content.get("slides", []):
        slides.append(PresentationSlide(
            slide_number=slide_data.get("slide_number", 1),
            slide_type=slide_data.get("slide_type", "content"),
            title=slide_data.get("title", ""),
            subtitle=slide_data.get("subtitle"),
            content=slide_data.get("content"),
            background_image_url=slide_data.get("background_image_url"),
            elements=slide_data.get("elements")
        ))

    return PresentationAssetResponse(
        id=str(asset.id),
        concept_id=str(asset.concept_id),
        title=asset.title or "발표자료",
        status=DemoAssetStatus(asset.status.value),
        created_at=asset.created_at,
        slides=slides,
        style=PresentationStyle(**style),
        export_formats=["pptx", "pdf", "png"],
        download_url=f"/api/v1/assets/presentations/{asset.id}/download"
    )


# =============================================================================
# Product Detail Asset API
# =============================================================================

@router.get("/assets/product-details/{asset_id}", response_model=ProductDetailAssetResponse)
async def get_product_detail_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """
    상세페이지 에셋 조회

    Args:
        asset_id: 에셋 ID

    Returns:
        ProductDetailAssetResponse
    """
    asset = _get_asset_or_404(db, asset_id, AssetType.PRODUCT_DETAIL)

    content = asset.content or _get_default_product_detail_content(asset)
    style = asset.style or _get_default_style()

    sections = []
    for section_data in content.get("sections", []):
        sections.append(ProductDetailSection(
            section_type=section_data.get("section_type", "content"),
            order=section_data.get("order", 0),
            content=section_data.get("content", {})
        ))

    return ProductDetailAssetResponse(
        id=str(asset.id),
        concept_id=str(asset.concept_id),
        title=asset.title or "상세페이지",
        status=DemoAssetStatus(asset.status.value),
        created_at=asset.created_at,
        sections=sections,
        style=PresentationStyle(**style),
        export_formats=["html", "pdf"],
        preview_url=f"/api/v1/assets/product-details/{asset.id}/preview",
        download_url=f"/api/v1/assets/product-details/{asset.id}/download"
    )


# =============================================================================
# Instagram Ads Asset API
# =============================================================================

@router.get("/assets/instagram-ads/{asset_id}", response_model=InstagramAdsAssetResponse)
async def get_instagram_ads_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """
    인스타그램 광고 에셋 조회

    Args:
        asset_id: 에셋 ID (또는 concept_id)

    Returns:
        InstagramAdsAssetResponse
    """
    asset = _get_asset_or_404(db, asset_id, AssetType.INSTAGRAM_ADS)

    content = asset.content or _get_default_instagram_content(asset)
    style = asset.style or _get_default_style()

    ads = []
    for ad_data in content.get("ads", []):
        creative_data = ad_data.get("creative", {})
        ads.append(InstagramAd(
            ad_id=ad_data.get("ad_id", f"ad_{len(ads)+1}"),
            ad_type=ad_data.get("ad_type", "single_image"),
            format=ad_data.get("format", "feed"),
            aspect_ratio=ad_data.get("aspect_ratio", "1:1"),
            creative=InstagramAdCreative(
                headline=creative_data.get("headline", ""),
                primary_text=creative_data.get("primary_text", ""),
                cta_text=creative_data.get("cta_text", "자세히 알아보기"),
                image_url=creative_data.get("image_url"),
                image_prompt=creative_data.get("image_prompt", ""),
                cards=creative_data.get("cards")
            ),
            specs=ad_data.get("specs", {"width": 1080, "height": 1080})
        ))

    return InstagramAdsAssetResponse(
        id=str(asset.id),
        concept_id=str(asset.concept_id),
        title=asset.title or "인스타그램 광고",
        status=DemoAssetStatus(asset.status.value),
        created_at=asset.created_at,
        campaign_objective=content.get("campaign_objective", "brand_awareness"),
        target_audience=content.get("target_audience", {}),
        ads=ads,
        hashtags=content.get("hashtags", []),
        style=style,
        export_formats=["png", "jpg"],
        download_url=f"/api/v1/assets/instagram-ads/{asset.id}/download"
    )


# =============================================================================
# Shorts Script Asset API
# =============================================================================

@router.get("/assets/shorts-scripts/{asset_id}", response_model=ShortsScriptAssetResponse)
async def get_shorts_script_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """
    숏폼 스크립트 에셋 조회

    Args:
        asset_id: 에셋 ID

    Returns:
        ShortsScriptAssetResponse
    """
    asset = _get_asset_or_404(db, asset_id, AssetType.SHORTS_SCRIPT)

    content = asset.content or _get_default_shorts_content(asset)
    style = asset.style or _get_default_style()

    scenes = []
    for scene_data in content.get("scenes", []):
        scenes.append(ShortsScene(
            scene_number=scene_data.get("scene_number", len(scenes)+1),
            start_time=scene_data.get("start_time", 0),
            end_time=scene_data.get("end_time", 5),
            duration_seconds=scene_data.get("duration_seconds", 5),
            narration=scene_data.get("narration", ""),
            visual_description=scene_data.get("visual_description", ""),
            text_overlay=scene_data.get("text_overlay"),
            transition=scene_data.get("transition", "cut"),
            bgm_mood=scene_data.get("bgm_mood", "neutral")
        ))

    audio_data = content.get("audio", {})
    audio_config = ShortsAudioConfig(
        tts_voice=audio_data.get("tts_voice", "ko-KR-SunHiNeural"),
        tts_provider=audio_data.get("tts_provider", "edge-tts"),
        bgm_track=audio_data.get("bgm_track", "upbeat_corporate_01.mp3"),
        bgm_volume=audio_data.get("bgm_volume", 0.3)
    )

    return ShortsScriptAssetResponse(
        id=str(asset.id),
        concept_id=str(asset.concept_id),
        title=asset.title or "숏폼 스크립트",
        status=DemoAssetStatus(asset.status.value),
        created_at=asset.created_at,
        video_specs=content.get("video_specs", {
            "duration_seconds": 45,
            "aspect_ratio": "9:16",
            "resolution": "1080x1920",
            "fps": 30
        }),
        hook=content.get("hook", {"text": "", "duration_seconds": 3}),
        scenes=scenes,
        cta=content.get("cta", {"text": "", "duration_seconds": 5}),
        audio=audio_config,
        style=style,
        export_formats=["mp4", "webm"],
        preview_url=f"/api/v1/assets/shorts-scripts/{asset.id}/preview",
        download_url=f"/api/v1/assets/shorts-scripts/{asset.id}/download"
    )


# =============================================================================
# Helper Functions
# =============================================================================

def _get_asset_or_404(
    db: Session,
    asset_id: str,
    asset_type: AssetType
) -> ConceptAsset:
    """에셋 조회 또는 404"""
    try:
        asset_uuid = uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset_id format")

    asset = db.query(ConceptAsset).filter(
        ConceptAsset.id == asset_uuid,
        ConceptAsset.asset_type == asset_type
    ).first()

    if not asset:
        raise HTTPException(
            status_code=404,
            detail=f"{asset_type.value} asset not found: {asset_id}"
        )

    return asset


def _get_default_style() -> dict:
    """기본 스타일"""
    return {
        "primary_color": "#4F46E5",
        "secondary_color": "#10B981",
        "font_family": "Pretendard",
        "theme": "modern"
    }


def _get_default_presentation_content(asset: ConceptAsset) -> dict:
    """기본 발표자료 컨텐츠"""
    concept = asset.concept
    return {
        "slides": [
            {
                "slide_number": 1,
                "slide_type": "cover",
                "title": concept.name if concept else "프레젠테이션",
                "subtitle": concept.key_message if concept else ""
            },
            {
                "slide_number": 2,
                "slide_type": "content",
                "title": "핵심 내용",
                "content": [concept.description] if concept else []
            }
        ]
    }


def _get_default_product_detail_content(asset: ConceptAsset) -> dict:
    """기본 상세페이지 컨텐츠"""
    concept = asset.concept
    return {
        "sections": [
            {
                "section_type": "hero",
                "order": 1,
                "content": {
                    "headline": concept.key_message if concept else "",
                    "subheadline": concept.description if concept else ""
                }
            }
        ]
    }


def _get_default_instagram_content(asset: ConceptAsset) -> dict:
    """기본 인스타그램 컨텐츠"""
    concept = asset.concept
    return {
        "campaign_objective": "brand_awareness",
        "target_audience": {
            "description": concept.target_audience if concept else ""
        },
        "ads": [
            {
                "ad_id": "ad_1",
                "ad_type": "single_image",
                "format": "feed",
                "aspect_ratio": "1:1",
                "creative": {
                    "headline": concept.key_message if concept else "",
                    "primary_text": concept.description if concept else "",
                    "cta_text": "자세히 알아보기",
                    "image_prompt": f"{concept.visual_style}, marketing ad" if concept else ""
                },
                "specs": {"width": 1080, "height": 1080}
            }
        ],
        "hashtags": []
    }


def _get_default_shorts_content(asset: ConceptAsset) -> dict:
    """기본 숏폼 스크립트 컨텐츠"""
    concept = asset.concept
    return {
        "video_specs": {
            "duration_seconds": 45,
            "aspect_ratio": "9:16",
            "resolution": "1080x1920",
            "fps": 30
        },
        "hook": {
            "text": concept.key_message if concept else "",
            "duration_seconds": 3
        },
        "scenes": [
            {
                "scene_number": 1,
                "start_time": 0,
                "end_time": 5,
                "duration_seconds": 5,
                "narration": concept.description if concept else "",
                "visual_description": concept.visual_style if concept else "",
                "transition": "cut",
                "bgm_mood": "uplifting"
            }
        ],
        "cta": {
            "text": "지금 시작하세요",
            "duration_seconds": 5
        },
        "audio": {
            "tts_voice": "ko-KR-SunHiNeural",
            "tts_provider": "edge-tts",
            "bgm_track": "upbeat_corporate_01.mp3",
            "bgm_volume": 0.3
        }
    }
