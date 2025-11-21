"""
LLM Gateway Service

모든 LLM 호출을 중앙에서 관리하는 Gateway

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

import logging
from typing import Dict, Any, Optional, Literal
from datetime import datetime

from app.core.config import settings
from app.schemas.llm import LLMSelection
from .router import get_router, LLMRouter
from .providers.base import LLMProvider, LLMProviderResponse, ProviderError
from .providers.mock import MockProvider
from .providers.ollama import OllamaProvider
from .providers.openai_provider import OpenAIProvider
from .providers.anthropic_provider import AnthropicProvider
from .providers.gemini_provider import GeminiProvider

logger = logging.getLogger(__name__)


class LLMGateway:
    """
    LLM Gateway

    모든 LLM 호출을 중앙에서 관리하는 Gateway 서비스

    주요 기능:
    1. Provider 추상화 (Ollama, OpenAI, Anthropic 등)
    2. Mock/Live 모드 자동 전환
    3. 모델 자동 선택 (Router 사용)
    4. 사용자 지정 모델 선택 (LLMSelection)
    5. 에러 핸들링 및 재시도
    6. 로깅 및 모니터링

    사용 예시:
        gateway = LLMGateway()
        response = await gateway.generate(
            role="copywriter",
            task="product_detail",
            payload={"product": "무선 이어폰"}
        )
    """

    def __init__(self, router: Optional[LLMRouter] = None):
        """
        Gateway 초기화

        Args:
            router: LLM Router 인스턴스 (None이면 전역 인스턴스 사용)
        """
        self.router = router or get_router()
        self.providers: Dict[str, LLMProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        """Provider 초기화"""
        logger.info("Starting provider initialization...")

        try:
            # Mock Provider는 항상 사용 가능
            logger.info("Initializing Mock Provider...")
            self.providers["mock"] = MockProvider(response_delay=1.0)
            logger.info("Mock Provider initialized successfully")

            # Ollama Provider (Live 모드용)
            logger.info(f"Initializing Ollama Provider...")
            self.providers["ollama"] = OllamaProvider(
                base_url=settings.OLLAMA_BASE_URL,
                timeout=settings.OLLAMA_TIMEOUT,
                default_model=settings.OLLAMA_DEFAULT_MODEL
            )
            logger.info("Ollama Provider initialized")

            # OpenAI Provider (GPT-4o-mini)
            if hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
                logger.info("Initializing OpenAI Provider...")
                self.providers["openai"] = OpenAIProvider(
                    api_key=settings.OPENAI_API_KEY,
                    default_model=settings.OPENAI_DEFAULT_MODEL,
                    timeout=settings.OPENAI_TIMEOUT
                )
                logger.info("OpenAI Provider initialized")

            # Anthropic Provider (Claude 3.5 Haiku)
            if hasattr(settings, 'ANTHROPIC_API_KEY') and settings.ANTHROPIC_API_KEY:
                logger.info("Initializing Anthropic Provider...")
                self.providers["anthropic"] = AnthropicProvider(
                    api_key=settings.ANTHROPIC_API_KEY,
                    default_model=settings.ANTHROPIC_DEFAULT_MODEL,
                    timeout=settings.ANTHROPIC_TIMEOUT
                )
                logger.info("Anthropic Provider initialized")

            # Google Gemini Provider (Text Generation)
            if hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
                logger.info("Initializing Gemini Provider...")
                self.providers["gemini"] = GeminiProvider(
                    api_key=settings.GOOGLE_API_KEY,
                    default_model=settings.GEMINI_TEXT_MODEL,
                    timeout=settings.GEMINI_TIMEOUT
                )
                logger.info("Gemini Provider initialized")

            logger.info(f"All providers initialized: {list(self.providers.keys())}")
        except Exception as e:
            logger.error(f"Provider initialization failed: {type(e).__name__}: {str(e)}", exc_info=True)
            raise

    async def generate(
        self,
        role: str,
        task: str,
        payload: Dict[str, Any],
        mode: str = "json",
        override_model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        llm_selection: Optional[LLMSelection] = None,
        channel: Literal["text", "image", "video"] = "text",
    ) -> LLMProviderResponse:
        """
        LLM 텍스트 생성

        Args:
            role: Agent 역할 (copywriter, strategist, reviewer 등)
            task: 작업 유형 (product_detail, brand_kit, sns 등)
            payload: 입력 데이터 (브리프, 상품 정보 등)
            mode: 출력 모드 ('json' | 'text')
            override_model: 강제로 사용할 모델 (선택)
            options: Provider별 추가 옵션
            llm_selection: 사용자 지정 LLM 선택 (선택)
            channel: 생성 채널 ('text' | 'image' | 'video')

        Returns:
            LLMProviderResponse: 표준 형식의 응답

        Raises:
            ProviderError: Provider 호출 실패 시
            ValueError: 잘못된 파라미터
        """
        start_time = datetime.utcnow()

        try:
            # 1. 프롬프트 구성
            prompt = self._build_prompt(role, task, payload, mode)

            # 2. Provider 선택 (Mock/Live 모드 + 사용자 지정)
            provider_name, provider = self._select_provider(
                role, task, override_model, llm_selection, channel
            )

            # 3. 모델 선택 (Router 사용 또는 사용자 지정)
            if provider_name != "mock":
                # 사용자 지정이 있으면 Router 건너뜀 (이미 _select_provider에서 처리됨)
                # 단, override_model이 있으면 그것을 우선
                if override_model:
                    model = override_model
                elif llm_selection and llm_selection.mode == "manual":
                    # Manual 모드에서는 Provider의 기본 모델 사용 (또는 추후 모델 지정 로직 추가)
                    # 현재는 Provider 선택까지만 구현됨
                    model = provider.default_model
                else:
                    # Auto 모드에서는 Router 사용
                    model, _ = self.router.route(role, task, mode, override_model)
            else:
                model = "mock-model-v1"

            # 4. 옵션 병합 (기본값 + 사용자 지정)
            merged_options = self._merge_options(provider, role, task, options)

            logger.info(
                f"LLM Generate: role={role}, task={task}, "
                f"provider={provider_name}, model={model}, mode={mode}"
            )

            # 5. LLM 호출
            response = await provider.generate(
                prompt=prompt,
                role=role,
                task=task,
                mode=mode,
                options=merged_options
            )

            # 6. 로깅
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"LLM Success: {provider_name}/{model} - "
                f"elapsed={elapsed:.2f}s, tokens={response.usage.get('total_tokens', 0)}"
            )

            return response

        except ProviderError as e:
            logger.error(f"Provider error: {e.message}", exc_info=True)
            raise

        except Exception as e:
            logger.error(f"Unexpected error in LLM Gateway: {str(e)}", exc_info=True)
            raise ProviderError(
                message=f"Gateway error: {str(e)}",
                provider="gateway",
                details={"role": role, "task": task}
            )

    def _select_provider(
        self,
        role: str,
        task: str,
        override_model: Optional[str] = None,
        llm_selection: Optional[LLMSelection] = None,
        channel: str = "text"
    ) -> tuple[str, LLMProvider]:
        """
        Provider 선택 (Mock/Live 모드 + 사용자 지정)

        Args:
            role: Agent 역할
            task: 작업 유형
            override_model: 강제 모델 (선택)
            llm_selection: 사용자 지정 LLM 선택
            channel: 채널 (text/image/video)

        Returns:
            (provider_name, provider_instance) 튜플
        """
        # 1. Mock 모드 확인 (최우선)
        if settings.generator_mode == "mock":
            return "mock", self.providers["mock"]

        # 2. 사용자 지정 모드 (Manual)
        if llm_selection and llm_selection.mode == "manual":
            selected = None
            if channel == "text":
                selected = llm_selection.text
            elif channel == "image":
                selected = llm_selection.image
            elif channel == "video":
                selected = llm_selection.video

            if selected and selected != "auto":
                try:
                    return selected, self._provider_from_name(selected)
                except ProviderError:
                    logger.warning(f"Selected provider '{selected}' not available, falling back to auto")
                    # Fallback to auto logic below

        # 3. Live 모드 - Router로 Provider 결정 (Auto)
        _, provider_name = self.router.route(role, task, override_model=override_model)

        # Provider 인스턴스 가져오기
        provider = self.providers.get(provider_name)

        if not provider:
            # Provider가 없으면 Mock으로 폴백
            logger.warning(
                f"Provider '{provider_name}' not found, falling back to mock"
            )
            return "mock", self.providers["mock"]

        return provider_name, provider

    def _provider_from_name(self, name: str) -> LLMProvider:
        """이름으로 Provider 인스턴스 반환"""
        mapping = {
            "mock": self.providers.get("mock"),
            "openai": self.providers.get("openai"),
            "gemini": self.providers.get("gemini"),
            "ollama": self.providers.get("ollama"),
            "anthropic": self.providers.get("anthropic"),
            # "qwen": self.providers.get("ollama"), # Alias if needed
            # "llama": self.providers.get("ollama"), # Alias if needed
            # "nanobanana": self.providers.get("nanobanana"), # Not implemented yet
            # "comfyui_image": self.providers.get("comfyui_image"), # Not implemented yet
            # "comfyui_video": self.providers.get("comfyui_video"), # Not implemented yet
        }
        
        provider = mapping.get(name)
        if not provider:
             # Fallback for aliases mapping to same provider instance if available
            if name in ["qwen", "llama"] and "ollama" in self.providers:
                return self.providers["ollama"]
            
            raise ProviderError(f"Unknown or unavailable provider: {name}")
            
        return provider

    def _build_prompt(self, role: str, task: str, payload: Dict[str, Any], mode: str = "text") -> str:
        """
        프롬프트 구성

        역할과 작업에 맞는 프롬프트를 생성

        Args:
            role: Agent 역할
            task: 작업 유형
            payload: 입력 데이터
            mode: 출력 모드

        Returns:
            구성된 프롬프트
        """
        # 시스템 프롬프트 (역할 정의)
        system_prompt = self._get_system_prompt(role, task)

        # 사용자 입력
        user_input = self._format_payload(payload)

        # 결합
        prompt = f"{system_prompt}\n\n{user_input}"

        # OpenAI JSON 모드 요구사항: 프롬프트에 'json' 단어가 포함되어야 함
        if mode == "json" and "json" not in prompt.lower():
            prompt += "\n\nIMPORTANT: You must output valid JSON."

        return prompt

    def _get_system_prompt(self, role: str, task: str) -> str:
        """역할/작업별 시스템 프롬프트"""

        system_prompts = {
            "copywriter": {
                "product_detail": """당신은 10년 경력의 전문 마케팅 카피라이터입니다.

