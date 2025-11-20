import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from app.services.llm.gateway import LLMGateway
from app.schemas.llm import LLMSelection
from app.core.config import settings

async def test_live_llm():
    print("=== Starting Live LLM Verification ===")
    print(f"Generator Mode: {settings.generator_mode}")
    print(f"Ollama URL: {settings.ollama_base_url}")
    print(f"Gemini Model: {settings.gemini_text_model}")
    
    gateway = LLMGateway()
    
    # Test Data
    role = "copywriter"
    task = "sns"
    payload = {"prompt": "Say 'Hello' in Korean."}
    
    providers_to_test = [
        ("openai", "GPT-4o"),
        ("gemini", "Gemini"),
        ("ollama", "Ollama (Qwen)"),
        ("llama", "Ollama (Llama)"),
        ("mistral", "Ollama (Mistral)")
    ]
    
    for provider_key, provider_name in providers_to_test:
        print(f"\n--- Testing {provider_name} ({provider_key}) ---")
        try:
            selection = LLMSelection(mode="manual", text=provider_key)
            response = await gateway.generate(
                role=role,
                task=task,
                payload=payload,
                llm_selection=selection
            )
            print(f"✅ Success!")
            print(f"Model: {response.model}")
            print(f"Output: {response.output.value}")
        except Exception as e:
            print(f"❌ Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_live_llm())
