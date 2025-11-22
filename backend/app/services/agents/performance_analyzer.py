"""
Performance Analyzer Agent - SNS 및 광고 성과 분석 전문 에이전트

이 에이전트는 소셜 미디어와 광고 캠페인의 성과를 분석하고
인사이트를 제공합니다.

주요 기능:
1. SNS 성과 분석 (Instagram, Facebook, Twitter, YouTube)
2. 광고 캠페인 성과 분석 (Naver, Google Ads)
3. A/B 테스트 분석
4. 경쟁사 벤치마킹
5. 성과 예측 및 최적화 제안
"""

import json
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import asyncio
import logging
from collections import defaultdict

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class Platform(str, Enum):
    """플랫폼 종류"""
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    NAVER_BLOG = "naver_blog"
    NAVER_AD = "naver_ad"
    GOOGLE_ADS = "google_ads"

class MetricType(str, Enum):
    """지표 타입"""
    ENGAGEMENT = "engagement"
    REACH = "reach"
    IMPRESSION = "impression"
    CLICK = "click"
    CONVERSION = "conversion"
    ROI = "roi"
    CTR = "ctr"
    CPC = "cpc"
    CPM = "cpm"

class AnalysisType(str, Enum):
    """분석 유형"""
    PERFORMANCE = "performance"
    AB_TEST = "ab_test"
    BENCHMARK = "benchmark"
    PREDICTION = "prediction"
    OPTIMIZATION = "optimization"
    TREND = "trend"

class TimeGranularity(str, Enum):
    """시간 단위"""
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"

# ==================== Input/Output Schemas ====================

class PerformanceAnalysisInput(BaseModel):
    """성과 분석 입력"""
    platform: Platform = Field(..., description="플랫폼")
    post_id: Optional[str] = Field(None, description="게시물 ID")
    campaign_id: Optional[str] = Field(None, description="캠페인 ID")
    period: Dict[str, str] = Field(..., description="분석 기간")
    metrics: Optional[List[MetricType]] = Field(None, description="분석 지표")

class ABTestInput(BaseModel):
    """A/B 테스트 분석 입력"""
    variant_a: Dict[str, Any] = Field(..., description="변형 A 데이터")
    variant_b: Dict[str, Any] = Field(..., description="변형 B 데이터")
    metric: MetricType = Field(..., description="비교 지표")
    confidence_level: float = Field(default=0.95, description="신뢰 수준")

class BenchmarkInput(BaseModel):
    """벤치마크 분석 입력"""
    platform: Platform = Field(..., description="플랫폼")
    industry: str = Field(..., description="산업 분류")
    metrics: List[MetricType] = Field(..., description="비교 지표")
    competitors: Optional[List[str]] = Field(None, description="경쟁사 목록")

class PredictionInput(BaseModel):
    """성과 예측 입력"""
    platform: Platform = Field(..., description="플랫폼")
    historical_data: List[Dict[str, Any]] = Field(..., description="과거 데이터")
    forecast_days: int = Field(default=30, description="예측 일수")
    metric: MetricType = Field(..., description="예측 지표")

class OptimizationInput(BaseModel):
    """최적화 제안 입력"""
    platform: Platform = Field(..., description="플랫폼")
    current_performance: Dict[str, Any] = Field(..., description="현재 성과")
    goals: Dict[str, float] = Field(..., description="목표 지표")
    constraints: Optional[Dict[str, Any]] = Field(None, description="제약 조건")

# ==================== Output Schemas ====================

class Metric(BaseModel):
    """성과 지표"""
    name: str = Field(..., description="지표명")
    value: float = Field(..., description="값")
    change: Optional[float] = Field(None, description="변화율")
    benchmark: Optional[float] = Field(None, description="벤치마크 값")

class PerformanceReport(BaseModel):
    """성과 리포트"""
    platform: str = Field(..., description="플랫폼")
    period: Dict[str, str] = Field(..., description="분석 기간")
    metrics: List[Metric] = Field(..., description="성과 지표")
    grade: str = Field(..., description="성과 등급 (A~F)")
    score: float = Field(..., description="종합 점수")
    insights: List[str] = Field(..., description="인사이트")
    recommendations: List[str] = Field(..., description="개선 제안")

class ABTestResult(BaseModel):
    """A/B 테스트 결과"""
    winner: str = Field(..., description="우승 변형 (A/B)")
    confidence: float = Field(..., description="신뢰도")
    improvement: float = Field(..., description="개선율")
    statistical_significance: bool = Field(..., description="통계적 유의성")
    sample_size_a: int = Field(..., description="A 샘플 크기")
    sample_size_b: int = Field(..., description="B 샘플 크기")
    metric_a: float = Field(..., description="A 지표 값")
    metric_b: float = Field(..., description="B 지표 값")