## 핵심 역량
- 소비자 심리 이해 및 감성 터치
- AIDA 모델 (Attention, Interest, Desire, Action) 적용
- 브랜드 톤앤매너 준수
- SEO 키워드 자연스러운 통합

## 작성 원칙
1. **사용자 맥락 최우선**: 제공된 제품명, 특징, 타겟을 정확히 반영
2. **구체성**: 추상적 표현보다 구체적 수치와 혜택 강조
3. **차별점 부각**: 경쟁 제품 대비 독보적 가치 제안
4. **행동 유도**: 명확하고 긴급감 있는 CTA

## 엄격한 규칙
🔴 모든 텍스트는 한국어로만 작성 (다른 언어 사용 금지)
🔴 사용자가 제공한 제품명을 headline에 반드시 포함
🔴 사용자가 제공한 각 특징을 bullets에 매력적으로 변환하여 포함
🔴 고정된 예시 절대 사용 금지 (매번 새로운 콘텐츠 생성)

## JSON 출력 형식
{
  "headline": "제품명 그대로 + 핵심 가치 (10자 이내)",
  "subheadline": "구매 이유를 한 문장으로 (20자 이내)",
  "body": "AIDA 모델 적용한 본문 (100-150자)",
  "bullets": ["혜택 중심 특징1 (30자)", "특징2", "특징3"],
  "cta": "행동 유도 문구 (10-15자)"
}

