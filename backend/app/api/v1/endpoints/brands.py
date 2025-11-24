"""
Brand CRUD API 엔드포인트

브랜드 생성, 조회, 수정, 삭제 기능

MVP P0-1 Brand OS Module:
- Brand Document 업로드 API
- Brand URL 크롤링 API
- Brand Document 목록 조회 API
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import logging

from app.core.database import get_db
from app.models.user import User
from app.models.brand import Brand, BrandDocument, DocumentType
from app.schemas.brand import (
    BrandCreate, BrandUpdate, BrandResponse,
    BrandDocumentCreate, BrandDocumentCrawl, BrandDocumentResponse,
    BrandDocumentListResponse
)
from app.schemas.brand_analyzer import BrandAnalysisInputV1, BrandDNAOutputV1, BrandDocumentInput
from app.services.agents.brand_analyzer import get_brand_analyzer_agent
from app.services.agents.base import AgentRequest, AgentError
from app.auth.jwt import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    brand_data: BrandCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    새로운 브랜드를 생성합니다.

    Args:
        brand_data: 브랜드 생성 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 브랜드 정보
    """
    # slug 중복 확인
    existing_brand = db.query(Brand).filter(Brand.slug == brand_data.slug).first()
    if existing_brand:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand with slug '{brand_data.slug}' already exists"
        )

    # 브랜드 생성
    brand = Brand(
        **brand_data.model_dump(),
        owner_id=current_user.id
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)

    return brand


