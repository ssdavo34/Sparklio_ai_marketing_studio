"""
Self Learning Agent - 사용자 피드백 기반 학습 및 개선 에이전트

이 에이전트는 사용자 피드백을 학습하여 브랜드 벡터와 생성 모델을
지속적으로 개선합니다.

주요 기능:
1. 브랜드 벡터 학습 및 업데이트
2. 사용자 선호도 분석
3. 콘텐츠 품질 피드백 학습
4. 생성 파라미터 자동 최적화
5. 개인화 프로파일 구축
"""

import json
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import asyncio
import logging
from collections import defaultdict, deque

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class FeedbackType(str, Enum):
    """피드백 타입"""
    LIKE = "like"
    DISLIKE = "dislike"
    RATING = "rating"
    COMMENT = "comment"
    SELECTION = "selection"
    REJECTION = "rejection"

class LearningMode(str, Enum):
    """학습 모드"""
    INCREMENTAL = "incremental"
    BATCH = "batch"
    ONLINE = "online"
    REINFORCEMENT = "reinforcement"

class UpdateStrategy(str, Enum):
    """업데이트 전략"""
    IMMEDIATE = "immediate"
    SCHEDULED = "scheduled"
    THRESHOLD = "threshold"
    ADAPTIVE = "adaptive"

class FeatureType(str, Enum):
    """특징 타입"""
    TONE = "tone"
    STYLE = "style"
    COLOR = "color"
    LAYOUT = "layout"
    CONTENT = "content"
    TIMING = "timing"

# ==================== Input/Output Schemas ====================

class FeedbackInput(BaseModel):
    """피드백 입력"""
    user_id: str = Field(..., description="사용자 ID")
    brand_id: str = Field(..., description="브랜드 ID")
    content_id: str = Field(..., description="콘텐츠 ID")
    feedback_type: FeedbackType = Field(..., description="피드백 타입")
    value: Optional[Any] = Field(None, description="피드백 값")
    features: Optional[Dict[str, Any]] = Field(None, description="콘텐츠 특징")
    timestamp: Optional[datetime] = Field(None, description="피드백 시간")

class BrandVectorUpdateInput(BaseModel):
    """브랜드 벡터 업데이트 입력"""
    brand_id: str = Field(..., description="브랜드 ID")
    feedback_data: List[FeedbackInput] = Field(..., description="피드백 데이터")
    learning_mode: LearningMode = Field(
        default=LearningMode.INCREMENTAL,
        description="학습 모드"
    )
    update_strategy: UpdateStrategy = Field(
        default=UpdateStrategy.ADAPTIVE,
        description="업데이트 전략"
    )

class PreferenceAnalysisInput(BaseModel):
    """선호도 분석 입력"""
    user_id: str = Field(..., description="사용자 ID")
    history_window: int = Field(default=30, description="분석 기간(일)")
    feature_types: Optional[List[FeatureType]] = Field(None, description="분석 특징")

class OptimizationInput(BaseModel):
    """파라미터 최적화 입력"""
    brand_id: str = Field(..., description="브랜드 ID")
    target_metric: str = Field(..., description="목표 지표")
    current_params: Dict[str, Any] = Field(..., description="현재 파라미터")
    performance_history: List[Dict[str, Any]] = Field(..., description="성과 이력")

class PersonalizationInput(BaseModel):
    """개인화 프로파일 입력"""
    user_id: str = Field(..., description="사용자 ID")
    interactions: List[Dict[str, Any]] = Field(..., description="상호작용 이력")
    preferences: Optional[Dict[str, Any]] = Field(None, description="명시적 선호도")

# ==================== Output Schemas ====================

class BrandVector(BaseModel):
    """브랜드 벡터"""
    brand_id: str = Field(..., description="브랜드 ID")
    vector: List[float] = Field(..., description="벡터 값")
    confidence: float = Field(..., description="신뢰도")
    version: int = Field(..., description="버전")
    updated_at: datetime = Field(..., description="업데이트 시간")
    feedback_count: int = Field(..., description="피드백 개수")

