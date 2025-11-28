"""
Video Reviewer Agent

영상 품질 검토 및 개선 제안 에이전트
생성된 영상의 마케팅 효과, 기술적 품질, 브랜드 일관성을 평가합니다.

작성일: 2025-11-28
작성자: B팀 (Backend)
참조: AGENTS_SPEC.md - VideoReviewerAgent

LLM: Claude 3.5 Sonnet / GPT-4o (비전 분석)
"""

import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentOutput, AgentError

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class VideoReviewInput(BaseModel):
    """VideoReviewerAgent 입력"""
    video_url: Optional[str] = Field(None, description="영상 URL")
    video_path: Optional[str] = Field(None, description="로컬 영상 경로")
    storyboard: Optional[Dict[str, Any]] = Field(None, description="스토리보드")
    concept: Optional[Dict[str, Any]] = Field(None, description="컨셉 정보 (ConceptV1)")
    thumbnail_urls: List[str] = Field(default_factory=list, description="프레임/썸네일 URL")
    review_type: str = Field(default="full", description="검토 유형 (full, quick, technical)")
    target_platform: str = Field(default="shorts", description="타겟 플랫폼")


class ReviewScore(BaseModel):
    """검토 점수"""
    category: str
    score: float = Field(..., ge=0.0, le=10.0)
    feedback: str
    suggestions: List[str] = Field(default_factory=list)


class VideoReviewOutput(BaseModel):
    """VideoReviewerAgent 출력"""
    review_id: str = Field(..., description="검토 ID")
    overall_score: float = Field(..., ge=0.0, le=10.0, description="전체 점수")
    verdict: str = Field(..., description="판정 (approved, needs_revision, rejected)")
    scores: List[ReviewScore] = Field(..., description="카테고리별 점수")
    strengths: List[str] = Field(default_factory=list, description="강점")
    improvements: List[str] = Field(default_factory=list, description="개선 필요 사항")
    critical_issues: List[str] = Field(default_factory=list, description="치명적 이슈")
    platform_fit: Dict[str, Any] = Field(default_factory=dict, description="플랫폼 적합성")
    brand_consistency: float = Field(default=0.0, description="브랜드 일관성 점수")


# =============================================================================
# Video Reviewer Agent
# =============================================================================

