# EOD Report - 2025년 11월 19일

**작성자**: B팀 (Backend)
**작성일**: 2025-11-19
**작업 시간**: 09:00 - 23:00 (약 14시간)

---

## 📋 오늘의 주요 성과

### 1. 🔴 긴급 버그 수정: LLM Provider 구조적 결함 해결

#### 문제 발견
- **증상**: 서버 시작 시 `TypeError: Can't instantiate abstract class AnthropicProvider with abstract methods supports_json, vendor` 에러 발생
- **영향 범위**: Anthropic, Gemini, Novita 3개 Provider 모두 인스턴스화 불가능
- **근본 원인**: 어제(11/17) 작성된 Provider 코드가 Base Class의 추상 메서드를 제대로 구현하지 않음

#### 수정 내용
**파일**: `app/services/llm/providers/anthropic_provider.py`, `gemini_provider.py`, `novita_provider.py`

1. **Abstract Properties 추가**
   ```python
   @property
   def vendor(self) -> str:
       return "anthropic"  # 또는 "gemini", "novita"

   @property
   def supports_json(self) -> bool:
       return True
   ```

2. **generate() 메서드 시그니처 수정**
   - **Before**: `async def generate(self, prompt: str, options: Optional[Dict]) -> LLMProviderOutput`
   - **After**: `async def generate(self, prompt: str, role: str, task: str, mode: str = "json", options: Optional[Dict]) -> LLMProviderResponse`

3. **반환 타입 변경**
   - `LLMProviderOutput` → `LLMProviderResponse` (표준 형식)
   - 메타데이터 추가 (role, task, latency, temperature 등)

#### 결과
✅ 모든 LLM Provider 정상 초기화
✅ Ollama, OpenAI, Anthropic, Gemini, Novita 5개 Provider 작동 확인

---

### 2. 🎯 핵심 기능 수정: Prompt 자동 변환 기능 구현

#### 문제 발견
- **증상**: 프론트엔드에서 "지성 피부용 진정 토너" 입력 시 `${initial.product_name}` 템플릿 변수가 그대로 출력됨
- **근본 원인**:
  1. Workflow가 `${initial.product_name}` 템플릿 사용
  2. 프론트엔드는 `{prompt: "지성 피부용 진정 토너"}` 형식으로 전송
  3. `product_name` 필드가 없어 템플릿 치환 실패

#### 해결 방법
**파일**: `app/services/generator/service.py`

**새로운 메서드 추가**: `_prepare_workflow_payload()`

```python
def _prepare_workflow_payload(
    self,
    kind: str,
    input_data: Dict[str, Any],
    brand_id: str,
    options: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """자유 형식 입력(prompt)을 구조화된 데이터로 자동 변환"""

    payload = {"brand_id": brand_id, **(options or {})}

    # product_detail의 경우 특별 처리
    if kind in ["product_detail", "sns_set", "presentation_simple"]:
        if "prompt" in input_data:
            # 자유 형식 입력 → 구조화
            user_prompt = input_data["prompt"]
            payload.update({
                "product_name": user_prompt,
                "features": [user_prompt],
                "target_audience": "일반 소비자",
                "category": "제품",
                "description": user_prompt
            })
        else:
            # 구조화된 입력은 그대로 사용
            payload.update(input_data)

    return payload
```

#### 테스트 결과
**입력**:
```json
{
  "kind": "product_detail",
  "brandId": "test_brand",
  "input": {
    "prompt": "지성 피부용 진정 토너"
  }
}
```

**출력**:
```json
{
  "text": {
    "headline": "지성 피부용 진정 토너",
    "subheadline": "피부를 촉촉하게 진정시키세요",
    "body": "당신의 지성 피부에 필요한 진정 효과와 보습력을 경험해보세요...",
    "bullets": ["有效减少分泌物", "温和镇静肌肤", "深层保湿"],
    "cta": "立即购买，让肌肤回归平衡"
  }
}
```

✅ 템플릿 변수 제거 완료
✅ 사용자 입력이 정확하게 LLM에 전달됨
⚠️ LLM이 일부 중국어로 응답 (LLM 자체 문제, 코드 문제 아님)

---

## 🐛 트러블슈팅 경험

