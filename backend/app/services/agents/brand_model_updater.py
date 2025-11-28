"""
Brand Model Updater Agent

브랜드 학습 모델 업데이트 에이전트
사용자 피드백, 성과 데이터를 반영하여 브랜드 벡터와 스타일 모델을 갱신합니다.

작성일: 2025-11-28
작성자: B팀 (Backend)
참조: AGENTS_SPEC.md - BrandModelUpdaterAgent, BRAND_LEARNING_ENGINE.md

역할: Prompt Tuner + Style Model Builder
"""

import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentOutput, AgentError

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class FeedbackData(BaseModel):
    """피드백 데이터"""
    content_id: str = Field(..., description="콘텐츠 ID")
    content_type: str = Field(..., description="콘텐츠 유형 (copy, image, video)")
    rating: float = Field(..., ge=0.0, le=5.0, description="평점")
    feedback_text: Optional[str] = Field(None, description="피드백 텍스트")
    selected: bool = Field(default=False, description="선택 여부")
    engagement_metrics: Optional[Dict[str, Any]] = Field(None, description="참여 지표")


class PerformanceData(BaseModel):
    """성과 데이터"""
    campaign_id: str = Field(..., description="캠페인 ID")
    impressions: int = Field(default=0, description="노출 수")
    clicks: int = Field(default=0, description="클릭 수")
    conversions: int = Field(default=0, description="전환 수")
    engagement_rate: float = Field(default=0.0, description="참여율")
    content_samples: List[Dict[str, Any]] = Field(default_factory=list, description="성과 좋은 콘텐츠 샘플")


class BrandModelUpdaterInput(BaseModel):
    """BrandModelUpdaterAgent 입력"""
    brand_id: str = Field(..., description="브랜드 ID")
    update_type: str = Field(..., description="업데이트 유형 (feedback, performance, full)")
    feedback_data: List[FeedbackData] = Field(default_factory=list, description="피드백 데이터")
    performance_data: Optional[PerformanceData] = Field(None, description="성과 데이터")
    force_update: bool = Field(default=False, description="강제 업데이트")


class StyleUpdate(BaseModel):
    """스타일 업데이트"""
    dimension: str = Field(..., description="스타일 차원")
    old_value: Any = Field(..., description="이전 값")
    new_value: Any = Field(..., description="새 값")
    confidence: float = Field(default=0.8, description="신뢰도")


class BrandModelUpdaterOutput(BaseModel):
    """BrandModelUpdaterAgent 출력"""
    brand_id: str = Field(..., description="브랜드 ID")
    update_id: str = Field(..., description="업데이트 ID")
    updated: bool = Field(..., description="업데이트 여부")
    vector_updated: bool = Field(default=False, description="벡터 업데이트 여부")
    style_updates: List[StyleUpdate] = Field(default_factory=list, description="스타일 업데이트 목록")
    prompt_adjustments: Dict[str, str] = Field(default_factory=dict, description="프롬프트 조정")
    learning_summary: str = Field(default="", description="학습 요약")
    next_update_recommended: Optional[datetime] = Field(None, description="다음 업데이트 권장 시점")


# =============================================================================
# Brand Model Updater Agent
# =============================================================================

