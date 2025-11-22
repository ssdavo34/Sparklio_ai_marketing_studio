"""
Logger Agent - 로깅 및 모니터링 에이전트

이 에이전트는 시스템의 모든 활동을 로깅하고 모니터링하며,
성능 지표를 추적합니다.

주요 기능:
1. 구조화된 로그 수집
2. 로그 레벨 관리
3. 성능 메트릭 추적
4. 로그 검색 및 필터링
5. 실시간 모니터링
6. 로그 분석 및 통계
"""

import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import asyncio
import logging
from collections import defaultdict, deque
import time

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class LogLevel(str, Enum):
    """로그 레벨"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class LogCategory(str, Enum):
    """로그 카테고리"""
    SYSTEM = "system"
    APPLICATION = "application"
    SECURITY = "security"
    PERFORMANCE = "performance"
    AUDIT = "audit"
    USER_ACTION = "user_action"

class MetricType(str, Enum):
    """메트릭 타입"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    TIMER = "timer"

# ==================== Input/Output Schemas ====================

class LogEntry(BaseModel):
    """로그 항목"""
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="타임스탬프")
    level: LogLevel = Field(..., description="로그 레벨")
    category: LogCategory = Field(default=LogCategory.APPLICATION, description="카테고리")
    message: str = Field(..., description="메시지")
    source: Optional[str] = Field(None, description="출처")
    user_id: Optional[str] = Field(None, description="사용자 ID")
    session_id: Optional[str] = Field(None, description="세션 ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="메타데이터")
    tags: Optional[List[str]] = Field(None, description="태그")

class MetricEntry(BaseModel):
    """메트릭 항목"""
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="타임스탬프")
    metric_name: str = Field(..., description="메트릭명")
    metric_type: MetricType = Field(..., description="메트릭 타입")
    value: float = Field(..., description="값")
    unit: Optional[str] = Field(None, description="단위")
    tags: Optional[Dict[str, str]] = Field(None, description="태그")

class LogQuery(BaseModel):
    """로그 쿼리"""
    level: Optional[LogLevel] = Field(None, description="로그 레벨 필터")
    category: Optional[LogCategory] = Field(None, description="카테고리 필터")
    source: Optional[str] = Field(None, description="출처 필터")
    time_range: Optional[Dict[str, datetime]] = Field(None, description="시간 범위")
    search_text: Optional[str] = Field(None, description="검색 텍스트")
    limit: int = Field(default=100, description="결과 제한")
    offset: int = Field(default=0, description="오프셋")

class LogStats(BaseModel):
    """로그 통계"""
    total_logs: int = Field(..., description="전체 로그 수")
    by_level: Dict[str, int] = Field(..., description="레벨별 집계")
    by_category: Dict[str, int] = Field(..., description="카테고리별 집계")
    by_source: Dict[str, int] = Field(..., description="출처별 집계")
    time_range: Dict[str, str] = Field(..., description="시간 범위")

class PerformanceMetrics(BaseModel):
    """성능 메트릭"""
    avg_response_time: float = Field(..., description="평균 응답 시간(ms)")
    p95_response_time: float = Field(..., description="95백분위 응답 시간(ms)")
    p99_response_time: float = Field(..., description="99백분위 응답 시간(ms)")
    requests_per_second: float = Field(..., description="초당 요청 수")
    error_rate: float = Field(..., description="에러율")
    active_sessions: int = Field(..., description="활성 세션 수")

class MonitoringAlert(BaseModel):
    """모니터링 알림"""
    alert_id: str = Field(..., description="알림 ID")
    severity: str = Field(..., description="심각도")
    condition: str = Field(..., description="조건")
    triggered_at: datetime = Field(..., description="발생 시간")
    metric_name: str = Field(..., description="메트릭명")
    current_value: float = Field(..., description="현재 값")
    threshold: float = Field(..., description="임계값")

# ==================== Main Agent Class ====================