@router.get("/", response_model=List[BrandResponse])
async def list_brands(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    사용자의 브랜드 목록을 조회합니다.

    Args:
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        브랜드 목록
    """
    brands = db.query(Brand).filter(
        Brand.owner_id == current_user.id,
        Brand.deleted_at == None
    ).offset(skip).limit(limit).all()

    return brands


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    특정 브랜드의 상세 정보를 조회합니다.

    Args:
        brand_id: 브랜드 ID
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        브랜드 상세 정보

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    # 권한 확인 (소유자만 조회 가능)
    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return brand


@router.patch("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: UUID,
    brand_data: BrandUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드 정보를 수정합니다.

    Args:
        brand_id: 브랜드 ID
        brand_data: 수정할 데이터
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        수정된 브랜드 정보

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    # 권한 확인
    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # 수정
    update_data = brand_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(brand, key, value)

    db.commit()
    db.refresh(brand)

    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
    brand_id: UUID,
    hard_delete: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드를 삭제합니다 (기본: Soft Delete).

    Args:
        brand_id: 브랜드 ID
        hard_delete: True면 완전 삭제, False면 소프트 삭제
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    # 권한 확인
    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    if hard_delete:
        # 완전 삭제
        db.delete(brand)
    else:
        # 소프트 삭제
        from datetime import datetime
        brand.deleted_at = datetime.utcnow()

    db.commit()


# ==========================================
# Brand Document APIs (MVP P0-1)
# ==========================================

@router.post("/{brand_id}/documents", response_model=BrandDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_brand_document(
    brand_id: UUID,
    file: UploadFile = File(...),
    title: str | None = None,
    document_type: str = "pdf",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드 문서를 업로드합니다 (PDF, 이미지, 브로슈어 등).

    Args:
        brand_id: 브랜드 ID
        file: 업로드할 파일
        title: 문서 제목 (optional)
        document_type: 문서 타입 (pdf, image, brochure)
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 문서 정보

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    # 브랜드 존재 및 권한 확인
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # 파일 타입 검증
    allowed_types = {
        "pdf": ["application/pdf"],
        "image": ["image/jpeg", "image/png", "image/gif", "image/webp"],
        "brochure": ["application/pdf", "image/jpeg", "image/png"]
    }

    if document_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document_type. Must be one of: pdf, image, brochure"
        )

    if file.content_type not in allowed_types.get(document_type, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type for {document_type}. Allowed: {allowed_types[document_type]}"
        )

    # 파일 저장 (실제 구현에서는 S3 업로드)
    # TODO: S3 업로드 로직 구현
    file_content = await file.read()
    file_size = len(file_content)

    # 임시 파일 경로 (실제로는 S3 URL)
    file_url = f"/tmp/{brand_id}/{file.filename}"

    # BrandDocument 생성
    document = BrandDocument(
        brand_id=brand_id,
        title=title or file.filename,
        document_type=DocumentType(document_type),
        file_url=file_url,
        file_size=file_size,
        mime_type=file.content_type,
        processed="pending",
        document_metadata={
            "original_filename": file.filename,
            "upload_user_id": str(current_user.id)
        }
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    logger.info(f"Document uploaded: {document.id} for brand {brand_id}")

    return document


@router.post("/{brand_id}/documents/crawl", response_model=BrandDocumentResponse, status_code=status.HTTP_201_CREATED)
async def crawl_brand_url(
    brand_id: UUID,
    crawl_data: BrandDocumentCrawl,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드 URL을 크롤링하여 문서로 저장합니다.

    Args:
        brand_id: 브랜드 ID
        crawl_data: 크롤링 요청 데이터 (URL, title)
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 문서 정보

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    # 브랜드 존재 및 권한 확인
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # URL 크롤링 (실제 구현에서는 비동기 작업)
    # TODO: 실제 크롤링 로직 구현 (BeautifulSoup, Playwright 등)

    # BrandDocument 생성
    document = BrandDocument(
        brand_id=brand_id,
        title=crawl_data.title or f"Crawled from {crawl_data.url}",
        document_type=DocumentType.URL,
        source_url=crawl_data.url,
        processed="pending",
        document_metadata={
            "crawl_user_id": str(current_user.id),
            "crawl_requested_at": str(db.query(db.func.now()).scalar())
        }
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    logger.info(f"URL crawl requested: {document.id} for brand {brand_id}, URL: {crawl_data.url}")

    # TODO: 백그라운드 태스크로 크롤링 작업 실행
    # background_tasks.add_task(crawl_and_extract, document.id, crawl_data.url)

    return document


@router.get("/{brand_id}/documents", response_model=BrandDocumentListResponse)
async def list_brand_documents(
    brand_id: UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드의 문서 목록을 조회합니다.

    Args:
        brand_id: 브랜드 ID
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        문서 목록 및 총 개수

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없는 경우
    """
    # 브랜드 존재 및 권한 확인
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # 문서 목록 조회
    documents = db.query(BrandDocument).filter(
        BrandDocument.brand_id == brand_id
    ).offset(skip).limit(limit).all()

    total = db.query(BrandDocument).filter(
        BrandDocument.brand_id == brand_id
    ).count()

    return BrandDocumentListResponse(
        documents=documents,
        total=total
    )


@router.delete("/{brand_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand_document(
    brand_id: UUID,
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드 문서를 삭제합니다.

    Args:
        brand_id: 브랜드 ID
        document_id: 문서 ID
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Raises:
        HTTPException: 브랜드/문서를 찾을 수 없거나 권한이 없는 경우
    """
    # 브랜드 존재 및 권한 확인
    brand = db.query(Brand).filter(Brand.id == brand_id).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # 문서 조회
    document = db.query(BrandDocument).filter(
        BrandDocument.id == document_id,
        BrandDocument.brand_id == brand_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # 문서 삭제 (CASCADE로 자동 삭제되지만 명시적으로 처리)
    db.delete(document)
    db.commit()

    logger.info(f"Document deleted: {document_id} from brand {brand_id}")


# ==========================================
# BrandAnalyzerAgent API (MVP P0-1)
# ==========================================

@router.post("/{brand_id}/analyze", response_model=BrandDNAOutputV1)
async def analyze_brand(
    brand_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드 분석 및 Brand DNA 자동 생성

    브랜드에 업로드된 모든 문서를 분석하여 Brand DNA Card를 생성합니다.
    생성된 Brand DNA는 자동으로 brands.brand_dna에 저장됩니다.

    Args:
        brand_id: 브랜드 ID
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        Brand DNA Card (tone, key_messages, target_audience, dos/donts, sample_copies, suggested_brand_kit)

    Raises:
        HTTPException: 브랜드를 찾을 수 없거나 권한이 없거나 문서가 없는 경우
    """
    # 브랜드 존재 및 권한 확인
    brand = db.query(Brand).filter(
        Brand.id == brand_id,
        Brand.deleted_at == None
    ).first()

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )

    if brand.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # 문서 조회
    documents = db.query(BrandDocument).filter(
        BrandDocument.brand_id == brand_id,
        BrandDocument.processed == "completed"  # 완료된 문서만
    ).all()

    if not documents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No processed documents found. Please upload and process documents first."
        )

    # BrandDocumentInput 변환
    document_inputs = []
    for doc in documents:
        if doc.extracted_text:  # 텍스트가 있는 문서만
            document_inputs.append(
                BrandDocumentInput(
                    type=doc.document_type.value,
                    extracted_text=doc.extracted_text,
                    title=doc.title
                )
            )

    if not document_inputs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents with extracted text found. Please ensure documents are processed."
        )

    # BrandAnalysisInput 생성
    analysis_input = BrandAnalysisInputV1(
        brand_name=brand.name,
        documents=document_inputs,
        website_url=brand.website_url,
        industry=brand.industry,
        existing_brand_kit=brand.brand_kit
    )

    # BrandAnalyzerAgent 실행
    try:
        agent = get_brand_analyzer_agent()
        request = AgentRequest(
            task="brand_dna_generation",
            payload=analysis_input.model_dump()
        )

        response = await agent.execute(request)

        # Output 추출
        if not response.outputs or len(response.outputs) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="BrandAnalyzerAgent returned no output"
            )

        brand_dna_output = BrandDNAOutputV1(**response.outputs[0].value)

        # Brand DNA를 DB에 저장
        brand.brand_dna = brand_dna_output.model_dump()

        # suggested_brand_kit을 brand_kit에 병합 (기존 값 유지)
        if not brand.brand_kit:
            brand.brand_kit = {}

        suggested_kit = brand_dna_output.suggested_brand_kit.model_dump()

        # 기존 brand_kit이 없는 항목만 suggested_brand_kit으로 채움
        if "colors" not in brand.brand_kit:
            brand.brand_kit["colors"] = {
                "primary": suggested_kit.get("primary_colors", []),
                "secondary": suggested_kit.get("secondary_colors", [])
            }
        if "fonts" not in brand.brand_kit:
            brand.brand_kit["fonts"] = suggested_kit.get("fonts", {})
        if "tone_keywords" not in brand.brand_kit:
            brand.brand_kit["tone_keywords"] = suggested_kit.get("tone_keywords", [])
        if "forbidden_expressions" not in brand.brand_kit:
            brand.brand_kit["forbidden_expressions"] = suggested_kit.get("forbidden_expressions", [])

        db.commit()
        db.refresh(brand)

        logger.info(
            f"Brand DNA generated for brand {brand_id}, "
            f"confidence_score: {brand_dna_output.confidence_score}, "
            f"documents analyzed: {len(document_inputs)}"
        )

        return brand_dna_output

    except AgentError as e:
        logger.error(f"BrandAnalyzerAgent error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Brand analysis failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during brand analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Brand analysis failed: {str(e)}"
        )
