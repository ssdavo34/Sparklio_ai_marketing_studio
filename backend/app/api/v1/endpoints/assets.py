from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import mimetypes

from app.core.database import get_db
from app.models.asset import GeneratedAsset
from app.schemas.asset import AssetCreate, AssetResponse, AssetUpdate, AssetListResponse
from app.services.storage import storage_service
from app.core.config import settings

router = APIRouter()

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def upload_asset(
    file: UploadFile = File(...),
    brand_id: UUID = Form(...),
    project_id: Optional[UUID] = Form(None),
    user_id: UUID = Form(...),
    asset_type: str = Form(...),  # 'image', 'video', 'text'
    source: str = Form('manual'),
    tags: Optional[str] = Form(None),  # Comma-separated
    db: Session = Depends(get_db)
):
    """
    Upload a new asset to MinIO and save metadata to database.

    Example:
    ```
    curl -X POST http://100.123.51.5:8000/api/v1/assets \\
      -F 'file=@image.png' \\
      -F 'brand_id=550e8400-e29b-41d4-a716-446655440000' \\
      -F 'user_id=550e8400-e29b-41d4-a716-446655440001' \\
      -F 'asset_type=image' \\
      -F 'source=manual' \\
      -F 'tags=product,banner'
    ```
    """
    try:
        # Read file content
        file_data = await file.read()
        file_size = len(file_data)

        # Validate file size
        max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f'File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit'
            )

        # Get file extension and mime type
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]

        # Generate object path
        object_path = storage_service.generate_object_path(
            asset_type=asset_type,
            brand_id=brand_id,
            project_id=project_id,
            file_extension=file_extension
        )

        # Get bucket name
        bucket = storage_service._get_bucket_name(asset_type)

        # Upload to MinIO
        upload_result = storage_service.upload_file(
            bucket=bucket,
            object_path=object_path,
            file_data=file_data,
            content_type=mime_type or 'application/octet-stream'
        )

        # Parse tags
        tag_list = [t.strip() for t in tags.split(',')] if tags else None

        # Create database record
        db_asset = GeneratedAsset(
            brand_id=brand_id,
            project_id=project_id,
            user_id=user_id,
            type=asset_type,
            minio_path=upload_result['minio_path'],
            original_name=file.filename,
            file_size=upload_result['file_size'],
            mime_type=mime_type,
            checksum=upload_result['checksum'],
            source=source,
            tags=tag_list,
            status='active'
        )

        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)

        # Generate presigned URL for response
        presigned_url = storage_service.get_presigned_url(db_asset.minio_path)

        # Build response
        response = AssetResponse.model_validate(db_asset)
        response.presigned_url = presigned_url

        return response

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Upload failed: {str(e)}'
        )

@router.get("/", response_model=AssetListResponse)
async def list_assets(
    brand_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    asset_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """
    List assets with filtering and pagination.

    Example:
    ```
    curl http://100.123.51.5:8000/api/v1/assets?brand_id=550e8400-e29b-41d4-a716-446655440000&page=1&page_size=20
    ```
    """
    query = db.query(GeneratedAsset)

    # Apply filters
    if brand_id:
        query = query.filter(GeneratedAsset.brand_id == brand_id)
    if project_id:
        query = query.filter(GeneratedAsset.project_id == project_id)
    if asset_type:
        query = query.filter(GeneratedAsset.type == asset_type)
    if status_filter:
        query = query.filter(GeneratedAsset.status == status_filter)
    else:
        query = query.filter(GeneratedAsset.status == 'active')  # Default: active only

    # Get total count
    total = query.count()

    # Pagination
    offset = (page - 1) * page_size
    assets = query.order_by(GeneratedAsset.created_at.desc()).offset(offset).limit(page_size).all()

    # Generate presigned URLs
    asset_responses = []
    for asset in assets:
        response = AssetResponse.model_validate(asset)
        response.presigned_url = storage_service.get_presigned_url(asset.minio_path)
        asset_responses.append(response)

    return AssetListResponse(
        total=total,
        page=page,
        page_size=page_size,
        assets=asset_responses
    )

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a single asset by ID"""
    asset = db.query(GeneratedAsset).filter(GeneratedAsset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail='Asset not found')

    response = AssetResponse.model_validate(asset)
    response.presigned_url = storage_service.get_presigned_url(asset.minio_path)

    return response

@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: UUID,
    asset_update: AssetUpdate,
    db: Session = Depends(get_db)
):
    """Update asset metadata (tags, status, etc.)"""
    asset = db.query(GeneratedAsset).filter(GeneratedAsset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail='Asset not found')

    # Update fields
    if asset_update.tags is not None:
        asset.tags = asset_update.tags
    if asset_update.metadata is not None:
        asset.metadata = asset_update.metadata
    if asset_update.status is not None:
        asset.status = asset_update.status

    db.commit()
    db.refresh(asset)

    response = AssetResponse.model_validate(asset)
    response.presigned_url = storage_service.get_presigned_url(asset.minio_path)

    return response

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: UUID,
    hard_delete: bool = False,
    db: Session = Depends(get_db)
):
    """
    Delete an asset (soft delete by default).

    - hard_delete=False: Mark as deleted (status='deleted')
    - hard_delete=True: Remove from database AND MinIO
    """
    asset = db.query(GeneratedAsset).filter(GeneratedAsset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail='Asset not found')

    if hard_delete:
        # Delete from MinIO
        try:
            storage_service.delete_file(asset.minio_path)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f'Failed to delete file from storage: {str(e)}'
            )

        # Delete from database
        db.delete(asset)
    else:
        # Soft delete
        from datetime import datetime
        asset.status = 'deleted'
        asset.deleted_at = datetime.now()

    db.commit()

    return None
