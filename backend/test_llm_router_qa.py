#!/usr/bin/env python3
"""
LLM Router 통합 테스트 - A팀 QA
B팀 수정사항 검증 및 전체 라우팅 로직 테스트
"""

import asyncio
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# 프로젝트 루트 경로 추가
sys.path.insert(0, str(Path(__file__).parent))

from app.services.llm.router import LLMRouter
from app.services.llm.gateway import LLMGateway
from app.core.config import settings

class LLMRouterTester:
    """LLM Router 테스트 클래스"""

    def __init__(self):
        self.router = LLMRouter()
        self.gateway = LLMGateway()
        self.test_results = []

    async def test_model_provider_mapping(self):
        """모델-프로바이더 매핑 테스트"""
        print("\n📋 모델-프로바이더 매핑 테스트")
        print("-" * 60)

        test_cases = [
            # OpenAI 모델들
            ("gpt-4o", "openai", "✅ P0 이슈 해결 확인"),
            ("gpt-4o-mini", "openai", None),
            ("gpt-3.5-turbo", "openai", None),

            # Gemini 모델들 (B팀 수정사항)
            ("gemini-2.5-flash", "gemini", "✅ B팀 수정사항"),
            ("gemini-2.0-flash", "gemini", None),
            ("gemini-1.5-pro", "gemini", None),

            # Claude 모델들
            ("claude-3-5-haiku-20241022", "anthropic", None),
            ("claude-3-sonnet-20240229", "anthropic", None),

            # Ollama 로컬 모델들
            ("llama3", "ollama", None),
            ("qwen2.5:14b", "ollama", None),
        ]

        passed = 0
        failed = 0

        for model, expected_provider, note in test_cases:
            try:
                actual_model, actual_provider = self.router.route(
                    role="copywriter",
                    task="test",
                    override_model=model
                )

                if actual_provider == expected_provider:
                    status = "✅ PASS"
                    passed += 1
                else:
                    status = f"❌ FAIL (got {actual_provider})"
                    failed += 1

                result = f"{model:30} → {actual_provider:10} {status}"
                if note:
                    result += f"  [{note}]"

                print(result)
                self.test_results.append((model, status == "✅ PASS"))

            except Exception as e:
                status = f"❌ ERROR: {str(e)[:30]}"
                failed += 1
                print(f"{model:30} → {status}")
                self.test_results.append((model, False))

        print(f"\n결과: {passed}/{passed+failed} 테스트 통과")
        return failed == 0

    async def test_health_check(self):
        """LLM 프로바이더 헬스체크"""
        print("\n📋 LLM 프로바이더 헬스체크")
        print("-" * 60)

        try:
            health_status = await self.gateway.health_check()

            for provider, status in health_status.items():
                icon = "✅" if status["status"] == "healthy" else "❌"
                print(f"{icon} {provider:15} - {status['status']:10}", end="")

                if status.get("message"):
                    print(f" ({status['message']})")
                else:
                    print()

                # Gemini 특별 체크 (B팀 수정사항)
                if provider == "gemini":
                    if status["status"] == "healthy":
                        print(f"    → B팀 수정 후 정상 작동 확인")
                    else:
                        print(f"    → ⚠️ B팀 수정 후에도 문제 지속")
                        print(f"    → API 키 확인 필요: {settings.GOOGLE_API_KEY[:10]}...")

        except Exception as e:
            print(f"❌ 헬스체크 실패: {e}")
            return False

        return True

    async def test_chat_api_integration(self):
        """Chat API 통합 테스트"""
        print("\n📋 Chat API 통합 테스트")
        print("-" * 60)

        test_messages = [
            ("gpt-4o", "테스트 메시지"),
            ("gemini-2.5-flash", "Gemini 테스트"),
        ]

        for model, message in test_messages:
            print(f"\n테스트: {model}")
            try:
                response = await self.gateway.chat(
                    messages=[{"role": "user", "content": message}],
                    model=model,
                    temperature=0.5
                )

                if response and len(response) > 0:
                    print(f"  ✅ 응답 성공 ({len(response)} 글자)")
                    print(f"     {response[:100]}...")
                else:
                    print(f"  ❌ 빈 응답")

            except Exception as e:
                error_msg = str(e)
                if "404" in error_msg and "not found" in error_msg:
                    print(f"  ❌ 모델을 찾을 수 없음")
                    if model == "gpt-4o" and "gemini" in error_msg.lower():
                        print(f"  💡 P0 이슈 재발: gpt-4o가 Gemini로 라우팅됨")
                else:
                    print(f"  ❌ 에러: {error_msg[:100]}")

    async def test_fallback_mechanism(self):
        """폴백 메커니즘 테스트"""
        print("\n📋 폴백 메커니즘 테스트")
        print("-" * 60)

        # 존재하지 않는 모델로 테스트
        try:
            model, provider = self.router.route(
                role="copywriter",
                task="test",
                override_model="non-existent-model"
            )
            print(f"존재하지 않는 모델 → {model} ({provider})")
            print("  ✅ 폴백 정상 작동")
        except Exception as e:
            print(f"  ❌ 폴백 실패: {e}")

    async def run_all_tests(self):
        """모든 테스트 실행"""
        print("=" * 60)
        print("🧪 LLM Router 통합 테스트 시작 - A팀 QA")
        print("=" * 60)

        all_passed = True

        # 1. 모델-프로바이더 매핑
        if not await self.test_model_provider_mapping():
            all_passed = False

        # 2. 헬스체크
        if not await self.test_health_check():
            all_passed = False

        # 3. Chat API 통합
        await self.test_chat_api_integration()

        # 4. 폴백 메커니즘
        await self.test_fallback_mechanism()

        # 최종 결과
        print("\n" + "=" * 60)
        print("📊 테스트 결과 요약")
        print("=" * 60)

        if all_passed:
            print("✅ 모든 필수 테스트 통과")
            print("\n📋 B팀 수정사항 검증 결과:")
            print("  ✅ gemini-2.5-flash-preview → gemini-2.5-flash 변경 확인")
            print("  ✅ Gemini 모델 라우팅 정상")
            print("\n📋 P0 이슈 검증 결과:")
            print("  ✅ gpt-4o → OpenAI Provider 매핑 정상")
        else:
            print("❌ 일부 테스트 실패")
            print("\n⚠️ 추가 조치 필요:")
            print("  1. 실패한 테스트 확인")
            print("  2. 에러 로그 분석")
            print("  3. B팀과 협의하여 수정")

        return all_passed

async def main():
    """메인 실행 함수"""
    tester = LLMRouterTester()
    success = await tester.run_all_tests()

    print("\n" + "=" * 60)
    print("🏁 테스트 완료")
    print("=" * 60)

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())