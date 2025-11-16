"""
Mock LLM Provider

테스트용 Mock Provider - 빠른 응답 (5초 이내)

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

import asyncio
import random
from typing import Dict, Any, Optional
from datetime import datetime

from .base import LLMProvider, LLMProviderResponse


class MockProvider(LLMProvider):
    """
    Mock LLM Provider

    테스트용으로 빠른 응답을 생성하는 Provider
    - 실제 LLM 호출 없이 샘플 데이터 반환
    - 5초 이내 응답 (네트워크 시뮬레이션 포함)
    - 역할/작업별 샘플 응답 제공

    사용 예시:
        provider = MockProvider()
        response = await provider.generate(
            prompt="상품 설명을 작성해주세요",
            role="copywriter",
            task="product_detail",
            mode="json"
        )
    """

    def __init__(self, response_delay: float = 1.0):
        """
        Args:
            response_delay: 응답 지연 시간 (초) - 기본값 1.0초
        """
        self.response_delay = response_delay

    @property
    def vendor(self) -> str:
        """Provider 벤더명"""
        return "mock"

    @property
    def supports_json(self) -> bool:
        """JSON 모드 지원 여부"""
        return True

    @property
    def supports_streaming(self) -> bool:
        """스트리밍 지원 여부"""
        return False

    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str = "json",
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        Mock LLM 텍스트 생성

        Args:
            prompt: 프롬프트
            role: Agent 역할 (copywriter, strategist, reviewer 등)
            task: 작업 유형 (product_detail, brand_kit, sns 등)
            mode: 출력 모드 ('json' | 'text')
            options: 추가 옵션 (무시됨)

        Returns:
            LLMProviderResponse: 샘플 응답
        """
        # 네트워크 지연 시뮬레이션
        await asyncio.sleep(self.response_delay)

        # 역할/작업별 샘플 응답 생성
        output = self._generate_sample_output(role, task, mode)

        # 토큰 사용량 시뮬레이션
        prompt_tokens = len(prompt.split())
        completion_tokens = len(str(output).split()) if isinstance(output, dict) else len(output.split())

        return LLMProviderResponse(
            provider="mock",
            model="mock-model-v1",
            usage={
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens
            },
            output=output,
            meta={
                "latency_ms": self.response_delay * 1000,
                "temperature": 0.7,
                "mode": mode,
                "role": role,
                "task": task
            },
            timestamp=datetime.utcnow()
        )

    def _generate_sample_output(self, role: str, task: str, mode: str) -> Dict[str, Any] | str:
        """
        역할/작업별 샘플 응답 생성

        Args:
            role: Agent 역할
            task: 작업 유형
            mode: 출력 모드

        Returns:
            샘플 응답 (JSON 또는 텍스트)
        """
        # JSON 모드
        if mode == "json":
            return self._get_json_sample(role, task)

        # 텍스트 모드
        return self._get_text_sample(role, task)

    def _get_json_sample(self, role: str, task: str) -> Dict[str, Any]:
        """JSON 모드 샘플 응답"""

        # Copywriter 역할
        if role == "copywriter":
            if task == "product_detail":
                return {
                    "title": "프리미엄 무선 이어폰 X1",
                    "description": "완벽한 음질과 편안한 착용감을 제공하는 차세대 무선 이어폰",
                    "features": [
                        "노이즈 캔슬링 기술",
                        "24시간 배터리",
                        "IPX7 방수"
                    ],
                    "target_audience": "음질을 중시하는 2030 세대",
                    "tone": "프리미엄, 혁신적"
                }
            elif task == "sns":
                return {
                    "platform": "instagram",
                    "caption": "🎧 새로운 음악 경험의 시작\n완벽한 노이즈 캔슬링으로 나만의 세계에 빠져보세요.\n#무선이어폰 #프리미엄사운드",
                    "hashtags": ["무선이어폰", "프리미엄사운드", "노이즈캔슬링"],
                    "call_to_action": "지금 바로 확인하기 👉"
                }
            elif task == "brand_kit":
                return {
                    "brand_voice": "혁신적이고 프리미엄한 톤",
                    "key_messages": [
                        "완벽한 음질",
                        "편안한 착용감",
                        "스타일리시한 디자인"
                    ],
                    "do": ["프리미엄 강조", "기술 혁신 언급"],
                    "dont": ["저렴함 강조", "과도한 할인"]
                }

        # Strategist 역할
        elif role == "strategist":
            if task == "brand_kit":
                return {
                    "brand_position": "프리미엄 오디오 시장의 혁신 리더",
                    "target_segments": [
                        {"segment": "얼리어답터", "age": "25-35", "interest": "최신 기술"},
                        {"segment": "음악 애호가", "age": "30-45", "interest": "고음질"}
                    ],
                    "competitive_advantage": "최고 수준의 노이즈 캔슬링 기술",
                    "marketing_channels": ["SNS", "유튜브", "오프라인 매장"]
                }
            elif task == "campaign":
                return {
                    "campaign_name": "나만의 사운드 월드",
                    "objective": "신제품 인지도 30% 향상",
                    "duration": "2개월",
                    "budget_allocation": {
                        "digital": 60,
                        "offline": 30,
                        "influencer": 10
                    }
                }

        # Reviewer 역할
        elif role == "reviewer":
            return {
                "score": random.randint(70, 95),
                "feedback": [
                    {"type": "strength", "comment": "톤앤매너가 브랜드 아이덴티티와 잘 맞음"},
                    {"type": "improvement", "comment": "타겟 고객에 맞는 구체적인 사례 추가 필요"}
                ],
                "suggestions": [
                    "제품의 차별화 포인트를 더 명확하게 표현",
                    "감성적 요소와 기능적 요소의 균형 조정"
                ],
                "approved": True
            }

        # 기본 응답
        return {
            "role": role,
            "task": task,
            "result": f"Mock response for {role} - {task}",
            "status": "success"
        }

    def _get_text_sample(self, role: str, task: str) -> str:
        """텍스트 모드 샘플 응답"""

        # Copywriter 역할
        if role == "copywriter":
            if task == "product_detail":
                return """
프리미엄 무선 이어폰 X1

완벽한 음질과 편안한 착용감을 제공하는 차세대 무선 이어폰입니다.

주요 특징:
- 최첨단 노이즈 캔슬링 기술로 외부 소음 99% 차단
- 24시간 지속되는 강력한 배터리
- IPX7 방수 등급으로 어떤 환경에서도 자유롭게

음질을 중시하는 당신을 위한 완벽한 선택입니다.
                """.strip()
            elif task == "sns":
                return "🎧 새로운 음악 경험의 시작\n완벽한 노이즈 캔슬링으로 나만의 세계에 빠져보세요.\n#무선이어폰 #프리미엄사운드"

        # Strategist 역할
        elif role == "strategist":
            if task == "brand_kit":
                return """
브랜드 포지셔닝: 프리미엄 오디오 시장의 혁신 리더

타겟 고객:
1. 얼리어답터 (25-35세) - 최신 기술에 관심
2. 음악 애호가 (30-45세) - 고음질 추구

경쟁 우위: 최고 수준의 노이즈 캔슬링 기술

마케팅 채널: SNS, 유튜브, 오프라인 매장
                """.strip()

        # Reviewer 역할
        elif role == "reviewer":
            return f"""
검토 결과: {random.randint(70, 95)}점

강점:
- 톤앤매너가 브랜드 아이덴티티와 잘 맞음
- 타겟 고객의 니즈를 정확히 파악

개선 사항:
- 타겟 고객에 맞는 구체적인 사례 추가 필요
- 제품의 차별화 포인트를 더 명확하게 표현

승인: ✅
            """.strip()

        # 기본 응답
        return f"Mock text response for {role} - {task}\n\nThis is a sample response generated by the mock provider for testing purposes."


# Mock Provider 인스턴스 생성 헬퍼
def create_mock_provider(response_delay: float = 1.0) -> MockProvider:
    """
    Mock Provider 인스턴스 생성

    Args:
        response_delay: 응답 지연 시간 (초)

    Returns:
        MockProvider 인스턴스
    """
    return MockProvider(response_delay=response_delay)
