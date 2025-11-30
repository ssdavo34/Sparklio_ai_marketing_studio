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
    # Brand Kit 전용 정제 액션
    REMOVE_NAVIGATION = "remove_navigation"
    REMOVE_CATALOG_BLOCKS = "remove_catalog_blocks"
    REMOVE_FORMS = "remove_forms"
    REMOVE_FOOTER = "remove_footer"
    NORMALIZE_HASHTAGS = "normalize_hashtags"
    DEDUPLICATE_PARAGRAPHS = "deduplicate_paragraphs"
    EXTRACT_BRAND_CONTENT = "extract_brand_content"


class CleaningProfile(str, Enum):
    """정제 프로필 (도메인별 기본 액션 세트)"""
    DEFAULT = "default"
    BRAND_KIT = "brand_kit"  # 브랜드 분석용
    PRODUCT_CATALOG = "product_catalog"  # 상품 카탈로그용
    NEWS_ARTICLE = "news_article"  # 뉴스/기사용


# 프로필별 기본 액션 세트
PROFILE_ACTIONS = {
    CleaningProfile.DEFAULT: [
        "trim_spaces",
        "remove_duplicates",
        "standardize_format"
    ],
    CleaningProfile.BRAND_KIT: [
        "trim_spaces",
        "remove_navigation",
        "remove_catalog_blocks",
        "remove_forms",
        "remove_footer",
        "normalize_hashtags",
        "deduplicate_paragraphs",
        "extract_brand_content"
    ],
    CleaningProfile.PRODUCT_CATALOG: [
        "trim_spaces",
        "remove_navigation",
        "remove_forms",
        "standardize_format"
    ],
    CleaningProfile.NEWS_ARTICLE: [
        "trim_spaces",
        "remove_navigation",
        "remove_forms",
        "remove_footer"
    ]
}


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
                - data: 정제할 데이터
                - schema: 데이터 스키마 (선택)
                - actions: 정제 액션 리스트 (선택)
                - profile: 정제 프로필 (선택, brand_kit/product_catalog/news_article)

        Returns:
            정제된 데이터
        """
        data = payload["data"]
        schema = payload.get("schema", {})

        # 프로필이 있으면 프로필의 기본 액션 사용
        profile = payload.get("profile")
        if profile and profile in [p.value for p in CleaningProfile]:
            actions = PROFILE_ACTIONS.get(CleaningProfile(profile), ["trim_spaces"])
        else:
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

            # ============================================
            # Brand Kit 전용 정제 액션
            # ============================================
            elif action == "remove_navigation":
                cleaned_data = self._remove_navigation(cleaned_data)
                actions_performed.append("네비게이션/메뉴 제거")

            elif action == "remove_catalog_blocks":
                cleaned_data = self._remove_catalog_blocks(cleaned_data)
                actions_performed.append("카탈로그/상품목록 제거")

            elif action == "remove_forms":
                cleaned_data = self._remove_forms(cleaned_data)
                actions_performed.append("폼/입력 영역 제거")

            elif action == "remove_footer":
                cleaned_data = self._remove_footer(cleaned_data)
                actions_performed.append("푸터/저작권 정보 제거")

            elif action == "normalize_hashtags":
                cleaned_data = self._normalize_hashtags(cleaned_data)
                actions_performed.append("해시태그 정규화")

            elif action == "deduplicate_paragraphs":
                cleaned_data = self._deduplicate_paragraphs(cleaned_data)
                actions_performed.append("중복 문단 제거")

            elif action == "extract_brand_content":
                cleaned_data = self._extract_brand_content(cleaned_data)
                actions_performed.append("브랜드 관련 콘텐츠 추출")

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

    # ========================================================================
    # Brand Kit 전용 정제 메서드 (V2 - 마로솔 골든샘플 기준 대폭 강화)
    # ========================================================================

    def _remove_navigation(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        네비게이션/메뉴 블럭 제거 (V2 강화)

        - "카테고리별 스토어 바로가기" ~ 카테고리 목록 전체 블록 제거
        - "메뉴 바로가기", "카테고리 이동" 등 네비게이션 텍스트 제거
        - "Home > Category > Page" 형태의 브레드크럼 제거
        """
        cleaned = []
        for record in data:
            cleaned_record = record.copy()
            for field, value in record.items():
                if isinstance(value, str):
                    text = value
                    lines = text.split('\n')
                    filtered_lines = []
                    skip_until_empty = False

                    for line in lines:
                        stripped = line.strip()

                        # "카테고리별 스토어 바로가기" 시작하면 빈 줄 나올 때까지 스킵
                        if re.search(r'카테고리별\s*(스토어)?\s*바로\s*가기', stripped, re.IGNORECASE):
                            skip_until_empty = True
                            continue

                        # 빈 줄이면 스킵 모드 해제
                        if not stripped:
                            skip_until_empty = False
                            filtered_lines.append(line)
                            continue

                        if skip_until_empty:
                            continue

                        # 카테고리 나열 패턴 (로봇, 제품 등 여러 항목 나열)
                        # "휴머노이드 산업용로봇 협동로봇 청소로봇 물류로봇" 같은 패턴
                        category_keywords = ['로봇', '주변기기', '그리퍼', '센서', '솔루션', '서비스']
                        keyword_count = sum(1 for kw in category_keywords if kw in stripped)
                        if keyword_count >= 3 and len(stripped) < 200:
                            continue

                        # 네비게이션 패턴
                        nav_patterns = [
                            r'^메뉴\s*바로\s*가기',
                            r'^전체\s*메뉴',
                            r'^카테고리\s*(바로\s*)?가기',
                            r'^사이트맵',
                            r'^바로가기\s*메뉴',
                            r'^Skip\s+to\s+content',
                            r'^Skip\s+navigation',
                            r'^Main\s+Menu',
                            r'^Navigation',
                            # 브레드크럼 패턴
                            r'^Home\s*[>»›]',
                            r'^홈\s*[>»›]',
                            # 일반적인 네비게이션 링크 목록
                            r'^(로그인|회원가입|마이페이지|장바구니|검색)(\s*[|/·]\s*(로그인|회원가입|마이페이지|장바구니|검색))+',
                        ]

                        is_nav = False
                        for pattern in nav_patterns:
                            if re.search(pattern, stripped, re.IGNORECASE):
                                is_nav = True
                                break

                        if not is_nav:
                            filtered_lines.append(line)

                    cleaned_record[field] = '\n'.join(filtered_lines)
            cleaned.append(cleaned_record)
        return cleaned

    def _remove_catalog_blocks(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        카탈로그/상품 목록 블럭 제거 (V2 강화)

        마로솔 골든샘플 기준:
        - "#청소 로봇 > 인기 추천" ~ "더보기" 블록 전체 제거
        - "[업계 최저가] 상품명 ... 견적문의 0 점" 라인 제거
        - 가격이 포함된 카탈로그 라인 제거
        - "장바구니", "구매하기", "견적문의" 등 쇼핑 버튼 라인 제거
        """
        cleaned = []
        for record in data:
            cleaned_record = record.copy()
            for field, value in record.items():
                if isinstance(value, str):
                    text = value
                    lines = text.split('\n')
                    filtered_lines = []
                    skip_until_more = False  # "#카테고리 > 인기 추천" 블록 스킵

                    for line in lines:
                        stripped = line.strip()

                        # "#청소 로봇 > 인기 추천", "#산업용 로봇 > 인기 추천" 등 시작
                        if re.search(r'^#.+>\s*(인기|추천|베스트|신상품)', stripped):
                            skip_until_more = True
                            continue

                        # "더보기"가 나오면 블록 끝
                        if skip_until_more and re.search(r'^더\s*보기$', stripped, re.IGNORECASE):
                            skip_until_more = False
                            continue

                        if skip_until_more:
                            continue

                        # === 개별 라인 필터링 ===

                        # 1. 가격 패턴이 있는 라인 (25,000,000 원, 월 200만원 등)
                        price_patterns = [
                            r'\d{1,3}(,\d{3})+\s*원',  # 25,000,000 원
                            r'월\s*\d+만?\s*원',  # 월 200만원
                            r'₩\s*\d{1,3}(,\d{3})+',  # ₩25,000,000
                            r'\[\s*업계\s*최저가\s*\]',  # [업계 최저가]
                        ]
                        has_price = any(re.search(p, stripped) for p in price_patterns)

                        # 2. 카탈로그 키워드 조합 (견적문의 + 리스 + 렌탈 + 0 점 등)
                        catalog_keywords = ['견적문의', '리스', '렌탈', '할부', '0 점', '0점',
                                          '장바구니', '구매하기', '찜하기', '품절', '재고']
                        catalog_count = sum(1 for kw in catalog_keywords if kw in stripped)

                        # 3. 상품명 + 가격 + 견적 형태 (전형적인 카탈로그 라인)
                        is_catalog_line = (has_price and catalog_count >= 1) or catalog_count >= 2

                        # 4. 짧은 반복 버튼 텍스트
                        button_patterns = [
                            r'^더\s*보기$',
                            r'^자세히\s*보기$',
                            r'^바로\s*가기$',
                            r'^상세\s*보기$',
                            r'^구매하기$',
                            r'^장바구니$',
                            r'^견적문의$',
                        ]
                        is_button = any(re.match(p, stripped, re.IGNORECASE) for p in button_patterns)

                        # 5. 평점/리뷰 패턴만 있는 라인
                        is_rating_only = re.match(r'^[\d.]+\s*(점|점수)?\s*(\(\d+\s*(개|건)?\s*(리뷰|후기)?\))?$', stripped)

                        # 6. "인기 추천", "베스트 상품" 등 섹션 헤더
                        section_headers = [
                            r'^(인기|추천|베스트|신상품|할인)\s*(상품|제품)?$',
                            r'^NEW\s*ARRIVAL',
                            r'^BEST\s*SELLER',
                            r'^HOT\s*DEAL',
                        ]
                        is_section_header = any(re.match(p, stripped, re.IGNORECASE) for p in section_headers)

                        # 필터링 적용
                        if not (is_catalog_line or is_button or is_rating_only or is_section_header):
                            filtered_lines.append(line)

                    cleaned_record[field] = '\n'.join(filtered_lines)
            cleaned.append(cleaned_record)
        return cleaned

    def _remove_forms(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        폼/입력 영역 관련 텍스트 제거 (V2 강화)

        마로솔 골든샘플 기준:
        - "뉴스레터 구독" ~ "제출" 블록 전체 제거
        - "개인정보 수집 및 이용" ~ "동의합니다" 블록 제거
        - 입력 필드 레이블 (소속, 이름, 연락처, 이메일 등) 제거
        """
        cleaned = []
        for record in data:
            cleaned_record = record.copy()
            for field, value in record.items():
                if isinstance(value, str):
                    text = value
                    lines = text.split('\n')
                    filtered_lines = []
                    skip_form_block = False

                    for line in lines:
                        stripped = line.strip()

                        # "뉴스레터 구독" 또는 "개인정보 수집" 시작하면 블록 스킵
                        if re.search(r'(뉴스레터\s*(구독|신청)|개인\s*정보\s*(수집|이용)|Subscribe)', stripped, re.IGNORECASE):
                            skip_form_block = True
                            continue

                        # "제출", "동의합니다" 등이 나오면 블록 끝
                        if skip_form_block and re.search(r'(제출|동의합니다|Submit|Send)', stripped, re.IGNORECASE):
                            skip_form_block = False
                            continue

                        if skip_form_block:
                            continue

                        # === 개별 라인 필터링 ===

                        # 1. 폼 입력 필드 레이블 (짧은 라인)
                        form_labels = [
                            r'^(이름|성명|소속|직책|부서|회사명?)[:：\*]?\s*$',
                            r'^(연락처|휴대폰|전화번호|핸드폰)[:：\*]?\s*$',
                            r'^(이메일|E-?mail)[:：\*]?\s*$',
                            r'^(주소|우편번호)[:：\*]?\s*$',
                            r'^(문의\s*내용|요청\s*사항|메시지)[:：\*]?\s*$',
                            r'^(필수|선택)\s*(입력|항목|동의)$',
                        ]
                        is_form_label = any(re.match(p, stripped, re.IGNORECASE) for p in form_labels)

                        # 2. 동의 관련 문구
                        consent_patterns = [
                            r'위\s*내용을?\s*확인',
                            r'동의합니다',
                            r'동의\s*여부',
                            r'개인\s*정보',
                            r'마케팅\s*(수신|정보)',
                            r'약관에?\s*동의',
                        ]
                        is_consent = any(re.search(p, stripped, re.IGNORECASE) for p in consent_patterns)

                        # 3. 짧은 제출 버튼
                        submit_buttons = [
                            r'^(제출|전송|보내기|등록|신청)(\s*하기)?$',
                            r'^Submit$',
                            r'^Send(\s+Message)?$',
                        ]
                        is_submit = any(re.match(p, stripped, re.IGNORECASE) for p in submit_buttons)

                        # 필터링 적용
                        if not (is_form_label or is_consent or is_submit):
                            filtered_lines.append(line)

                    cleaned_record[field] = '\n'.join(filtered_lines)
            cleaned.append(cleaned_record)
        return cleaned

    def _remove_footer(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        푸터/저작권 정보 제거

        - 저작권 표시 (© 2025 Company)
        - 사업자 정보 (사업자등록번호, 통신판매업)
        - SNS 링크 목록
        """
        footer_patterns = [
            # 저작권
            r'[©ⓒ]\s*\d{4}(\s*[-~]\s*\d{4})?\s*[A-Za-z가-힣\s]+\.?\s*(All\s*Rights?\s*Reserved\.?)?',
            r'Copyright\s*[©ⓒ]?\s*\d{4}',
            # 사업자 정보
            r'사업자\s*(등록\s*)?번호\s*[:：]?\s*\d{3}-\d{2}-\d{5}',
            r'통신\s*판매\s*(업)?\s*(신고\s*)?(번호)?[:：]?\s*제?\s*\d+',
            r'대표(\s*이사)?[:：]?\s*[가-힣]{2,4}',
            r'(주소|소재지)[:：]?\s*[가-힣\s\d\-]+[로길]\s*\d+',
            r'(전화|TEL|Tel)[:：]?\s*\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}',
            r'(팩스|FAX|Fax)[:：]?\s*\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}',
            # SNS 링크
            r'(Facebook|Instagram|Twitter|YouTube|LinkedIn|TikTok|Naver|Kakao)\s*[|/·]?',
            r'(페이스북|인스타그램|트위터|유튜브|링크드인|틱톡|네이버|카카오)\s*[|/·]?',
            # 기타 푸터 요소
            r'이용\s*약관',
            r'개인\s*정보\s*(처리|보호)\s*방침',
            r'쿠키\s*정책',
            r'사이트\s*맵',
        ]

        cleaned = []
        for record in data:
            cleaned_record = record.copy()
            for field, value in record.items():
                if isinstance(value, str):
                    text = value
                    for pattern in footer_patterns:
                        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.MULTILINE)
                    cleaned_record[field] = text
            cleaned.append(cleaned_record)
        return cleaned

    def _normalize_hashtags(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        해시태그 정규화

        - 연속된 해시태그를 키워드 리스트로 압축
        - 중복 해시태그 제거
        - 본문에서는 해시태그 최소화
        """
        cleaned = []
        for record in data:
            cleaned_record = record.copy()
            extracted_hashtags = set()

            for field, value in record.items():
                if isinstance(value, str):
                    # 해시태그 추출
                    hashtags = re.findall(r'#\s*([가-힣A-Za-z0-9_]+)', value)
                    extracted_hashtags.update(hashtags)

                    # 본문에서 해시태그 제거 (연속 해시태그 블럭)
                    # 예: "#마케팅 #브랜딩 #SNS #광고" -> 제거
                    text = re.sub(r'(#\s*[가-힣A-Za-z0-9_]+\s*){3,}', '', value)
                    cleaned_record[field] = text

            # 추출된 해시태그를 별도 필드로 저장
            if extracted_hashtags:
                cleaned_record['_extracted_keywords'] = list(extracted_hashtags)[:20]  # 최대 20개

            cleaned.append(cleaned_record)
        return cleaned

    def _deduplicate_paragraphs(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        중복 문단 제거

        - 동일하거나 유사한 문단이 반복되는 경우 제거
        - 짧은 반복 문구 제거 (예: "더보기", "자세히 보기")
        """
        cleaned = []
        for record in data:
            cleaned_record = record.copy()
            for field, value in record.items():
                if isinstance(value, str):
                    # 줄 단위로 분리
                    lines = value.split('\n')

                    # 중복 제거 (순서 유지)
                    seen = set()
                    unique_lines = []
                    for line in lines:
                        stripped = line.strip()
                        # 빈 줄이거나 너무 짧은 줄(5자 미만)은 중복 체크 제외
                        if len(stripped) < 5:
                            unique_lines.append(line)
                            continue

                        # 정규화된 형태로 중복 체크
                        normalized = re.sub(r'\s+', ' ', stripped.lower())
                        if normalized not in seen:
                            seen.add(normalized)
                            unique_lines.append(line)

                    # 짧은 반복 문구 제거
                    repeat_phrases = [
                        r'^더\s*보기$',
                        r'^자세히\s*보기$',
                        r'^더\s*알아보기$',
                        r'^View\s*More$',
                        r'^Read\s*More$',
                        r'^Learn\s*More$',
                        r'^See\s*More$',
                        r'^Click\s*Here$',
                    ]
                    filtered_lines = []
                    for line in unique_lines:
                        stripped = line.strip()
                        is_repeat = False
                        for pattern in repeat_phrases:
                            if re.match(pattern, stripped, re.IGNORECASE):
                                is_repeat = True
                                break
                        if not is_repeat:
                            filtered_lines.append(line)

                    cleaned_record[field] = '\n'.join(filtered_lines)
            cleaned.append(cleaned_record)
        return cleaned

    def _extract_brand_content(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        브랜드 관련 콘텐츠 추출 (V2 강화)

        마로솔 골든샘플 기준:
        - 케이스 스터디 / 적용 사례 (가중치 높음)
        - 서비스/제품 카테고리 설명
        - 브랜드 스토리, 회사 소개, 비전/미션
        - 고객 문제 해결 사례

        버려야 할 것:
        - 숫자(가격/수량) 비율 높은 문단
        - 너무 짧은 문단 (5단어 미만)
        """
        # 브랜드 관련 키워드 (가중치 높음)
        brand_keywords = [
            # 브랜드 아이덴티티
            r'브랜드\s*(스토리|철학|가치|약속|비전)',
            r'(비전|미션|핵심\s*가치|슬로건)',
            r'(회사|기업|브랜드)\s*(소개|철학|정신)',
            r'(창업|설립)\s*(이야기|스토리|정신)',
            r'(our|brand)\s*(story|vision|mission|values?)',
            # 차별점
            r'(차별화|차별점|특장점|강점)',
            r'(unique|different|special)',
            r'왜\s*(우리|저희)인가',
            r'why\s+(us|choose)',
            # 고객/타겟
            r'(고객|소비자).*?(위한|위해|생각)',
            r'(target|customer|audience)',
            # 품질/가치
            r'(품질|퀄리티|프리미엄)',
            r'(신뢰|믿음|정직|진정성)',
            r'(혁신|innovation|innovative)',
        ]

        # 케이스 스터디 / 적용 사례 키워드 (가중치 매우 높음)
        case_study_keywords = [
            r'(적용|도입)\s*(사례|현장|케이스)',
            r'(도입|적용|설치)\s*(완료|성공)',
            r'(문제|과제).*?(해결|솔루션)',
            r'(효과|성과|결과)',
            r'(자동화|효율화|절감)',
            r'(학교|병원|기업|공장|창고|시설).*?(도입|적용)',
            r'(청소|물류|제조|안내).*?(로봇|자동화)',
            r'인건비\s*(절감|절약)',
            r'(작업|업무)\s*효율',
            r'ROI|투자\s*대비',
        ]

        cleaned = []
        for record in data:
            cleaned_record = record.copy()
            for field, value in record.items():
                if isinstance(value, str) and field == 'text':
                    # 문단 단위로 분리 (빈 줄 또는 여러 줄바꿈)
                    paragraphs = re.split(r'\n\s*\n|\n{2,}', value)

                    # 각 문단의 브랜드 관련성 점수 계산
                    scored_paragraphs = []
                    for para in paragraphs:
                        para = para.strip()
                        if not para:
                            continue

                        score = 0

                        # 1. 케이스 스터디 키워드 (가중치 3점)
                        for keyword in case_study_keywords:
                            if re.search(keyword, para, re.IGNORECASE):
                                score += 3

                        # 2. 브랜드 키워드 (가중치 2점)
                        for keyword in brand_keywords:
                            if re.search(keyword, para, re.IGNORECASE):
                                score += 2

                        # 3. 문장 길이 가중치
                        word_count = len(para.split())
                        if 15 <= word_count <= 150:
                            score += 2  # 적당한 길이 보너스
                        elif 10 <= word_count < 15 or 150 < word_count <= 300:
                            score += 1
                        elif word_count < 5:
                            score -= 3  # 너무 짧으면 큰 감점

                        # 4. 숫자/기호 비율 (카탈로그 징후)
                        digit_count = len(re.findall(r'\d', para))
                        digit_ratio = digit_count / max(len(para), 1)
                        if digit_ratio > 0.15:
                            score -= 3  # 숫자 비율 높으면 큰 감점
                        elif digit_ratio > 0.1:
                            score -= 1

                        # 5. 가격/카탈로그 패턴이 있으면 강한 감점
                        catalog_signals = [
                            r'\d{1,3}(,\d{3})+\s*원',  # 가격
                            r'견적문의',
                            r'0\s*점',
                            r'리스|렌탈|할부',
                        ]
                        if any(re.search(p, para) for p in catalog_signals):
                            score -= 5

                        # 6. 특정 장소/기관 이름이 있으면 케이스 스터디 가능성 높음
                        institution_patterns = [
                            r'(초등학교|중학교|고등학교|대학교|대학)',
                            r'(과학관|박물관|도서관|체육관)',
                            r'(병원|의원|클리닉)',
                            r'(공장|창고|물류센터)',
                            r'(주식회사|㈜|Inc\.|Co\.|Ltd\.)',
                        ]
                        if any(re.search(p, para) for p in institution_patterns):
                            score += 2

                        scored_paragraphs.append((para, score))

                    # 점수 기준 정렬 (높은 순)
                    scored_paragraphs.sort(key=lambda x: x[1], reverse=True)

                    # 양성 점수 문단만 선택 (최소 300자 이상, 최대 5000자)
                    selected = []
                    total_chars = 0
                    max_chars = 5000

                    for para, score in scored_paragraphs:
                        if score >= 0 or total_chars < 300:
                            if total_chars + len(para) <= max_chars:
                                selected.append(para)
                                total_chars += len(para)

                    # 원래 순서대로 재정렬
                    paragraphs_clean = [p.strip() for p in paragraphs if p.strip()]
                    original_order = {para: i for i, para in enumerate(paragraphs_clean)}
                    selected.sort(key=lambda p: original_order.get(p, 999))

                    cleaned_record[field] = '\n\n'.join(selected)

            cleaned.append(cleaned_record)
        return cleaned

    # ========================================================================
    # Brand Kit 텍스트 정제 편의 메서드
    # ========================================================================

    def _normalize_line_breaks(self, text: str) -> str:
        """
        줄바꿈이 없는 텍스트에 논리적 줄바꿈 추가 (전처리)

        웹 크롤링 시 BeautifulSoup의 .get_text()가 모든 텍스트를
        공백으로 연결하는 경우가 있음. 이 경우 줄 기반 정제가
        작동하지 않으므로 먼저 논리적 줄바꿈을 삽입함.

        Args:
            text: 원본 텍스트 (줄바꿈이 없을 수 있음)

        Returns:
            줄바꿈이 삽입된 텍스트
        """
        # 이미 줄바꿈이 충분히 있으면 그대로 반환
        newline_count = text.count('\n')
        if newline_count > 10 or (newline_count > 0 and len(text) / max(newline_count, 1) < 200):
            return text

        logger.info(f"[DataCleaner] Normalizing line breaks (original newlines: {newline_count})")

        # 줄바꿈 삽입 패턴들 (순서 중요 - 먼저 블록 단위, 그 다음 개별 패턴)
        result = text

        # 1. 해시태그 섹션 앞에 줄바꿈 (예: #청소 로봇 > 인기 추천)
        result = re.sub(r'\s+(#[가-힣A-Za-z]+\s*[>»›])', r'\n\n\1', result)

        # 2. "더보기" 뒤에 줄바꿈
        result = re.sub(r'(더\s*보기)\s+', r'\1\n\n', result)

        # 3. 카테고리 나열 패턴 앞뒤에 줄바꿈
        # "카테고리별 스토어 바로가기" 앞에 줄바꿈
        result = re.sub(r'\s+(카테고리별\s*스토어?\s*바로\s*가기)', r'\n\n\1', result, flags=re.IGNORECASE)

        # 4. 가격 패턴 앞에 줄바꿈 (상품명과 가격 분리)
        # "[업계 최저가]" 앞에 줄바꿈
        result = re.sub(r'\s+(\[업계\s*최저가\])', r'\n\1', result)
        # "원 " 다음에 새로운 항목 시작 가능성
        result = re.sub(r'(\d{1,3}(,\d{3})+\s*원)\s+(?=[가-힣A-Za-z\[])', r'\1\n', result)

        # 5. 견적문의/장바구니 등 쇼핑 버튼 뒤에 줄바꿈
        result = re.sub(r'(견적문의|장바구니|구매하기)\s*(\d*\s*점)?\s+', r'\1\n', result)

        # 6. 폼 레이블 앞에 줄바꿈 (뉴스레터, 소속, 이름, 연락처 등)
        form_labels = r'뉴스레터\s*구독|개인\s*정보\s*수집|소속|이름|연락처|이메일|문의\s*내용'
        result = re.sub(rf'\s+({form_labels})', r'\n\1', result, flags=re.IGNORECASE)

        # 7. 섹션 헤더 앞에 줄바꿈 (대문자로 시작하는 영어 섹션)
        result = re.sub(r'\s+(WHY|ABOUT|SERVICE|PRODUCT|CONTACT|FAQ)', r'\n\n\1', result)

        # 8. 한국어 문장 끝 + 새로운 문장 시작 패턴
        # "다." 또는 "요." 다음에 한글이 오면 줄바꿈
        result = re.sub(r'([다요니까죠]\.)\s+(?=[가-힣])', r'\1\n', result)

        # 9. 연속된 짧은 항목들 분리 (로봇 종류 나열 등)
        # "휴머노이드 산업용로봇 협동로봇 청소로봇" 같은 패턴
        robot_types = r'휴머노이드|산업용\s*로봇|협동\s*로봇|청소\s*로봇|물류\s*로봇|서비스\s*로봇|교육용\s*로봇|ROS\s*지원'
        result = re.sub(rf'({robot_types})\s+(?={robot_types})', r'\1\n', result, flags=re.IGNORECASE)

        # 10. 저작권/사업자 정보 앞에 줄바꿈
        result = re.sub(r'\s+([©ⓒ]|사업자\s*등록\s*번호|통신\s*판매)', r'\n\n\1', result)

        # 11. 긴 연속 공백을 줄바꿈으로 변환 (3개 이상 연속 공백)
        result = re.sub(r'\s{3,}', '\n', result)

        # 12. 연속된 줄바꿈 정리 (3개 이상 -> 2개)
        result = re.sub(r'\n{3,}', '\n\n', result)

        logger.info(f"[DataCleaner] Line breaks normalized (new newlines: {result.count(chr(10))})")
        return result

    async def clean_brand_text(self, text: str) -> Dict[str, Any]:
        """
        브랜드킷용 텍스트 정제 편의 메서드

        Args:
            text: 정제할 원본 텍스트

        Returns:
            Dict with:
                - clean_text: 정제된 텍스트
                - extracted_keywords: 추출된 키워드
                - actions_performed: 수행된 작업 목록
                - quality_improvement: 품질 개선도

        Usage:
            cleaner = DataCleanerAgent()
            result = await cleaner.clean_brand_text(crawled_text)
            clean_text = result["clean_text"]
        """
        from .base import AgentRequest

        # 1. 텍스트 전처리 (줄바꿈 정규화)
        preprocessed_text = self._normalize_line_breaks(text)
        
        logger.info(f"[DataCleaner] Text normalization: {len(text)} -> {len(preprocessed_text)} chars")
        if len(text) != len(preprocessed_text):
            logger.info(f"[DataCleaner] Sample normalized: {preprocessed_text[:200]}...")

        response = await self.execute(AgentRequest(
            task="clean_data",
            payload={
                "data": [{"text": preprocessed_text}],
                "profile": "brand_kit"
            }
        ))

        # AgentResponse 구조에 맞게 수정
        if response and response.outputs:
            # 첫 번째 출력물에서 결과 추출
            result_data = response.outputs[0].value
            cleaned_data = result_data.get("cleaned_data", [])
            
            if cleaned_data:
                clean_text = cleaned_data[0].get("text", "")
                
                # 상세 로깅
                logger.info(f"[DataCleaner] Cleaning result: {len(preprocessed_text)} -> {len(clean_text)} chars")
                actions = result_data.get("actions_performed", [])
                logger.info(f"[DataCleaner] Actions performed: {actions}")
                
                return {
                    "clean_text": clean_text,
                    "extracted_keywords": result_data.get("extracted_keywords", []),
                    "actions_performed": actions,
                    "quality_improvement": response.meta.get("quality_improvement", 0)
                }
        
        # Fallback in case of failure or no cleaned data
        return {
            "clean_text": text, # Return original text if cleaning fails
            "extracted_keywords": [],
            "actions_performed": [],
            "quality_improvement": 0
        }


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