class LoggerAgent(AgentBase):
    """로깅 및 모니터링 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            llm_gateway=llm_service
        )

        # 로그 저장소 (링 버퍼)
        self.log_buffer: deque = deque(maxlen=10000)

        # 메트릭 저장소
        self.metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))

        # 성능 추적
        self.response_times: deque = deque(maxlen=1000)
        self.request_count = 0
        self.error_count = 0

        # 알림 설정
        self.alert_rules: List[Dict[str, Any]] = []

        # 로그 레벨별 카운터
        self.level_counters = defaultdict(int)

        # 시작 시간
        self.start_time = datetime.now()

    @property
    def name(self) -> str:
        """Agent 이름 반환"""
        return "logger"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        from app.services.agents.base import AgentOutput

        try:
            task = request.task

            if task == "log":
                result = await self._log_entry(request.payload)
            elif task == "record_metric":
                result = await self._record_metric(request.payload)
            elif task == "query_logs":
                result = await self._query_logs(request.payload)
            elif task == "get_stats":
                result = await self._get_stats(request.payload)
            elif task == "get_performance":
                result = await self._get_performance_metrics(request.payload)
            elif task == "set_alert":
                result = await self._set_alert(request.payload)
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
                    "total_logs": len(self.log_buffer)
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
            logger.error(f"Logger agent error: {e}")
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

    async def _log_entry(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """로그 기록"""
        log_entry = LogEntry(**payload)

        # 로그 저장
        self.log_buffer.append(log_entry)

        # 레벨별 카운터 증가
        self.level_counters[log_entry.level.value] += 1

        # 파이썬 로거로도 기록
        python_logger = logging.getLogger(log_entry.source or "sparklio")

        log_method = {
            LogLevel.DEBUG: python_logger.debug,
            LogLevel.INFO: python_logger.info,
            LogLevel.WARNING: python_logger.warning,
            LogLevel.ERROR: python_logger.error,
            LogLevel.CRITICAL: python_logger.critical
        }.get(log_entry.level, python_logger.info)

        log_method(f"[{log_entry.category.value}] {log_entry.message}")

        # 알림 체크
        alerts = await self._check_alerts(log_entry)

        return {
            "logged": True,
            "timestamp": log_entry.timestamp.isoformat(),
            "level": log_entry.level.value,
            "alerts_triggered": len(alerts),
            "alerts": alerts
        }

    async def _record_metric(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """메트릭 기록"""
        metric = MetricEntry(**payload)

        # 메트릭 저장
        self.metrics[metric.metric_name].append(metric)

        # 특정 메트릭 추적
        if metric.metric_name == "response_time":
            self.response_times.append(metric.value)

        elif metric.metric_name == "request_count":
            self.request_count += int(metric.value)

        elif metric.metric_name == "error_count":
            self.error_count += int(metric.value)

        # 알림 체크
        alerts = await self._check_metric_alerts(metric)

        return {
            "recorded": True,
            "metric_name": metric.metric_name,
            "value": metric.value,
            "alerts_triggered": len(alerts)
        }

    async def _query_logs(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """로그 쿼리"""
        # time_range 문자열을 dict로 변환
        if "time_range" in payload and isinstance(payload["time_range"], str):
            time_str = payload["time_range"]
            payload = payload.copy()
            payload["time_range"] = self._parse_time_range(time_str)

        query = LogQuery(**payload)

        # 필터링
        filtered_logs = []

        for log in self.log_buffer:
            # 레벨 필터
            if query.level and log.level != query.level:
                continue

            # 카테고리 필터
            if query.category and log.category != query.category:
                continue

            # 출처 필터
            if query.source and log.source != query.source:
                continue

            # 시간 범위 필터
            if query.time_range:
                start = query.time_range.get("start")
                end = query.time_range.get("end")

                if start and log.timestamp < start:
                    continue
                if end and log.timestamp > end:
                    continue

            # 텍스트 검색
            if query.search_text and query.search_text.lower() not in log.message.lower():
                continue

            filtered_logs.append(log)

        # 페이징
        total = len(filtered_logs)
        filtered_logs = filtered_logs[query.offset:query.offset + query.limit]

        return {
            "logs": [log.dict() for log in filtered_logs],
            "total": total,
            "limit": query.limit,
            "offset": query.offset,
            "has_more": total > (query.offset + query.limit)
        }

    async def _get_stats(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """로그 통계"""
        time_range = payload.get("time_range", 60)  # 기본 60분

        # 문자열 형식 파싱 (예: "24h", "7d")
        if isinstance(time_range, str):
            parsed_range = self._parse_time_range(time_range)
            cutoff_time = parsed_range["start"]
        elif isinstance(time_range, int):
            cutoff_time = datetime.now() - timedelta(minutes=time_range)
        else:
            cutoff_time = datetime.now() - timedelta(minutes=60)

        # 시간 범위 내 로그 필터링
        recent_logs = [
            log for log in self.log_buffer
            if log.timestamp >= cutoff_time
        ]

        # 레벨별 집계
        by_level = defaultdict(int)
        for log in recent_logs:
            by_level[log.level.value] += 1

        # 카테고리별 집계
        by_category = defaultdict(int)
        for log in recent_logs:
            by_category[log.category.value] += 1

        # 출처별 집계
        by_source = defaultdict(int)
        for log in recent_logs:
            if log.source:
                by_source[log.source] += 1

        stats = LogStats(
            total_logs=len(recent_logs),
            by_level=dict(by_level),
            by_category=dict(by_category),
            by_source=dict(by_source),
            time_range={
                "start": cutoff_time.isoformat(),
                "end": datetime.now().isoformat()
            }
        ).dict()

        # Add aggregation/summary key for test compatibility
        stats["summary"] = f"{len(recent_logs)} logs in the time range"
        return stats

    async def _get_performance_metrics(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """성능 메트릭 조회"""
        if not self.response_times:
            # 기본값 반환
            return PerformanceMetrics(
                avg_response_time=0,
                p95_response_time=0,
                p99_response_time=0,
                requests_per_second=0,
                error_rate=0,
                active_sessions=0
            ).dict()

        # 응답 시간 통계
        response_times_list = sorted(list(self.response_times))
        avg_response_time = sum(response_times_list) / len(response_times_list)

        p95_index = int(len(response_times_list) * 0.95)
        p99_index = int(len(response_times_list) * 0.99)

        p95_response_time = response_times_list[p95_index] if p95_index < len(response_times_list) else response_times_list[-1]
        p99_response_time = response_times_list[p99_index] if p99_index < len(response_times_list) else response_times_list[-1]

        # 초당 요청 수
        uptime_seconds = (datetime.now() - self.start_time).total_seconds()
        requests_per_second = self.request_count / uptime_seconds if uptime_seconds > 0 else 0

        # 에러율
        error_rate = self.error_count / self.request_count if self.request_count > 0 else 0

        # 활성 세션 (Mock)
        active_sessions = len(set(log.session_id for log in self.log_buffer if log.session_id))

        return PerformanceMetrics(
            avg_response_time=avg_response_time,
            p95_response_time=p95_response_time,
            p99_response_time=p99_response_time,
            requests_per_second=requests_per_second,
            error_rate=error_rate,
            active_sessions=active_sessions
        ).dict()

    async def _set_alert(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """알림 설정"""
        alert_rule = {
            "metric_name": payload.get("metric_name"),
            "condition": payload.get("condition"),  # e.g., ">"
            "threshold": payload.get("threshold"),
            "severity": payload.get("severity", "warning"),
            "enabled": True
        }

        self.alert_rules.append(alert_rule)

        return {
            "alert_set": True,
            "rule": alert_rule,
            "total_rules": len(self.alert_rules)
        }

    def _parse_time_range(self, time_str: str) -> Dict[str, datetime]:
        """시간 범위 문자열 파싱 (예: "24h", "7d", "30m")"""
        import re
        match = re.match(r'(\d+)([hdm])', time_str.lower())
        if not match:
            return {"start": datetime.utcnow() - timedelta(hours=24), "end": datetime.utcnow()}

        value = int(match.group(1))
        unit = match.group(2)

        if unit == 'h':
            delta = timedelta(hours=value)
        elif unit == 'd':
            delta = timedelta(days=value)
        elif unit == 'm':
            delta = timedelta(minutes=value)
        else:
            delta = timedelta(hours=24)

        return {
            "start": datetime.utcnow() - delta,
            "end": datetime.utcnow()
        }

    async def _check_alerts(self, log_entry: LogEntry) -> List[Dict[str, Any]]:
        """로그 기반 알림 체크"""
        alerts = []

        # 에러 레벨 알림
        if log_entry.level in [LogLevel.ERROR, LogLevel.CRITICAL]:
            alerts.append({
                "type": "error_log",
                "severity": "high",
                "message": f"{log_entry.level.value} 로그 발생: {log_entry.message}",
                "timestamp": datetime.now().isoformat()
            })

        return alerts

    async def _check_metric_alerts(self, metric: MetricEntry) -> List[MonitoringAlert]:
        """메트릭 기반 알림 체크"""
        alerts = []

        for rule in self.alert_rules:
            if not rule.get("enabled"):
                continue

            if rule["metric_name"] != metric.metric_name:
                continue

            condition = rule["condition"]
            threshold = rule["threshold"]
            triggered = False

            if condition == ">" and metric.value > threshold:
                triggered = True
            elif condition == "<" and metric.value < threshold:
                triggered = True
            elif condition == "==" and metric.value == threshold:
                triggered = True
            elif condition == ">=" and metric.value >= threshold:
                triggered = True
            elif condition == "<=" and metric.value <= threshold:
                triggered = True

            if triggered:
                alert = MonitoringAlert(
                    alert_id=f"alert_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    severity=rule["severity"],
                    condition=f"{metric.metric_name} {condition} {threshold}",
                    triggered_at=datetime.now(),
                    metric_name=metric.metric_name,
                    current_value=metric.value,
                    threshold=threshold
                )
                alerts.append(alert)

        return alerts

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "log_levels": [level.value for level in LogLevel],
            "log_categories": [cat.value for cat in LogCategory],
            "metric_types": [mtype.value for mtype in MetricType],
            "features": {
                "structured_logging": True,
                "log_search": True,
                "metrics_collection": True,
                "performance_monitoring": True,
                "alerting": True,
                "real_time_monitoring": True,
                "log_aggregation": True,
                "statistics": True
            },
            "stats": {
                "total_logs": len(self.log_buffer),
                "buffer_size": self.log_buffer.maxlen,
                "unique_metrics": len(self.metrics),
                "alert_rules": len(self.alert_rules),
                "uptime_seconds": (datetime.now() - self.start_time).total_seconds()
            },
            "level_counters": dict(self.level_counters)
        }

# ==================== Factory Function ====================

def create_logger_agent(llm_service: Optional[LLMService] = None) -> LoggerAgent:
    """LoggerAgent 인스턴스 생성"""
    return LoggerAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_logger_agent():
        # 에이전트 생성
        agent = create_logger_agent()

        # 1. 로그 기록
        log_request = AgentRequest(
            task="log",
            payload={
                "timestamp": datetime.now(),
                "level": "info",
                "category": "application",
                "message": "사용자 로그인 성공",
                "source": "auth_service",
                "user_id": "user_001",
                "session_id": "session_123",
                "metadata": {"ip": "192.168.1.1"},
                "tags": ["auth", "success"]
            }
        )

        result = await agent.execute(log_request)
        print(f"로그 기록: {result.status}")
        if result.status == "success":
            print(f"  - 기록 시간: {result.result['timestamp']}")
            print(f"  - 레벨: {result.result['level']}")

        # 여러 로그 기록
        for i in range(10):
            await agent.execute(AgentRequest(
                task="log",
                payload={
                    "timestamp": datetime.now(),
                    "level": "info" if i % 3 != 0 else "warning",
                    "category": "performance",
                    "message": f"요청 처리 완료 #{i}",
                    "source": "api_service"
                }
            ))

        # 2. 메트릭 기록
        metric_request = AgentRequest(
            task="record_metric",
            payload={
                "timestamp": datetime.now(),
                "metric_name": "response_time",
                "metric_type": "gauge",
                "value": 150.5,
                "unit": "ms",
                "tags": {"endpoint": "/api/users"}
            }
        )

        result = await agent.execute(metric_request)
        print(f"\n메트릭 기록: {result.status}")
        if result.status == "success":
            print(f"  - 메트릭명: {result.result['metric_name']}")
            print(f"  - 값: {result.result['value']}")

        # 3. 로그 통계
        stats_request = AgentRequest(
            task="get_stats",
            payload={"time_range": 60}
        )

        result = await agent.execute(stats_request)
        print(f"\n로그 통계: {result.status}")
        if result.status == "success":
            print(f"  - 총 로그: {result.result['total_logs']}")
            print(f"  - 레벨별: {result.result['by_level']}")
            print(f"  - 카테고리별: {result.result['by_category']}")

        # 4. 로그 쿼리
        query_request = AgentRequest(
            task="query_logs",
            payload={
                "level": "warning",
                "limit": 5
            }
        )

        result = await agent.execute(query_request)
        print(f"\n로그 쿼리: {result.status}")
        if result.status == "success":
            print(f"  - 검색 결과: {len(result.result['logs'])}개")
            print(f"  - 전체: {result.result['total']}개")

        # 5. 알림 설정
        alert_request = AgentRequest(
            task="set_alert",
            payload={
                "metric_name": "response_time",
                "condition": ">",
                "threshold": 1000,
                "severity": "warning"
            }
        )

        result = await agent.execute(alert_request)
        print(f"\n알림 설정: {result.status}")
        if result.status == "success":
            print(f"  - 총 규칙: {result.result['total_rules']}")

        # 6. 성능 메트릭
        perf_request = AgentRequest(
            task="get_performance",
            payload={}
        )

        result = await agent.execute(perf_request)
        print(f"\n성능 메트릭: {result.status}")
        if result.status == "success":
            print(f"  - 평균 응답시간: {result.result['avg_response_time']:.2f}ms")
            print(f"  - P95: {result.result['p95_response_time']:.2f}ms")
            print(f"  - 에러율: {result.result['error_rate']:.2%}")

    # 테스트 실행
    asyncio.run(test_logger_agent())
