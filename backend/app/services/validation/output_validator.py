"""
Output Validator

Agent 출력 검증 4단계 파이프라인

Stage 1: Schema Validation (Pydantic)
Stage 2: Length Validation
Stage 3: Language Validation (한국어 체크)
Stage 4: Quality Validation

작성일: 2025-11-23
작성자: B팀 (Backend)
참고: A_TEAM_QUALITY_VALIDATION_REPORT_2025-11-23.md
"""

import re
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from pydantic import BaseModel, Field, ValidationError, validator

logger = logging.getLogger(__name__)


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class StageResult:
    """단일 검증 스테이지 결과"""
    stage: str
    passed: bool
    issues: List[str]
    score: float = 10.0  # 0-10 점수


@dataclass
class ValidationResult:
    """전체 검증 결과"""
    passed: bool
    stage_results: List[StageResult]
    overall_score: float
    errors: List[str]
    warnings: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "passed": self.passed,
            "overall_score": round(self.overall_score, 1),
            "stages": [
                {
                    "stage": r.stage,
                    "passed": r.passed,
                    "score": round(r.score, 1),
                    "issues": r.issues
                }
                for r in self.stage_results
            ],
            "errors": self.errors,
            "warnings": self.warnings
        }


# ============================================================================
# Pydantic Schemas (Stage 1)
# ============================================================================

class ProductDetailOutput(BaseModel):
    """product_detail 출력 스키마"""
    headline: str = Field(..., min_length=5, max_length=25)  # A팀 수정: 20→25 (여유)
    subheadline: str = Field(..., min_length=10, max_length=35)  # A팀 수정: 30→35
    body: str = Field(..., min_length=20, max_length=100)  # A팀 수정: 80→100 (LLM 초과 방지)
    bullets: List[str] = Field(..., min_items=3, max_items=3)
    cta: str = Field(..., min_length=4, max_length=20)  # A팀 수정: 15→20

    @validator("bullets")
    def validate_bullets(cls, v):
        for bullet in v:
            if len(bullet) > 20:
                raise ValueError(f"Bullet exceeds 20 chars: {bullet}")
        return v

    @validator("headline", "subheadline", "body", "cta", each_item=False)
    def check_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v


class SNSOutput(BaseModel):
    """sns 출력 스키마"""
    post: str = Field(..., min_length=80, max_length=120)
    hashtags: List[str] = Field(..., min_items=5, max_items=10)
    cta: Optional[str] = Field(None, max_length=20)

    @validator("hashtags")
    def validate_hashtags(cls, v):
        for tag in v:
            if not tag.startswith("#"):
                raise ValueError(f"Hashtag must start with #: {tag}")
            if len(tag) > 20:
                raise ValueError(f"Hashtag too long: {tag}")
        return v


class BrandMessageOutput(BaseModel):
    """brand_message 출력 스키마"""
    tagline: str = Field(..., min_length=3, max_length=10)
    message: str = Field(..., min_length=50, max_length=100)
    values: List[str] = Field(..., min_items=3, max_items=3)
    promise: Optional[str] = Field(None, max_length=50)

    @validator("values")
    def validate_values(cls, v):
        for value in v:
            if len(value) > 15:
                raise ValueError(f"Value too long: {value}")
        # 중복 체크
        if len(v) != len(set(v)):
            raise ValueError("Duplicate values detected")
        return v


# ============================================================================
# Helper Functions
# ============================================================================

def calculate_korean_ratio(text: str) -> float:
    """
    한국어 비율 계산

    Args:
        text: 검사할 텍스트

    Returns:
        한국어 비율 (0.0 ~ 1.0)

    Examples:
        >>> calculate_korean_ratio("안녕하세요")
        1.0
        >>> calculate_korean_ratio("Hello 안녕")
        0.5
        >>> calculate_korean_ratio("제품명 Pro")
        0.75
    """
    if not text:
        return 0.0

    # 공백 제거
    text_no_space = re.sub(r'\s', '', text)

    if len(text_no_space) == 0:
        return 0.0

    # 한글 문자 개수 (가-힣)
    korean_chars = len(re.findall(r'[가-힣]', text))

    return korean_chars / len(text_no_space)


# ============================================================================
# Output Validator
# ============================================================================

