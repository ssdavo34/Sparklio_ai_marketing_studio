from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Workflow(Base):
    """
    워크플로우 모델

    Multi-Agent DAG 실행을 관리합니다.
    - PMAgent가 생성한 DAG 저장
    - 실행 상태 추적
    - 노드별 실행 결과 저장
    """
    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    brand_id = Column(UUID(as_uuid=True), ForeignKey('brands.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    name = Column(String(255), nullable=False)
    workflow_type = Column(String(50), nullable=False)  # 'campaign', 'brochure', etc.

    # DAG 정의 (JSON)
    dag_definition = Column(JSONB, nullable=False)
    # {
    #   "nodes": [
    #     {"id": "brief", "agent": "BriefAgent", "dependencies": []},
    #     {"id": "strategy", "agent": "StrategistAgent", "dependencies": ["brief"]},
    #     {"id": "copy", "agent": "CopywriterAgent", "dependencies": ["strategy"]}
    #   ]
    # }

    # 실행 상태
    status = Column(String(20), default='pending', nullable=False)
    # 'pending', 'running', 'completed', 'failed', 'cancelled'

    # 실행 결과
    execution_result = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)

    # 타임스탬프
    started_at = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Workflow(id={self.id}, name={self.name}, status={self.status})>"


class WorkflowNode(Base):
    """
    워크플로우 노드 모델

    DAG의 개별 노드(Agent 실행 단위)를 추적합니다.
    """
    __tablename__ = "workflow_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey('workflows.id'), nullable=False)

    node_id = Column(String(100), nullable=False)  # DAG 내 노드 ID
    agent_name = Column(String(100), nullable=False)  # 실행할 Agent 이름

    # 실행 상태
    status = Column(String(20), default='pending', nullable=False)
    # 'pending', 'running', 'completed', 'failed', 'skipped'

    # 입출력
    input_data = Column(JSONB, nullable=True)
    output_data = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)

    # 실행 순서 및 의존성
    execution_order = Column(Integer, nullable=True)
    dependencies = Column(JSONB, nullable=True)  # ["brief", "strategy"]

    # 타임스탬프
    started_at = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<WorkflowNode(id={self.id}, node_id={self.node_id}, agent={self.agent_name}, status={self.status})>"
