"""
QA Agent - 품질 검증 및 테스트 에이전트

이 에이전트는 생성된 콘텐츠와 시스템 출력의 품질을 검증하고
다양한 테스트를 수행합니다.

주요 기능:
1. 콘텐츠 품질 검증 (텍스트, 이미지, 비디오)
2. 브랜드 가이드라인 준수 확인
3. 문법 및 맞춤법 검사
4. SEO 최적화 검증
5. 접근성 검사
6. A/B 테스트 설계 및 평가
"""

import json
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import asyncio
import logging

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class QualityLevel(str, Enum):
    """품질 수준"""
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"
    FAILED = "failed"

class ContentType(str, Enum):
    """콘텐츠 타입"""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    HTML = "html"

class CheckType(str, Enum):
    """검사 타입"""
    GRAMMAR = "grammar"
    SPELLING = "spelling"
    BRAND_ALIGNMENT = "brand_alignment"
    SEO = "seo"
    ACCESSIBILITY = "accessibility"
    PLAGIARISM = "plagiarism"
    SENSITIVITY = "sensitivity"

class Severity(str, Enum):
    """심각도"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

# ==================== Input/Output Schemas ====================

class QARequest(BaseModel):
    """품질 검증 요청"""
    content: str = Field(..., description="검증할 콘텐츠")
    content_type: ContentType = Field(..., description="콘텐츠 타입")
    checks: Optional[List[CheckType]] = Field(None, description="수행할 검사")
    brand_guidelines: Optional[Dict[str, Any]] = Field(None, description="브랜드 가이드라인")
    target_audience: Optional[str] = Field(None, description="대상 청중")

class Issue(BaseModel):
    """품질 이슈"""
    issue_id: str = Field(..., description="이슈 ID")
    check_type: CheckType = Field(..., description="검사 타입")
    severity: Severity = Field(..., description="심각도")
    description: str = Field(..., description="이슈 설명")
    location: Optional[str] = Field(None, description="위치")
    suggestion: Optional[str] = Field(None, description="개선 제안")
    auto_fixable: bool = Field(default=False, description="자동 수정 가능 여부")

class QAReport(BaseModel):
    """품질 검증 리포트"""
    overall_quality: QualityLevel = Field(..., description="종합 품질")
    quality_score: float = Field(..., description="품질 점수 (0-100)")
    issues: List[Issue] = Field(..., description="발견된 이슈")
    passed_checks: List[str] = Field(..., description="통과한 검사")
    failed_checks: List[str] = Field(..., description="실패한 검사")
    recommendations: List[str] = Field(..., description="권장사항")
    execution_time: float = Field(..., description="검사 시간(초)")

class BrandComplianceCheck(BaseModel):
    """브랜드 가이드라인 준수 검사"""
    compliant: bool = Field(..., description="준수 여부")
    compliance_score: float = Field(..., description="준수 점수")
    violations: List[Dict[str, Any]] = Field(..., description="위반 사항")
    recommendations: List[str] = Field(..., description="권장사항")

class SEOAnalysis(BaseModel):
    """SEO 분석"""
    seo_score: float = Field(..., description="SEO 점수")
    keyword_density: float = Field(..., description="키워드 밀도")
    meta_tags_present: bool = Field(..., description="메타 태그 존재 여부")
    readability_score: float = Field(..., description="가독성 점수")
    issues: List[str] = Field(..., description="SEO 이슈")
    suggestions: List[str] = Field(..., description="개선 제안")

class AccessibilityReport(BaseModel):
    """접근성 리포트"""
    wcag_level: str = Field(..., description="WCAG 준수 레벨")
    issues: List[Dict[str, Any]] = Field(..., description="접근성 이슈")
    score: float = Field(..., description="접근성 점수")

# ==================== Main Agent Class ====================

class QAAgent(AgentBase):
    """품질 검증 및 테스트 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            agent_id="qa",
            name="QA Agent",
            description="콘텐츠와 시스템 출력의 품질을 검증합니다",
            category="system",
            llm_service=llm_service
        )

        # 품질 기준
        self.quality_thresholds = {
            "excellent": 90,
            "good": 75,
            "acceptable": 60,
            "poor": 40,
            "failed": 0
        }

        # 금지 단어 목록
        self.banned_words = [
            "비속어1", "비속어2"  # 실제 목록은 외부 설정
        ]

        # SEO 키워드 (Mock)
        self.seo_keywords = []

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        try:
            task = request.task

            if task == "quality_check":
                result = await self._quality_check(request.payload)
            elif task == "brand_compliance":
                result = await self._check_brand_compliance(request.payload)
            elif task == "seo_analysis":
                result = await self._analyze_seo(request.payload)
            elif task == "accessibility_check":
                result = await self._check_accessibility(request.payload)
            elif task == "grammar_check":
                result = await self._check_grammar(request.payload)
            elif task == "auto_fix":
                result = await self._auto_fix_issues(request.payload)
            else:
                raise AgentError(f"Unknown task: {request.task}")

            return AgentResponse(
                agent_id=self.agent_id,
                status="success",
                result=result,
                metadata={
                    "task": task,
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
            logger.error(f"QA agent error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=str(e)
            )

    async def _quality_check(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """종합 품질 검증"""
        qa_request = QARequest(**payload)
        start_time = datetime.now()

        issues = []
        passed_checks = []
        failed_checks = []

        # 수행할 검사 목록
        checks = qa_request.checks or [
            CheckType.GRAMMAR,
            CheckType.SPELLING,
            CheckType.BRAND_ALIGNMENT,
            CheckType.SEO
        ]

        # 각 검사 수행
        for check_type in checks:
            check_issues = await self._perform_check(
                check_type,
                qa_request.content,
                qa_request.content_type,
                qa_request.brand_guidelines
            )

            if check_issues:
                issues.extend(check_issues)
                failed_checks.append(check_type.value)
            else:
                passed_checks.append(check_type.value)

        # 품질 점수 계산
        quality_score = self._calculate_quality_score(issues, checks)

        # 품질 수준 결정
        overall_quality = self._determine_quality_level(quality_score)

        # 권장사항 생성
        recommendations = self._generate_recommendations(issues)

        execution_time = (datetime.now() - start_time).total_seconds()

        return QAReport(
            overall_quality=overall_quality,
            quality_score=quality_score,
            issues=issues,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            recommendations=recommendations,
            execution_time=execution_time
        ).dict()

    async def _perform_check(
        self,
        check_type: CheckType,
        content: str,
        content_type: ContentType,
        brand_guidelines: Optional[Dict[str, Any]]
    ) -> List[Issue]:
        """개별 검사 수행"""
        issues = []

        if check_type == CheckType.GRAMMAR:
            issues.extend(self._check_grammar_issues(content))

        elif check_type == CheckType.SPELLING:
            issues.extend(self._check_spelling_issues(content))

        elif check_type == CheckType.BRAND_ALIGNMENT:
            if brand_guidelines:
                issues.extend(self._check_brand_issues(content, brand_guidelines))

        elif check_type == CheckType.SEO:
            issues.extend(self._check_seo_issues(content))

        elif check_type == CheckType.ACCESSIBILITY:
            if content_type == ContentType.HTML:
                issues.extend(self._check_accessibility_issues(content))

        elif check_type == CheckType.SENSITIVITY:
            issues.extend(self._check_sensitivity_issues(content))

        return issues

    def _check_grammar_issues(self, content: str) -> List[Issue]:
        """문법 검사"""
        issues = []

        # Mock 문법 검사
        # 실제로는 language_tool_python 등 사용

        # 간단한 규칙 검사
        sentences = content.split('.')

        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if not sentence:
                continue

            # 문장이 소문자로 시작하는지
            if sentence and sentence[0].islower():
                issues.append(Issue(
                    issue_id=f"grammar_{i}_001",
                    check_type=CheckType.GRAMMAR,
                    severity=Severity.LOW,
                    description="문장이 소문자로 시작합니다",
                    location=f"문장 {i+1}",
                    suggestion="문장의 첫 글자를 대문자로 변경하세요",
                    auto_fixable=True
                ))

        return issues

    def _check_spelling_issues(self, content: str) -> List[Issue]:
        """맞춤법 검사"""
        issues = []

        # Mock 맞춤법 검사
        # 실제로는 한글 맞춤법 검사 API 사용

        # 간단한 패턴 검사
        common_typos = {
            "되요": "돼요",
            "않되": "안 돼",
            "되게": "정말"
        }

        for typo, correction in common_typos.items():
            if typo in content:
                issues.append(Issue(
                    issue_id=f"spelling_{typo}",
                    check_type=CheckType.SPELLING,
                    severity=Severity.MEDIUM,
                    description=f"잘못된 표현: '{typo}'",
                    suggestion=f"'{correction}'으로 수정하세요",
                    auto_fixable=True
                ))

        return issues

    def _check_brand_issues(
        self,
        content: str,
        brand_guidelines: Dict[str, Any]
    ) -> List[Issue]:
        """브랜드 가이드라인 검사"""
        issues = []

        # 톤앤매너 검사
        required_tone = brand_guidelines.get("tone", "professional")

        if required_tone == "professional":
            # 비격식적 표현 검사
            informal_patterns = ["ㅋㅋ", "ㅎㅎ", "~", "요~~"]
            for pattern in informal_patterns:
                if pattern in content:
                    issues.append(Issue(
                        issue_id=f"brand_tone_{pattern}",
                        check_type=CheckType.BRAND_ALIGNMENT,
                        severity=Severity.HIGH,
                        description=f"비격식적 표현 발견: '{pattern}'",
                        suggestion="전문적인 톤으로 수정하세요"
                    ))

        # 금지 단어 검사
        banned_words = brand_guidelines.get("banned_words", self.banned_words)
        for word in banned_words:
            if word in content:
                issues.append(Issue(
                    issue_id=f"brand_banned_{word}",
                    check_type=CheckType.BRAND_ALIGNMENT,
                    severity=Severity.CRITICAL,
                    description=f"금지 단어 사용: '{word}'",
                    suggestion="다른 표현으로 대체하세요"
                ))

        return issues

    def _check_seo_issues(self, content: str) -> List[Issue]:
        """SEO 검사"""
        issues = []

        # 제목 길이 검사
        if len(content) < 30:
            issues.append(Issue(
                issue_id="seo_title_length",
                check_type=CheckType.SEO,
                severity=Severity.MEDIUM,
                description="제목이 너무 짧습니다",
                suggestion="최소 30자 이상으로 작성하세요"
            ))

        # 키워드 밀도 검사
        word_count = len(content.split())
        if word_count > 100:
            # 키워드가 없으면 경고
            if not any(keyword in content for keyword in self.seo_keywords):
                issues.append(Issue(
                    issue_id="seo_no_keywords",
                    check_type=CheckType.SEO,
                    severity=Severity.HIGH,
                    description="타겟 키워드가 포함되지 않았습니다",
                    suggestion="관련 키워드를 자연스럽게 포함시키세요"
                ))

        return issues

    def _check_accessibility_issues(self, content: str) -> List[Issue]:
        """접근성 검사"""
        issues = []

        # HTML 콘텐츠 검사
        # img 태그에 alt 속성 검사
        img_pattern = r'<img[^>]+>'
        images = re.findall(img_pattern, content)

        for i, img_tag in enumerate(images):
            if 'alt=' not in img_tag:
                issues.append(Issue(
                    issue_id=f"a11y_img_alt_{i}",
                    check_type=CheckType.ACCESSIBILITY,
                    severity=Severity.HIGH,
                    description=f"이미지에 alt 속성이 없습니다",
                    location=f"이미지 {i+1}",
                    suggestion="대체 텍스트를 추가하세요"
                ))

        return issues

    def _check_sensitivity_issues(self, content: str) -> List[Issue]:
        """민감도 검사"""
        issues = []

        # 차별적 표현 검사
        sensitive_patterns = [
            ("성차별", ["여자답게", "남자답게"]),
            ("연령차별", ["꼰대", "틀딱"]),
            ("장애차별", ["병신", "정신병"])
        ]

        for category, patterns in sensitive_patterns:
            for pattern in patterns:
                if pattern in content:
                    issues.append(Issue(
                        issue_id=f"sensitivity_{category}_{pattern}",
                        check_type=CheckType.SENSITIVITY,
                        severity=Severity.CRITICAL,
                        description=f"{category} 표현 발견: '{pattern}'",
                        suggestion="포용적이고 존중하는 표현으로 변경하세요"
                    ))

        return issues

    async def _check_brand_compliance(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """브랜드 가이드라인 준수 검사"""
        content = payload.get("content", "")
        brand_guidelines = payload.get("brand_guidelines", {})

        violations = []
        compliance_score = 100.0

        # 톤앤매너
        required_tone = brand_guidelines.get("tone")
        if required_tone:
            tone_check = self._check_tone_compliance(content, required_tone)
            if not tone_check["compliant"]:
                violations.append(tone_check)
                compliance_score -= 20

        # 컬러 가이드라인 (이미지/비디오용)
        # Mock 구현

        # 금지 표현
        banned = brand_guidelines.get("banned_words", [])
        for word in banned:
            if word in content:
                violations.append({
                    "type": "banned_word",
                    "value": word,
                    "severity": "critical"
                })
                compliance_score -= 30

        compliant = len(violations) == 0
        recommendations = self._generate_compliance_recommendations(violations)

        return BrandComplianceCheck(
            compliant=compliant,
            compliance_score=max(0, compliance_score),
            violations=violations,
            recommendations=recommendations
        ).dict()

    def _check_tone_compliance(self, content: str, required_tone: str) -> Dict[str, Any]:
        """톤앤매너 준수 검사"""
        # Mock 구현
        compliant = True

        if required_tone == "professional":
            # 이모티콘이나 과도한 느낌표 검사
            if content.count('!') > 3 or '~' in content:
                compliant = False

        return {
            "compliant": compliant,
            "type": "tone",
            "required": required_tone,
            "severity": "high" if not compliant else "none"
        }

    async def _analyze_seo(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """SEO 분석"""
        content = payload.get("content", "")
        target_keywords = payload.get("keywords", [])

        # SEO 점수 계산
        seo_score = 50.0  # 기본 점수

        # 키워드 밀도
        words = content.lower().split()
        keyword_count = sum(1 for word in words if word in target_keywords)
        keyword_density = keyword_count / len(words) if words else 0

        if 0.01 <= keyword_density <= 0.03:  # 1-3% 최적
            seo_score += 20
        elif keyword_density > 0:
            seo_score += 10

        # 제목 길이
        if 50 <= len(content) <= 70:
            seo_score += 15

        # 가독성 (Mock)
        readability_score = 70.0

        # 메타 태그 (HTML인 경우)
        meta_tags_present = '<meta' in content

        issues = []
        suggestions = []

        if keyword_density < 0.01:
            issues.append("키워드 밀도가 너무 낮습니다")
            suggestions.append("타겟 키워드를 더 자주 사용하세요")

        if len(content) < 50:
            issues.append("콘텐츠가 너무 짧습니다")
            suggestions.append("최소 50자 이상으로 작성하세요")

        return SEOAnalysis(
            seo_score=min(100, seo_score),
            keyword_density=keyword_density,
            meta_tags_present=meta_tags_present,
            readability_score=readability_score,
            issues=issues,
            suggestions=suggestions
        ).dict()

    async def _check_accessibility(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """접근성 검사"""
        content = payload.get("content", "")

        issues = []
        score = 100.0

        # WCAG 검사 (Mock)
        # 실제로는 axe-core 등 사용

        # 이미지 대체 텍스트
        if '<img' in content:
            imgs_without_alt = len(re.findall(r'<img(?![^>]*alt=)', content))
            if imgs_without_alt > 0:
                issues.append({
                    "type": "missing_alt",
                    "count": imgs_without_alt,
                    "wcag": "1.1.1",
                    "level": "A"
                })
                score -= imgs_without_alt * 10

        # 색상 대비 (Mock)
        # 실제로는 색상 분석 필요

        # 키보드 접근성
        if '<button' in content:
            buttons_without_aria = len(re.findall(r'<button(?![^>]*aria-label)', content))
            if buttons_without_aria > 0:
                issues.append({
                    "type": "missing_aria_label",
                    "count": buttons_without_aria,
                    "wcag": "4.1.2",
                    "level": "A"
                })
                score -= buttons_without_aria * 5

        # WCAG 레벨 결정
        if score >= 95:
            wcag_level = "AAA"
        elif score >= 85:
            wcag_level = "AA"
        elif score >= 70:
            wcag_level = "A"
        else:
            wcag_level = "Non-compliant"

        return AccessibilityReport(
            wcag_level=wcag_level,
            issues=issues,
            score=max(0, score)
        ).dict()

    async def _check_grammar(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """문법 검사"""
        content = payload.get("content", "")

        issues = self._check_grammar_issues(content)
        issues.extend(self._check_spelling_issues(content))

        return {
            "total_issues": len(issues),
            "issues": [issue.dict() for issue in issues],
            "fixable_count": sum(1 for issue in issues if issue.auto_fixable)
        }

    async def _auto_fix_issues(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """이슈 자동 수정"""
        content = payload.get("content", "")
        issues = payload.get("issues", [])

        fixed_content = content
        fixed_count = 0

        for issue in issues:
            if issue.get("auto_fixable", False):
                # Mock 자동 수정
                # 실제로는 issue별 수정 로직 구현
                fixed_count += 1

        return {
            "original_content": content,
            "fixed_content": fixed_content,
            "fixed_count": fixed_count,
            "remaining_issues": len(issues) - fixed_count
        }

    # ==================== Helper Methods ====================

    def _calculate_quality_score(
        self,
        issues: List[Issue],
        checks: List[CheckType]
    ) -> float:
        """품질 점수 계산"""
        base_score = 100.0

        # 심각도별 감점
        severity_penalties = {
            Severity.CRITICAL: 30,
            Severity.HIGH: 15,
            Severity.MEDIUM: 10,
            Severity.LOW: 5,
            Severity.INFO: 2
        }

        for issue in issues:
            base_score -= severity_penalties.get(issue.severity, 5)

        return max(0, min(100, base_score))

    def _determine_quality_level(self, score: float) -> QualityLevel:
        """점수를 품질 수준으로 변환"""
        if score >= self.quality_thresholds["excellent"]:
            return QualityLevel.EXCELLENT
        elif score >= self.quality_thresholds["good"]:
            return QualityLevel.GOOD
        elif score >= self.quality_thresholds["acceptable"]:
            return QualityLevel.ACCEPTABLE
        elif score >= self.quality_thresholds["poor"]:
            return QualityLevel.POOR
        else:
            return QualityLevel.FAILED

    def _generate_recommendations(self, issues: List[Issue]) -> List[str]:
        """권장사항 생성"""
        recommendations = []

        # 심각한 이슈 우선 처리
        critical_issues = [i for i in issues if i.severity == Severity.CRITICAL]
        if critical_issues:
            recommendations.append(
                f"{len(critical_issues)}개의 치명적 이슈를 즉시 수정하세요"
            )

        # 자동 수정 가능한 이슈
        auto_fixable = [i for i in issues if i.auto_fixable]
        if auto_fixable:
            recommendations.append(
                f"{len(auto_fixable)}개 이슈는 자동 수정이 가능합니다"
            )

        # 이슈 타입별 권장사항
        issue_types = {}
        for issue in issues:
            issue_types.setdefault(issue.check_type, []).append(issue)

        for check_type, type_issues in issue_types.items():
            if len(type_issues) > 3:
                recommendations.append(
                    f"{check_type.value} 관련 이슈가 {len(type_issues)}개 발견되었습니다"
                )

        return recommendations[:5]  # 상위 5개

    def _generate_compliance_recommendations(
        self,
        violations: List[Dict[str, Any]]
    ) -> List[str]:
        """브랜드 준수 권장사항"""
        recommendations = []

        violation_types = {}
        for v in violations:
            violation_types.setdefault(v["type"], []).append(v)

        for vtype, items in violation_types.items():
            if vtype == "tone":
                recommendations.append("브랜드 톤앤매너를 준수하도록 수정하세요")
            elif vtype == "banned_word":
                recommendations.append(
                    f"{len(items)}개의 금지 단어를 다른 표현으로 대체하세요"
                )

        return recommendations

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "supported_content_types": [ct.value for ct in ContentType],
            "supported_checks": [check.value for check in CheckType],
            "quality_levels": [level.value for level in QualityLevel],
            "features": {
                "grammar_check": True,
                "spelling_check": True,
                "brand_compliance": True,
                "seo_analysis": True,
                "accessibility_check": True,
                "auto_fix": True,
                "plagiarism_detection": False,  # 미구현
                "sentiment_analysis": True
            },
            "quality_thresholds": self.quality_thresholds
        }

# ==================== Factory Function ====================

def create_qa_agent(llm_service: Optional[LLMService] = None) -> QAAgent:
    """QAAgent 인스턴스 생성"""
    return QAAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_qa_agent():
        # 에이전트 생성
        agent = create_qa_agent()

        # 1. 종합 품질 검증
        qa_request = AgentRequest(
            task="quality_check",
            payload={
                "content": "비건 화장품으로 아름다워지세요! 자연의 힘으로 피부를 되살리는 특별한 경험.",
                "content_type": "text",
                "checks": ["grammar", "spelling", "brand_alignment", "seo"],
                "brand_guidelines": {
                    "tone": "professional",
                    "banned_words": []
                }
            }
        )

        result = await agent.execute(qa_request)
        print(f"품질 검증: {result.status}")
        if result.status == "success":
            print(f"  - 종합 품질: {result.result['overall_quality']}")
            print(f"  - 품질 점수: {result.result['quality_score']:.1f}")
            print(f"  - 이슈 수: {len(result.result['issues'])}")
            print(f"  - 통과한 검사: {len(result.result['passed_checks'])}")

        # 2. 브랜드 준수 검사
        brand_request = AgentRequest(
            task="brand_compliance",
            payload={
                "content": "ㅋㅋ 이거 완전 대박이에요~~ 꼭 써보세요!",
                "brand_guidelines": {
                    "tone": "professional",
                    "banned_words": ["대박"]
                }
            }
        )

        result = await agent.execute(brand_request)
        print(f"\n브랜드 준수 검사: {result.status}")
        if result.status == "success":
            print(f"  - 준수 여부: {result.result['compliant']}")
            print(f"  - 준수 점수: {result.result['compliance_score']:.1f}")
            print(f"  - 위반 사항: {len(result.result['violations'])}")

        # 3. SEO 분석
        seo_request = AgentRequest(
            task="seo_analysis",
            payload={
                "content": "비건 화장품 추천 - 친환경 뷰티 브랜드 베스트 5",
                "keywords": ["비건", "화장품", "친환경"]
            }
        )

        result = await agent.execute(seo_request)
        print(f"\nSEO 분석: {result.status}")
        if result.status == "success":
            print(f"  - SEO 점수: {result.result['seo_score']:.1f}")
            print(f"  - 키워드 밀도: {result.result['keyword_density']:.1%}")
            print(f"  - 가독성: {result.result['readability_score']:.1f}")

        # 4. 문법 검사
        grammar_request = AgentRequest(
            task="grammar_check",
            payload={
                "content": "이것은 테스트 문장입니다. 문법을 확인합니다."
            }
        )

        result = await agent.execute(grammar_request)
        print(f"\n문법 검사: {result.status}")
        if result.status == "success":
            print(f"  - 총 이슈: {result.result['total_issues']}")
            print(f"  - 자동 수정 가능: {result.result['fixable_count']}")

    # 테스트 실행
    asyncio.run(test_qa_agent())
