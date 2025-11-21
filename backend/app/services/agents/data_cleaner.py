"""
Data Cleaner Agent

데이터 정제 및 전처리 전문 Agent

작성일: 2025-11-21
작성자: B팀 (Backend)
문서: AGENT_EXPANSION_PLAN_2025-11-18.md (Phase 3, P1-B)

주요 기능:
1. 데이터 정제 (중복 제거, 오류 수정)
2. 형식 표준화 (날짜, 숫자, 텍스트)
3. 데이터 검증 (무결성, 일관성)
4. 이상치 탐지 및 처리
5. 데이터 보강 (누락값 처리)

KPI:
- 데이터 정확도: >95%
- 처리 속도: >1000 records/sec
- 오류 감지율: >90%
"""

import logging
import re
import json
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from enum import Enum
import hashlib
from collections import Counter
import statistics

from .base import AgentBase, AgentRequest, AgentResponse, AgentError

logger = logging.getLogger(__name__)


# ============================================================================
# Data Cleaning Schemas
# ============================================================================

class DataType(str, Enum):
    """데이터 타입"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    EMAIL = "email"
    PHONE = "phone"
    URL = "url"
    JSON = "json"
    CATEGORY = "category"


class CleaningAction(str, Enum):
    """정제 액션"""
    REMOVE_DUPLICATES = "remove_duplicates"
    FIX_TYPOS = "fix_typos"
    STANDARDIZE_FORMAT = "standardize_format"
    REMOVE_OUTLIERS = "remove_outliers"
    FILL_MISSING = "fill_missing"
    VALIDATE_DATA = "validate_data"
    NORMALIZE = "normalize"
    TRIM_SPACES = "trim_spaces"


class DataQualityMetrics(BaseModel):
    """데이터 품질 지표"""
    completeness: float = Field(..., ge=0, le=1, description="완전성 (0-1)")
    accuracy: float = Field(..., ge=0, le=1, description="정확도 (0-1)")
    consistency: float = Field(..., ge=0, le=1, description="일관성 (0-1)")
    validity: float = Field(..., ge=0, le=1, description="유효성 (0-1)")
    uniqueness: float = Field(..., ge=0, le=1, description="고유성 (0-1)")
    timeliness: float = Field(..., ge=0, le=1, description="적시성 (0-1)")

    @property
    def overall_score(self) -> float:
        """전체 품질 점수"""
        scores = [
            self.completeness,
            self.accuracy,
            self.consistency,
            self.validity,
            self.uniqueness,
            self.timeliness
        ]
        return sum(scores) / len(scores)


class DataIssue(BaseModel):
    """데이터 이슈"""
    issue_type: str = Field(..., description="이슈 타입")
    field: str = Field(..., description="필드명")
    severity: str = Field(..., description="심각도 (low/medium/high)")
    count: int = Field(..., description="발생 횟수")
    examples: List[Any] = Field(default_factory=list, description="예시")
    suggestion: str = Field(..., description="개선 제안")


class CleanedData(BaseModel):
    """정제된 데이터"""
    original_count: int = Field(..., description="원본 레코드 수")
    cleaned_count: int = Field(..., description="정제 후 레코드 수")
    removed_count: int = Field(..., description="제거된 레코드 수")

    # 정제 결과
    data: List[Dict[str, Any]] = Field(..., description="정제된 데이터")
    removed_data: List[Dict[str, Any]] = Field(default_factory=list, description="제거된 데이터")

    # 정제 상세
    actions_performed: List[str] = Field(..., description="수행된 정제 작업")
    issues_found: List[DataIssue] = Field(default_factory=list, description="발견된 이슈")

    # 품질 지표
    quality_before: DataQualityMetrics = Field(..., description="정제 전 품질")
    quality_after: DataQualityMetrics = Field(..., description="정제 후 품질")

    # 메타데이터
    processing_time: float = Field(..., description="처리 시간 (초)")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="처리 시간")


# ============================================================================
# Data Cleaner Agent
# ============================================================================

class DataCleanerAgent(AgentBase):
    """
    Data Cleaner Agent

    데이터를 정제하고 품질을 개선하는 Intelligence Agent

    주요 작업:
    1. clean_data: 데이터 정제
    2. validate_data: 데이터 검증
    3. detect_outliers: 이상치 탐지
    4. standardize_format: 형식 표준화
    5. assess_quality: 품질 평가

    사용 예시:
        agent = DataCleanerAgent()
        response = await agent.execute(AgentRequest(
            task="clean_data",
            payload={
                "data": [...],
                "schema": {...},
                "actions": ["remove_duplicates", "standardize_format"]
            }
        ))
    """

    @property
    def name(self) -> str:
        return "data_cleaner"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Data Cleaner Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 데이터 정제 결과

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)
            self._validate_cleaner_input(request.payload)

            logger.info(f"Data Cleaner Agent executing: task={request.task}")

            # 2. 작업별 처리
            if request.task == "clean_data":
                result = await self._clean_data(request.payload)
            elif request.task == "validate_data":
                result = await self._validate_data(request.payload)
            elif request.task == "detect_outliers":
                result = await self._detect_outliers(request.payload)
            elif request.task == "standardize_format":
                result = await self._standardize_format(request.payload)
            elif request.task == "assess_quality":
                result = await self._assess_quality(request.payload)
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
                "records_processed": result.get("original_count", 0),
                "records_cleaned": result.get("cleaned_count", 0),
                "elapsed_seconds": round(elapsed, 2)
            }

            # 5. 메타데이터
            meta = {
                "task": request.task,
                "actions": request.payload.get("actions", []),
                "quality_improvement": self._calculate_improvement(result)
            }

            logger.info(
                f"Data Cleaner Agent success: task={request.task}, "
                f"records={usage['records_processed']}, elapsed={elapsed:.2f}s"
            )

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=outputs,
                usage=usage,
                meta=meta
            )

        except Exception as e:
            logger.error(f"Data Cleaner Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Data cleaning failed: {str(e)}",
                agent=self.name,
                details={"task": request.task}
            )

    def _validate_cleaner_input(self, payload: Dict[str, Any]) -> None:
        """
        데이터 정제 입력 검증

        Args:
            payload: 입력 데이터

        Raises:
            AgentError: 필수 필드가 없을 때
        """
        if "data" not in payload:
            raise AgentError(
                message="'data' field is required",
                agent=self.name
            )

        data = payload["data"]
        if not isinstance(data, (list, dict)):
            raise AgentError(
                message="'data' must be a list or dict",
                agent=self.name
            )

    async def _clean_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        데이터 정제

        Args:
            payload: 입력 데이터

        Returns:
            정제된 데이터
        """
        data = payload["data"]
        schema = payload.get("schema", {})
        actions = payload.get("actions", ["remove_duplicates", "standardize_format"])

        # 리스트로 변환
        if isinstance(data, dict):
            data = [data]

        # 정제 전 품질 평가
        quality_before = self._assess_data_quality(data)

        # 정제 작업 수행
        cleaned_data = data.copy()
        removed_data = []
        actions_performed = []
        issues_found = []

        for action in actions:
            if action == "remove_duplicates":
                cleaned_data, removed = self._remove_duplicates(cleaned_data)
                removed_data.extend(removed)
                actions_performed.append("중복 제거")

            elif action == "standardize_format":
                cleaned_data = self._standardize_formats(cleaned_data, schema)
                actions_performed.append("형식 표준화")

            elif action == "fix_typos":
                cleaned_data = self._fix_typos(cleaned_data)
                actions_performed.append("오타 수정")

            elif action == "remove_outliers":
                cleaned_data, outliers = self._remove_outliers_from_data(cleaned_data)
                removed_data.extend(outliers)
                actions_performed.append("이상치 제거")

            elif action == "fill_missing":
                cleaned_data = self._fill_missing_values(cleaned_data, schema)
                actions_performed.append("누락값 처리")

            elif action == "trim_spaces":
                cleaned_data = self._trim_spaces(cleaned_data)
                actions_performed.append("공백 제거")

            elif action == "normalize":
                cleaned_data = self._normalize_data(cleaned_data)
                actions_performed.append("정규화")

        # 정제 후 품질 평가
        quality_after = self._assess_data_quality(cleaned_data)

        # 이슈 탐지
        issues_found = self._detect_issues(cleaned_data, schema)

        return {
            "original_count": len(data),
            "cleaned_count": len(cleaned_data),
            "removed_count": len(removed_data),
            "data": cleaned_data,
            "removed_data": removed_data[:10],  # 샘플만 포함
            "actions_performed": actions_performed,
            "issues_found": issues_found,
            "quality_before": quality_before,
            "quality_after": quality_after,
            "processing_time": 0.0  # Will be calculated
        }

    async def _validate_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        데이터 검증

        Args:
            payload: 입력 데이터

        Returns:
            검증 결과
        """
        data = payload["data"]
        schema = payload.get("schema", {})
        rules = payload.get("rules", {})

        if isinstance(data, dict):
            data = [data]

        validation_results = []
        valid_count = 0
        invalid_count = 0

        for idx, record in enumerate(data):
            result = self._validate_record(record, schema, rules)
            validation_results.append({
                "index": idx,
                "valid": result["valid"],
                "errors": result.get("errors", [])
            })

            if result["valid"]:
                valid_count += 1
            else:
                invalid_count += 1

        return {
            "total_records": len(data),
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "validation_rate": valid_count / len(data) if data else 0,
            "validation_results": validation_results[:100],  # 처음 100개만
            "common_errors": self._summarize_errors(validation_results)
        }

    async def _detect_outliers(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        이상치 탐지

        Args:
            payload: 입력 데이터

        Returns:
            이상치 탐지 결과
        """
        data = payload["data"]
        fields = payload.get("fields", [])
        method = payload.get("method", "iqr")  # iqr, zscore, isolation_forest

        if isinstance(data, dict):
            data = [data]

        outliers = []

        for field in fields:
            values = [
                record.get(field) for record in data
                if self._is_numeric(record.get(field))
            ]

            if not values:
                continue

            if method == "iqr":
                outlier_indices = self._detect_outliers_iqr(values)
            elif method == "zscore":
                outlier_indices = self._detect_outliers_zscore(values)
            else:
                outlier_indices = []

            for idx in outlier_indices:
                outliers.append({
                    "field": field,
                    "index": idx,
                    "value": values[idx],
                    "reason": f"Detected by {method} method"
                })

        return {
            "total_records": len(data),
            "outliers_found": len(outliers),
            "outlier_rate": len(outliers) / (len(data) * len(fields)) if data and fields else 0,
            "outliers": outliers[:100],  # 처음 100개만
            "method_used": method
        }

    async def _standardize_format(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        형식 표준화

        Args:
            payload: 입력 데이터

        Returns:
            표준화된 데이터
        """
        data = payload["data"]
        schema = payload.get("schema", {})

        if isinstance(data, dict):
            data = [data]

        standardized = []

        for record in data:
            std_record = {}

            for field, value in record.items():
                field_type = schema.get(field, {}).get("type", "text")

                if field_type == "date":
                    std_record[field] = self._standardize_date(value)
                elif field_type == "phone":
                    std_record[field] = self._standardize_phone(value)
                elif field_type == "email":
                    std_record[field] = self._standardize_email(value)
                elif field_type == "number":
                    std_record[field] = self._standardize_number(value)
                elif field_type == "text":
                    std_record[field] = self._standardize_text(value)
                else:
                    std_record[field] = value

            standardized.append(std_record)

        return {
            "original_count": len(data),
            "standardized_count": len(standardized),
            "data": standardized,
            "format_changes": self._count_format_changes(data, standardized)
        }

    async def _assess_quality(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        데이터 품질 평가

        Args:
            payload: 입력 데이터

        Returns:
            품질 평가 결과
        """
        data = payload["data"]
        schema = payload.get("schema", {})

        if isinstance(data, dict):
            data = [data]

        quality = self._assess_data_quality(data)
        issues = self._detect_issues(data, schema)

        return {
            "quality_metrics": quality,
            "overall_score": quality.overall_score,
            "issues_found": issues,
            "recommendations": self._generate_quality_recommendations(quality, issues),
            "data_profile": self._generate_data_profile(data)
        }

    def _remove_duplicates(
        self,
        data: List[Dict[str, Any]]
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """중복 제거"""
        seen = set()
        unique_data = []
        duplicates = []

        for record in data:
            # 레코드를 해시 가능한 형태로 변환
            record_hash = self._hash_record(record)

            if record_hash not in seen:
                seen.add(record_hash)
                unique_data.append(record)
            else:
                duplicates.append(record)

        return unique_data, duplicates

    def _hash_record(self, record: Dict[str, Any]) -> str:
        """레코드 해시 생성"""
        # JSON으로 직렬화하여 해시 생성
        json_str = json.dumps(record, sort_keys=True, default=str)
        return hashlib.md5(json_str.encode()).hexdigest()

    def _standardize_formats(
        self,
        data: List[Dict[str, Any]],
        schema: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """형식 표준화"""
        standardized = []

        for record in data:
            std_record = {}
            for field, value in record.items():
                if field in schema:
                    field_type = schema[field].get("type", "text")
                    std_record[field] = self._standardize_field(value, field_type)
                else:
                    std_record[field] = value

            standardized.append(std_record)

        return standardized

    def _standardize_field(self, value: Any, field_type: str) -> Any:
        """필드 표준화"""
        if value is None:
            return None

        if field_type == "text":
            return self._standardize_text(value)
        elif field_type == "date":
            return self._standardize_date(value)
        elif field_type == "phone":
            return self._standardize_phone(value)
        elif field_type == "email":
            return self._standardize_email(value)
        elif field_type == "number":
            return self._standardize_number(value)
        else:
            return value

    def _standardize_text(self, value: Any) -> str:
        """텍스트 표준화"""
        if value is None:
            return ""
        text = str(value).strip()
        # 여러 공백을 하나로
        text = re.sub(r'\s+', ' ', text)
        return text

    def _standardize_date(self, value: Any) -> str:
        """날짜 표준화 (YYYY-MM-DD)"""
        if value is None:
            return ""

        # 다양한 날짜 형식 처리
        date_formats = [
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%Y.%m.%d",
            "%d.%m.%Y"
        ]

        for fmt in date_formats:
            try:
                dt = datetime.strptime(str(value), fmt)
                return dt.strftime("%Y-%m-%d")
            except:
                continue

        return str(value)  # 변환 실패 시 원본 반환

    def _standardize_phone(self, value: Any) -> str:
        """전화번호 표준화"""
        if value is None:
            return ""

        phone = re.sub(r'[^0-9]', '', str(value))

        # 한국 전화번호 형식
        if phone.startswith("82"):
            phone = "0" + phone[2:]

        if len(phone) == 11 and phone.startswith("01"):
            return f"{phone[:3]}-{phone[3:7]}-{phone[7:]}"
        elif len(phone) == 10:
            if phone.startswith("02"):
                return f"{phone[:2]}-{phone[2:6]}-{phone[6:]}"
            else:
                return f"{phone[:3]}-{phone[3:6]}-{phone[6:]}"

        return phone

    def _standardize_email(self, value: Any) -> str:
        """이메일 표준화"""
        if value is None:
            return ""

        email = str(value).strip().lower()
        # 이메일 유효성 검사
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if re.match(email_pattern, email):
            return email
        return str(value)

    def _standardize_number(self, value: Any) -> float:
        """숫자 표준화"""
        if value is None:
            return 0.0

        try:
            # 쉼표 제거
            if isinstance(value, str):
                value = value.replace(',', '')
            return float(value)
        except:
            return 0.0

    def _fix_typos(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """오타 수정 (간단한 버전)"""
        # 일반적인 오타 패턴
        typo_fixes = {
            "teh": "the",
            "recieve": "receive",
            "occured": "occurred",
            "seperate": "separate",
            "definately": "definitely"
        }

        fixed_data = []

        for record in data:
            fixed_record = {}
            for field, value in record.items():
                if isinstance(value, str):
                    for typo, correct in typo_fixes.items():
                        value = re.sub(r'\b' + typo + r'\b', correct, value, flags=re.IGNORECASE)
                fixed_record[field] = value
            fixed_data.append(fixed_record)

        return fixed_data

    def _remove_outliers_from_data(
        self,
        data: List[Dict[str, Any]]
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """데이터에서 이상치 제거"""
        clean_data = []
        outliers = []

        # 숫자 필드 찾기
        numeric_fields = []
        if data:
            sample = data[0]
            for field, value in sample.items():
                if self._is_numeric(value):
                    numeric_fields.append(field)

        # 각 숫자 필드에 대해 이상치 탐지
        outlier_indices = set()

        for field in numeric_fields:
            values = [r.get(field) for r in data if self._is_numeric(r.get(field))]
            if values:
                field_outliers = self._detect_outliers_iqr(values)
                outlier_indices.update(field_outliers)

        # 이상치와 정상 데이터 분리
        for idx, record in enumerate(data):
            if idx in outlier_indices:
                outliers.append(record)
            else:
                clean_data.append(record)

        return clean_data, outliers

    def _is_numeric(self, value: Any) -> bool:
        """숫자인지 확인"""
        try:
            float(value)
            return True
        except:
            return False

    def _detect_outliers_iqr(self, values: List[float]) -> List[int]:
        """IQR 방법으로 이상치 탐지"""
        if len(values) < 4:
            return []

        sorted_values = sorted(values)
        q1_idx = len(sorted_values) // 4
        q3_idx = 3 * len(sorted_values) // 4

        q1 = sorted_values[q1_idx]
        q3 = sorted_values[q3_idx]
        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outliers = []
        for idx, value in enumerate(values):
            if value < lower_bound or value > upper_bound:
                outliers.append(idx)

        return outliers

    def _detect_outliers_zscore(self, values: List[float], threshold: float = 3) -> List[int]:
        """Z-score 방법으로 이상치 탐지"""
        if len(values) < 2:
            return []

        mean = statistics.mean(values)
        stdev = statistics.stdev(values)

        if stdev == 0:
            return []

        outliers = []
        for idx, value in enumerate(values):
            z_score = abs((value - mean) / stdev)
            if z_score > threshold:
                outliers.append(idx)

        return outliers

    def _fill_missing_values(
        self,
        data: List[Dict[str, Any]],
        schema: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """누락값 처리"""
        filled_data = []

        for record in data:
            filled_record = record.copy()

            for field, field_info in schema.items():
                if field not in filled_record or filled_record[field] is None:
                    # 기본값 사용
                    default_value = field_info.get("default")
                    if default_value is not None:
                        filled_record[field] = default_value
                    else:
                        # 타입별 기본값
                        field_type = field_info.get("type", "text")
                        if field_type == "text":
                            filled_record[field] = ""
                        elif field_type == "number":
                            filled_record[field] = 0
                        elif field_type == "date":
                            filled_record[field] = datetime.now().strftime("%Y-%m-%d")
                        else:
                            filled_record[field] = None

            filled_data.append(filled_record)

        return filled_data

    def _trim_spaces(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """공백 제거"""
        trimmed_data = []

        for record in data:
            trimmed_record = {}
            for field, value in record.items():
                if isinstance(value, str):
                    trimmed_record[field] = value.strip()
                else:
                    trimmed_record[field] = value
            trimmed_data.append(trimmed_record)

        return trimmed_data

    def _normalize_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """데이터 정규화"""
        normalized_data = []

        # 숫자 필드 찾기
        numeric_fields = []
        if data:
            sample = data[0]
            for field, value in sample.items():
                if self._is_numeric(value):
                    numeric_fields.append(field)

        # 각 필드의 min/max 계산
        field_stats = {}
        for field in numeric_fields:
            values = [
                float(r.get(field)) for r in data
                if self._is_numeric(r.get(field))
            ]
            if values:
                field_stats[field] = {
                    "min": min(values),
                    "max": max(values)
                }

        # 정규화
        for record in data:
            norm_record = record.copy()

            for field in numeric_fields:
                if field in field_stats and self._is_numeric(record.get(field)):
                    value = float(record[field])
                    min_val = field_stats[field]["min"]
                    max_val = field_stats[field]["max"]

                    if max_val > min_val:
                        norm_record[field] = (value - min_val) / (max_val - min_val)
                    else:
                        norm_record[field] = 0.5

            normalized_data.append(norm_record)

        return normalized_data

    def _validate_record(
        self,
        record: Dict[str, Any],
        schema: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> Dict[str, Any]:
        """레코드 검증"""
        errors = []

        for field, field_info in schema.items():
            value = record.get(field)

            # 필수 필드 체크
            if field_info.get("required") and value is None:
                errors.append(f"{field}: Required field is missing")

            # 타입 체크
            if value is not None:
                expected_type = field_info.get("type")
                if not self._check_type(value, expected_type):
                    errors.append(f"{field}: Type mismatch (expected {expected_type})")

            # 커스텀 규칙 체크
            if field in rules and value is not None:
                rule = rules[field]
                if not self._check_rule(value, rule):
                    errors.append(f"{field}: Failed custom validation rule")

        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

    def _check_type(self, value: Any, expected_type: str) -> bool:
        """타입 체크"""
        if expected_type == "text":
            return isinstance(value, str)
        elif expected_type == "number":
            return self._is_numeric(value)
        elif expected_type == "date":
            # 간단한 날짜 형식 체크
            try:
                datetime.strptime(str(value), "%Y-%m-%d")
                return True
            except:
                return False
        elif expected_type == "email":
            return re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', str(value)) is not None
        else:
            return True

    def _check_rule(self, value: Any, rule: Dict[str, Any]) -> bool:
        """커스텀 규칙 체크"""
        # 간단한 규칙 예시
        if "min" in rule and self._is_numeric(value):
            if float(value) < rule["min"]:
                return False

        if "max" in rule and self._is_numeric(value):
            if float(value) > rule["max"]:
                return False

        if "pattern" in rule and isinstance(value, str):
            if not re.match(rule["pattern"], value):
                return False

        return True

    def _assess_data_quality(self, data: List[Dict[str, Any]]) -> DataQualityMetrics:
        """데이터 품질 평가"""
        if not data:
            return DataQualityMetrics(
                completeness=0,
                accuracy=0,
                consistency=0,
                validity=0,
                uniqueness=0,
                timeliness=0
            )

        # 완전성 (null이 아닌 값의 비율)
        total_fields = sum(len(record) for record in data)
        non_null_fields = sum(
            1 for record in data
            for value in record.values()
            if value is not None and value != ""
        )
        completeness = non_null_fields / total_fields if total_fields > 0 else 0

        # 고유성 (중복이 없는 레코드의 비율)
        unique_hashes = set(self._hash_record(record) for record in data)
        uniqueness = len(unique_hashes) / len(data)

        # 일관성 (형식이 일정한 필드의 비율)
        consistency = self._assess_consistency(data)

        # 유효성 (기본 검증 통과 비율)
        validity = self._assess_validity(data)

        # 정확도와 적시성은 Mock 값
        accuracy = 0.9  # 실제로는 외부 데이터와 비교 필요
        timeliness = 0.85  # 실제로는 타임스탬프 분석 필요

        return DataQualityMetrics(
            completeness=completeness,
            accuracy=accuracy,
            consistency=consistency,
            validity=validity,
            uniqueness=uniqueness,
            timeliness=timeliness
        )

    def _assess_consistency(self, data: List[Dict[str, Any]]) -> float:
        """일관성 평가"""
        if not data:
            return 0

        # 각 필드의 값 형식 일관성 체크
        field_formats = {}

        for record in data:
            for field, value in record.items():
                if field not in field_formats:
                    field_formats[field] = []

                # 값의 형식 패턴 저장
                if value is not None:
                    if isinstance(value, str):
                        pattern = "string"
                    elif self._is_numeric(value):
                        pattern = "number"
                    else:
                        pattern = "other"

                    field_formats[field].append(pattern)

        # 각 필드별로 가장 많은 패턴의 비율 계산
        consistency_scores = []

        for field, patterns in field_formats.items():
            if patterns:
                pattern_counts = Counter(patterns)
                most_common_count = pattern_counts.most_common(1)[0][1]
                consistency_scores.append(most_common_count / len(patterns))

        return sum(consistency_scores) / len(consistency_scores) if consistency_scores else 0

    def _assess_validity(self, data: List[Dict[str, Any]]) -> float:
        """유효성 평가"""
        if not data:
            return 0

        valid_count = 0
        total_count = 0

        for record in data:
            for field, value in record.items():
                total_count += 1

                # 간단한 유효성 체크
                if value is not None:
                    if "@" in field and isinstance(value, str):
                        # 이메일 필드
                        if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
                            valid_count += 1
                    else:
                        # 기본적으로 유효
                        valid_count += 1

        return valid_count / total_count if total_count > 0 else 0

    def _detect_issues(
        self,
        data: List[Dict[str, Any]],
        schema: Dict[str, Any]
    ) -> List[DataIssue]:
        """데이터 이슈 탐지"""
        issues = []

        # 누락값 체크
        missing_counts = Counter()
        for record in data:
            for field in schema:
                if field not in record or record[field] is None:
                    missing_counts[field] += 1

        for field, count in missing_counts.items():
            if count > 0:
                issues.append(DataIssue(
                    issue_type="missing_value",
                    field=field,
                    severity="high" if count > len(data) * 0.5 else "medium",
                    count=count,
                    examples=[],
                    suggestion=f"Fill missing values for {field}"
                ))

        # 형식 불일치 체크
        format_issues = self._detect_format_issues(data, schema)
        issues.extend(format_issues)

        return issues

    def _detect_format_issues(
        self,
        data: List[Dict[str, Any]],
        schema: Dict[str, Any]
    ) -> List[DataIssue]:
        """형식 이슈 탐지"""
        issues = []

        for field, field_info in schema.items():
            expected_type = field_info.get("type")
            invalid_examples = []

            for record in data[:100]:  # 샘플링
                value = record.get(field)
                if value is not None and not self._check_type(value, expected_type):
                    invalid_examples.append(value)

            if invalid_examples:
                issues.append(DataIssue(
                    issue_type="format_mismatch",
                    field=field,
                    severity="medium",
                    count=len(invalid_examples),
                    examples=invalid_examples[:3],
                    suggestion=f"Standardize {field} to {expected_type} format"
                ))

        return issues

    def _summarize_errors(self, validation_results: List[Dict[str, Any]]) -> List[str]:
        """에러 요약"""
        error_counts = Counter()

        for result in validation_results:
            for error in result.get("errors", []):
                error_counts[error.split(":")[0]] += 1

        return [
            f"{field}: {count} errors"
            for field, count in error_counts.most_common(5)
        ]

    def _count_format_changes(
        self,
        original: List[Dict[str, Any]],
        standardized: List[Dict[str, Any]]
    ) -> int:
        """형식 변경 횟수 계산"""
        changes = 0

        for orig, std in zip(original, standardized):
            for field in orig:
                if field in std and orig[field] != std[field]:
                    changes += 1

        return changes

    def _generate_quality_recommendations(
        self,
        quality: DataQualityMetrics,
        issues: List[DataIssue]
    ) -> List[str]:
        """품질 개선 추천사항 생성"""
        recommendations = []

        if quality.completeness < 0.8:
            recommendations.append("누락된 데이터를 채워 완전성을 개선하세요")

        if quality.uniqueness < 0.9:
            recommendations.append("중복 레코드를 제거하여 고유성을 개선하세요")

        if quality.consistency < 0.85:
            recommendations.append("데이터 형식을 표준화하여 일관성을 개선하세요")

        if quality.validity < 0.9:
            recommendations.append("유효성 검증 규칙을 강화하세요")

        # 이슈 기반 추천
        for issue in issues[:3]:
            if issue.issue_type == "missing_value":
                recommendations.append(f"{issue.field} 필드의 누락값을 처리하세요")

        return recommendations

    def _generate_data_profile(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """데이터 프로파일 생성"""
        if not data:
            return {}

        profile = {
            "record_count": len(data),
            "field_count": len(data[0]) if data else 0,
            "fields": {}
        }

        # 각 필드별 프로파일
        if data:
            for field in data[0].keys():
                values = [record.get(field) for record in data]
                non_null_values = [v for v in values if v is not None]

                field_profile = {
                    "null_count": len(values) - len(non_null_values),
                    "null_rate": (len(values) - len(non_null_values)) / len(values),
                    "unique_count": len(set(non_null_values))
                }

                # 숫자 필드 통계
                numeric_values = [v for v in non_null_values if self._is_numeric(v)]
                if numeric_values:
                    field_profile.update({
                        "min": min(numeric_values),
                        "max": max(numeric_values),
                        "mean": statistics.mean(numeric_values)
                    })

                profile["fields"][field] = field_profile

        return profile

    def _calculate_improvement(self, result: Dict[str, Any]) -> float:
        """품질 개선도 계산"""
        if "quality_before" in result and "quality_after" in result:
            before = result["quality_before"].overall_score
            after = result["quality_after"].overall_score
            return (after - before) / before if before > 0 else 0

        return 0

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
            name="cleaned_data",
            value=result,
            meta={
                "task": task,
                "format": "data_cleaning_report",
                "records": result.get("cleaned_count", 0)
            }
        ))

        # 추천사항 (있는 경우)
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

def get_data_cleaner_agent(llm_gateway=None) -> DataCleanerAgent:
    """
    Data Cleaner Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        DataCleanerAgent 인스턴스
    """
    return DataCleanerAgent(llm_gateway=llm_gateway)