class BrandModelUpdaterAgent(AgentBase):
    """
    Brand Model Updater Agent

    브랜드 학습 데이터를 기반으로 모델을 업데이트합니다.

    주요 기능:
    1. 피드백 기반 학습: 사용자 선택/평점 반영
    2. 성과 기반 학습: CTR, 전환율 등 반영
    3. 스타일 모델 갱신: 톤, 길이, 키워드 선호도
    4. 프롬프트 튜닝: 에이전트 프롬프트 최적화

    학습 전략:
    - 긍정적 피드백: 해당 스타일 가중치 증가
    - 부정적 피드백: 해당 스타일 가중치 감소
    - 선택된 콘텐츠: 패턴 학습 및 반영
    """

    # 학습률
    LEARNING_RATE = 0.1

    # 최소 피드백 수
    MIN_FEEDBACK_COUNT = 5

    @property
    def name(self) -> str:
        return "brand_model_updater"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        브랜드 모델 업데이트

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = BrandModelUpdaterInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        logger.info(f"[BrandModelUpdaterAgent] Starting {input_data.update_type} update for brand {input_data.brand_id}")

        try:
            if input_data.update_type == "feedback":
                result = await self._update_from_feedback(input_data)
            elif input_data.update_type == "performance":
                result = await self._update_from_performance(input_data)
            else:
                result = await self._full_update(input_data)
        except Exception as e:
            logger.error(f"[BrandModelUpdaterAgent] Update failed: {e}")
            raise AgentError(
                message=f"Update failed: {str(e)}",
                agent=self.name,
                details={"brand_id": input_data.brand_id}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(f"[BrandModelUpdaterAgent] Update completed: {result.updated}")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="brand_update",
                    value=result.model_dump(),
                    meta={"updated": result.updated}
                )
            ],
            usage={
                "elapsed_seconds": elapsed
            },
            meta={
                "brand_id": input_data.brand_id,
                "update_type": input_data.update_type
            }
        )

    async def _update_from_feedback(self, input_data: BrandModelUpdaterInput) -> BrandModelUpdaterOutput:
        """피드백 기반 업데이트"""
        feedback_list = input_data.feedback_data

        # 최소 피드백 수 확인
        if len(feedback_list) < self.MIN_FEEDBACK_COUNT and not input_data.force_update:
            return BrandModelUpdaterOutput(
                brand_id=input_data.brand_id,
                update_id=f"update_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                updated=False,
                learning_summary=f"Insufficient feedback ({len(feedback_list)}/{self.MIN_FEEDBACK_COUNT}). Need more data.",
                next_update_recommended=datetime.utcnow()
            )

        # 피드백 분석
        analysis = await self._analyze_feedback(feedback_list)

        # 스타일 업데이트 결정
        style_updates = self._calculate_style_updates(analysis)

        # 프롬프트 조정 생성
        prompt_adjustments = await self._generate_prompt_adjustments(analysis, input_data.brand_id)

        # SelfLearningAgent와 연동하여 실제 업데이트 적용
        await self._apply_updates(input_data.brand_id, style_updates, prompt_adjustments)

        return BrandModelUpdaterOutput(
            brand_id=input_data.brand_id,
            update_id=f"update_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            updated=True,
            vector_updated=len(style_updates) > 0,
            style_updates=style_updates,
            prompt_adjustments=prompt_adjustments,
            learning_summary=self._generate_summary(analysis, style_updates),
            next_update_recommended=datetime.utcnow()
        )

    async def _update_from_performance(self, input_data: BrandModelUpdaterInput) -> BrandModelUpdaterOutput:
        """성과 기반 업데이트"""
        perf = input_data.performance_data

        if not perf or not perf.content_samples:
            return BrandModelUpdaterOutput(
                brand_id=input_data.brand_id,
                update_id=f"update_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                updated=False,
                learning_summary="No performance data or content samples provided."
            )

        # 성과 좋은 콘텐츠 패턴 분석
        pattern_analysis = await self._analyze_high_performers(perf.content_samples)

        # 스타일 업데이트
        style_updates = self._derive_style_from_patterns(pattern_analysis)

        # 프롬프트 조정
        prompt_adjustments = await self._generate_prompt_from_patterns(pattern_analysis, input_data.brand_id)

        await self._apply_updates(input_data.brand_id, style_updates, prompt_adjustments)

        return BrandModelUpdaterOutput(
            brand_id=input_data.brand_id,
            update_id=f"update_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            updated=True,
            vector_updated=True,
            style_updates=style_updates,
            prompt_adjustments=prompt_adjustments,
            learning_summary=f"Learned from {len(perf.content_samples)} high-performing samples. CTR: {perf.clicks/max(perf.impressions,1)*100:.2f}%"
        )

    async def _full_update(self, input_data: BrandModelUpdaterInput) -> BrandModelUpdaterOutput:
        """전체 업데이트 (피드백 + 성과)"""
        results = []

        if input_data.feedback_data:
            fb_result = await self._update_from_feedback(input_data)
            results.append(fb_result)

        if input_data.performance_data:
            perf_result = await self._update_from_performance(input_data)
            results.append(perf_result)

        # 결과 병합
        all_style_updates = []
        all_prompt_adjustments = {}

        for r in results:
            all_style_updates.extend(r.style_updates)
            all_prompt_adjustments.update(r.prompt_adjustments)

        return BrandModelUpdaterOutput(
            brand_id=input_data.brand_id,
            update_id=f"update_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            updated=any(r.updated for r in results),
            vector_updated=any(r.vector_updated for r in results),
            style_updates=all_style_updates,
            prompt_adjustments=all_prompt_adjustments,
            learning_summary="Full update completed with feedback and performance data."
        )

    async def _analyze_feedback(self, feedback_list: List[FeedbackData]) -> Dict[str, Any]:
        """피드백 분석"""
        # 선택된 콘텐츠
        selected = [f for f in feedback_list if f.selected]
        rejected = [f for f in feedback_list if not f.selected and f.rating < 3.0]

        # 평균 평점
        avg_rating = sum(f.rating for f in feedback_list) / len(feedback_list) if feedback_list else 0

        # 콘텐츠 유형별 분석
        by_type = {}
        for f in feedback_list:
            if f.content_type not in by_type:
                by_type[f.content_type] = {"count": 0, "total_rating": 0, "selected": 0}
            by_type[f.content_type]["count"] += 1
            by_type[f.content_type]["total_rating"] += f.rating
            if f.selected:
                by_type[f.content_type]["selected"] += 1

        # 피드백 텍스트 분석 (LLM 사용)
        feedback_texts = [f.feedback_text for f in feedback_list if f.feedback_text]
        text_insights = await self._analyze_feedback_texts(feedback_texts) if feedback_texts else {}

        return {
            "total_count": len(feedback_list),
            "selected_count": len(selected),
            "rejected_count": len(rejected),
            "avg_rating": avg_rating,
            "by_type": by_type,
            "text_insights": text_insights
        }

    async def _analyze_feedback_texts(self, texts: List[str]) -> Dict[str, Any]:
        """피드백 텍스트 LLM 분석"""
        if not texts:
            return {}

        prompt = f"""Analyze these user feedback texts and extract key insights:

Feedback:
{chr(10).join(f'- {t}' for t in texts[:20])}

Extract:
1. Common positive themes
2. Common negative themes
3. Style preferences mentioned
4. Specific requests

JSON format:
{{
    "positive_themes": ["theme1", "theme2"],
    "negative_themes": ["theme1", "theme2"],
    "style_preferences": {{"key": "value"}},
    "specific_requests": ["request1"]
}}
"""
        try:
            response = await self.llm_gateway.generate(
                role=self.name,
                task="analyze_feedback",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={"temperature": 0.3, "max_tokens": 1000}
            )
            return response.output.value if isinstance(response.output.value, dict) else {}
        except Exception as e:
            logger.warning(f"[BrandModelUpdaterAgent] Feedback text analysis failed: {e}")
            return {}

    def _calculate_style_updates(self, analysis: Dict[str, Any]) -> List[StyleUpdate]:
        """스타일 업데이트 계산"""
        updates = []

        avg_rating = analysis.get("avg_rating", 0)
        text_insights = analysis.get("text_insights", {})
        style_prefs = text_insights.get("style_preferences", {})

        # 평점 기반 전체 품질 조정
        if avg_rating >= 4.0:
            updates.append(StyleUpdate(
                dimension="quality_threshold",
                old_value=0.7,
                new_value=0.75,
                confidence=0.8
            ))
        elif avg_rating < 3.0:
            updates.append(StyleUpdate(
                dimension="creativity_boost",
                old_value=0.5,
                new_value=0.6,
                confidence=0.7
            ))

        # 스타일 선호도 반영
        for key, value in style_prefs.items():
            updates.append(StyleUpdate(
                dimension=f"style_{key}",
                old_value=None,
                new_value=value,
                confidence=0.6
            ))

        return updates

    async def _analyze_high_performers(self, samples: List[Dict[str, Any]]) -> Dict[str, Any]:
        """고성과 콘텐츠 패턴 분석"""
        if not samples:
            return {}

        prompt = f"""Analyze these high-performing marketing content samples and extract patterns:

Samples:
{json.dumps(samples[:10], ensure_ascii=False, indent=2)}

Extract common patterns:
1. Tone patterns
2. Length patterns
3. Structure patterns
4. Keyword patterns
5. Hook patterns

JSON format:
{{
    "tone_patterns": ["pattern1"],
    "length_patterns": {{"avg_words": 50, "optimal_range": [40, 60]}},
    "structure_patterns": ["pattern1"],
    "keyword_patterns": ["keyword1", "keyword2"],
    "hook_patterns": ["pattern1"]
}}
"""
        try:
            response = await self.llm_gateway.generate(
                role=self.name,
                task="analyze_patterns",
                payload={"prompt": prompt},
                mode="json",
                override_model="gpt-4o",
                options={"temperature": 0.3, "max_tokens": 1500}
            )
            return response.output.value if isinstance(response.output.value, dict) else {}
        except Exception as e:
            logger.warning(f"[BrandModelUpdaterAgent] Pattern analysis failed: {e}")
            return {}

    def _derive_style_from_patterns(self, patterns: Dict[str, Any]) -> List[StyleUpdate]:
        """패턴에서 스타일 도출"""
        updates = []

        if patterns.get("tone_patterns"):
            updates.append(StyleUpdate(
                dimension="preferred_tones",
                old_value=[],
                new_value=patterns["tone_patterns"],
                confidence=0.85
            ))

        if patterns.get("length_patterns"):
            length = patterns["length_patterns"]
            updates.append(StyleUpdate(
                dimension="optimal_length",
                old_value=None,
                new_value=length,
                confidence=0.8
            ))

        if patterns.get("hook_patterns"):
            updates.append(StyleUpdate(
                dimension="hook_styles",
                old_value=[],
                new_value=patterns["hook_patterns"],
                confidence=0.75
            ))

        return updates

    async def _generate_prompt_adjustments(
        self,
        analysis: Dict[str, Any],
        brand_id: str
    ) -> Dict[str, str]:
        """프롬프트 조정 생성"""
        adjustments = {}

        text_insights = analysis.get("text_insights", {})
        positive = text_insights.get("positive_themes", [])
        negative = text_insights.get("negative_themes", [])

        if positive:
            adjustments["emphasis"] = f"Emphasize: {', '.join(positive[:3])}"

        if negative:
            adjustments["avoid"] = f"Avoid: {', '.join(negative[:3])}"

        return adjustments

    async def _generate_prompt_from_patterns(
        self,
        patterns: Dict[str, Any],
        brand_id: str
    ) -> Dict[str, str]:
        """패턴 기반 프롬프트 생성"""
        adjustments = {}

        if patterns.get("hook_patterns"):
            adjustments["hook_style"] = f"Use hook patterns like: {', '.join(patterns['hook_patterns'][:2])}"

        if patterns.get("keyword_patterns"):
            adjustments["keywords"] = f"Include keywords: {', '.join(patterns['keyword_patterns'][:5])}"

        return adjustments

    async def _apply_updates(
        self,
        brand_id: str,
        style_updates: List[StyleUpdate],
        prompt_adjustments: Dict[str, str]
    ):
        """업데이트 적용 (SelfLearningAgent 연동)"""
        try:
            from app.services.agents.self_learning import get_self_learning_agent

            agent = get_self_learning_agent(llm_gateway=self.llm_gateway)

            # 스타일 업데이트를 BrandVector로 변환
            style_dict = {u.dimension: u.new_value for u in style_updates}

            await agent.execute(AgentRequest(
                task="update_brand_vector",
                payload={
                    "brand_id": brand_id,
                    "updates": style_dict,
                    "prompt_adjustments": prompt_adjustments
                }
            ))

            logger.info(f"[BrandModelUpdaterAgent] Applied {len(style_updates)} updates to brand {brand_id}")
        except Exception as e:
            logger.warning(f"[BrandModelUpdaterAgent] Failed to apply updates: {e}")

    def _generate_summary(self, analysis: Dict[str, Any], updates: List[StyleUpdate]) -> str:
        """학습 요약 생성"""
        parts = []

        parts.append(f"Analyzed {analysis.get('total_count', 0)} feedback items")
        parts.append(f"Average rating: {analysis.get('avg_rating', 0):.1f}/5")
        parts.append(f"Selected: {analysis.get('selected_count', 0)}, Rejected: {analysis.get('rejected_count', 0)}")

        if updates:
            parts.append(f"Applied {len(updates)} style updates")

        return ". ".join(parts) + "."


# =============================================================================
# Factory Function
# =============================================================================

def get_brand_model_updater_agent(llm_gateway=None) -> BrandModelUpdaterAgent:
    """BrandModelUpdaterAgent 인스턴스 반환"""
    return BrandModelUpdaterAgent(llm_gateway=llm_gateway)