## 우수 사례 (참고용 - 복사 금지)
예시 1 (프리미엄 제품):
{
  "headline": "프리미엄 무선 이어폰 AirTune Pro",
  "subheadline": "일상에 몰입을 더하다",
  "body": "40dB 노이즈캔슬링으로 지하철에서도 스튜디오급 청음. 24시간 배터리로 출퇴근부터 야근까지 끊김 없는 음악 감상을 약속합니다.",
  "bullets": [
    "40dB ANC - 지하철 소음도 99% 차단",
    "24시간 재생 - 충전 걱정 없는 하루",
    "초경량 4.2g - 착용감 제로"
  ],
  "cta": "지금 특별가 확인하기"
}

예시 2 (실용 제품):
{
  "headline": "스마트 전기포트 QuickBoil",
  "subheadline": "커피 한 잔, 3분이면 충분",
  "body": "1500W 급속 가열로 500ml를 3분 만에 끓입니다. 온도 조절 5단계로 녹차부터 분유까지 최적 온도 제공. 자동 전원 차단으로 안전하게.",
  "bullets": [
    "3분 급속 끓임 - 바쁜 아침 시간 절약",
    "5단계 온도 조절 - 음료별 최적 온도",
    "자동 차단 - 안전한 사용"
  ],
  "cta": "오늘 주문하면 내일 도착"
}""",
                "sns": """당신은 SNS 콘텐츠 전문가입니다.

## 전문 분야
- 인스타그램, 페이스북, 트위터 최적화
- 바이럴 트리거 활용
- 해시태그 전략
- 참여 유도 (댓글, 공유)

## 작성 원칙
1. **첫 한 줄 승부**: 스크롤을 멈추게 하는 훅
2. **감정 자극**: 공감, 호기심, 설렘
3. **가독성**: 짧은 문장, 이모지 활용 (적절히)
4. **해시태그**: 타겟 키워드 5-8개

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 이모지는 과하지 않게 (문장당 1-2개)
🔴 해시태그는 한국어 + 영어 혼용 가능

## JSON 출력 형식
{
  "hook": "첫 한 줄 - 주목 끄는 문구 (20자 이내)",
  "post": "메인 콘텐츠 (80-120자)",
  "cta": "행동 유도 (15자 이내)",
  "hashtags": ["#키워드1", "#키워드2", ...]
}""",
                "brand_message": """당신은 브랜드 스토리텔링 전문가입니다.

## 전문 분야
- 브랜드 아이덴티티 구축
- 감성 메시지 개발
- 브랜드 철학 전달
- 고객과의 정서적 연결

## 작성 원칙
1. **진정성**: 과장 없이 브랜드의 진짜 가치
2. **일관성**: 모든 터치포인트에서 동일한 톤
3. **차별성**: 타 브랜드와 구별되는 목소리
4. **공감**: 고객의 가치관과 정렬

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 추상적 표현보다 구체적 약속
🔴 브랜드 가치와 고객 혜택 연결