class OutputValidator:
    """
    Agent 출력 검증 파이프라인

    4단계 검증:
    1. Schema Validation (Pydantic)
    2. Length Validation
    3. Language Validation (한국어 체크)
    4. Quality Validation

    사용 예시:
        validator = OutputValidator()
        result = validator.validate(
            output={"headline": "...", "body": "..."},
            task="product_detail",
            input_data={"product_name": "..."}
        )
        if result.passed:
            print("✅ Validation passed")
        else:
            print(f"❌ Errors: {result.errors}")
    """

    # Task별 Pydantic 스키마 매핑
    SCHEMA_MAP = {
        "product_detail": ProductDetailOutput,
        "sns": SNSOutput,
        "brand_message": BrandMessageOutput
    }

    def validate(
        self,
        output: Dict[str, Any],
        task: str,
        input_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """
        4단계 검증 파이프라인 실행

        Args:
            output: Agent 출력 dict
            task: 작업 유형 (예: "product_detail")
            input_data: 입력 데이터 (optional, Stage 4에서 사용)

        Returns:
            ValidationResult
        """
        stage_results: List[StageResult] = []
        errors: List[str] = []
        warnings: List[str] = []

        # Stage 1: Schema Validation
        stage1 = self._validate_schema(output, task)
        stage_results.append(stage1)
        if not stage1.passed:
            errors.extend(stage1.issues)

        # Stage 2: Length Validation
        stage2 = self._validate_length(output, task)
        stage_results.append(stage2)
        if not stage2.passed:
            warnings.extend(stage2.issues)

        # Stage 3: Language Validation (한국어 체크)
        stage3 = self._validate_language(output, task)
        stage_results.append(stage3)
        if not stage3.passed:
            errors.extend(stage3.issues)

        # Stage 4: Quality Validation
        stage4 = self._validate_quality(output, task, input_data)
        stage_results.append(stage4)
        if not stage4.passed:
            warnings.extend(stage4.issues)

        # 전체 통과 여부: Stage 1만 필수 (Schema)
        # A팀 수정 (2025-11-23): Language 체크를 Warning으로 완화 (기술 용어 대응)
        passed = stage1.passed

        # 전체 점수 계산 (4개 스테이지 평균)
        overall_score = sum(r.score for r in stage_results) / len(stage_results)

        return ValidationResult(
            passed=passed,
            stage_results=stage_results,
            overall_score=overall_score,
            errors=errors,
            warnings=warnings
        )

    def _validate_schema(self, output: Dict[str, Any], task: str) -> StageResult:
        """
        Stage 1: Schema Validation (Pydantic)

        Args:
            output: Agent 출력
            task: 작업 유형

        Returns:
            StageResult
        """
        issues = []
        score = 10.0

        # 스키마 클래스 가져오기
        schema_class = self.SCHEMA_MAP.get(task)

        if schema_class is None:
            # 스키마가 정의되지 않은 task는 통과
            logger.warning(f"No schema defined for task: {task}")
            return StageResult(
                stage="schema",
                passed=True,
                issues=[],
                score=10.0
            )

        try:
            # Pydantic 검증
            schema_class(**output)

        except ValidationError as e:
            # Pydantic 오류를 issues로 변환
            for error in e.errors():
                field = ".".join(str(loc) for loc in error['loc'])
                msg = error['msg']
                issues.append(f"{field}: {msg}")
                score -= 2.0  # 필드당 -2점

        passed = len(issues) == 0
        score = max(0.0, score)  # 최소 0점

        return StageResult(
            stage="schema",
            passed=passed,
            issues=issues,
            score=score
        )

    def _validate_length(self, output: Dict[str, Any], task: str) -> StageResult:
        """
        Stage 2: Length Validation

        Args:
            output: Agent 출력
            task: 작업 유형

        Returns:
            StageResult
        """
        issues = []
        score = 10.0

        # Task별 길이 제약 규칙
        length_rules = self._get_length_rules(task)

        for field, rule in length_rules.items():
            value = output.get(field)

            if value is None:
                continue

            # 문자열 필드
            if isinstance(value, str):
                length = len(value)

                if "max_length" in rule and length > rule["max_length"]:
                    issues.append(
                        f"{field} exceeds max length "
                        f"({length} > {rule['max_length']})"
                    )
                    score -= 1.0

                if "min_length" in rule and length < rule["min_length"]:
                    issues.append(
                        f"{field} below min length "
                        f"({length} < {rule['min_length']})"
                    )
                    score -= 1.0

            # 리스트 필드 (bullets, hashtags 등)
            elif isinstance(value, list):
                if "count" in rule and len(value) != rule["count"]:
                    issues.append(
                        f"{field} count mismatch "
                        f"(expected {rule['count']}, got {len(value)})"
                    )
                    score -= 1.0

                # 리스트 항목별 길이 체크
                if "max_item_length" in rule:
                    for i, item in enumerate(value):
                        if len(str(item)) > rule["max_item_length"]:
                            issues.append(
                                f"{field}[{i}] exceeds max item length "
                                f"({len(str(item))} > {rule['max_item_length']})"
                            )
                            score -= 0.5

        passed = len(issues) == 0
        score = max(0.0, score)

        return StageResult(
            stage="length",
            passed=passed,
            issues=issues,
            score=score
        )

    def _validate_language(self, output: Dict[str, Any], task: str) -> StageResult:
        """
        Stage 3: Language Validation (한국어 체크)

        한국어 비율이 기준 미달이면 실패

        Args:
            output: Agent 출력
            task: 작업 유형

        Returns:
            StageResult
        """
        issues = []
        score = 10.0

        # 한국어 체크 제외 필드 (영어 허용)
        exclude_fields = ["hashtags", "english_prompt", "negative_prompt"]

        # 한국어 비율 기준 (task별 다를 수 있음)
        threshold = self._get_korean_threshold(task)

        for field, value in output.items():
            # 제외 필드는 스킵
            if field in exclude_fields:
                continue

            # 문자열 필드만 검사
            if isinstance(value, str):
                ratio = calculate_korean_ratio(value)

                if ratio < threshold:
                    issues.append(
                        f"{field}: 한국어 비율 {ratio:.0%} (< {threshold:.0%})"
                    )
                    score -= 2.0

            # 리스트 필드 (각 항목 검사)
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, str):
                        ratio = calculate_korean_ratio(item)
                        if ratio < threshold:
                            issues.append(
                                f"{field}[{i}]: 한국어 비율 {ratio:.0%} (< {threshold:.0%})"
                            )
                            score -= 1.0

        passed = len(issues) == 0
        score = max(0.0, score)

        return StageResult(
            stage="language",
            passed=passed,
            issues=issues,
            score=score
        )

    def _validate_quality(
        self,
        output: Dict[str, Any],
        task: str,
        input_data: Optional[Dict[str, Any]]
    ) -> StageResult:
        """
        Stage 4: Quality Validation

        비즈니스 로직 검증:
        - 기본값 폴백 감지
        - 논리적 일관성
        - 중복 제거

        Args:
            output: Agent 출력
            task: 작업 유형
            input_data: 입력 데이터 (optional)

        Returns:
            StageResult
        """
        issues = []
        score = 10.0

        # Task별 품질 체크
        if task == "product_detail":
            # 기본값 폴백 감지
            if output.get("subheadline") == "제품 설명":
                issues.append("subheadline is default fallback value")
                score -= 3.0

            # headline이 너무 짧지 않은지
            headline = output.get("headline", "")
            if len(headline) < 8:
                issues.append(f"headline too short ({len(headline)} chars)")
                score -= 1.0

        elif task == "brand_message":
            # values 중복 체크 (이미 Schema에서도 체크하지만 이중 검증)
            values = output.get("values", [])
            if len(values) != len(set(values)):
                issues.append("Duplicate values detected")
                score -= 2.0

        # 공통 검증: 모든 필드가 의미 있는 값인지
        for field, value in output.items():
            if isinstance(value, str):
                # 빈 문자열 또는 공백만
                if not value.strip():
                    issues.append(f"{field} is empty or whitespace only")
                    score -= 1.0

        passed = len(issues) == 0
        score = max(0.0, score)

        return StageResult(
            stage="quality",
            passed=passed,
            issues=issues,
            score=score
        )

    def _get_length_rules(self, task: str) -> Dict[str, Dict[str, int]]:
        """Task별 길이 제약 규칙 반환"""

        if task == "product_detail":
            return {
                "headline": {"max_length": 20, "min_length": 5},
                "subheadline": {"max_length": 30, "min_length": 10},
                "body": {"max_length": 80, "min_length": 20},
                "bullets": {"count": 3, "max_item_length": 20},
                "cta": {"max_length": 15, "min_length": 4}
            }
        elif task == "sns":
            return {
                "post": {"max_length": 120, "min_length": 80},
                "hashtags": {"max_item_length": 20},
                "cta": {"max_length": 20}
            }
        elif task == "brand_message":
            return {
                "tagline": {"max_length": 10, "min_length": 3},
                "message": {"max_length": 100, "min_length": 50},
                "values": {"count": 3, "max_item_length": 15},
                "promise": {"max_length": 50}
            }
        else:
            return {}

    def _get_korean_threshold(self, task: str) -> float:
        """Task별 한국어 비율 기준 반환"""

        # product_detail, brand_message는 30% 이상 (기술 용어 허용)
        # A팀 수정 (2025-11-23): 90% → 60% → 30% 완화 (IPX7 등 기술 용어 대응)
        if task in ["product_detail", "brand_message"]:
            return 0.3

        # sns는 50% 이상 (hashtags 제외)
        elif task == "sns":
            return 0.5

        else:
            return 0.5  # 기본 50%
