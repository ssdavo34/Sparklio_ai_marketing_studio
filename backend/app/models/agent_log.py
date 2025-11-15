from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class AgentLog(Base):
    """
    에이전트 실행 로그 모델

    모든 Agent 실행 이력을 추적합니다.
    - A2A 프로토콜 request/response 저장
    - 성능 메트릭 (실행 시간, 토큰 사용량)
    - 에러 추적
    """
    __tablename__ = "agent_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 관계
    workflow_id = Column(UUID(as_uuid=True), ForeignKey('workflows.id'), nullable=True)
    workflow_node_id = Column(UUID(as_uuid=True), ForeignKey('workflow_nodes.id'), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    # Agent 정보
    agent_name = Column(String(100), nullable=False, index=True)
    source_agent = Column(String(100), nullable=True)  # 요청한 Agent
    target_agent = Column(String(100), nullable=True)  # 수신 Agent

    # A2A Request/Response
    request_id = Column(String(100), nullable=False, index=True)
    request_payload = Column(JSONB, nullable=True)
    response_payload = Column(JSONB, nullable=True)

    # 실행 상태
    status = Column(String(20), nullable=False)  # 'success', 'error', 'partial'
    error_message = Column(Text, nullable=True)
    error_code = Column(String(50), nullable=True)

    # 성능 메트릭
    execution_time_ms = Column(Integer, nullable=True)  # 실행 시간 (밀리초)
    token_usage = Column(JSONB, nullable=True)
    # {
    #   "prompt_tokens": 150,
    #   "completion_tokens": 300,
    #   "total_tokens": 450,
    #   "cost_usd": 0.0045
    # }

    # Context 크기
    context_size_bytes = Column(Integer, nullable=True)

    # 메타데이터
    log_metadata = Column(JSONB, nullable=True)  # Renamed from 'metadata' (SQLAlchemy reserved word)

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False, index=True)

    def __repr__(self):
        return f"<AgentLog(id={self.id}, agent={self.agent_name}, status={self.status}, created_at={self.created_at})>"


class RouterLog(Base):
    """
    SmartRouter 로그 모델

    SmartRouter의 의사결정 과정을 추적합니다.
    - Intent Classification
    - Agent Selection
    - Model Selection
    """
    __tablename__ = "router_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=True)

    # 사용자 요청
    request_text = Column(Text, nullable=False)

    # Router 결정
    detected_intent = Column(String(50), nullable=True)  # 'brand_query', 'strategy', etc.
    selected_agent = Column(String(100), nullable=True)
    selected_model = Column(String(100), nullable=True)

    # Risk Assessment
    risk_level = Column(String(20), nullable=True)  # 'low', 'medium', 'high'
    context_size_bytes = Column(Integer, nullable=True)

    # 결정 과정
    decision_metadata = Column(JSONB, nullable=True)
    # {
    #   "intent_scores": {"brand_query": 0.85, "strategy": 0.12},
    #   "agent_candidates": ["BrandAgent", "StrategistAgent"],
    #   "model_selection_reason": "low risk + small context"
    # }

    # 타임스탬프
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False, index=True)

    def __repr__(self):
        return f"<RouterLog(id={self.id}, intent={self.detected_intent}, agent={self.selected_agent})>"