class BenchmarkReport(BaseModel):
    """벤치마크 리포트"""
    platform: str = Field(..., description="플랫폼")
    industry: str = Field(..., description="산업")
    your_performance: Dict[str, float] = Field(..., description="자사 성과")
    industry_average: Dict[str, float] = Field(..., description="업계 평균")
    competitors: Optional[Dict[str, Dict[str, float]]] = Field(None, description="경쟁사 성과")
    ranking: int = Field(..., description="업계 내 순위")
    percentile: float = Field(..., description="백분위")

class PredictionResult(BaseModel):
    """예측 결과"""
    metric: str = Field(..., description="예측 지표")
    predictions: List[Dict[str, Any]] = Field(..., description="일별 예측값")
    trend: str = Field(..., description="트렌드 (상승/하락/유지)")
    confidence_interval: Dict[str, List[float]] = Field(..., description="신뢰 구간")
    accuracy_score: float = Field(..., description="예측 정확도")

class OptimizationSuggestion(BaseModel):
    """최적화 제안"""
    area: str = Field(..., description="개선 영역")
    current_value: float = Field(..., description="현재 값")
    target_value: float = Field(..., description="목표 값")
    action: str = Field(..., description="액션 아이템")
    expected_impact: float = Field(..., description="예상 효과")
    priority: str = Field(..., description="우선순위 (High/Medium/Low)")

class OptimizationReport(BaseModel):
    """최적화 리포트"""
    platform: str = Field(..., description="플랫폼")
    suggestions: List[OptimizationSuggestion] = Field(..., description="제안 사항")
    estimated_improvement: float = Field(..., description="예상 개선율")
    implementation_complexity: str = Field(..., description="구현 복잡도")

# ==================== Main Agent Class ====================

