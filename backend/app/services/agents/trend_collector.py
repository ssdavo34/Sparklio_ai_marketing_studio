"""
Trend Collector Agent

마케팅 트렌드 수집 및 분석 전문 Agent

작성일: 2025-11-21
작성자: B팀 (Backend)
문서: AGENT_EXPANSION_PLAN_2025-11-18.md (Phase 3, P1-B)

주요 기능:
1. SNS 트렌드 수집 (Twitter, Instagram, TikTok)
2. 검색 트렌드 분석 (Google Trends, Naver)
3. 업계 뉴스 수집
4. 경쟁사 모니터링
5. 키워드 트렌드 분석

KPI:
- 데이터 수집 정확도: >90%
- 응답 시간: <15초
- 트렌드 예측 정확도: >75%
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from enum import Enum
import hashlib
import json

from .base import AgentBase, AgentRequest, AgentResponse, AgentError

logger = logging.getLogger(__name__)


# ============================================================================
# Trend Collection Schemas
# ============================================================================

class TrendSource(str, Enum):
    """트렌드 소스"""
    GOOGLE_TRENDS = "google_trends"
    NAVER_TRENDS = "naver_trends"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    NEWS = "news"
    REDDIT = "reddit"


class TrendCategory(str, Enum):
    """트렌드 카테고리"""
    TECHNOLOGY = "technology"
    FASHION = "fashion"
    FOOD = "food"
    BEAUTY = "beauty"
    LIFESTYLE = "lifestyle"
    ENTERTAINMENT = "entertainment"
    SPORTS = "sports"
    BUSINESS = "business"
    HEALTH = "health"
    EDUCATION = "education"


class TrendStatus(str, Enum):
    """트렌드 상태"""
    RISING = "rising"        # 상승 중
    PEAKING = "peaking"      # 정점
    DECLINING = "declining"  # 하락 중
    STABLE = "stable"        # 안정


class TrendItem(BaseModel):
    """트렌드 아이템"""
    keyword: str = Field(..., description="트렌드 키워드")
    source: TrendSource = Field(..., description="트렌드 소스")
    category: TrendCategory = Field(..., description="카테고리")
    status: TrendStatus = Field(..., description="트렌드 상태")

    # 지표
    search_volume: int = Field(..., description="검색량")
    growth_rate: float = Field(..., description="성장률 (%)")
    engagement_rate: float = Field(..., description="참여율")
    sentiment_score: float = Field(..., ge=-1, le=1, description="감정 점수 (-1 to 1)")

    # 시간 정보
    collected_at: datetime = Field(default_factory=datetime.utcnow, description="수집 시간")
    peak_time: Optional[datetime] = Field(None, description="피크 시간")

    # 관련 정보
    related_keywords: List[str] = Field(default_factory=list, description="관련 키워드")
    related_hashtags: List[str] = Field(default_factory=list, description="관련 해시태그")
    sample_content: List[Dict[str, Any]] = Field(default_factory=list, description="샘플 콘텐츠")

    # 지역 정보
    region: Optional[str] = Field(None, description="지역")
    language: str = Field(default="ko", description="언어")


class CompetitorData(BaseModel):
    """경쟁사 데이터"""
    competitor_name: str = Field(..., description="경쟁사명")
    domain: str = Field(..., description="도메인")

    # 마케팅 활동
    recent_campaigns: List[Dict[str, Any]] = Field(default_factory=list, description="최근 캠페인")
    content_frequency: int = Field(..., description="콘텐츠 게시 빈도 (주당)")
    engagement_metrics: Dict[str, float] = Field(..., description="참여 지표")

    # 키워드 분석
    top_keywords: List[str] = Field(default_factory=list, description="상위 키워드")
    content_themes: List[str] = Field(default_factory=list, description="콘텐츠 주제")

    # 성과 지표
    estimated_traffic: int = Field(..., description="예상 트래픽")
    social_followers: Dict[str, int] = Field(..., description="SNS 팔로워 수")

    collected_at: datetime = Field(default_factory=datetime.utcnow, description="수집 시간")


class TrendReport(BaseModel):
    """트렌드 리포트"""
    period: str = Field(..., description="분석 기간")
    trends: List[TrendItem] = Field(..., description="트렌드 목록")
    competitors: List[CompetitorData] = Field(default_factory=list, description="경쟁사 데이터")

    # 종합 분석
    top_rising: List[str] = Field(..., description="급상승 키워드")
    declining: List[str] = Field(..., description="하락 키워드")
    opportunities: List[str] = Field(..., description="기회 키워드")
    threats: List[str] = Field(..., description="위협 요소")

    # 추천
    recommendations: List[str] = Field(..., description="마케팅 추천사항")
    action_items: List[Dict[str, Any]] = Field(..., description="실행 항목")

    # 메타데이터
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시간")
    confidence_score: float = Field(..., ge=0, le=1, description="신뢰도 점수")


# ============================================================================
# Trend Collector Agent
# ============================================================================

class TrendCollectorAgent(AgentBase):
    """
    Trend Collector Agent

    마케팅 트렌드를 수집하고 분석하는 Intelligence Agent

    주요 작업:
    1. collect_trends: 트렌드 수집
    2. analyze_keywords: 키워드 분석
    3. monitor_competitors: 경쟁사 모니터링
    4. generate_report: 트렌드 리포트 생성
    5. predict_trends: 트렌드 예측

    사용 예시:
        agent = TrendCollectorAgent()
        response = await agent.execute(AgentRequest(
            task="collect_trends",
            payload={
                "category": "technology",
                "sources": ["google_trends", "twitter"],
                "period": "7d",
                "region": "KR"
            }
        ))
    """

    @property
    def name(self) -> str:
        return "trend_collector"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Trend Collector Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 트렌드 수집 결과

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)
            self._validate_trend_input(request.payload)

            logger.info(f"Trend Collector Agent executing: task={request.task}")

            # 2. 작업별 처리
            if request.task == "collect_trends":
                result = await self._collect_trends(request.payload)
            elif request.task == "analyze_keywords":
                result = await self._analyze_keywords(request.payload)
            elif request.task == "monitor_competitors":
                result = await self._monitor_competitors(request.payload)
            elif request.task == "generate_report":
                result = await self._generate_report(request.payload)
            elif request.task == "predict_trends":
                result = await self._predict_trends(request.payload)
            else:
                raise AgentError(
                    message=f"Unsupported task: {request.task}",
                    agent=self.name
                )

            # 3. 결과를 AgentOutput으로 변환
            outputs = self._create_outputs(result, request.task)

            # 4. 사용량 계산
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            usage = {
                "api_calls": result.get("api_calls", 0),
                "data_points": result.get("data_points", 0),
                "elapsed_seconds": round(elapsed, 2)
            }

            # 5. 메타데이터
            meta = {
                "task": request.task,
                "sources": request.payload.get("sources", []),
                "period": request.payload.get("period", "7d"),
                "trend_count": len(result.get("trends", []))
            }

            logger.info(
                f"Trend Collector Agent success: task={request.task}, "
                f"trends={meta['trend_count']}, elapsed={elapsed:.2f}s"
            )

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=outputs,
                usage=usage,
                meta=meta
            )

        except Exception as e:
            logger.error(f"Trend Collector Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Trend collection failed: {str(e)}",
                agent=self.name,
                details={"task": request.task}
            )

    def _validate_trend_input(self, payload: Dict[str, Any]) -> None:
        """
        트렌드 입력 검증

        Args:
            payload: 입력 데이터

        Raises:
            AgentError: 필수 필드가 없을 때
        """
        # collect_trends 작업의 경우
        if "sources" in payload:
            sources = payload["sources"]
            if not isinstance(sources, list) or not sources:
                raise AgentError(
                    message="'sources' must be a non-empty list",
                    agent=self.name
                )

    async def _collect_trends(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        트렌드 수집

        Args:
            payload: 입력 데이터

        Returns:
            수집된 트렌드
        """
        sources = payload.get("sources", ["google_trends"])
        category = payload.get("category", "general")
        period = payload.get("period", "7d")
        region = payload.get("region", "KR")

        # 각 소스별로 트렌드 수집 (비동기 실행)
        tasks = []
        for source in sources:
            if source == "google_trends":
                tasks.append(self._collect_google_trends(category, period, region))
            elif source == "twitter":
                tasks.append(self._collect_twitter_trends(category, period, region))
            elif source == "instagram":
                tasks.append(self._collect_instagram_trends(category, period))
            elif source == "naver_trends":
                tasks.append(self._collect_naver_trends(category, period))
            else:
                logger.warning(f"Unknown source: {source}, using mock data")
                tasks.append(self._collect_mock_trends(source, category))

        # 모든 소스에서 데이터 수집
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 결과 통합
        all_trends = []
        api_calls = 0

        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Trend collection error: {result}")
                continue
            if isinstance(result, dict):
                all_trends.extend(result.get("trends", []))
                api_calls += result.get("api_calls", 0)

        # 중복 제거 및 정렬
        unique_trends = self._deduplicate_trends(all_trends)
        sorted_trends = sorted(
            unique_trends,
            key=lambda x: x.get("growth_rate", 0),
            reverse=True
        )

        return {
            "trends": sorted_trends[:50],  # 상위 50개
            "api_calls": api_calls,
            "data_points": len(all_trends),
            "sources_processed": len(sources)
        }

    async def _collect_google_trends(
        self,
        category: str,
        period: str,
        region: str
    ) -> Dict[str, Any]:
        """Google Trends 데이터 수집"""
        # 실제 구현에서는 Google Trends API 사용
        # 여기서는 Mock 데이터
        return {
            "trends": [
                {
                    "keyword": "AI 마케팅",
                    "source": "google_trends",
                    "category": category,
                    "status": "rising",
                    "search_volume": 12500,
                    "growth_rate": 45.2,
                    "engagement_rate": 0.72,
                    "sentiment_score": 0.65,
                    "related_keywords": ["자동화", "ChatGPT", "마케팅 도구"],
                    "region": region
                },
                {
                    "keyword": "숏폼 콘텐츠",
                    "source": "google_trends",
                    "category": category,
                    "status": "peaking",
                    "search_volume": 28000,
                    "growth_rate": 28.5,
                    "engagement_rate": 0.89,
                    "sentiment_score": 0.78,
                    "related_keywords": ["틱톡", "릴스", "쇼츠"],
                    "region": region
                }
            ],
            "api_calls": 1
        }

    async def _collect_twitter_trends(
        self,
        category: str,
        period: str,
        region: str
    ) -> Dict[str, Any]:
        """Twitter 트렌드 수집"""
        # Mock 데이터
        return {
            "trends": [
                {
                    "keyword": "#AI혁명",
                    "source": "twitter",
                    "category": category,
                    "status": "rising",
                    "search_volume": 5600,
                    "growth_rate": 120.5,
                    "engagement_rate": 0.45,
                    "sentiment_score": 0.55,
                    "related_hashtags": ["#인공지능", "#미래기술"],
                    "region": region
                }
            ],
            "api_calls": 1
        }

    async def _collect_instagram_trends(
        self,
        category: str,
        period: str
    ) -> Dict[str, Any]:
        """Instagram 트렌드 수집"""
        # Mock 데이터
        return {
            "trends": [
                {
                    "keyword": "릴스마케팅",
                    "source": "instagram",
                    "category": category,
                    "status": "rising",
                    "search_volume": 18900,
                    "growth_rate": 67.3,
                    "engagement_rate": 0.92,
                    "sentiment_score": 0.81,
                    "related_hashtags": ["#reels", "#숏폼", "#바이럴"],
                    "region": "global"
                }
            ],
            "api_calls": 1
        }

    async def _collect_naver_trends(
        self,
        category: str,
        period: str
    ) -> Dict[str, Any]:
        """Naver 트렌드 수집"""
        # Mock 데이터
        return {
            "trends": [
                {
                    "keyword": "스마트스토어",
                    "source": "naver_trends",
                    "category": category,
                    "status": "stable",
                    "search_volume": 34500,
                    "growth_rate": 12.1,
                    "engagement_rate": 0.68,
                    "sentiment_score": 0.71,
                    "related_keywords": ["네이버쇼핑", "온라인창업"],
                    "region": "KR"
                }
            ],
            "api_calls": 1
        }

    async def _collect_mock_trends(
        self,
        source: str,
        category: str
    ) -> Dict[str, Any]:
        """Mock 트렌드 데이터"""
        return {
            "trends": [
                {
                    "keyword": f"Mock Trend from {source}",
                    "source": source,
                    "category": category,
                    "status": "stable",
                    "search_volume": 1000,
                    "growth_rate": 5.0,
                    "engagement_rate": 0.5,
                    "sentiment_score": 0.0,
                    "related_keywords": [],
                    "region": "global"
                }
            ],
            "api_calls": 0
        }

    async def _analyze_keywords(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        키워드 분석

        Args:
            payload: 입력 데이터

        Returns:
            키워드 분석 결과
        """
        keywords = payload.get("keywords", [])

        analyzed = []
        for keyword in keywords:
            # 실제로는 각 키워드에 대한 상세 분석 수행
            analysis = {
                "keyword": keyword,
                "search_volume": self._estimate_search_volume(keyword),
                "competition": self._estimate_competition(keyword),
                "cpc": self._estimate_cpc(keyword),
                "trend": self._analyze_trend_direction(keyword),
                "seasonality": self._check_seasonality(keyword),
                "related_terms": self._find_related_terms(keyword)
            }
            analyzed.append(analysis)

        return {
            "analyzed_keywords": analyzed,
            "recommendations": self._generate_keyword_recommendations(analyzed),
            "api_calls": len(keywords),
            "data_points": len(keywords) * 6
        }

    async def _monitor_competitors(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        경쟁사 모니터링

        Args:
            payload: 입력 데이터

        Returns:
            경쟁사 데이터
        """
        competitors = payload.get("competitors", [])

        competitor_data = []
        for comp in competitors:
            # Mock 경쟁사 데이터
            data = {
                "competitor_name": comp,
                "domain": f"{comp.lower().replace(' ', '')}.com",
                "recent_campaigns": [
                    {
                        "name": "여름 세일",
                        "start_date": "2025-06-01",
                        "channels": ["instagram", "youtube"],
                        "estimated_budget": 5000000
                    }
                ],
                "content_frequency": 14,  # 주당 14개 콘텐츠
                "engagement_metrics": {
                    "avg_likes": 1250,
                    "avg_comments": 89,
                    "avg_shares": 45
                },
                "top_keywords": ["AI", "자동화", "효율성"],
                "content_themes": ["기술", "혁신", "트렌드"],
                "estimated_traffic": 125000,
                "social_followers": {
                    "instagram": 45000,
                    "youtube": 28000,
                    "twitter": 12000
                }
            }
            competitor_data.append(data)

        return {
            "competitors": competitor_data,
            "insights": self._generate_competitive_insights(competitor_data),
            "api_calls": len(competitors),
            "data_points": len(competitors) * 10
        }

    async def _generate_report(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        트렌드 리포트 생성

        Args:
            payload: 입력 데이터

        Returns:
            트렌드 리포트
        """
        # 트렌드 수집
        trends_result = await self._collect_trends(payload)

        # 경쟁사 데이터 수집 (있는 경우)
        competitors_data = []
        if "competitors" in payload:
            comp_result = await self._monitor_competitors(payload)
            competitors_data = comp_result.get("competitors", [])

        # 리포트 생성
        report = {
            "period": payload.get("period", "7d"),
            "trends": trends_result["trends"][:20],  # 상위 20개
            "competitors": competitors_data,
            "top_rising": self._identify_top_rising(trends_result["trends"]),
            "declining": self._identify_declining(trends_result["trends"]),
            "opportunities": self._identify_opportunities(trends_result["trends"]),
            "threats": self._identify_threats(trends_result["trends"], competitors_data),
            "recommendations": self._generate_recommendations(
                trends_result["trends"],
                competitors_data
            ),
            "action_items": self._generate_action_items(trends_result["trends"]),
            "confidence_score": 0.82,
            "api_calls": trends_result.get("api_calls", 0),
            "data_points": trends_result.get("data_points", 0)
        }

        return report

    async def _predict_trends(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        트렌드 예측

        Args:
            payload: 입력 데이터

        Returns:
            트렌드 예측 결과
        """
        historical_data = payload.get("historical_data", [])
        prediction_period = payload.get("prediction_period", "30d")

        # 간단한 트렌드 예측 로직 (실제로는 ML 모델 사용)
        predictions = []

        # Mock 예측 데이터
        predictions = [
            {
                "keyword": "AI 콘텐츠 생성",
                "current_volume": 8500,
                "predicted_volume": 15600,
                "growth_prediction": 83.5,
                "confidence": 0.78,
                "peak_timing": "2025-02-15"
            },
            {
                "keyword": "버추얼 인플루언서",
                "current_volume": 3200,
                "predicted_volume": 7800,
                "growth_prediction": 143.8,
                "confidence": 0.71,
                "peak_timing": "2025-03-20"
            }
        ]

        return {
            "predictions": predictions,
            "prediction_period": prediction_period,
            "methodology": "time_series_analysis",
            "confidence": 0.75,
            "api_calls": 0,
            "data_points": len(historical_data)
        }

    def _deduplicate_trends(self, trends: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """트렌드 중복 제거"""
        seen = set()
        unique = []

        for trend in trends:
            # 키워드를 기반으로 중복 체크
            key = self._normalize_keyword(trend.get("keyword", ""))
            if key not in seen:
                seen.add(key)
                unique.append(trend)

        return unique

    def _normalize_keyword(self, keyword: str) -> str:
        """키워드 정규화"""
        return keyword.lower().strip().replace(" ", "").replace("#", "")

    def _estimate_search_volume(self, keyword: str) -> int:
        """검색량 추정 (Mock)"""
        # 실제로는 API나 ML 모델 사용
        hash_val = int(hashlib.md5(keyword.encode()).hexdigest()[:8], 16)
        return (hash_val % 50000) + 1000

    def _estimate_competition(self, keyword: str) -> str:
        """경쟁도 추정"""
        volume = self._estimate_search_volume(keyword)
        if volume > 30000:
            return "high"
        elif volume > 10000:
            return "medium"
        else:
            return "low"

    def _estimate_cpc(self, keyword: str) -> float:
        """CPC 추정"""
        volume = self._estimate_search_volume(keyword)
        return round((volume / 10000) * 850, -1)  # Mock 계산

    def _analyze_trend_direction(self, keyword: str) -> str:
        """트렌드 방향 분석"""
        # Mock 분석
        hash_val = int(hashlib.md5(keyword.encode()).hexdigest()[:2], 16)
        if hash_val > 200:
            return "rising"
        elif hash_val > 100:
            return "stable"
        else:
            return "declining"

    def _check_seasonality(self, keyword: str) -> bool:
        """계절성 체크"""
        seasonal_keywords = ["여름", "겨울", "크리스마스", "설날", "추석"]
        return any(season in keyword for season in seasonal_keywords)

    def _find_related_terms(self, keyword: str) -> List[str]:
        """관련 용어 찾기"""
        # Mock 데이터
        return [f"{keyword} 팁", f"{keyword} 가이드", f"최고의 {keyword}"]

    def _generate_keyword_recommendations(
        self,
        analyzed: List[Dict[str, Any]]
    ) -> List[str]:
        """키워드 추천 생성"""
        recommendations = []

        for kw in analyzed:
            if kw["competition"] == "low" and kw["search_volume"] > 5000:
                recommendations.append(f"{kw['keyword']} - 낮은 경쟁, 좋은 기회")
            elif kw["trend"] == "rising":
                recommendations.append(f"{kw['keyword']} - 상승 트렌드, 주목 필요")

        return recommendations[:5]

    def _generate_competitive_insights(
        self,
        competitor_data: List[Dict[str, Any]]
    ) -> List[str]:
        """경쟁 인사이트 생성"""
        insights = []

        for comp in competitor_data:
            if comp["content_frequency"] > 10:
                insights.append(f"{comp['competitor_name']}는 적극적인 콘텐츠 마케팅 중")
            if comp["social_followers"].get("instagram", 0) > 30000:
                insights.append(f"{comp['competitor_name']}는 Instagram에서 강세")

        return insights

    def _identify_top_rising(self, trends: List[Dict[str, Any]]) -> List[str]:
        """급상승 트렌드 식별"""
        rising = [
            t["keyword"] for t in trends
            if t.get("status") == "rising" and t.get("growth_rate", 0) > 50
        ]
        return rising[:5]

    def _identify_declining(self, trends: List[Dict[str, Any]]) -> List[str]:
        """하락 트렌드 식별"""
        declining = [
            t["keyword"] for t in trends
            if t.get("status") == "declining" or t.get("growth_rate", 0) < -10
        ]
        return declining[:5]

    def _identify_opportunities(self, trends: List[Dict[str, Any]]) -> List[str]:
        """기회 식별"""
        opportunities = []

        for trend in trends:
            if (trend.get("growth_rate", 0) > 30 and
                trend.get("sentiment_score", 0) > 0.6):
                opportunities.append(
                    f"{trend['keyword']} - 높은 성장률과 긍정적 감정"
                )

        return opportunities[:5]

    def _identify_threats(
        self,
        trends: List[Dict[str, Any]],
        competitors: List[Dict[str, Any]]
    ) -> List[str]:
        """위협 요소 식별"""
        threats = []

        # 경쟁사 위협
        for comp in competitors:
            if comp.get("content_frequency", 0) > 15:
                threats.append(f"{comp['competitor_name']}의 공격적 마케팅")

        # 부정적 트렌드
        for trend in trends:
            if trend.get("sentiment_score", 1) < -0.3:
                threats.append(f"{trend['keyword']}에 대한 부정적 정서")

        return threats[:5]

    def _generate_recommendations(
        self,
        trends: List[Dict[str, Any]],
        competitors: List[Dict[str, Any]]
    ) -> List[str]:
        """마케팅 추천사항 생성"""
        recommendations = []

        # 트렌드 기반 추천
        rising_trends = [t for t in trends if t.get("status") == "rising"]
        if rising_trends:
            recommendations.append(
                f"{rising_trends[0]['keyword']} 관련 콘텐츠 제작 권장"
            )

        # 경쟁사 기반 추천
        if competitors:
            avg_frequency = sum(c.get("content_frequency", 0) for c in competitors) / len(competitors)
            if avg_frequency > 10:
                recommendations.append("콘텐츠 게시 빈도를 주 10회 이상으로 증가")

        # 플랫폼 추천
        high_engagement = [
            t for t in trends
            if t.get("engagement_rate", 0) > 0.8
        ]
        if high_engagement:
            recommendations.append(
                f"{high_engagement[0]['source']} 플랫폼 집중 공략"
            )

        return recommendations

    def _generate_action_items(
        self,
        trends: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """실행 항목 생성"""
        action_items = []

        # 상위 트렌드에 대한 액션
        for trend in trends[:3]:
            action_items.append({
                "priority": "high",
                "action": f"{trend['keyword']} 키워드 콘텐츠 작성",
                "deadline": "1주 이내",
                "expected_impact": "높음"
            })

        return action_items

    def _create_outputs(
        self,
        result: Dict[str, Any],
        task: str
    ) -> List:
        """
        결과를 AgentOutput 리스트로 변환

        Args:
            result: 처리 결과
            task: 작업 유형

        Returns:
            AgentOutput 리스트
        """
        outputs = []

        # 전체 결과
        outputs.append(self._create_output(
            output_type="json",
            name="trend_data",
            value=result,
            meta={
                "task": task,
                "format": "trend_report",
                "data_points": result.get("data_points", 0)
            }
        ))

        # 추천사항 (텍스트 형식)
        if "recommendations" in result:
            recommendations_text = "\n".join([
                f"• {rec}"
                for rec in result["recommendations"]
            ])

            outputs.append(self._create_output(
                output_type="text",
                name="recommendations",
                value=recommendations_text,
                meta={"format": "bullet_list"}
            ))

        return outputs


# ============================================================================
# Factory Function
# ============================================================================

def get_trend_collector_agent(llm_gateway=None) -> TrendCollectorAgent:
    """
    Trend Collector Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        TrendCollectorAgent 인스턴스
    """
    return TrendCollectorAgent(llm_gateway=llm_gateway)