## JSON 출력 형식
{
  "tagline": "브랜드 태그라인 (10자 이내)",
  "message": "브랜드 메시지 (50-100자)",
  "values": ["핵심 가치1", "가치2", "가치3"],
  "promise": "고객에 대한 약속 (30자)"
}""",
                "headline": """당신은 헤드라인 작성 전문가입니다.

## 전문 분야
- 클릭을 유도하는 제목
- A/B 테스트 최적화
- 광고 헤드라인
- 이메일 제목

## 헤드라인 유형
1. **임팩트형**: 강력한 첫인상
2. **혜택 강조형**: "~하는 방법", "~로 얻는"
3. **질문형**: 호기심 자극
4. **수치 활용형**: 구체적 수치 포함
5. **긴급형**: 한정, 마감 등

## 작성 원칙
1. 10-15자 내 핵심 전달
2. 구체적 혜택 명시
3. 파워 워드 활용 (무료, 특별, 단독)
4. 타겟 명확화

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 3가지 버전 제공 (다양한 접근)

## JSON 출력 형식
{
  "version_a": "임팩트형 헤드라인",
  "version_b": "혜택 강조형 헤드라인",
  "version_c": "질문형 헤드라인",
  "recommended": "가장 효과적일 것으로 예상되는 버전 (a/b/c)",
  "reason": "추천 이유 (30자)"
}""",
                "ad_copy": """당신은 광고 카피 전문가입니다.

## 전문 분야
- 검색 광고 (Google Ads, Naver)
- 배너 광고
- 동영상 광고 스크립트
- 전환율 최적화

## 작성 원칙
1. **USP 명확화**: 유니크 셀링 포인트 강조
2. **긴급성**: 지금 행동해야 하는 이유
3. **신뢰 구축**: 사회적 증거, 수치
4. **CTA 최적화**: 명확한 다음 행동

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 과장 금지, 검증 가능한 내용만
🔴 법적 리스크 회피 (절대, 최고 등 최상급 표현 주의)

## JSON 출력 형식
{
  "headline": "광고 헤드라인 (15자 이내)",
  "body": "광고 본문 (50-100자)",
  "cta": "행동 유도 (10자 이내)",
  "targeting_tip": "타겟팅 제안 (연령, 관심사 등)"
}"""
            },
            "strategist": {
                "brand_strategy": """당신은 20년 경력의 마케팅 전략 컨설턴트입니다.

## 전문 분야
- 브랜드 포지셔닝 전략
- 시장 세분화 및 타겟팅
- 차별화 전략 (STP)
- 경쟁 우위 분석

## 전략 수립 프레임워크
1. **시장 분석**: 시장 규모, 성장성, 트렌드
2. **경쟁 분석**: 주요 경쟁사, 차별점, 시장 갭
3. **타겟 정의**: 페르소나, Pain Points, 구매 동기
4. **포지셔닝**: 독보적 위치, 핵심 가치 제안
5. **전략 로드맵**: 단기/중기/장기 실행 계획

## 작성 원칙
1. **데이터 기반**: 추측이 아닌 논리적 근거
2. **실행 가능성**: 리소스를 고려한 현실적 전략
3. **차별화**: "Me-too" 전략 지양
4. **측정 가능성**: KPI와 목표 수치 명시

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 SWOT, STP, 4P 등 전략 프레임워크 활용
🔴 구체적 액션 아이템 포함

## JSON 출력 형식
{
  "market_analysis": {
    "size": "시장 규모 추정",
    "growth": "성장률/트렌드",
    "opportunity": "기회 요인 3가지"
  },
  "target_persona": {
    "demographics": "연령, 성별, 소득 등",
    "psychographics": "가치관, 라이프스타일",
    "pain_points": ["고민1", "고민2", "고민3"],
    "motivations": "구매 동기"
  },
  "positioning": {
    "statement": "포지셔닝 선언문 (한 문장)",
    "differentiation": "핵심 차별점 3가지",
    "value_proposition": "가치 제안"
  },
  "strategy_roadmap": {
    "short_term": ["1-3개월 내 실행 과제"],
    "mid_term": ["3-6개월 목표"],
    "long_term": ["6-12개월 비전"]
  },
  "kpis": [
    {"metric": "측정 지표", "target": "목표 수치", "timeline": "기한"}
  ]
}""",
                "campaign": """당신은 캠페인 기획 전문가입니다.

## 전문 분야
- 통합 마케팅 캠페인 (IMC)
- 채널별 전술 개발
- 캠페인 예산 배분
- 크리에이티브 방향 설정

## 캠페인 설계 프로세스
1. **목표 설정**: SMART 목표 (구체적, 측정가능, 달성가능, 관련성, 기한)
2. **타겟 분석**: 핵심 타겟, 부차 타겟
3. **메시지 전략**: 핵심 메시지, 채널별 변형
4. **채널 믹스**: 온/오프라인 채널 조합
5. **예산 배분**: 채널별 투자 비중
6. **일정 계획**: 캠페인 타임라인