class PerformanceAnalyzerAgent(AgentBase):
    """SNS 및 광고 성과 분석 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            llm_gateway=llm_service
        )

        # 업계 벤치마크 데이터 (Mock)
        self.industry_benchmarks = {
            "cosmetics": {
                "engagement": 0.035,
                "ctr": 0.02,
                "conversion": 0.015,
                "roi": 3.5
            },
            "fashion": {
                "engagement": 0.042,
                "ctr": 0.025,
                "conversion": 0.018,
                "roi": 4.2
            },
            "food": {
                "engagement": 0.048,
                "ctr": 0.028,
                "conversion": 0.022,
                "roi": 3.8
            }
        }

    @property
    def name(self) -> str:
        """Agent 이름 반환"""
        return "performance_analyzer"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        try:
            analysis_type = AnalysisType(request.task)

            if analysis_type == AnalysisType.PERFORMANCE:
                result = await self._analyze_performance(request.payload)
            elif analysis_type == AnalysisType.AB_TEST:
                result = await self._analyze_ab_test(request.payload)
            elif analysis_type == AnalysisType.BENCHMARK:
                result = await self._benchmark_analysis(request.payload)
            elif analysis_type == AnalysisType.PREDICTION:
                result = await self._predict_performance(request.payload)
            elif analysis_type == AnalysisType.OPTIMIZATION:
                result = await self._optimize_performance(request.payload)
            else:
                raise AgentError(f"Unknown task: {request.task}")

            return AgentResponse(
                agent_id=self.agent_id,
                status="success",
                result=result,
                metadata={
                    "task": analysis_type.value,
                    "timestamp": datetime.now().isoformat()
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
            logger.error(f"Performance analyzer agent error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=str(e)
            )

    async def _analyze_performance(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """성과 분석"""
        input_data = PerformanceAnalysisInput(**payload)

        # Mock 성과 데이터 생성
        metrics = []

        metric_types = input_data.metrics or [
            MetricType.ENGAGEMENT,
            MetricType.REACH,
            MetricType.CTR,
            MetricType.CONVERSION
        ]

        for metric_type in metric_types:
            value = np.random.uniform(0.01, 0.05)  # Mock 값
            change = np.random.uniform(-0.15, 0.25)  # Mock 변화율
            benchmark = self._get_benchmark_value(input_data.platform, metric_type)

            metrics.append(Metric(
                name=metric_type.value,
                value=value,
                change=change,
                benchmark=benchmark
            ))

        # 종합 점수 계산
        score = self._calculate_score(metrics)
        grade = self._calculate_grade(score)

        # 인사이트 생성
        insights = self._generate_insights(metrics, input_data.platform)

        # 개선 제안
        recommendations = self._generate_recommendations(metrics)

        return PerformanceReport(
            platform=input_data.platform.value,
            period=input_data.period,
            metrics=metrics,
            grade=grade,
            score=score,
            insights=insights,
            recommendations=recommendations
        ).dict()

    async def _analyze_ab_test(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """A/B 테스트 분석"""
        input_data = ABTestInput(**payload)

        # 변형 데이터 추출
        metric_a = input_data.variant_a.get("value", np.random.uniform(0.02, 0.04))
        metric_b = input_data.variant_b.get("value", np.random.uniform(0.02, 0.04))
        sample_size_a = input_data.variant_a.get("sample_size", 1000)
        sample_size_b = input_data.variant_b.get("sample_size", 1000)

        # 통계적 유의성 검정 (간단한 z-test 시뮬레이션)
        improvement = (metric_b - metric_a) / metric_a if metric_a > 0 else 0
        statistical_significance = abs(improvement) > 0.1  # 10% 이상 차이면 유의

        # 우승자 결정
        winner = "B" if metric_b > metric_a else "A"
        confidence = min(0.99, 0.5 + abs(improvement) * 2)

        return ABTestResult(
            winner=winner,
            confidence=confidence,
            improvement=improvement,
            statistical_significance=statistical_significance,
            sample_size_a=sample_size_a,
            sample_size_b=sample_size_b,
            metric_a=metric_a,
            metric_b=metric_b
        ).dict()

    async def _benchmark_analysis(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """벤치마크 분석"""
        input_data = BenchmarkInput(**payload)

        # 자사 성과 (Mock)
        your_performance = {}
        for metric in input_data.metrics:
            your_performance[metric.value] = np.random.uniform(0.02, 0.05)

        # 업계 평균
        industry_avg = self.industry_benchmarks.get(
            input_data.industry,
            self.industry_benchmarks["cosmetics"]
        )

        industry_average = {}
        for metric in input_data.metrics:
            industry_average[metric.value] = industry_avg.get(
                metric.value,
                np.random.uniform(0.025, 0.04)
            )

        # 경쟁사 성과
        competitors = {}
        if input_data.competitors:
            for comp in input_data.competitors:
                competitors[comp] = {}
                for metric in input_data.metrics:
                    competitors[comp][metric.value] = np.random.uniform(0.02, 0.05)

        # 순위 계산 (Mock)
        all_scores = [sum(your_performance.values())]
        if competitors:
            all_scores.extend([sum(c.values()) for c in competitors.values()])

        all_scores.sort(reverse=True)
        ranking = all_scores.index(sum(your_performance.values())) + 1
        percentile = (len(all_scores) - ranking + 1) / len(all_scores)

        return BenchmarkReport(
            platform=input_data.platform.value,
            industry=input_data.industry,
            your_performance=your_performance,
            industry_average=industry_average,
            competitors=competitors if competitors else None,
            ranking=ranking,
            percentile=percentile
        ).dict()

    async def _predict_performance(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """성과 예측"""
        input_data = PredictionInput(**payload)

        # 과거 데이터 분석
        historical_values = [d.get("value", 0) for d in input_data.historical_data]

        if not historical_values:
            # Mock 과거 데이터
            historical_values = [np.random.uniform(0.02, 0.04) for _ in range(30)]

        # 트렌드 계산
        trend_slope = (historical_values[-1] - historical_values[0]) / len(historical_values)

        if trend_slope > 0.001:
            trend = "상승"
        elif trend_slope < -0.001:
            trend = "하락"
        else:
            trend = "유지"

        # 예측 생성 (간단한 선형 예측)
        predictions = []
        last_value = historical_values[-1]

        for day in range(1, input_data.forecast_days + 1):
            predicted_value = last_value + trend_slope * day
            # 노이즈 추가
            predicted_value += np.random.normal(0, abs(trend_slope) * 0.5)

            predictions.append({
                "date": (datetime.now() + timedelta(days=day)).isoformat()[:10],
                "value": max(0, predicted_value),
                "day": day
            })

        # 신뢰 구간
        confidence_interval = {
            "lower": [max(0, p["value"] * 0.9) for p in predictions],
            "upper": [p["value"] * 1.1 for p in predictions]
        }

        # 예측 정확도 (Mock)
        accuracy_score = 0.75 + np.random.uniform(0, 0.15)

        return PredictionResult(
            metric=input_data.metric.value,
            predictions=predictions,
            trend=trend,
            confidence_interval=confidence_interval,
            accuracy_score=accuracy_score
        ).dict()

    async def _optimize_performance(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """성과 최적화"""
        input_data = OptimizationInput(**payload)

        suggestions = []

        # 목표와 현재 성과 비교
        for goal_metric, target_value in input_data.goals.items():
            current_value = input_data.current_performance.get(goal_metric, 0)

            if current_value < target_value:
                gap = target_value - current_value
                improvement_rate = gap / current_value if current_value > 0 else 1.0

                # 최적화 제안 생성
                suggestion = self._generate_optimization_suggestion(
                    goal_metric,
                    current_value,
                    target_value,
                    improvement_rate,
                    input_data.platform
                )

                suggestions.append(suggestion)

        # 우선순위 정렬
        suggestions.sort(key=lambda x: self._get_priority_score(x.priority), reverse=True)

        # 예상 개선율 계산
        estimated_improvement = sum(s.expected_impact for s in suggestions) / len(suggestions) if suggestions else 0

        # 구현 복잡도
        complexity_score = sum(1 if s.priority == "High" else 0.5 for s in suggestions)
        if complexity_score > 3:
            implementation_complexity = "High"
        elif complexity_score > 1.5:
            implementation_complexity = "Medium"
        else:
            implementation_complexity = "Low"

        return OptimizationReport(
            platform=input_data.platform.value,
            suggestions=suggestions,
            estimated_improvement=estimated_improvement,
            implementation_complexity=implementation_complexity
        ).dict()

    # ==================== Helper Methods ====================

    def _get_benchmark_value(self, platform: Platform, metric: MetricType) -> float:
        """벤치마크 값 조회"""
        # Mock 벤치마크
        benchmarks = {
            MetricType.ENGAGEMENT: 0.035,
            MetricType.CTR: 0.022,
            MetricType.CONVERSION: 0.015,
            MetricType.ROI: 3.5
        }
        return benchmarks.get(metric, 0.03)

    def _calculate_score(self, metrics: List[Metric]) -> float:
        """종합 점수 계산"""
        if not metrics:
            return 0.0

        scores = []
        for metric in metrics:
            if metric.benchmark:
                # 벤치마크 대비 점수
                score = (metric.value / metric.benchmark) * 100
            else:
                # 절대값 기반 점수
                score = metric.value * 1000

            scores.append(min(100, score))

        return sum(scores) / len(scores)

    def _calculate_grade(self, score: float) -> str:
        """점수를 등급으로 변환"""
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"

    def _generate_insights(self, metrics: List[Metric], platform: Platform) -> List[str]:
        """인사이트 생성"""
        insights = []

        for metric in metrics:
            if metric.change and metric.change > 0.1:
                insights.append(f"{metric.name} 지표가 {metric.change*100:.1f}% 증가했습니다")
            elif metric.change and metric.change < -0.1:
                insights.append(f"{metric.name} 지표가 {abs(metric.change)*100:.1f}% 감소했습니다")

            if metric.benchmark and metric.value > metric.benchmark:
                diff = (metric.value / metric.benchmark - 1) * 100
                insights.append(f"{metric.name}이 업계 평균보다 {diff:.1f}% 높습니다")

        # 플랫폼별 인사이트
        if platform == Platform.INSTAGRAM:
            insights.append("스토리 콘텐츠의 engagement가 피드보다 25% 높습니다")
        elif platform == Platform.YOUTUBE:
            insights.append("썸네일 A/B 테스트 시 CTR이 평균 15% 향상됩니다")

        return insights[:5]  # 상위 5개

    def _generate_recommendations(self, metrics: List[Metric]) -> List[str]:
        """개선 제안 생성"""
        recommendations = []

        for metric in metrics:
            if metric.benchmark and metric.value < metric.benchmark:
                recommendations.append(
                    f"{metric.name} 개선을 위해 콘텐츠 품질 향상이 필요합니다"
                )

            if metric.change and metric.change < 0:
                recommendations.append(
                    f"{metric.name} 하락 추세를 막기 위한 전략 재검토가 필요합니다"
                )

        # 일반 제안
        recommendations.extend([
            "최적 게시 시간대 분석을 통한 도달률 향상",
            "해시태그 전략 최적화로 발견성 증대",
            "인플루언서 협업을 통한 브랜드 인지도 향상"
        ])

        return recommendations[:5]

    def _generate_optimization_suggestion(
        self,
        metric: str,
        current: float,
        target: float,
        improvement_rate: float,
        platform: Platform
    ) -> OptimizationSuggestion:
        """최적화 제안 생성"""

        actions = {
            "engagement": "콘텐츠 퀄리티 향상 및 인터랙티브 요소 추가",
            "ctr": "제목과 썸네일 A/B 테스트 실시",
            "conversion": "랜딩 페이지 최적화 및 CTA 개선",
            "roi": "타겟팅 정밀화 및 광고 예산 재분배"
        }

        priority = "High" if improvement_rate > 0.5 else "Medium" if improvement_rate > 0.2 else "Low"

        return OptimizationSuggestion(
            area=metric,
            current_value=current,
            target_value=target,
            action=actions.get(metric, "성과 모니터링 강화 및 데이터 기반 의사결정"),
            expected_impact=min(improvement_rate, 0.5),
            priority=priority
        )

    def _get_priority_score(self, priority: str) -> int:
        """우선순위 점수 변환"""
        return {"High": 3, "Medium": 2, "Low": 1}.get(priority, 0)

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "supported_platforms": [p.value for p in Platform],
            "supported_metrics": [m.value for m in MetricType],
            "analysis_types": [a.value for a in AnalysisType],
            "features": {
                "ab_testing": True,
                "benchmarking": True,
                "prediction": True,
                "optimization": True,
                "real_time_monitoring": True,
                "competitor_analysis": True
            },
            "industry_benchmarks": list(self.industry_benchmarks.keys())
        }

# ==================== Factory Function ====================

def create_performance_analyzer_agent(llm_service: Optional[LLMService] = None) -> PerformanceAnalyzerAgent:
    """PerformanceAnalyzerAgent 인스턴스 생성"""
    return PerformanceAnalyzerAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_performance_analyzer_agent():
        # 에이전트 생성
        agent = create_performance_analyzer_agent()

        # 1. 성과 분석
        performance_request = AgentRequest(
            task="performance",
            payload={
                "platform": "instagram",
                "post_id": "post_123",
                "period": {"start": "2025-01-01", "end": "2025-01-31"},
                "metrics": ["engagement", "reach", "ctr"]
            }
        )

        result = await agent.execute(performance_request)
        print(f"성과 분석 결과: {result.status}")
        if result.status == "success":
            print(f"  - 등급: {result.result['grade']}")
            print(f"  - 점수: {result.result['score']:.1f}")
            print(f"  - 인사이트 수: {len(result.result['insights'])}")

        # 2. A/B 테스트
        ab_test_request = AgentRequest(
            task="ab_test",
            payload={
                "variant_a": {"value": 0.025, "sample_size": 1000},
                "variant_b": {"value": 0.032, "sample_size": 1000},
                "metric": "ctr"
            }
        )

        result = await agent.execute(ab_test_request)
        print(f"\nA/B 테스트 결과: {result.status}")
        if result.status == "success":
            print(f"  - 우승자: 변형 {result.result['winner']}")
            print(f"  - 개선율: {result.result['improvement']*100:.1f}%")
            print(f"  - 통계적 유의성: {result.result['statistical_significance']}")

        # 3. 벤치마크
        benchmark_request = AgentRequest(
            task="benchmark",
            payload={
                "platform": "instagram",
                "industry": "cosmetics",
                "metrics": ["engagement", "ctr", "conversion"],
                "competitors": ["competitor_a", "competitor_b"]
            }
        )

        result = await agent.execute(benchmark_request)
        print(f"\n벤치마크 결과: {result.status}")
        if result.status == "success":
            print(f"  - 업계 순위: {result.result['ranking']}위")
            print(f"  - 백분위: {result.result['percentile']*100:.1f}%")

        # 4. 성과 예측
        prediction_request = AgentRequest(
            task="prediction",
            payload={
                "platform": "instagram",
                "historical_data": [],  # Mock에서 자동 생성
                "forecast_days": 30,
                "metric": "engagement"
            }
        )

        result = await agent.execute(prediction_request)
        print(f"\n성과 예측 결과: {result.status}")
        if result.status == "success":
            print(f"  - 트렌드: {result.result['trend']}")
            print(f"  - 예측 정확도: {result.result['accuracy_score']:.2%}")

        # 5. 최적화 제안
        optimization_request = AgentRequest(
            task="optimization",
            payload={
                "platform": "instagram",
                "current_performance": {
                    "engagement": 0.025,
                    "ctr": 0.018,
                    "conversion": 0.012
                },
                "goals": {
                    "engagement": 0.035,
                    "ctr": 0.025,
                    "conversion": 0.020
                }
            }
        )

        result = await agent.execute(optimization_request)
        print(f"\n최적화 제안 결과: {result.status}")
        if result.status == "success":
            print(f"  - 제안 수: {len(result.result['suggestions'])}")
            print(f"  - 예상 개선율: {result.result['estimated_improvement']*100:.1f}%")
            print(f"  - 구현 복잡도: {result.result['implementation_complexity']}")

    # 테스트 실행
    asyncio.run(test_performance_analyzer_agent())
