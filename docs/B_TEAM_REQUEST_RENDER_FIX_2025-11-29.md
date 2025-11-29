# B팀 요청서: Video Pipeline V2 RENDER 모드 실패 수정

**작성일**: 2025-11-29
**작성자**: C팀 (Frontend)
**우선순위**: 🔴 P0 (Blocking)
**상태**: 대기중

---

## 요청 요약

Video Pipeline V2 End-to-End 테스트 중 RENDER 모드에서 이미지 생성 실패.
**원인: `MediaGateway` 객체에 `generate_image` 메서드가 없음.**

---

## 테스트 결과 요약

| 단계 | API | 상태 | 비고 |
|------|-----|------|------|
| 1. 프로젝트 생성 | POST /api/v1/video6/projects | ✅ 201 Created | 정상 |
| 2. PLAN 모드 | POST /api/v1/video6/{id}/plan | ✅ 200 OK | LLM이 6개 씬 생성 |
| 3. RENDER 모드 | POST /api/v1/video6/{id}/render | ❌ Failed | 이미지 생성 실패 |

---

## 에러 상세

### 백엔드 로그 (Mac mini)

```
INFO:     [VisionGeneratorAgent] Generating image for scene 1
WARNING:  [VisionGeneratorAgent] Nanobanana failed, trying fallback: 'MediaGateway' object has no attribute 'generate_image'
WARNING:  [VisionGeneratorAgent] DALL-E failed: 'MediaGateway' object has no attribute 'generate_image'
ERROR:    [VisionGeneratorAgent] Image generation failed for scene 1: All providers failed

INFO:     [VisionGeneratorAgent] Generating image for scene 2
WARNING:  [VisionGeneratorAgent] Nanobanana failed, trying fallback: 'MediaGateway' object has no attribute 'generate_image'
WARNING:  [VisionGeneratorAgent] DALL-E failed: 'MediaGateway' object has no attribute 'generate_image'
ERROR:    [VisionGeneratorAgent] Image generation failed for scene 2: All providers failed

... (scene 3, 4, 5, 6 동일)

WARNING:  [VideoDirector] No image for scene 1
WARNING:  [VideoDirector] No image for scene 2
WARNING:  [VideoDirector] No image for scene 3
WARNING:  [VideoDirector] No image for scene 4
WARNING:  [VideoDirector] No image for scene 5
WARNING:  [VideoDirector] No image for scene 6

ERROR:    [VideoDirectorAgent] RENDER mode failed: List should have at least 1 item after validation, not 0
```

### 문제 원인

`MediaGateway` 클래스에 `generate_image` 메서드가 구현되어 있지 않음.

```python
# 예상 호출 코드 (VisionGeneratorAgent)
image_url = await self.media_gateway.generate_image(prompt, provider="nanobanana")
# ↑ AttributeError: 'MediaGateway' object has no attribute 'generate_image'
```

---

## 요청 사항

### 방법 1: MediaGateway에 generate_image 메서드 추가 (권장)

```python
# backend/app/services/media_gateway.py

class MediaGateway:
    async def generate_image(
        self,
        prompt: str,
        provider: str = "nanobanana",
        width: int = 1024,
        height: int = 1024,
        **kwargs
    ) -> str:
        """
        이미지 생성 API 호출

        Args:
            prompt: 이미지 생성 프롬프트
            provider: nanobanana, dalle, comfyui 등
            width: 이미지 너비
            height: 이미지 높이

        Returns:
            생성된 이미지 URL
        """
        if provider == "nanobanana":
            return await self._generate_nanobanana(prompt, width, height)
        elif provider == "dalle":
            return await self._generate_dalle(prompt, width, height)
        elif provider == "comfyui":
            return await self._generate_comfyui(prompt, width, height)
        else:
            raise ValueError(f"Unknown provider: {provider}")
```

### 방법 2: VisionGeneratorAgent에서 직접 API 호출

`MediaGateway`를 거치지 않고 VisionGeneratorAgent에서 직접 이미지 생성 API 호출.

---

## 현재 MediaGateway 상태 확인 명령

```bash
# MediaGateway 클래스 확인
ssh woosun@100.123.51.5 "grep -n 'def generate' ~/sparklio_ai_marketing_studio/backend/app/services/media_gateway.py"

# VisionGeneratorAgent 이미지 생성 코드 확인
ssh woosun@100.123.51.5 "grep -n 'generate_image' ~/sparklio_ai_marketing_studio/backend/app/services/agents/vision_generator_agent.py"
```

---

## 영향 범위

| 기능 | 상태 | 비고 |
|------|------|------|
| Video6 프로젝트 생성 | ✅ 정상 | - |
| Video6 PLAN 모드 | ✅ 정상 | LLM 플랜 생성 성공 |
| Video6 RENDER 모드 | ❌ 차단 | 이미지 생성 불가 |
| VisionGeneratorAgent | ❌ 차단 | MediaGateway 의존성 |

---

## 우선순위 근거

1. Video Pipeline V2의 핵심 기능 (RENDER)이 완전히 차단됨
2. Frontend E2E 테스트 완료 불가
3. PLAN 모드까지는 성공했으므로 이 부분만 해결하면 전체 플로우 완성

---

## 테스트 환경

- **Frontend**: Windows Laptop (`localhost:3001`)
- **Backend**: Mac mini (`100.123.51.5:8000`)
- **테스트 주제**: "핸드크림 겨울 할인 이벤트"
- **모드**: creative

---

## 프론트엔드 수정 완료 사항

C팀에서 이미 완료한 수정:

1. ✅ API 스키마 매핑 (`plan_draft` → `plan`)
2. ✅ 비동기 state 문제 해결 (`projectIdOverride` 파라미터)
3. ✅ PLAN 요청 body 추가 (`mode`, `total_duration_sec`, `music_mood`)
4. ✅ Video6Modal 통합

---

## 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 환경**: Windows Laptop (`localhost:3001`)
- **대상 서버**: Mac mini (`100.123.51.5:8000`)