### Issue 1: Python Module Caching 문제
- **증상**: 코드 수정 후에도 이전 에러 계속 발생
- **원인**: uvicorn의 auto-reload가 싱글톤 인스턴스를 재생성하지 않음
- **해결**: `__pycache__` 삭제 + 프로세스 완전 재시작

### Issue 2: Multiple Server Processes
- **증상**: 6개의 서로 다른 프로세스가 포트 8000에서 동시 실행
- **원인**: 서버 재시작 시 이전 프로세스가 완전히 종료되지 않음
- **해결**: `taskkill //F //IM python.exe //T`로 모든 프로세스 종료 후 재시작

### Issue 3: Import Path 문제
- **증상**: NanoBanana Provider import 실패 (`No module named 'google.genai'`)
- **원인**: 잘못된 import 문법 사용
- **해결**: `import google.genai` → `from google import genai`

---

## 📁 수정된 파일 목록

### LLM Providers (3개 파일)
1. **app/services/llm/providers/anthropic_provider.py**
   - vendor, supports_json property 추가
   - generate() 시그니처 수정
   - LLMProviderResponse 반환

2. **app/services/llm/providers/gemini_provider.py**
   - 동일한 수정 적용

3. **app/services/llm/providers/novita_provider.py**
   - 동일한 수정 적용

### Generator Service (1개 파일)
4. **app/services/generator/service.py** ⭐
   - `_prepare_workflow_payload()` 메서드 추가
   - prompt 자동 변환 로직 구현
   - Optional import 추가

---

## 🎓 학습 내용

### 1. Python Abstract Base Class (ABC)
- `@property`, `@abstractmethod` 데코레이터 순서 중요
- Abstract method 시그니처 완벽히 일치해야 함
- 자식 클래스에서 반드시 구현해야 인스턴스화 가능

### 2. Workflow Template Variable Substitution
- `${initial.field_name}` 형식으로 템플릿 변수 사용
- initial_payload에 해당 필드가 없으면 치환 실패
- 자유 형식 입력 지원을 위해 사전 변환 필요

### 3. FastAPI + Uvicorn Hot Reload 한계
- 싱글톤 패턴 사용 시 reload가 제대로 작동하지 않음
- 모듈 레벨 변수는 재로드되지 않음
- 완전한 재시작이 필요한 경우가 많음

---

## 📊 현재 시스템 상태

### ✅ 작동 중인 기능
- FastAPI 서버 (포트 8000)
- 5개 LLM Provider (Ollama, OpenAI, Anthropic, Gemini, Novita)
- Workflow 기반 콘텐츠 생성
- Mock/Live 모드 전환
- Prompt 자동 변환

### ⚠️ 알려진 제한사항
- NanoBanana Provider (Gemini Image): `google-genai` 패키지 미설치로 비활성화
- LLM 응답 언어 불안정 (중국어 혼입)

### 🔧 환경 설정
- Python 3.11.8
- GENERATOR_MODE=live
- LOG_LEVEL=INFO
- 기본 LLM: Ollama (qwen2.5:7b)

---

## 🚀 다음 단계

내일 작업 항목은 별도 문서 `NEXT_SESSION_GUIDE_2025-11-20.md` 참고

---

## 💡 중요 노트

### For Next Developer

1. **서버 재시작 시 주의사항**
   ```bash
   # 이전 프로세스 완전 종료 필수
   taskkill //F //IM python.exe //T

   # 캐시 삭제 권장
   find app -type d -name __pycache__ -exec rm -rf {} +

   # 재시작
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Prompt 입력 형식**
   - 자유 형식: `{"prompt": "제품명 또는 설명"}`
   - 구조화 형식: `{"product_name": "...", "features": [...], ...}`
   - 둘 다 지원함

3. **LLM Provider 추가 시 체크리스트**
   - [ ] `vendor` property 구현
   - [ ] `supports_json` property 구현
   - [ ] `generate()` 시그니처 정확히 일치
   - [ ] `LLMProviderResponse` 반환
   - [ ] 에러 처리 시 `ProviderError` 사용

---

**작성 완료 시각**: 2025-11-19 23:00
**다음 세션**: 2025-11-20 오전