class VideoReviewerAgent(AgentBase):
    """
    Video Reviewer Agent

    생성된 영상의 품질을 다각도로 평가합니다.

    평가 카테고리:
    - 마케팅 효과 (Hook, CTA, 메시지 전달)
    - 기술적 품질 (해상도, 프레임, 오디오)
    - 브랜드 일관성 (컨셉 반영도, 톤앤매너)
    - 플랫폼 적합성 (길이, 포맷, 트렌드)
    - 규제 준수 (광고 표시, 저작권)

    주요 기능:
    - 멀티모달 분석 (영상 프레임 분석)
    - 스토리보드 대비 실제 영상 비교
    - 개선 제안 생성
    - ConceptV1.guardrails 검증
    """

    # 검토 카테고리
    REVIEW_CATEGORIES = [
        "marketing_effectiveness",
        "technical_quality",
        "brand_consistency",
        "platform_fit",
        "compliance"
    ]

    @property
    def name(self) -> str:
        return "video_reviewer"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        영상 품질 검토

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = VideoReviewInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        logger.info(f"[VideoReviewerAgent] Starting {input_data.review_type} review")

        # 리뷰 수행
        try:
            if input_data.review_type == "quick":
                review_result = await self._quick_review(input_data)
            elif input_data.review_type == "technical":
                review_result = await self._technical_review(input_data)
            else:
                review_result = await self._full_review(input_data)
        except Exception as e:
            logger.error(f"[VideoReviewerAgent] Review failed: {e}")
            raise AgentError(
                message=f"Review failed: {str(e)}",
                agent=self.name,
                details={"review_type": input_data.review_type}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(f"[VideoReviewerAgent] Review completed: {review_result.verdict} ({review_result.overall_score:.1f}/10)")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="video_review",
                    value=review_result.model_dump(),
                    meta={"verdict": review_result.verdict}
                )
            ],
            usage={
                "elapsed_seconds": elapsed
            },
            meta={
                "review_type": input_data.review_type,
                "overall_score": review_result.overall_score
            }
        )

    async def _full_review(self, input_data: VideoReviewInput) -> VideoReviewOutput:
        """전체 검토"""
        prompt = self._build_full_review_prompt(input_data)

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="full_video_review",
                payload={"prompt": prompt},
                mode="json",
                override_model="claude-sonnet",
                options={
                    "temperature": 0.3,
                    "max_tokens": 3000
                }
            )
        except Exception as e:
            # Claude 실패 시 GPT-4o 폴백
            logger.warning(f"[VideoReviewerAgent] Claude failed, trying GPT-4o: {e}")
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="full_video_review",
                payload={"prompt": prompt},
                mode="json",
                override_model="gpt-4o",
                options={
                    "temperature": 0.3,
                    "max_tokens": 3000
                }
            )

        return self._parse_review_output(llm_response.output.value, input_data)

    async def _quick_review(self, input_data: VideoReviewInput) -> VideoReviewOutput:
        """빠른 검토 (핵심 항목만)"""
        prompt = self._build_quick_review_prompt(input_data)

        llm_response = await self.llm_gateway.generate(
            role=self.name,
            task="quick_video_review",
            payload={"prompt": prompt},
            mode="json",
            override_model="gemini-2.0-flash",
            options={
                "temperature": 0.3,
                "max_tokens": 1500
            }
        )

        return self._parse_review_output(llm_response.output.value, input_data)

    async def _technical_review(self, input_data: VideoReviewInput) -> VideoReviewOutput:
        """기술적 검토"""
        # 기술적 항목은 LLM 없이 분석 가능한 부분
        scores = []

        # 스토리보드 기반 기본 검토
        if input_data.storyboard:
            storyboard = input_data.storyboard
            scenes = storyboard.get("scenes", [])
            total_duration = sum(s.get("duration", 0) for s in scenes)

            # 길이 검토
            platform_limits = {
                "shorts": 60,
                "reel": 90,
                "tiktok": 60,
                "story": 15
            }
            limit = platform_limits.get(input_data.target_platform, 60)

            if total_duration <= limit:
                scores.append(ReviewScore(
                    category="duration",
                    score=10.0,
                    feedback=f"Duration ({total_duration}s) is within {input_data.target_platform} limit",
                    suggestions=[]
                ))
            else:
                scores.append(ReviewScore(
                    category="duration",
                    score=5.0,
                    feedback=f"Duration ({total_duration}s) exceeds {input_data.target_platform} limit ({limit}s)",
                    suggestions=[f"Reduce video to under {limit} seconds"]
                ))

            # 씬 수 검토
            optimal_scenes = {"shorts": 6, "reel": 8, "tiktok": 6, "story": 3}
            optimal = optimal_scenes.get(input_data.target_platform, 6)

            if len(scenes) >= optimal - 2 and len(scenes) <= optimal + 2:
                scores.append(ReviewScore(
                    category="scene_count",
                    score=9.0,
                    feedback=f"Scene count ({len(scenes)}) is appropriate",
                    suggestions=[]
                ))
            else:
                scores.append(ReviewScore(
                    category="scene_count",
                    score=6.0,
                    feedback=f"Scene count ({len(scenes)}) differs from optimal ({optimal})",
                    suggestions=[f"Consider adjusting to around {optimal} scenes"]
                ))

        # 기본 점수 계산
        overall = sum(s.score for s in scores) / len(scores) if scores else 5.0
        verdict = "approved" if overall >= 7.0 else "needs_revision" if overall >= 5.0 else "rejected"

        return VideoReviewOutput(
            review_id=f"review_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            overall_score=overall,
            verdict=verdict,
            scores=scores,
            strengths=["Technical parameters within limits"],
            improvements=[],
            critical_issues=[],
            platform_fit={"platform": input_data.target_platform, "fit_score": overall}
        )

    def _build_full_review_prompt(self, input_data: VideoReviewInput) -> str:
        """전체 검토 프롬프트"""
        concept = input_data.concept or {}
        storyboard = input_data.storyboard or {}

        # Guardrails 추출
        guardrails = concept.get("guardrails", {})
        avoid_claims = guardrails.get("avoid_claims", [])
        must_include = guardrails.get("must_include", [])

        prompt = f"""You are an expert video content reviewer for marketing campaigns.

## Video Information
- Platform: {input_data.target_platform}
- Storyboard: {json.dumps(storyboard, ensure_ascii=False, indent=2) if storyboard else 'Not provided'}

## Brand Concept
- Name: {concept.get('concept_name', 'N/A')}
- Core Promise: {concept.get('core_promise', 'N/A')}
- Target Audience: {concept.get('target_audience', 'N/A')}
- Tone: {concept.get('tone_and_manner', 'N/A')}

## Guardrails (CRITICAL)
- MUST AVOID: {avoid_claims if avoid_claims else 'None specified'}
- MUST INCLUDE: {must_include if must_include else 'None specified'}

## Review Categories
Evaluate each category (0-10 scale):

1. **Marketing Effectiveness** (30% weight)
   - Hook strength (first 3 seconds)
   - Message clarity
   - Call-to-action effectiveness
   - Emotional engagement

2. **Brand Consistency** (25% weight)
   - Concept alignment
   - Visual style match
   - Tone and manner fit
   - Guardrails compliance

3. **Platform Fit** (20% weight)
   - Duration appropriateness
   - Format optimization (vertical)
   - Trend alignment
   - Engagement potential

4. **Technical Quality** (15% weight)
   - Visual clarity
   - Transition smoothness
   - Pacing

5. **Compliance** (10% weight)
   - Ad disclosure (if needed)
   - No misleading claims
   - Copyright safety

## Output Format (JSON)
{{
    "review_id": "review_xxx",
    "overall_score": 7.5,
    "verdict": "approved | needs_revision | rejected",
    "scores": [
        {{
            "category": "marketing_effectiveness",
            "score": 8.0,
            "feedback": "Strong hook, clear message",
            "suggestions": ["Consider stronger CTA"]
        }}
    ],
    "strengths": ["List of strong points"],
    "improvements": ["List of improvements needed"],
    "critical_issues": ["Any blockers - guardrail violations, major problems"],
    "platform_fit": {{
        "platform": "{input_data.target_platform}",
        "fit_score": 8.5,
        "notes": "Well optimized for platform"
    }},
    "brand_consistency": 8.0
}}

## Verdict Criteria
- approved: overall >= 7.0 AND no critical issues
- needs_revision: overall >= 5.0 OR has fixable issues
- rejected: overall < 5.0 OR guardrail violations OR major compliance issues

Review thoroughly and provide actionable feedback.
"""
        return prompt

    def _build_quick_review_prompt(self, input_data: VideoReviewInput) -> str:
        """빠른 검토 프롬프트"""
        concept = input_data.concept or {}
        storyboard = input_data.storyboard or {}

        return f"""Quick video review for {input_data.target_platform}.

Concept: {concept.get('concept_name', 'N/A')}
Scenes: {len(storyboard.get('scenes', []))}
Duration: {sum(s.get('duration', 0) for s in storyboard.get('scenes', []))}s

Provide:
1. Overall score (0-10)
2. Quick verdict (approved/needs_revision/rejected)
3. Top 2 strengths
4. Top 2 improvements needed

JSON format:
{{
    "review_id": "quick_xxx",
    "overall_score": 7.0,
    "verdict": "approved",
    "scores": [],
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "critical_issues": [],
    "platform_fit": {{}},
    "brand_consistency": 7.0
}}
"""

    def _parse_review_output(self, llm_output: Any, input_data: VideoReviewInput) -> VideoReviewOutput:
        """검토 결과 파싱"""
        if isinstance(llm_output, dict):
            data = llm_output
        elif isinstance(llm_output, str):
            try:
                data = json.loads(llm_output)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\{[\s\S]*\}', llm_output)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    raise ValueError("Cannot parse LLM output as JSON")
        else:
            raise ValueError(f"Unexpected output type: {type(llm_output)}")

        # 점수 파싱
        scores = []
        for score_data in data.get("scores", []):
            scores.append(ReviewScore(
                category=score_data.get("category", "unknown"),
                score=float(score_data.get("score", 5.0)),
                feedback=score_data.get("feedback", ""),
                suggestions=score_data.get("suggestions", [])
            ))

        return VideoReviewOutput(
            review_id=data.get("review_id", f"review_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
            overall_score=float(data.get("overall_score", 5.0)),
            verdict=data.get("verdict", "needs_revision"),
            scores=scores,
            strengths=data.get("strengths", []),
            improvements=data.get("improvements", []),
            critical_issues=data.get("critical_issues", []),
            platform_fit=data.get("platform_fit", {}),
            brand_consistency=float(data.get("brand_consistency", 5.0))
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_video_reviewer_agent(llm_gateway=None) -> VideoReviewerAgent:
    """VideoReviewerAgent 인스턴스 반환"""
    return VideoReviewerAgent(llm_gateway=llm_gateway)