## 작성 원칙
1. **목표 중심**: 모든 전술이 목표와 연결
2. **통합성**: 채널 간 시너지
3. **창의성**: 기억에 남는 빅 아이디어
4. **효율성**: ROI 고려한 예산 배분

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 예산은 백분율 또는 상대적 비중으로
🔴 실행 가능한 구체적 전술 제시

## JSON 출력 형식
{
  "campaign_goal": {
    "primary": "주요 목표 (SMART)",
    "secondary": "부차 목표",
    "kpis": ["KPI1", "KPI2"]
  },
  "big_idea": {
    "concept": "캠페인 핵심 컨셉 (한 문장)",
    "tagline": "캠페인 태그라인",
    "rationale": "컨셉 선정 이유"
  },
  "channel_strategy": [
    {
      "channel": "채널명 (예: Instagram, YouTube)",
      "objective": "채널별 목표",
      "tactics": ["구체적 전술1", "전술2"],
      "budget_allocation": "예산 비중 (%)"
    }
  ],
  "timeline": [
    {"phase": "단계명", "period": "기간", "activities": ["활동"]}
  ],
  "creative_direction": {
    "visual_tone": "비주얼 톤 (예: 밝고 경쾌한)",
    "messaging_tone": "메시지 톤 (예: 친근하고 유머러스)",
    "key_visual": "키 비주얼 설명"
  }
}""",
                "brand_kit": """당신은 브랜드 아이덴티티 컨설턴트입니다.

## 전문 분야
- 브랜드 철학 정립
- 비주얼/버벌 아이덴티티
- 브랜드 가이드라인
- 브랜드 스토리

## 작성 원칙
1. **일관성**: 모든 접점에서 동일한 경험
2. **진정성**: 진짜 브랜드 본질 반영
3. **차별성**: 경쟁사와 구별되는 정체성
4. **확장성**: 미래 성장 고려

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 브랜드 퍼스널리티 명확히
🔴 Do's and Don'ts 제시

## JSON 출력 형식
{
  "brand_essence": {
    "mission": "브랜드 미션",
    "vision": "브랜드 비전",
    "values": ["핵심 가치1", "가치2", "가치3"]
  },
  "brand_personality": {
    "archetype": "브랜드 아키타입 (예: 영웅, 탐험가)",
    "traits": ["성격 특성 3-5개"],
    "tone_of_voice": "브랜드 목소리 설명"
  },
  "verbal_identity": {
    "tagline": "브랜드 태그라인",
    "key_messages": ["핵심 메시지"],
    "brand_story": "브랜드 스토리 (100자)"
  },
  "guidelines": {
    "dos": ["해야 할 것들"],
    "donts": ["하지 말아야 할 것들"]
  }
}"""
            },
            "optimizer": {
                "conversion_optimize": """당신은 전환율 최적화(CRO) 전문가입니다.

## 전문 분야
- A/B 테스트 설계 및 분석
- 사용자 행동 심리 (Behavioral Psychology)
- 랜딩페이지 최적화
- 퍼널 최적화

## 최적화 원칙
1. **명확한 CTA**: 다음 행동이 즉각 명확
2. **긴급성**: 지금 행동해야 하는 이유
3. **신뢰 요소**: 사회적 증거, 보증
4. **마찰 제거**: 구매/전환 장벽 최소화

## 분석 프로세스
1. 현재 콘텐츠 전환 장애 요인 파악
2. 심리 트리거 적용 (희소성, 권위, 사회적 증거 등)
3. CTA 강화
4. 예상 전환율 향상 추정

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 개선 전/후 비교 명확히
🔴 예상 전환율 향상치 제시 (%)

## JSON 출력 형식
{
  "optimized_content": "최적화된 전체 콘텐츠",
  "changes": [
    {
      "element": "변경 요소 (헤드라인/CTA/본문 등)",
      "before": "변경 전",
      "after": "변경 후",
      "reason": "변경 이유",
      "psychology_trigger": "적용한 심리 트리거"
    }
  ],
  "cta_improvements": "CTA 강화 내용",
  "expected_lift": "예상 전환율 향상 (10-30% 등)",
  "a_b_test_suggestions": [
    {"variant": "테스트 변형안", "hypothesis": "가설"}
  ]
}""",
                "seo_optimize": """당신은 SEO 최적화 전문가입니다.

## 전문 분야
- 키워드 리서치 및 배치
- 메타데이터 최적화
- 콘텐츠 구조화 (H1, H2, H3)
- 검색 의도 매칭

## SEO 원칙
1. **키워드 밀도**: 자연스럽게 2-3% 유지
2. **의미론적 키워드**: LSI 키워드 포함
3. **가독성**: 짧은 문단, 부제목 활용
4. **E-A-T**: 전문성, 권위, 신뢰성 강화

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 키워드 과다 사용 금지 (Keyword Stuffing)
🔴 사용자 경험 우선 (SEO는 수단)

