from sqlalchemy import Column, String, Text, TIMESTAMP, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


class Document(Base):
    """
    Document 모델

    Editor Document 저장 및 버전 관리
    - Generator가 생성한 editorDocument JSON 저장
    - 사용자 수정 내역 저장 (Auto-save)
    - 버전 관리 지원
    """
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    # Editor Document JSON
    # ONE_PAGE_EDITOR_SPEC.md 섹션 5.2 구조
    # {
    #   "documentId": "doc_123",
    #   "type": "brand_kit" | "product_detail" | "sns",
    #   "brandId": "brand_001",
    #   "pages": [...]
    # }
    document_json = Column(JSONB, nullable=False)

    # 메타데이터
    # {
    #   "generator_kind": "product_detail",
    #   "task_id": "gen_123",
    #   "templates_used": ["product_detail_premium"],
    #   "agents_trace": [...],
    #   "last_action": "update_object",
    #   "total_edits": 5
    # }
    document_metadata = Column(JSONB, nullable=True, default={})

    # 버전 관리
    version = Column(Integer, default=1, nullable=False)

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Document(id={self.id}, user_id={self.user_id}, version={self.version})>"


class Template(Base):
    """
    Template 모델

    Generator가 사용하는 Layout Template 저장
    - Crawling Pipeline으로 수집
    - Admin 승인 프로세스
    - Redis 캐싱 지원
    """
    __tablename__ = "templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(String(255), unique=True, nullable=False, index=True)

    # Template 유형 및 출처
    type = Column(String(50), nullable=False)
    # 'brand_kit', 'product_detail', 'sns', 'presentation'

    origin = Column(String(50), nullable=False)
    # 'crawled', 'manual', 'ai_generated'

    # 산업 및 채널 (필터링용)
    industry = Column(JSONB, nullable=True, default=[])
    # ['beauty', 'food', 'fashion']

    channel = Column(JSONB, nullable=True, default=[])
    # ['instagram', 'blog', 'youtube']

    # Template JSON (ONE_PAGE_EDITOR_SPEC.md 구조)
    document_json = Column(JSONB, nullable=False)

    # 승인 상태
    status = Column(String(20), default='draft', nullable=False)
    # 'draft', 'approved', 'rejected'

    # 메타데이터
    template_metadata = Column(JSONB, nullable=True, default={})
    # {
    #   "source_url": "https://example.com",
    #   "crawled_at": "2025-11-15T10:00:00Z",
    #   "quality_score": 0.85,
    #   "usage_count": 42
    # }

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Template(id={self.id}, template_id={self.template_id}, type={self.type}, status={self.status})>"


class GenerationJob(Base):
    """
    Generation Job 모델

    Generator 실행 이력 저장 및 모니터링
    - 비동기 Generation 작업 추적
    - 성능 메트릭 수집
    - 에러 로그
    """
    __tablename__ = "generation_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(String(255), unique=True, nullable=False, index=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=True)

    # Generator 정보
    kind = Column(String(50), nullable=False)
    # 'brand_kit', 'product_detail', 'sns'

    status = Column(String(20), default='queued', nullable=False)
    # 'queued', 'running', 'completed', 'failed'

    # 입력 및 결과 데이터
    input_data = Column(JSONB, nullable=True)
    result_data = Column(JSONB, nullable=True)

    # 성능 메트릭
    started_at = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # 에러 처리
    error_message = Column(Text, nullable=True)

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<GenerationJob(id={self.id}, task_id={self.task_id}, kind={self.kind}, status={self.status})>"
