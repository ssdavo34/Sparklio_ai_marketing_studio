"""
LLM Router

역할과 작업에 따라 최적의 모델을 자동으로 선택

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

from typing import Dict, Any, Optional, Tuple
from enum import Enum


class ModelTier(str, Enum):
    """모델 성능 등급"""
    LIGHT = "light"      # 빠른 응답, 간단한 작업 (7B 모델)
    STANDARD = "standard"  # 균형잡힌 성능 (14B 모델)
    HEAVY = "heavy"      # 고품질, 복잡한 작업 (32B+ 모델)


class LLMRouter:
    """
    LLM Router

    역할(role)과 작업(task)에 따라 최적의 모델을 선택하는 라우터

    선택 기준:
    1. 작업 복잡도 (간단한 SNS vs 복잡한 브랜드킷)
    2. 품질 요구사항 (초안 vs 최종본)
    3. 응답 속도 요구사항

    사용 예시:
        router = LLMRouter()
        model, provider = router.route(role="copywriter", task="sns")
        # ("qwen2.5:7b", "ollama")
    """

    def __init__(self):
        """Router 초기화"""
        # 역할별 기본 모델 티어
        self.role_tiers: Dict[str, ModelTier] = {
            "brief_agent": ModelTier.LIGHT,      # 브리프 추출은 가벼운 모델로 충분
            "brand_agent": ModelTier.HEAVY,      # 브랜드킷은 고품질 필요
            "strategist": ModelTier.HEAVY,       # 전략 수립은 복잡한 사고 필요
            "copywriter": ModelTier.STANDARD,    # 카피라이팅은 균형잡힌 모델
            "vision_generator": ModelTier.STANDARD,  # 이미지 프롬프트 생성
            "reviewer": ModelTier.STANDARD,      # 검토는 중간 수준
        }

        # 작업별 모델 티어 오버라이드
        self.task_overrides: Dict[str, ModelTier] = {
            "sns": ModelTier.LIGHT,              # SNS는 빠른 응답 중요
            "brand_kit": ModelTier.HEAVY,        # 브랜드킷은 고품질 필수
            "campaign": ModelTier.HEAVY,         # 캠페인 기획은 복잡
            "product_detail": ModelTier.STANDARD,  # 상품 상세는 표준
            "review": ModelTier.LIGHT,           # 리뷰는 가벼운 모델로 충분
        }

        # 티어별 Ollama 모델 매핑
        self.ollama_models: Dict[ModelTier, str] = {
            ModelTier.LIGHT: "qwen2.5:7b",
            ModelTier.STANDARD: "qwen2.5:14b",
            ModelTier.HEAVY: "qwen2.5:32b",
        }

        # Provider별 우선순위 (향후 확장용)
        self.provider_priority = ["ollama", "openai", "anthropic", "gemini"]

    def route(
        self,
        role: str,
        task: str,
        mode: str = "json",
        override_model: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        역할과 작업에 따라 모델과 Provider 선택

        Args:
            role: Agent 역할
            task: 작업 유형
            mode: 출력 모드 (json | text)
            override_model: 강제로 사용할 모델 (선택)

        Returns:
            (model_name, provider_name) 튜플
                - model_name: 모델명 (예: "qwen2.5:14b")
                - provider_name: Provider명 (예: "ollama")

        Example:
            >>> router = LLMRouter()
            >>> model, provider = router.route(role="copywriter", task="sns")
            >>> print(f"{provider}: {model}")
            ollama: qwen2.5:7b
        """
        # 명시적 모델 지정 시
        if override_model:
            # 모델명으로 적절한 provider 자동 추론
            return override_model, self._get_provider_for_model(override_model)

        # 모델 티어 결정 (작업 우선, 없으면 역할 기본값)
        tier = self._determine_tier(role, task)

        # 티어에 맞는 모델 선택
        model = self.ollama_models.get(tier, self.ollama_models[ModelTier.STANDARD])

        # Provider 선택 (현재는 Ollama만, 향후 확장)
        provider = "ollama"

        return model, provider

    def _determine_tier(self, role: str, task: str) -> ModelTier:
        """
        역할과 작업으로 모델 티어 결정

        우선순위:
        1. task_overrides (작업별 오버라이드)
        2. role_tiers (역할별 기본값)
        3. STANDARD (기본값)

        Args:
            role: Agent 역할
            task: 작업 유형

        Returns:
            ModelTier: 선택된 모델 티어
        """
        # 작업별 오버라이드 확인
        if task in self.task_overrides:
            return self.task_overrides[task]

        # 역할별 기본값 확인
        if role in self.role_tiers:
            return self.role_tiers[role]

        # 기본값
        return ModelTier.STANDARD

    def _get_provider_for_model(self, model: str) -> str:
        """
        모델명으로 Provider 추론

        Args:
            model: 모델명

        Returns:
            Provider명
        """
        # 모델명을 소문자로 변환하여 대소문자 구분 없이 매칭
        model_lower = model.lower()

        # OpenAI 모델 패턴 (gpt, o1 시리즈 등)
        if "gpt" in model_lower or "o1" in model_lower:
            return "openai"

        # Gemini 모델 패턴
        elif "gemini" in model_lower:
            return "gemini"

        # Anthropic 모델 패턴 (claude 시리즈)
        elif "claude" in model_lower:
            return "anthropic"

        # Ollama 모델 패턴 (qwen, llama, mistral 등)
        elif "qwen" in model_lower or "llama" in model_lower or "mistral" in model_lower or ":" in model:
            return "ollama"

        # 기본값은 ollama로 설정
        return "ollama"

    def get_model_info(self, model: str, provider: str) -> Dict[str, Any]:
        """
        모델 정보 반환

        Args:
            model: 모델명
            provider: Provider명

        Returns:
            모델 정보 딕셔너리
        """
        # 티어 역추적
        tier = None
        for t, m in self.ollama_models.items():
            if m == model:
                tier = t
                break

        return {
            "model": model,
            "provider": provider,
            "tier": tier.value if tier else "unknown",
            "characteristics": self._get_tier_characteristics(tier) if tier else {}
        }

    def _get_tier_characteristics(self, tier: ModelTier) -> Dict[str, Any]:
        """티어별 특성 정보"""
        characteristics = {
            ModelTier.LIGHT: {
                "speed": "fast",
                "quality": "good",
                "use_case": "간단한 작업, 빠른 응답 필요",
                "avg_latency_sec": 5
            },
            ModelTier.STANDARD: {
                "speed": "moderate",
                "quality": "excellent",
                "use_case": "균형잡힌 품질과 속도",
                "avg_latency_sec": 15
            },
            ModelTier.HEAVY: {
                "speed": "slow",
                "quality": "premium",
                "use_case": "복잡한 작업, 최고 품질 필요",
                "avg_latency_sec": 40
            }
        }
        return characteristics.get(tier, {})

    def add_model(self, tier: ModelTier, provider: str, model: str):
        """
        새로운 모델 추가 (동적 확장)

        Args:
            tier: 모델 티어
            provider: Provider명
            model: 모델명
        """
        if provider == "ollama":
            self.ollama_models[tier] = model
        # 향후 다른 Provider 추가 가능

    def override_task_tier(self, task: str, tier: ModelTier):
        """
        작업별 티어 오버라이드 추가

        Args:
            task: 작업 유형
            tier: 모델 티어
        """
        self.task_overrides[task] = tier

    def override_role_tier(self, role: str, tier: ModelTier):
        """
        역할별 티어 오버라이드 추가

        Args:
            role: Agent 역할
            tier: 모델 티어
        """
        self.role_tiers[role] = tier


# 전역 Router 인스턴스
_router_instance: Optional[LLMRouter] = None


def get_router() -> LLMRouter:
    """
    전역 Router 인스턴스 반환 (싱글톤)

    Returns:
        LLMRouter 인스턴스
    """
    global _router_instance
    if _router_instance is None:
        _router_instance = LLMRouter()
    return _router_instance