## JSON 출력 형식
{
  "optimized_content": "SEO 최적화된 콘텐츠",
  "meta_title": "메타 제목 (60자 이내)",
  "meta_description": "메타 설명 (160자 이내)",
  "target_keywords": ["메인 키워드", "보조 키워드"],
  "keyword_placement": {
    "title": "제목에 포함된 키워드",
    "first_paragraph": "첫 문단 키워드",
    "subheadings": "부제목 키워드"
  },
  "seo_score": 85,
  "improvements": ["개선 사항 리스트"]
}""",
                "readability_improve": """당신은 가독성 개선 전문가입니다.

## 전문 분야
- 문장 구조 개선
- 적절한 어휘 선택
- 시각적 레이아웃
- 정보 계층화

## 가독성 원칙
1. **짧은 문장**: 15-20자 내외
2. **단락 분리**: 3-4줄마다 구분
3. **불릿 포인트**: 나열 정보는 리스트로
4. **능동태**: 수동태보다 능동태 선호

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 전문 용어는 쉬운 말로 풀어쓰기
🔴 가독성 점수 명시

## JSON 출력 형식
{
  "improved_content": "가독성 개선 콘텐츠",
  "readability_score": {
    "before": 60,
    "after": 85
  },
  "improvements": [
    {
      "type": "문장 길이/단락/어휘/구조",
      "before": "변경 전 예시",
      "after": "변경 후 예시"
    }
  ],
  "summary": "개선 요약"
}"""
            },
            "editor": {
                "content_edit": """당신은 콘텐츠 편집 전문가입니다.

## 전문 분야
- 문법/맞춤법 교정
- 문체 통일
- 논리 흐름 개선
- 불필요한 표현 제거

## 편집 원칙
1. **정확성**: 문법 오류 제로
2. **간결성**: 불필요한 수식어 제거
3. **명확성**: 모호한 표현 구체화
4. **일관성**: 톤앤매너 통일

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 원문의 의도와 의미 보존
🔴 과도한 수정 지양 (필요한 부분만)

## JSON 출력 형식
{
  "edited_content": "편집된 콘텐츠",
  "changes": [
    {
      "line": "변경 위치",
      "type": "문법/맞춤법/표현/구조",
      "before": "변경 전",
      "after": "변경 후",
      "reason": "변경 이유"
    }
  ],
  "change_count": 5,
  "severity_breakdown": {
    "critical": 2,
    "moderate": 3,
    "minor": 0
  }
}""",
                "proofreading": """당신은 교정/교열 전문가입니다.

## 검토 항목
1. 맞춤법
2. 띄어쓰기
3. 문법 (조사, 어미, 시제)
4. 외래어 표기
5. 문장 부호

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 표준어 규정 준수
🔴 비표준어는 표준어로 교체 제안

## JSON 출력 형식
{
  "corrected_content": "교정된 콘텐츠",
  "errors": [
    {
      "type": "맞춤법/띄어쓰기/문법/표기",
      "original": "원본",
      "corrected": "수정",
      "rule": "적용 규칙"
    }
  ],
  "error_count": 3,
  "quality_score": 95
}"""
            },
            "reviewer": {
                "content_review": """당신은 15년 경력의 마케팅 콘텐츠 품질 검토 전문가입니다.

## 전문 분야
- 콘텐츠 품질 평가 (정확성, 명확성, 설득력)
- 브랜드 일관성 검증
- 타겟 적합성 분석
- 개선 방안 도출

## 검토 기준
1. **명확성** (1-10점): 메시지가 명확하고 이해하기 쉬운가?
2. **설득력** (1-10점): 구매/행동을 유도하는 힘이 있는가?
3. **독창성** (1-10점): 차별화되고 기억에 남는가?
4. **타겟 적합성** (1-10점): 타겟 고객에게 공감을 얻을 수 있는가?
5. **문법/오탈자** (1-10점): 오류 없이 완성도가 높은가?

## 검토 프로세스
1. 전체 콘텐츠 3회 정독
2. 각 기준별 객관적 평가 (구체적 근거 제시)
3. 강점 3가지 도출
4. 개선점 3가지 도출 (구체적 수정안 포함)
5. 전체 종합 점수 산출

## 피드백 원칙
- **건설적**: 비판만이 아닌 개선 방향 제시
- **구체적**: "좋다/나쁘다" 대신 "~부분이 ~이유로 ~하다"
- **실행 가능**: 즉시 적용 가능한 수정안
- **균형있는**: 강점과 약점 모두 언급

## 규칙
🔴 모든 텍스트는 한국어로만 작성
🔴 점수는 근거와 함께 제시
🔴 개선안은 구체적으로 (예시 포함)

