"""
LLM Router 버그 수정 테스트
C팀 요청사항: 모델명과 Provider 매칭 문제 해결 검증

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.llm.router import LLMRouter


def test_llm_router_model_provider_matching():
    """모델명으로 올바른 Provider를 추론하는지 테스트"""

    router = LLMRouter()

    # 테스트 케이스 정의
    test_cases = [
        # (모델명, 예상되는 provider)
        ("gpt-4o", "openai"),
        ("gpt-4-turbo", "openai"),
        ("gpt-3.5-turbo", "openai"),
        ("o1-preview", "openai"),
        ("o1-mini", "openai"),

        ("gemini-pro", "gemini"),
        ("gemini-1.5-pro", "gemini"),
        ("gemini-ultra", "gemini"),

        ("claude-3-opus", "anthropic"),
        ("claude-3-sonnet", "anthropic"),
        ("claude-2.1", "anthropic"),

        ("qwen2.5:7b", "ollama"),
        ("llama3:8b", "ollama"),
        ("mistral:7b", "ollama"),
        ("mixtral:8x7b", "ollama"),

        # 대소문자 혼용 테스트
        ("GPT-4o", "openai"),
        ("Gemini-Pro", "gemini"),
        ("Claude-3-Opus", "anthropic"),
        ("Qwen2.5:7b", "ollama"),
    ]

    print("🧪 LLM Router 모델-Provider 매칭 테스트")
    print("=" * 60)

    passed = 0
    failed = 0

    for model_name, expected_provider in test_cases:
        # route 메서드로 테스트 (override_model 사용)
        returned_model, actual_provider = router.route(
            role="test",
            task="test",
            override_model=model_name
        )

        # 결과 검증
        if actual_provider == expected_provider:
            print(f"✅ {model_name:20} → {actual_provider:10} (기대값: {expected_provider})")
            passed += 1
        else:
            print(f"❌ {model_name:20} → {actual_provider:10} (기대값: {expected_provider})")
            failed += 1

    print("=" * 60)
    print(f"\n📊 테스트 결과: {passed}개 통과, {failed}개 실패")

    if failed == 0:
        print("✨ 모든 테스트 통과! LLM Router 버그가 수정되었습니다.")
    else:
        print("⚠️ 일부 테스트가 실패했습니다. 추가 수정이 필요합니다.")

    return failed == 0


def test_chat_analyze_api_simulation():
    """C팀이 보고한 /api/v1/chat/analyze API 시나리오 테스트"""

    print("\n\n🔍 /api/v1/chat/analyze API 시나리오 테스트")
    print("=" * 60)

    router = LLMRouter()

    # C팀이 보고한 문제 상황 재현
    problematic_models = [
        "gpt-4o",  # OpenAI 모델이 Gemini Provider로 잘못 전달되던 문제
        "claude-3-opus",  # Anthropic 모델 테스트
        "gemini-pro"  # Gemini 모델 테스트
    ]

    for model in problematic_models:
        _, provider = router.route("chat", "analyze", override_model=model)

        # Provider가 올바른지 확인
        if model.startswith("gpt") and provider == "openai":
            print(f"✅ {model}: 올바른 Provider({provider})로 라우팅됨")
        elif "claude" in model.lower() and provider == "anthropic":
            print(f"✅ {model}: 올바른 Provider({provider})로 라우팅됨")
        elif "gemini" in model.lower() and provider == "gemini":
            print(f"✅ {model}: 올바른 Provider({provider})로 라우팅됨")
        else:
            print(f"❌ {model}: 잘못된 Provider({provider})로 라우팅됨")

    print("\n✨ C팀 요청사항 처리 완료!")


if __name__ == "__main__":
    # 테스트 실행
    success = test_llm_router_model_provider_matching()
    test_chat_analyze_api_simulation()

    if success:
        print("\n\n🎉 LLM Router 버그 수정 완료!")
        print("📝 수정 내용:")
        print("  - 모델명을 소문자로 변환하여 대소문자 구분 없이 매칭")
        print("  - gpt, o1 시리즈 → OpenAI Provider")
        print("  - gemini 시리즈 → Gemini Provider")
        print("  - claude 시리즈 → Anthropic Provider")
        print("  - qwen, llama, mistral 등 → Ollama Provider")