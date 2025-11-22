"""
Error Handler Agent - 에러 처리 및 복구 에이전트

이 에이전트는 시스템에서 발생하는 에러를 감지하고 처리하며,
가능한 경우 자동 복구를 시도합니다.

주요 기능:
1. 에러 감지 및 분류
2. 에러 심각도 평가
3. 자동 복구 시도
4. 에러 로깅 및 알림
5. 재시도 전략 관리
"""

import json
import traceback
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import asyncio
import logging
from collections import defaultdict, deque
from uuid import uuid4

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class ErrorSeverity(str, Enum):
    """에러 심각도"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    WARNING = "warning"

class ErrorCategory(str, Enum):
    """에러 카테고리"""
    SYSTEM = "system"
    NETWORK = "network"
    DATABASE = "database"
    API = "api"
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    BUSINESS_LOGIC = "business_logic"
    UNKNOWN = "unknown"

class RecoveryStrategy(str, Enum):
    """복구 전략"""
    RETRY = "retry"
    FALLBACK = "fallback"
    SKIP = "skip"
    NOTIFY = "notify"
    ESCALATE = "escalate"
    MANUAL = "manual"

class ErrorStatus(str, Enum):
    """에러 상태"""
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RECOVERED = "recovered"
    FAILED = "failed"
    ESCALATED = "escalated"

# ==================== Input/Output Schemas ====================

class ErrorReport(BaseModel):
    """에러 리포트"""
    error_id: str = Field(default_factory=lambda: str(uuid4()), description="에러 ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="발생 시간")
    error_type: str = Field(..., description="에러 타입")
    error_message: str = Field(..., description="에러 메시지")
    stacktrace: Optional[str] = Field(None, description="스택 트레이스")
    context: Optional[Dict[str, Any]] = Field(None, description="에러 컨텍스트")
    affected_component: Optional[str] = Field(None, description="영향받은 컴포넌트")

class ErrorAnalysis(BaseModel):
    """에러 분석 결과"""
    error_id: str = Field(..., description="에러 ID")
    severity: ErrorSeverity = Field(..., description="심각도")
    category: ErrorCategory = Field(..., description="카테고리")
    root_cause: str = Field(..., description="근본 원인")
    impact: str = Field(..., description="영향도")
    recommended_action: RecoveryStrategy = Field(..., description="권장 조치")

class RecoveryAttempt(BaseModel):
    """복구 시도"""
    attempt_id: str = Field(..., description="시도 ID")
    error_id: str = Field(..., description="에러 ID")
    strategy: RecoveryStrategy = Field(..., description="복구 전략")
    started_at: datetime = Field(..., description="시작 시간")
    completed_at: Optional[datetime] = Field(None, description="완료 시간")
    success: bool = Field(..., description="성공 여부")
    details: Optional[Dict[str, Any]] = Field(None, description="상세 정보")

class RetryConfig(BaseModel):
    """재시도 설정"""
    max_attempts: int = Field(default=3, description="최대 시도 횟수")
    initial_delay: float = Field(default=1.0, description="초기 대기 시간(초)")
    backoff_multiplier: float = Field(default=2.0, description="백오프 승수")
    max_delay: float = Field(default=60.0, description="최대 대기 시간(초)")

class ErrorSummary(BaseModel):
    """에러 요약"""
    total_errors: int = Field(..., description="전체 에러 수")
    by_severity: Dict[str, int] = Field(..., description="심각도별 집계")
    by_category: Dict[str, int] = Field(..., description="카테고리별 집계")
    recovery_rate: float = Field(..., description="복구율")
    most_common_errors: List[Dict[str, Any]] = Field(..., description="빈번한 에러")

# ==================== Main Agent Class ====================

class ErrorHandlerAgent(AgentBase):
    """에러 처리 및 복구 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            llm_gateway=llm_service
        )

        # 에러 히스토리
        self.error_history: Dict[str, ErrorReport] = {}

        # 에러 분석 결과
        self.error_analyses: Dict[str, ErrorAnalysis] = {}

        # 복구 시도 기록
        self.recovery_attempts: Dict[str, List[RecoveryAttempt]] = defaultdict(list)

        # 에러 패턴 (학습용)
        self.error_patterns: Dict[str, int] = defaultdict(int)

        # 재시도 설정
        self.retry_config = RetryConfig()

        # 알림 큐
        self.notification_queue: deque = deque(maxlen=100)

    @property
    def name(self) -> str:
        """Agent 이름 반환"""
        return "error_handler"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        from app.services.agents.base import AgentOutput

        try:
            task = request.task

            if task == "handle_error":
                result = await self._handle_error(request.payload)
            elif task == "analyze_error":
                result = await self._analyze_error(request.payload)
            elif task == "retry_operation":
                result = await self._retry_operation(request.payload)
            elif task == "get_error_summary":
                result = await self._get_error_summary(request.payload)
            elif task == "suggest_fix":
                result = await self._suggest_fix(request.payload)
            else:
                raise AgentError(f"Unknown task: {request.task}")

            # AgentResponse 형식에 맞게 변경
            return AgentResponse(
                agent=self.name,
                task=task,
                outputs=[AgentOutput(type="json", name="result", value=result)],
                usage={},
                meta={
                    "timestamp": datetime.now().isoformat(),
                    "total_errors": len(self.error_history)
                }
            )

        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=[AgentOutput(
                    type="json", name="error",
                    value={"error": f"입력 데이터 검증 실패: {str(e)}"}
                )],
                usage={},
                meta={}
            )
        except Exception as e:
            logger.error(f"Error handler agent error: {e}")
            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=[AgentOutput(
                    type="json", name="error",
                    value={"error": str(e)}
                )],
                usage={},
                meta={}
            )

    async def _handle_error(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """에러 처리"""
        error_report = ErrorReport(**payload)

        # 에러 저장
        self.error_history[error_report.error_id] = error_report

        # 에러 분석
        analysis = await self._analyze_error(error_report.dict())

        # 복구 시도
        recovery_result = None
        if analysis["recommended_action"] in [
            RecoveryStrategy.RETRY.value,
            RecoveryStrategy.FALLBACK.value
        ]:
            recovery_result = await self._attempt_recovery(
                error_report,
                ErrorAnalysis(**analysis)
            )

        # 심각도에 따른 알림
        if analysis["severity"] in [ErrorSeverity.CRITICAL.value, ErrorSeverity.HIGH.value]:
            await self._send_notification(error_report, analysis)

        return {
            "error_id": error_report.error_id,
            "handled": True,
            "analysis": analysis,
            "recovery_attempted": recovery_result is not None,
            "recovery_result": recovery_result,
            "notification_sent": analysis["severity"] in [
                ErrorSeverity.CRITICAL.value,
                ErrorSeverity.HIGH.value
            ]
        }

    async def _analyze_error(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """에러 분석"""
        error_report = ErrorReport(**payload)

        # 에러 타입 분류
        category = self._classify_error(error_report)

        # 심각도 평가
        severity = self._assess_severity(error_report, category)

        # 근본 원인 분석
        root_cause = self._analyze_root_cause(error_report)

        # 영향도 평가
        impact = self._assess_impact(error_report, severity)

        # 권장 조치
        recommended_action = self._recommend_action(category, severity)

        analysis = ErrorAnalysis(
            error_id=error_report.error_id,
            severity=severity,
            category=category,
            root_cause=root_cause,
            impact=impact,
            recommended_action=recommended_action
        )

        # 분석 결과 저장
        self.error_analyses[error_report.error_id] = analysis

        # 패턴 학습
        pattern_key = f"{category.value}:{error_report.error_type}"
        self.error_patterns[pattern_key] += 1

        return analysis.dict()

    async def _retry_operation(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """작업 재시도"""
        operation = payload.get("operation")
        operation_args = payload.get("args", [])
        operation_kwargs = payload.get("kwargs", {})
        config = RetryConfig(**payload.get("retry_config", {}))

        attempts = 0
        last_error = None
        delay = config.initial_delay

        while attempts < config.max_attempts:
            attempts += 1

            try:
                # Mock 작업 실행
                await asyncio.sleep(0.1)

                # 성공 시뮬레이션 (70% 확률)
                import random
                if random.random() > 0.3:
                    return {
                        "success": True,
                        "attempts": attempts,
                        "result": "Operation succeeded",
                        "total_delay": sum(
                            config.initial_delay * (config.backoff_multiplier ** i)
                            for i in range(attempts - 1)
                        )
                    }

                # 실패 시뮬레이션
                raise Exception("Operation failed")

            except Exception as e:
                last_error = str(e)
                logger.warning(f"Retry attempt {attempts} failed: {e}")

                if attempts < config.max_attempts:
                    await asyncio.sleep(delay)
                    delay = min(delay * config.backoff_multiplier, config.max_delay)

        return {
            "strategy": "exponential_backoff",
            "success": False,
            "attempts": attempts,
            "last_error": last_error,
            "exhausted": True,
            "retry": False
        }

    async def _get_error_summary(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """에러 요약 조회"""
        time_range = payload.get("time_range")  # 시간 범위 (분)

        if time_range:
            cutoff_time = datetime.now() - timedelta(minutes=time_range)
            errors = [
                e for e in self.error_history.values()
                if e.timestamp >= cutoff_time
            ]
        else:
            errors = list(self.error_history.values())

        # 심각도별 집계
        by_severity = defaultdict(int)
        for error_id, analysis in self.error_analyses.items():
            if error_id in [e.error_id for e in errors]:
                by_severity[analysis.severity.value] += 1

        # 카테고리별 집계
        by_category = defaultdict(int)
        for error_id, analysis in self.error_analyses.items():
            if error_id in [e.error_id for e in errors]:
                by_category[analysis.category.value] += 1

        # 복구율 계산
        total_recovery_attempts = sum(
            len(attempts) for attempts in self.recovery_attempts.values()
        )
        successful_recoveries = sum(
            sum(1 for attempt in attempts if attempt.success)
            for attempts in self.recovery_attempts.values()
        )
        recovery_rate = (
            successful_recoveries / total_recovery_attempts
            if total_recovery_attempts > 0 else 0
        )

        # 빈번한 에러
        most_common = sorted(
            self.error_patterns.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        most_common_errors = [
            {"pattern": pattern, "count": count}
            for pattern, count in most_common
        ]

        return ErrorSummary(
            total_errors=len(errors),
            by_severity=dict(by_severity),
            by_category=dict(by_category),
            recovery_rate=recovery_rate,
            most_common_errors=most_common_errors
        ).dict()

    async def _suggest_fix(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """수정 방법 제안"""
        error_id = payload.get("error_id")

        if error_id not in self.error_history:
            raise ValueError(f"Error not found: {error_id}")

        error_report = self.error_history[error_id]
        analysis = self.error_analyses.get(error_id)

        suggestions = []

        if analysis:
            # 카테고리별 제안
            if analysis.category == ErrorCategory.DATABASE:
                suggestions.extend([
                    "데이터베이스 연결 풀 설정을 확인하세요",
                    "쿼리 타임아웃을 늘려보세요",
                    "데이터베이스 인덱스를 점검하세요"
                ])

            elif analysis.category == ErrorCategory.NETWORK:
                suggestions.extend([
                    "네트워크 연결을 확인하세요",
                    "방화벽 설정을 점검하세요",
                    "API 엔드포인트가 올바른지 확인하세요"
                ])

            elif analysis.category == ErrorCategory.API:
                suggestions.extend([
                    "API 키가 유효한지 확인하세요",
                    "Rate limit을 초과하지 않았는지 확인하세요",
                    "요청 페이로드 형식을 점검하세요"
                ])

            elif analysis.category == ErrorCategory.VALIDATION:
                suggestions.extend([
                    "입력 데이터 형식을 확인하세요",
                    "필수 필드가 누락되지 않았는지 확인하세요",
                    "데이터 타입이 올바른지 검증하세요"
                ])

        # 과거 유사 에러의 성공적인 복구 방법
        similar_errors = self._find_similar_errors(error_report)
        for similar_id in similar_errors:
            successful_recoveries = [
                attempt for attempt in self.recovery_attempts.get(similar_id, [])
                if attempt.success
            ]

            if successful_recoveries:
                suggestions.append(
                    f"유사 에러는 '{successful_recoveries[0].strategy.value}' 전략으로 해결되었습니다"
                )

        return {
            "error_id": error_id,
            "suggestions": suggestions[:5],  # 상위 5개
            "similar_errors_found": len(similar_errors),
            "documentation_links": self._get_documentation_links(analysis) if analysis else []
        }

    # ==================== Helper Methods ====================

    def _classify_error(self, error_report: ErrorReport) -> ErrorCategory:
        """에러 분류"""
        error_type = error_report.error_type.lower()
        error_message = error_report.error_message.lower()

        if any(keyword in error_type or keyword in error_message for keyword in [
            "connection", "timeout", "socket", "network"
        ]):
            return ErrorCategory.NETWORK

        elif any(keyword in error_type or keyword in error_message for keyword in [
            "database", "sql", "query", "transaction"
        ]):
            return ErrorCategory.DATABASE

        elif any(keyword in error_type or keyword in error_message for keyword in [
            "api", "http", "request", "response"
        ]):
            return ErrorCategory.API

        elif any(keyword in error_type or keyword in error_message for keyword in [
            "validation", "invalid", "required", "format"
        ]):
            return ErrorCategory.VALIDATION

        elif any(keyword in error_type or keyword in error_message for keyword in [
            "auth", "token", "permission", "credential"
        ]):
            return ErrorCategory.AUTHENTICATION

        elif any(keyword in error_type or keyword in error_message for keyword in [
            "memory", "disk", "cpu", "resource"
        ]):
            return ErrorCategory.SYSTEM

        else:
            return ErrorCategory.UNKNOWN

    def _assess_severity(
        self,
        error_report: ErrorReport,
        category: ErrorCategory
    ) -> ErrorSeverity:
        """심각도 평가"""
        # 카테고리별 기본 심각도
        category_severity = {
            ErrorCategory.SYSTEM: ErrorSeverity.CRITICAL,
            ErrorCategory.DATABASE: ErrorSeverity.HIGH,
            ErrorCategory.NETWORK: ErrorSeverity.MEDIUM,
            ErrorCategory.API: ErrorSeverity.MEDIUM,
            ErrorCategory.VALIDATION: ErrorSeverity.LOW,
            ErrorCategory.AUTHENTICATION: ErrorSeverity.HIGH,
            ErrorCategory.AUTHORIZATION: ErrorSeverity.MEDIUM,
            ErrorCategory.BUSINESS_LOGIC: ErrorSeverity.MEDIUM,
            ErrorCategory.UNKNOWN: ErrorSeverity.WARNING
        }

        severity = category_severity.get(category, ErrorSeverity.WARNING)

        # 영향받은 컴포넌트에 따라 심각도 조정
        if error_report.affected_component:
            critical_components = ["database", "auth", "payment"]
            if any(comp in error_report.affected_component.lower() for comp in critical_components):
                severity = ErrorSeverity.CRITICAL

        return severity

    def _analyze_root_cause(self, error_report: ErrorReport) -> str:
        """근본 원인 분석"""
        # Mock 구현 (실제로는 더 복잡한 분석)
        if "timeout" in error_report.error_message.lower():
            return "작업 처리 시간 초과"
        elif "connection" in error_report.error_message.lower():
            return "연결 실패"
        elif "not found" in error_report.error_message.lower():
            return "리소스를 찾을 수 없음"
        elif "permission" in error_report.error_message.lower():
            return "권한 부족"
        else:
            return "원인 분석 필요"

    def _assess_impact(self, error_report: ErrorReport, severity: ErrorSeverity) -> str:
        """영향도 평가"""
        impact_map = {
            ErrorSeverity.CRITICAL: "전체 시스템 중단 가능",
            ErrorSeverity.HIGH: "주요 기능 장애",
            ErrorSeverity.MEDIUM: "일부 기능 제한",
            ErrorSeverity.LOW: "사용자 경험 저하",
            ErrorSeverity.WARNING: "최소 영향"
        }

        return impact_map.get(severity, "영향도 미상")

    def _recommend_action(
        self,
        category: ErrorCategory,
        severity: ErrorSeverity
    ) -> RecoveryStrategy:
        """권장 조치 결정"""
        if severity == ErrorSeverity.CRITICAL:
            return RecoveryStrategy.ESCALATE

        if category in [ErrorCategory.NETWORK, ErrorCategory.API]:
            return RecoveryStrategy.RETRY

        if category == ErrorCategory.DATABASE:
            if severity == ErrorSeverity.HIGH:
                return RecoveryStrategy.ESCALATE
            else:
                return RecoveryStrategy.RETRY

        if category == ErrorCategory.VALIDATION:
            return RecoveryStrategy.NOTIFY

        return RecoveryStrategy.MANUAL

    async def _attempt_recovery(
        self,
        error_report: ErrorReport,
        analysis: ErrorAnalysis
    ) -> Dict[str, Any]:
        """복구 시도"""
        attempt_id = f"recovery_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        attempt = RecoveryAttempt(
            attempt_id=attempt_id,
            error_id=error_report.error_id,
            strategy=analysis.recommended_action,
            started_at=datetime.now(),
            success=False
        )

        try:
            if analysis.recommended_action == RecoveryStrategy.RETRY:
                # 재시도
                result = await self._retry_operation({
                    "operation": "mock_operation",
                    "retry_config": self.retry_config.dict()
                })
                attempt.success = result["success"]

            elif analysis.recommended_action == RecoveryStrategy.FALLBACK:
                # 폴백 로직
                attempt.success = True
                attempt.details = {"fallback": "used_default_value"}

            attempt.completed_at = datetime.now()

        except Exception as e:
            attempt.success = False
            attempt.details = {"error": str(e)}
            attempt.completed_at = datetime.now()

        self.recovery_attempts[error_report.error_id].append(attempt)

        return attempt.dict()

    async def _send_notification(
        self,
        error_report: ErrorReport,
        analysis: Dict[str, Any]
    ):
        """알림 전송"""
        notification = {
            "type": "error_alert",
            "severity": analysis["severity"],
            "error_id": error_report.error_id,
            "message": error_report.error_message,
            "timestamp": datetime.now().isoformat()
        }

        self.notification_queue.append(notification)
        logger.critical(f"Critical error: {error_report.error_id}")

    def _find_similar_errors(self, error_report: ErrorReport) -> List[str]:
        """유사 에러 찾기"""
        similar = []

        for error_id, stored_error in self.error_history.items():
            if error_id == error_report.error_id:
                continue

            # 에러 타입이 같고 메시지가 유사하면
            if stored_error.error_type == error_report.error_type:
                similar.append(error_id)

        return similar[:5]  # 상위 5개

    def _get_documentation_links(self, analysis: Optional[ErrorAnalysis]) -> List[str]:
        """문서 링크 조회"""
        if not analysis:
            return []

        # Mock 문서 링크
        links = [
            f"https://docs.sparklio.ai/errors/{analysis.category.value}",
            f"https://docs.sparklio.ai/troubleshooting/{analysis.error_id}"
        ]

        return links

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "error_categories": [cat.value for cat in ErrorCategory],
            "severity_levels": [sev.value for sev in ErrorSeverity],
            "recovery_strategies": [strategy.value for strategy in RecoveryStrategy],
            "features": {
                "error_classification": True,
                "severity_assessment": True,
                "automatic_recovery": True,
                "retry_with_backoff": True,
                "pattern_learning": True,
                "notification_system": True,
                "root_cause_analysis": True
            },
            "stats": {
                "total_errors": len(self.error_history),
                "total_patterns": len(self.error_patterns),
                "recovery_attempts": sum(len(a) for a in self.recovery_attempts.values()),
                "notifications_sent": len(self.notification_queue)
            },
            "retry_config": self.retry_config.dict()
        }

# ==================== Factory Function ====================

def create_error_handler_agent(llm_service: Optional[LLMService] = None) -> ErrorHandlerAgent:
    """ErrorHandlerAgent 인스턴스 생성"""
    return ErrorHandlerAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_error_handler_agent():
        # 에이전트 생성
        agent = create_error_handler_agent()

        # 1. 에러 처리
        error_request = AgentRequest(
            task="handle_error",
            payload={
                "error_id": "err_001",
                "timestamp": datetime.now(),
                "error_type": "ConnectionError",
                "error_message": "Database connection timeout after 30 seconds",
                "stacktrace": "...",
                "context": {"database": "postgresql", "host": "localhost"},
                "affected_component": "database"
            }
        )

        result = await agent.execute(error_request)
        print(f"에러 처리: {result.status}")
        if result.status == "success":
            print(f"  - 분석 완료: {result.result['handled']}")
            print(f"  - 심각도: {result.result['analysis']['severity']}")
            print(f"  - 카테고리: {result.result['analysis']['category']}")
            print(f"  - 권장 조치: {result.result['analysis']['recommended_action']}")

        # 2. 재시도
        retry_request = AgentRequest(
            task="retry_operation",
            payload={
                "operation": "connect_to_database",
                "retry_config": {
                    "max_attempts": 3,
                    "initial_delay": 1.0,
                    "backoff_multiplier": 2.0
                }
            }
        )

        result = await agent.execute(retry_request)
        print(f"\n재시도 결과: {result.status}")
        if result.status == "success":
            print(f"  - 성공 여부: {result.result['success']}")
            print(f"  - 시도 횟수: {result.result['attempts']}")

        # 3. 에러 요약
        summary_request = AgentRequest(
            task="get_error_summary",
            payload={"time_range": 60}  # 최근 60분
        )

        result = await agent.execute(summary_request)
        print(f"\n에러 요약: {result.status}")
        if result.status == "success":
            print(f"  - 총 에러: {result.result['total_errors']}")
            print(f"  - 복구율: {result.result['recovery_rate']:.1%}")
            print(f"  - 심각도별: {result.result['by_severity']}")

        # 4. 수정 방법 제안
        suggest_request = AgentRequest(
            task="suggest_fix",
            payload={"error_id": "err_001"}
        )

        result = await agent.execute(suggest_request)
        print(f"\n수정 방법 제안: {result.status}")
        if result.status == "success":
            print(f"  - 제안 수: {len(result.result['suggestions'])}")
            for i, suggestion in enumerate(result.result['suggestions'], 1):
                print(f"    {i}. {suggestion}")

    # 테스트 실행
    asyncio.run(test_error_handler_agent())