class VectorUpdateResult(BaseModel):
    """벡터 업데이트 결과"""
    previous_vector: List[float] = Field(..., description="이전 벡터")
    updated_vector: List[float] = Field(..., description="업데이트된 벡터")
    change_magnitude: float = Field(..., description="변화 크기")
    improvement_score: float = Field(..., description="개선 점수")
    applied_feedback: int = Field(..., description="적용된 피드백 수")

class PreferenceProfile(BaseModel):
    """선호도 프로파일"""
    user_id: str = Field(..., description="사용자 ID")
    preferences: Dict[str, float] = Field(..., description="특징별 선호도")
    confidence: Dict[str, float] = Field(..., description="특징별 신뢰도")
    sample_size: int = Field(..., description="샘플 크기")
    last_updated: datetime = Field(..., description="마지막 업데이트")

class OptimizedParams(BaseModel):
    """최적화된 파라미터"""
    parameters: Dict[str, Any] = Field(..., description="최적화된 파라미터")
    expected_improvement: float = Field(..., description="예상 개선율")
    confidence: float = Field(..., description="신뢰도")
    iterations: int = Field(..., description="최적화 반복 횟수")

class PersonalizationProfile(BaseModel):
    """개인화 프로파일"""
    user_id: str = Field(..., description="사용자 ID")
    profile_vector: List[float] = Field(..., description="프로파일 벡터")
    segment: str = Field(..., description="사용자 세그먼트")
    preferences: Dict[str, Any] = Field(..., description="선호 정보")
    engagement_score: float = Field(..., description="참여도 점수")
    created_at: datetime = Field(..., description="생성 시간")

class LearningMetrics(BaseModel):
    """학습 지표"""
    total_feedback: int = Field(..., description="전체 피드백 수")
    positive_feedback: int = Field(..., description="긍정 피드백 수")
    negative_feedback: int = Field(..., description="부정 피드백 수")
    learning_rate: float = Field(..., description="학습 속도")
    accuracy: float = Field(..., description="정확도")
    improvement_trend: str = Field(..., description="개선 트렌드")

# ==================== Main Agent Class ====================