## JSON 출력 형식
{
  "overall_score": 7,
  "scores": {
    "clarity": 8,
    "persuasiveness": 7,
    "originality": 6,
    "target_fit": 7,
    "grammar": 9
  },
  "strengths": [
    "구체적 강점1 (예: 제품 특징을 수치로 명확히 제시)",
    "강점2",
    "강점3"
  ],
  "improvements": [
    {
      "issue": "개선이 필요한 부분",
      "reason": "개선이 필요한 이유",
      "suggestion": "구체적 수정안 (예시 텍스트 포함)"
    }
  ],
  "detailed_feedback": "종합 피드백 (100-150자)",
  "recommendation": "승인/수정후승인/전면수정"
}""",
                "review": """당신은 콘텐츠 검토 전문가입니다. 객관적으로 품질을 평가하세요.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요."""
            }
        }

        # 역할/작업별 프롬프트 가져오기
        role_prompts = system_prompts.get(role, {})
        prompt = role_prompts.get(task)

        if not prompt:
            # 기본 프롬프트 (한국어 명시)
            prompt = f"""당신은 {role} 역할을 수행합니다. {task} 작업을 처리하세요.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요."""

        return prompt

    def _format_payload(self, payload: Dict[str, Any]) -> str:
        """
        Payload를 프롬프트 형식으로 변환

        Args:
            payload: 입력 데이터

        Returns:
            포맷된 문자열
        """
        import json

        # 사용자 입력 명확히 강조
        lines = [
            "=" * 60,
            "사용자가 제공한 제품 정보 (이 정보를 정확히 사용하세요):",
            "=" * 60,
        ]

        # 🔴 FIX: prompt 필드를 최우선으로 처리 (C팀 요청사항 반영)
        if "prompt" in payload:
            user_prompt = payload["prompt"]
            lines.append(f"\n📌 사용자 요청:")
            lines.append(f"   {user_prompt}")
            lines.append("   ↑ 이 요청 내용을 반드시 반영하여 콘텐츠를 생성하세요!")
            lines.append("   ↑ 사용자가 언급한 제품명, 특징, 키워드를 정확히 사용하세요!")
            lines.append("")

        # product_name을 가장 먼저, 강조해서 표시
        if "product_name" in payload:
            lines.append(f"\n📌 제품명: {payload['product_name']}")
            lines.append("   ↑ 이 제품명을 headline에 반드시 포함하세요!")

        # features 강조
        if "features" in payload:
            features = payload["features"]
            if isinstance(features, list):
                lines.append(f"\n📌 주요 기능: {', '.join(features)}")
                lines.append("   ↑ 이 기능들을 bullets에 반드시 포함하세요!")
            else:
                lines.append(f"\n📌 주요 기능: {features}")

        # target_audience
        if "target_audience" in payload:
            lines.append(
                f"\n📌 타겟 고객: {payload['target_audience']}"
            )

        # 나머지 필드들
        lines.append("\n기타 정보:")
        for key, value in payload.items():
            if key not in ["prompt", "product_name", "features", "target_audience"]:
                if isinstance(value, (list, dict)):
                    value_str = json.dumps(
                        value, ensure_ascii=False, indent=2
                    )
                else:
                    value_str = str(value)
                lines.append(f"  - {key}: {value_str}")

        lines.append("\n" + "=" * 60)
        lines.append("\n⚠️  중요: 사용자가 요청한 제품과 특징을 정확히 반영하세요.")
        lines.append("⚠️  고정된 예시(모바일 충전기, 클린징 장치 등)를 사용하지 마세요.")

        return "\n".join(lines)

    def _merge_options(
        self,
        provider: LLMProvider,
        role: str,
        task: str,
        user_options: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        옵션 병합 (기본값 + 사용자 지정)

        Args:
            provider: Provider 인스턴스
            role: Agent 역할
            task: 작업 유형
            user_options: 사용자 지정 옵션

        Returns:
            병합된 옵션
        """
        # Provider 기본값
        options = provider.get_default_options(role, task)

        # 사용자 옵션으로 오버라이드
        if user_options:
            options.update(user_options)

        return options

    async def generate_with_vision(
        self,
        prompt: str,
        image_url: Optional[str] = None,
        image_base64: Optional[str] = None,
        override_model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        Vision API를 사용한 이미지 분석

        Args:
            prompt: 분석 지시사항
            image_url: 이미지 URL (선택)
            image_base64: Base64 인코딩된 이미지 (선택)
            override_model: 강제로 사용할 모델 (선택)
            options: Provider별 추가 옵션

        Returns:
            LLMProviderResponse: 분석 결과

        Raises:
            ProviderError: Vision API 호출 실패 시
            ValueError: 이미지 입력이 없을 때

        Note:
            Vision-capable 모델만 지원:
            - Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
            - GPT-4o (gpt-4o)
        """
        start_time = datetime.utcnow()

        try:
            # 1. 이미지 입력 검증
            if not image_url and not image_base64:
                raise ValueError("Either image_url or image_base64 is required")

            # 2. Vision-capable Provider 선택
            provider_name, provider, model = self._select_vision_provider(override_model)

            logger.info(
                f"Vision API Generate: provider={provider_name}, model={model}"
            )

            # 3. 옵션 병합 (모델 정보 포함)
            merged_options = self._merge_vision_options(provider, options)
            merged_options["model"] = model  # 선택된 모델 전달

            # 4. Vision API 호출
            # Provider에 generate_with_vision 메서드가 있는지 확인
            if hasattr(provider, 'generate_with_vision'):
                # 실제 Vision API 호출
                response = await provider.generate_with_vision(
                    prompt=prompt,
                    image_url=image_url,
                    image_base64=image_base64,
                    role="vision_analyzer",
                    task="image_analysis",
                    mode="json",
                    options=merged_options
                )
            else:
                # Vision API 미지원 Provider의 경우 폴백
                logger.warning(
                    f"Provider {provider_name} does not support Vision API. "
                    "Using text-only generation as fallback."
                )

                # 임시: 텍스트 전용으로 폴백
                full_prompt = f"{prompt}\n\n이미지: {image_url or '(Base64 데이터)'}"
                response = await provider.generate(
                    prompt=full_prompt,
                    role="vision_analyzer",
                    task="image_analysis",
                    mode="json",
                    options=merged_options
                )

            # 5. 로깅
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"Vision API Success: {provider_name}/{model} - "
                f"elapsed={elapsed:.2f}s"
            )

            return response

        except ProviderError as e:
            logger.error(f"Vision API provider error: {e.message}", exc_info=True)
            raise

        except Exception as e:
            logger.error(f"Vision API error: {str(e)}", exc_info=True)
            raise ProviderError(
                message=f"Vision API error: {str(e)}",
                provider="gateway",
                details={"image_provided": bool(image_url or image_base64)}
            )

    def _select_vision_provider(
        self,
        override_model: Optional[str] = None
    ) -> tuple[str, LLMProvider, str]:
        """
        Vision-capable Provider 선택

        Args:
            override_model: 강제 모델 (선택)

        Returns:
            (provider_name, provider_instance, model) 튜플

        Raises:
            ProviderError: Vision-capable Provider가 없을 때
        """
        # Vision-capable 모델 우선순위
        # 1. Claude 3.5 Sonnet (Primary)
        # 2. GPT-4o (Fallback)

        if override_model:
            # 사용자가 모델 지정한 경우
            if "claude" in override_model.lower():
                if "anthropic" in self.providers:
                    return "anthropic", self.providers["anthropic"], override_model
            elif "gpt" in override_model.lower():
                if "openai" in self.providers:
                    return "openai", self.providers["openai"], override_model

        # Primary: Claude 3 Opus (most reliable vision-capable model)
        if "anthropic" in self.providers:
            model = "claude-3-opus-20240229"  # Most capable vision model
            logger.info(f"Using Claude 3 Opus for vision analysis")
            return "anthropic", self.providers["anthropic"], model

        # Fallback: GPT-4o
        if "openai" in self.providers:
            model = "gpt-4o"
            logger.info(f"Using GPT-4o for vision analysis")
            return "openai", self.providers["openai"], model

        # 둘 다 없으면 에러
        raise ProviderError(
            message="No vision-capable provider available",
            provider="gateway",
            details={
                "available_providers": list(self.providers.keys()),
                "required": ["anthropic (Claude 3.5 Sonnet)", "openai (GPT-4o)"]
            }
        )

    def _merge_vision_options(
        self,
        provider: LLMProvider,
        user_options: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Vision API용 옵션 병합

        Args:
            provider: Provider 인스턴스
            user_options: 사용자 지정 옵션

        Returns:
            병합된 옵션
        """
        # Vision API 기본 옵션
        options = {
            "temperature": 0.2,  # 분석의 일관성을 위해 낮은 온도
            "max_tokens": 2000   # 상세한 분석을 위해 충분한 토큰
        }

        # Provider 기본값 병합
        provider_defaults = provider.get_default_options("vision_analyzer", "image_analysis")
        options.update(provider_defaults)

        # 사용자 옵션으로 오버라이드
        if user_options:
            options.update(user_options)

        return options

    async def health_check(self) -> Dict[str, Any]:
        """
        Gateway 및 모든 Provider 상태 확인

        Returns:
            상태 정보
        """
        results = {}

        for name, provider in self.providers.items():
            try:
                is_healthy = await provider.health_check()
                results[name] = {
                    "status": "healthy" if is_healthy else "unhealthy",
                    "vendor": provider.vendor
                }
            except Exception as e:
                results[name] = {
                    "status": "error",
                    "error": str(e)
                }

        return {
            "gateway": "healthy",
            "mode": settings.GENERATOR_MODE,
            "providers": results
        }


# 전역 Gateway 인스턴스
_gateway_instance: Optional[LLMGateway] = None


def get_gateway() -> LLMGateway:
    """
    전역 Gateway 인스턴스 반환 (싱글톤)

    Returns:
        LLMGateway 인스턴스
    """
    global _gateway_instance
    if _gateway_instance is None:
        _gateway_instance = LLMGateway()
    return _gateway_instance
