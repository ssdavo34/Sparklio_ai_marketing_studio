"""
사전 정의 워크플로우

자주 사용되는 Agent 조합 워크플로우

작성일: 2025-11-17
"""

from typing import Dict, Any
from .base import WorkflowDefinition, WorkflowStep, StepType


class ProductContentWorkflow:
    """제품 콘텐츠 생성 파이프라인

    Copywriter → Reviewer → Optimizer
    """

    @staticmethod
    def get_definition() -> WorkflowDefinition:
        return WorkflowDefinition(
            name="product_content_pipeline",
            description="제품 콘텐츠 생성 → 검토 → 최적화 파이프라인",
            step_type=StepType.SEQUENTIAL,
            steps=[
                # Step 1: Copywriter - 초안 생성
                WorkflowStep(
                    agent_name="copywriter",
                    task="product_detail",
                    payload_template={
                        "product_name": "${initial.product_name}",
                        "features": "${initial.features}",
                        "target_audience": "${initial.target_audience}"
                    },
                    options={"tone": "professional", "length": "medium"}
                ),

                # Step 2: Reviewer - 품질 검토
                WorkflowStep(
                    agent_name="reviewer",
                    task="content_review",
                    payload_template={
                        "content": "${step_0.outputs[0].value}",
                        "criteria": ["quality", "brand_fit", "effectiveness"]
                    }
                ),

                # Step 3: Optimizer - 최적화
                WorkflowStep(
                    agent_name="optimizer",
                    task="conversion_optimize",
                    payload_template={
                        "content": "${step_0.outputs[0].value}",
                        "review_feedback": "${step_1.outputs[0].value}",
                        "target_metrics": ["conversion_rate", "readability"]
                    }
                )
            ]
        )


class BrandIdentityWorkflow:
    """브랜드 아이덴티티 수립 파이프라인

    Strategist → Copywriter (병렬) → Reviewer
    """

    @staticmethod
    def get_definition() -> WorkflowDefinition:
        return WorkflowDefinition(
            name="brand_identity_pipeline",
            description="브랜드 전략 수립 → 메시지 생성 → 검토 파이프라인",
            step_type=StepType.SEQUENTIAL,
            steps=[
                # Step 1: Strategist - 브랜드 전략
                WorkflowStep(
                    agent_name="strategist",
                    task="brand_kit",
                    payload_template={
                        "brand_name": "${initial.brand_name}",
                        "industry": "${initial.industry}",
                        "target_market": "${initial.target_market}"
                    }
                ),

                # Step 2: Copywriter - 브랜드 메시지
                WorkflowStep(
                    agent_name="copywriter",
                    task="brand_message",
                    payload_template={
                        "brand_strategy": "${step_0.outputs[0].value}",
                        "tone": "inspirational"
                    },
                    options={"length": "short"}
                ),

                # Step 3: Reviewer - 일관성 검토
                WorkflowStep(
                    agent_name="reviewer",
                    task="brand_consistency",
                    payload_template={
                        "brand_strategy": "${step_0.outputs[0].value}",
                        "brand_message": "${step_1.outputs[0].value}"
                    }
                )
            ]
        )


class ContentReviewWorkflow:
    """콘텐츠 검토 및 개선 파이프라인

    Reviewer → Editor → Reviewer (재검토)
    """

    @staticmethod
    def get_definition() -> WorkflowDefinition:
        return WorkflowDefinition(
            name="content_review_pipeline",
            description="콘텐츠 검토 → 교정 → 재검토 파이프라인",
            step_type=StepType.SEQUENTIAL,
            steps=[
                # Step 1: Reviewer - 초기 검토
                WorkflowStep(
                    agent_name="reviewer",
                    task="content_review",
                    payload_template={
                        "content": "${initial.content}",
                        "criteria": ["grammar", "clarity", "effectiveness"]
                    }
                ),

                # Step 2: Editor - 교정 및 개선
                WorkflowStep(
                    agent_name="editor",
                    task="proofread",
                    payload_template={
                        "content": "${initial.content}",
                        "review_feedback": "${step_0.outputs[0].value}"
                    }
                ),

                # Step 3: Reviewer - 재검토
                WorkflowStep(
                    agent_name="reviewer",
                    task="content_review",
                    payload_template={
                        "content": "${step_1.outputs[0].value}",
                        "criteria": ["quality", "improvement"]
                    }
                )
            ]
        )


# 워크플로우 레지스트리
WORKFLOWS = {
    "product_content": ProductContentWorkflow,
    "brand_identity": BrandIdentityWorkflow,
    "content_review": ContentReviewWorkflow
}


def get_workflow(name: str) -> WorkflowDefinition:
    """
    워크플로우 정의 가져오기

    Args:
        name: 워크플로우 이름

    Returns:
        WorkflowDefinition

    Raises:
        ValueError: 존재하지 않는 워크플로우
    """
    if name not in WORKFLOWS:
        raise ValueError(
            f"Unknown workflow: {name}. "
            f"Available: {', '.join(WORKFLOWS.keys())}"
        )

    return WORKFLOWS[name].get_definition()