class SelfLearningAgent(AgentBase):
    """사용자 피드백 기반 학습 및 개선 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            agent_id="self_learning",
            name="Self Learning Agent",
            description="사용자 피드백을 학습하여 시스템을 지속적으로 개선합니다",
            category="intelligence",
            llm_service=llm_service
        )

        # 브랜드 벡터 저장소
        self.brand_vectors: Dict[str, BrandVector] = {}

        # 피드백 히스토리
        self.feedback_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))

        # 사용자 프로파일
        self.user_profiles: Dict[str, PersonalizationProfile] = {}

        # 학습 통계
        self.learning_stats = {
            "total_updates": 0,
            "successful_improvements": 0,
            "total_feedback_processed": 0
        }

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        try:
            task = request.task

            if task == "update_brand_vector":
                result = await self._update_brand_vector(request.payload)
            elif task == "analyze_preferences":
                result = await self._analyze_preferences(request.payload)
            elif task == "optimize_parameters":
                result = await self._optimize_parameters(request.payload)
            elif task == "build_profile":
                result = await self._build_personalization_profile(request.payload)
            elif task == "record_feedback":
                result = await self._record_feedback(request.payload)
            elif task == "get_metrics":
                result = await self._get_learning_metrics(request.payload)
            else:
                raise AgentError(f"Unknown task: {request.task}")

            return AgentResponse(
                agent_id=self.agent_id,
                status="success",
                result=result,
                metadata={
                    "task": task,
                    "timestamp": datetime.now().isoformat(),
                    "learning_stats": self.learning_stats
                }
            )

        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=f"입력 데이터 검증 실패: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Self learning agent error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=str(e)
            )

    async def _update_brand_vector(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """브랜드 벡터 업데이트"""
        input_data = BrandVectorUpdateInput(**payload)

        # 기존 벡터 로드
        if input_data.brand_id in self.brand_vectors:
            current_vector = self.brand_vectors[input_data.brand_id]
            previous_vector = current_vector.vector.copy()
            version = current_vector.version + 1
        else:
            # 초기 벡터 생성
            previous_vector = [np.random.randn() for _ in range(128)]
            version = 1

        # 피드백 분석
        positive_feedback = [
            f for f in input_data.feedback_data
            if f.feedback_type in [FeedbackType.LIKE, FeedbackType.SELECTION]
            or (f.feedback_type == FeedbackType.RATING and f.value and float(f.value) >= 4.0)
        ]

        negative_feedback = [
            f for f in input_data.feedback_data
            if f.feedback_type in [FeedbackType.DISLIKE, FeedbackType.REJECTION]
            or (f.feedback_type == FeedbackType.RATING and f.value and float(f.value) < 3.0)
        ]

        # 학습률 계산
        learning_rate = self._calculate_learning_rate(
            len(input_data.feedback_data),
            input_data.learning_mode
        )

        # 벡터 업데이트
        updated_vector = previous_vector.copy()

        for feedback in positive_feedback:
            if feedback.features:
                # 긍정 피드백 특징을 벡터에 반영
                feature_vector = self._extract_feature_vector(feedback.features)
                updated_vector = [
                    v + learning_rate * f
                    for v, f in zip(updated_vector, feature_vector)
                ]

        for feedback in negative_feedback:
            if feedback.features:
                # 부정 피드백 특징을 벡터에서 제거
                feature_vector = self._extract_feature_vector(feedback.features)
                updated_vector = [
                    v - learning_rate * f * 0.5  # 부정은 절반만 반영
                    for v, f in zip(updated_vector, feature_vector)
                ]

        # 정규화
        vector_norm = np.linalg.norm(updated_vector)
        if vector_norm > 0:
            updated_vector = [v / vector_norm for v in updated_vector]

        # 변화 크기 계산
        change_magnitude = np.linalg.norm(
            np.array(updated_vector) - np.array(previous_vector)
        )

        # 신뢰도 계산
        confidence = min(1.0, len(input_data.feedback_data) / 100)

        # 개선 점수 (긍정 피드백 비율)
        improvement_score = (
            len(positive_feedback) / len(input_data.feedback_data)
            if input_data.feedback_data else 0.5
        )

        # 브랜드 벡터 저장
        self.brand_vectors[input_data.brand_id] = BrandVector(
            brand_id=input_data.brand_id,
            vector=updated_vector,
            confidence=confidence,
            version=version,
            updated_at=datetime.now(),
            feedback_count=len(input_data.feedback_data)
        )

        self.learning_stats["total_updates"] += 1
        if improvement_score > 0.6:
            self.learning_stats["successful_improvements"] += 1

        return VectorUpdateResult(
            previous_vector=previous_vector,
            updated_vector=updated_vector,
            change_magnitude=float(change_magnitude),
            improvement_score=improvement_score,
            applied_feedback=len(input_data.feedback_data)
        ).dict()

    async def _analyze_preferences(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """사용자 선호도 분석"""
        input_data = PreferenceAnalysisInput(**payload)

        # 사용자 피드백 히스토리 조회
        user_feedback = self.feedback_history.get(input_data.user_id, [])

        # 시간 범위 필터링
        cutoff_date = datetime.now() - timedelta(days=input_data.history_window)
        recent_feedback = [
            f for f in user_feedback
            if f.get("timestamp") and f["timestamp"] >= cutoff_date
        ]

        # 특징별 선호도 계산
        preferences = {}
        confidence = {}

        feature_types = input_data.feature_types or list(FeatureType)

        for feature_type in feature_types:
            feature_scores = []

            for feedback in recent_feedback:
                if feedback.get("features") and feature_type.value in feedback["features"]:
                    # 피드백 타입에 따른 점수
                    if feedback["feedback_type"] in ["like", "selection"]:
                        score = 1.0
                    elif feedback["feedback_type"] in ["dislike", "rejection"]:
                        score = -1.0
                    elif feedback["feedback_type"] == "rating":
                        score = (float(feedback.get("value", 3)) - 3) / 2  # -1 ~ 1로 정규화
                    else:
                        score = 0

                    feature_scores.append(score)

            if feature_scores:
                preferences[feature_type.value] = np.mean(feature_scores)
                confidence[feature_type.value] = min(1.0, len(feature_scores) / 20)
            else:
                preferences[feature_type.value] = 0.0
                confidence[feature_type.value] = 0.0

        return PreferenceProfile(
            user_id=input_data.user_id,
            preferences=preferences,
            confidence=confidence,
            sample_size=len(recent_feedback),
            last_updated=datetime.now()
        ).dict()

    async def _optimize_parameters(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """생성 파라미터 최적화"""
        input_data = OptimizationInput(**payload)

        # 성과 이력 분석
        performance_data = input_data.performance_history

        if not performance_data:
            # 기본 파라미터 반환
            return OptimizedParams(
                parameters=input_data.current_params,
                expected_improvement=0.0,
                confidence=0.5,
                iterations=0
            ).dict()

        # 최적 파라미터 탐색 (Mock 구현)
        optimized_params = input_data.current_params.copy()

        # 각 파라미터별 최적값 찾기
        for param_name, current_value in input_data.current_params.items():
            # 과거 성과 데이터에서 상관관계 분석
            param_values = [d.get("params", {}).get(param_name) for d in performance_data]
            metric_values = [d.get(input_data.target_metric, 0) for d in performance_data]

            valid_pairs = [
                (p, m) for p, m in zip(param_values, metric_values)
                if p is not None
            ]

            if valid_pairs and len(valid_pairs) > 3:
                # 최고 성과를 낸 파라미터 값
                best_idx = max(range(len(valid_pairs)), key=lambda i: valid_pairs[i][1])
                optimized_params[param_name] = valid_pairs[best_idx][0]

        # 예상 개선율 계산
        current_performance = performance_data[-1].get(input_data.target_metric, 0)
        best_performance = max(d.get(input_data.target_metric, 0) for d in performance_data)

        expected_improvement = (
            (best_performance - current_performance) / current_performance
            if current_performance > 0 else 0
        )

        confidence = min(1.0, len(performance_data) / 50)

        return OptimizedParams(
            parameters=optimized_params,
            expected_improvement=max(0, expected_improvement),
            confidence=confidence,
            iterations=len(performance_data)
        ).dict()

    async def _build_personalization_profile(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """개인화 프로파일 구축"""
        input_data = PersonalizationInput(**payload)

        # 상호작용 이력 분석
        interactions = input_data.interactions

        # 프로파일 벡터 생성 (128차원)
        profile_vector = [0.0] * 128

        for interaction in interactions:
            if interaction.get("features"):
                feature_vector = self._extract_feature_vector(interaction["features"])
                weight = interaction.get("weight", 1.0)

                profile_vector = [
                    p + f * weight
                    for p, f in zip(profile_vector, feature_vector)
                ]

        # 정규화
        norm = np.linalg.norm(profile_vector)
        if norm > 0:
            profile_vector = [v / norm for v in profile_vector]

        # 사용자 세그먼트 결정
        segment = self._determine_user_segment(interactions, input_data.preferences)

        # 참여도 점수
        engagement_score = min(1.0, len(interactions) / 100) * 0.7 + 0.3

        # 선호 정보 추출
        preferences = input_data.preferences or {}

        # 프로파일 저장
        profile = PersonalizationProfile(
            user_id=input_data.user_id,
            profile_vector=profile_vector,
            segment=segment,
            preferences=preferences,
            engagement_score=engagement_score,
            created_at=datetime.now()
        )

        self.user_profiles[input_data.user_id] = profile

        return profile.dict()

    async def _record_feedback(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """피드백 기록"""
        feedback = FeedbackInput(**payload)

        # 피드백 저장
        feedback_dict = feedback.dict()
        feedback_dict["timestamp"] = feedback.timestamp or datetime.now()

        self.feedback_history[feedback.user_id].append(feedback_dict)
        self.learning_stats["total_feedback_processed"] += 1

        return {
            "success": True,
            "user_id": feedback.user_id,
            "feedback_type": feedback.feedback_type.value,
            "recorded_at": feedback_dict["timestamp"].isoformat()
        }

    async def _get_learning_metrics(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """학습 지표 조회"""
        brand_id = payload.get("brand_id")

        # 브랜드별 피드백 통계
        if brand_id:
            brand_feedback = [
                f for user_feedback in self.feedback_history.values()
                for f in user_feedback
                if f.get("brand_id") == brand_id
            ]
        else:
            brand_feedback = [
                f for user_feedback in self.feedback_history.values()
                for f in user_feedback
            ]

        total_feedback = len(brand_feedback)

        positive_feedback = sum(
            1 for f in brand_feedback
            if f.get("feedback_type") in ["like", "selection"]
        )

        negative_feedback = sum(
            1 for f in brand_feedback
            if f.get("feedback_type") in ["dislike", "rejection"]
        )

        # 학습률 계산
        learning_rate = 0.1 if total_feedback < 100 else 0.01

        # 정확도 (긍정 피드백 비율)
        accuracy = positive_feedback / total_feedback if total_feedback > 0 else 0.5

        # 개선 트렌드
        if accuracy > 0.7:
            improvement_trend = "상승"
        elif accuracy < 0.4:
            improvement_trend = "하락"
        else:
            improvement_trend = "유지"

        return LearningMetrics(
            total_feedback=total_feedback,
            positive_feedback=positive_feedback,
            negative_feedback=negative_feedback,
            learning_rate=learning_rate,
            accuracy=accuracy,
            improvement_trend=improvement_trend
        ).dict()

    # ==================== Helper Methods ====================

    def _calculate_learning_rate(self, feedback_count: int, mode: LearningMode) -> float:
        """학습률 계산"""
        if mode == LearningMode.INCREMENTAL:
            # 피드백이 적을수록 빠르게 학습
            return 0.1 / (1 + np.log(1 + feedback_count))
        elif mode == LearningMode.BATCH:
            # 고정 학습률
            return 0.01
        elif mode == LearningMode.ONLINE:
            # 매우 빠른 학습
            return 0.3
        else:
            # Adaptive
            return 0.05 / (1 + np.sqrt(feedback_count))

    def _extract_feature_vector(self, features: Dict[str, Any]) -> List[float]:
        """특징을 벡터로 변환"""
        # Mock 구현: 특징을 128차원 벡터로 변환
        vector = [0.0] * 128

        # 특징별 인코딩
        feature_mappings = {
            "tone": (0, 32),
            "style": (32, 64),
            "color": (64, 96),
            "layout": (96, 128)
        }

        for feature_name, value in features.items():
            if feature_name in feature_mappings:
                start, end = feature_mappings[feature_name]

                if isinstance(value, (int, float)):
                    # 숫자 값
                    for i in range(start, end):
                        vector[i] = float(value) / (i - start + 1)
                elif isinstance(value, str):
                    # 문자열 해시
                    hash_val = hash(value) % 100 / 100.0
                    for i in range(start, end):
                        vector[i] = hash_val

        return vector

    def _determine_user_segment(
        self,
        interactions: List[Dict[str, Any]],
        preferences: Optional[Dict[str, Any]]
    ) -> str:
        """사용자 세그먼트 결정"""

        interaction_count = len(interactions)

        if interaction_count < 10:
            return "new_user"
        elif interaction_count < 50:
            return "active_user"
        else:
            return "power_user"

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "supported_feedback_types": [ft.value for ft in FeedbackType],
            "learning_modes": [mode.value for mode in LearningMode],
            "update_strategies": [strategy.value for strategy in UpdateStrategy],
            "feature_types": [ft.value for ft in FeatureType],
            "features": {
                "brand_vector_learning": True,
                "preference_analysis": True,
                "parameter_optimization": True,
                "personalization": True,
                "continuous_learning": True,
                "adaptive_learning_rate": True
            },
            "stats": self.learning_stats,
            "storage_status": {
                "brand_vectors": len(self.brand_vectors),
                "user_profiles": len(self.user_profiles),
                "feedback_records": sum(len(h) for h in self.feedback_history.values())
            }
        }

# ==================== Factory Function ====================

def create_self_learning_agent(llm_service: Optional[LLMService] = None) -> SelfLearningAgent:
    """SelfLearningAgent 인스턴스 생성"""
    return SelfLearningAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_self_learning_agent():
        # 에이전트 생성
        agent = create_self_learning_agent()

        # 1. 피드백 기록
        feedback_requests = []
        for i in range(5):
            feedback_requests.append(AgentRequest(
                task="record_feedback",
                payload={
                    "user_id": "user_001",
                    "brand_id": "brand_001",
                    "content_id": f"content_{i}",
                    "feedback_type": "like" if i % 2 == 0 else "dislike",
                    "features": {
                        "tone": "professional",
                        "style": "modern",
                        "color": "blue"
                    }
                }
            ))

        for req in feedback_requests:
            result = await agent.execute(req)
            print(f"피드백 기록: {result.status}")

        # 2. 브랜드 벡터 업데이트
        update_request = AgentRequest(
            task="update_brand_vector",
            payload={
                "brand_id": "brand_001",
                "feedback_data": [
                    {
                        "user_id": "user_001",
                        "brand_id": "brand_001",
                        "content_id": f"content_{i}",
                        "feedback_type": "like",
                        "features": {"tone": "professional"}
                    }
                    for i in range(10)
                ],
                "learning_mode": "incremental"
            }
        )

        result = await agent.execute(update_request)
        print(f"\n브랜드 벡터 업데이트: {result.status}")
        if result.status == "success":
            print(f"  - 변화 크기: {result.result['change_magnitude']:.4f}")
            print(f"  - 개선 점수: {result.result['improvement_score']:.2f}")

        # 3. 선호도 분석
        preference_request = AgentRequest(
            task="analyze_preferences",
            payload={
                "user_id": "user_001",
                "history_window": 30,
                "feature_types": ["tone", "style", "color"]
            }
        )

        result = await agent.execute(preference_request)
        print(f"\n선호도 분석: {result.status}")
        if result.status == "success":
            print(f"  - 샘플 크기: {result.result['sample_size']}")
            print(f"  - 선호도: {result.result['preferences']}")

        # 4. 파라미터 최적화
        optimization_request = AgentRequest(
            task="optimize_parameters",
            payload={
                "brand_id": "brand_001",
                "target_metric": "engagement",
                "current_params": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "frequency_penalty": 0.5
                },
                "performance_history": [
                    {
                        "params": {"temperature": 0.5},
                        "engagement": 0.025
                    },
                    {
                        "params": {"temperature": 0.7},
                        "engagement": 0.035
                    },
                    {
                        "params": {"temperature": 0.9},
                        "engagement": 0.030
                    }
                ]
            }
        )

        result = await agent.execute(optimization_request)
        print(f"\n파라미터 최적화: {result.status}")
        if result.status == "success":
            print(f"  - 예상 개선율: {result.result['expected_improvement']*100:.1f}%")
            print(f"  - 신뢰도: {result.result['confidence']:.2f}")

        # 5. 개인화 프로파일
        profile_request = AgentRequest(
            task="build_profile",
            payload={
                "user_id": "user_001",
                "interactions": [
                    {"features": {"tone": "casual"}, "weight": 1.0}
                    for _ in range(20)
                ],
                "preferences": {"style": "modern"}
            }
        )

        result = await agent.execute(profile_request)
        print(f"\n개인화 프로파일: {result.status}")
        if result.status == "success":
            print(f"  - 세그먼트: {result.result['segment']}")
            print(f"  - 참여도 점수: {result.result['engagement_score']:.2f}")

        # 6. 학습 지표
        metrics_request = AgentRequest(
            task="get_metrics",
            payload={"brand_id": "brand_001"}
        )

        result = await agent.execute(metrics_request)
        print(f"\n학습 지표: {result.status}")
        if result.status == "success":
            print(f"  - 전체 피드백: {result.result['total_feedback']}")
            print(f"  - 정확도: {result.result['accuracy']:.2%}")
            print(f"  - 트렌드: {result.result['improvement_trend']}")

    # 테스트 실행
    asyncio.run(test_self_learning_agent())
