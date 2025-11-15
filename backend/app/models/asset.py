from sqlalchemy import Column, String, BigInteger, TIMESTAMP, ARRAY, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.core.database import Base
import uuid

class GeneratedAsset(Base):
    __tablename__ = "generated_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), nullable=False)
    project_id = Column(UUID(as_uuid=True), nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)

    type = Column(String(50), nullable=False)  # 'image', 'video', 'text', etc.
    minio_path = Column(Text, nullable=False)
    original_name = Column(Text, nullable=True)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=True)
    checksum = Column(Text, nullable=True)

    source = Column(String(50), nullable=False)  # 'comfyui', 'ollama', 'manual'
    source_metadata = Column(JSONB, nullable=True)

    status = Column(String(20), default='active')  # 'active', 'archived', 'deleted'
    embedding = Column(Vector(1536), nullable=True)  # For similarity search
    asset_metadata = Column(JSONB, nullable=True)  # Renamed from 'metadata' (SQLAlchemy reserved word)
    tags = Column(ARRAY(Text), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(TIMESTAMP, nullable=True)
