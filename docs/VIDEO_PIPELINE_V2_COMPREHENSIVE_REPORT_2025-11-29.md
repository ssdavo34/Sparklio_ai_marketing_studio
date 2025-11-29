# Video Pipeline V2 종합 보고서

**작성일**: 2025-11-29 18:30
**작성자**: C팀 (Frontend)
**문서 버전**: 1.0
**상태**: 긴급 - B팀 조치 필요

---

## 목차

1. [파이프라인 기준 흐름](#1-파이프라인-기준-흐름)
2. [관련 파일 목록](#2-관련-파일-목록)
3. [현재 문제점 상세](#3-현재-문제점-상세)
4. [테스트 결과 요약](#4-테스트-결과-요약)
5. [B팀 요청 사항](#5-b팀-요청-사항)

---

## 1. 파이프라인 기준 흐름

### 1.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          VIDEO PIPELINE V2                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [Frontend - C팀]                     [Backend - B팀]                   │
│                                                                          │
│   ┌─────────────┐                      ┌─────────────────────┐          │
│   │ Video6Modal │  ─── HTTP ───────▶   │ /api/v1/video6/*    │          │
│   │ Video6Panel │                      │                     │          │
│   │ useVideo6   │  ◀─── JSON ──────    │ video_director.py   │          │
│   └─────────────┘                      └──────────┬──────────┘          │
│                                                   │                      │
│                                                   ▼                      │
│                                        ┌─────────────────────┐          │
│                                        │  VisionGenerator    │          │
│                                        │  Agent              │          │
│                                        └──────────┬──────────┘          │
│                                                   │                      │
│                                                   ▼                      │
│                                        ┌─────────────────────┐          │
│                                        │  NanoBanana         │          │
│                                        │  Provider           │          │
│                                        └──────────┬──────────┘          │
│                                                   │                      │
│                                                   ▼                      │
│                                        ┌─────────────────────┐          │
│                                        │  Gemini API         │  ❌ 차단  │
│                                        │  gemini-2.5-flash   │          │
│                                        └─────────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 2단계 플로우 (PLAN → RENDER)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          STEP 1: PLAN 단계                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   User Input          Frontend                    Backend                 │
│   ──────────          ────────                    ───────                 │
│                                                                           │
│   1. 모드 선택        selectMode('creative')                              │
│      (CREATIVE)                                                           │
│                              │                                            │
│   2. 주제 입력        setTopic('겨울 패딩 세일')                          │
│                              │                                            │
│   3. PLAN 버튼  ───▶  createProject() ───────▶  POST /projects           │
│      클릭                    │                        │                   │
│                              │                   ◀────┘ project_id        │
│                              │                                            │
│                       executePlan() ─────────▶  POST /{id}/plan          │
│                              │                        │                   │
│                              │                   LLM 호출 (스크립트 생성)  │
│                              │                        │                   │
│                              │                   ◀────┘ plan_draft        │
│                              ▼                                            │
│   4. Plan 확인        PlanReview 컴포넌트에서                             │
│      (6개 씬)         씬 편집 가능                                        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼

┌──────────────────────────────────────────────────────────────────────────┐
│                          STEP 2: RENDER 단계                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   User Action         Frontend                    Backend                 │
│   ───────────         ────────                    ───────                 │
│                                                                           │
│   5. RENDER 버튼 ───▶ startRender() ─────────▶  POST /{id}/render        │
│      클릭                   │                        │                    │
│                              │                   _prepare_images_v3()     │
│                              │                        │                    │
│                              │                   scenes_to_generate 계산   │
│                              │                        │                    │
│                              │                   VisionGenerator 호출      │
│                              │                        │                    │
│                              │                   NanoBanana.generate()     │
│                              │                        │                    │
│                              │                   ❌ Gemini: image=None     │
│                              │                        │                    │
│                              │                   VideoBuilder.render()     │
│                              │                        │                    │
│                              │                   ◀────┘ video_url          │
│                              ▼                                            │
│   6. 결과 확인        Video 재생                                          │
│      ❌ 실패          (Scene Placeholder만 표시)                          │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.3 모드별 동작

| 모드 | 설명 | 이미지 소스 | VisionGenerator 호출 |
|------|------|------------|---------------------|
| **REUSE** | 기존 이미지 재활용 | Asset Pool | ❌ 안 함 |
| **HYBRID** | 일부 재활용 + 일부 생성 | Asset Pool + AI 생성 | ⭕ 부분 호출 |
| **CREATIVE** | 모든 이미지 AI 생성 | AI 생성 | ⭕ 전체 호출 |

---

## 2. 관련 파일 목록

### 2.1 Frontend (C팀 담당)

#### UI 컴포넌트

| 파일 | 역할 | 주요 기능 |
|------|------|----------|
| `components/video6/Video6Modal.tsx` | 메인 모달 | 전체 UI 컨테이너, 단계별 뷰 전환 |
| `components/video6/Video6Panel.tsx` | 결과 패널 | 영상 재생, MinIO URL 변환 |
| `components/video6/ModeSelector.tsx` | 모드 선택 | REUSE/HYBRID/CREATIVE 선택 |
| `components/video6/PlanReview.tsx` | Plan 확인 | 씬 목록 표시, 수정 UI |
| `components/video6/SceneEditor.tsx` | 씬 편집 | 개별 씬 편집, 프롬프트 수정 |
| `components/video6/RenderProgress.tsx` | 진행률 | 렌더링 진행 상태 표시 |
| `components/video6/AssetPoolGrid.tsx` | 에셋 선택 | REUSE/HYBRID용 에셋 그리드 |

#### 상태 관리 & API

| 파일 | 역할 | 주요 기능 |
|------|------|----------|
| `hooks/useVideo6.ts` | 메인 Hook | 전체 상태 관리, API 호출 조율 |
| `lib/api/video-pipeline-api.ts` | API 클라이언트 | Backend 통신, 에러 핸들링 |
| `types/video-pipeline.ts` | 타입 정의 | TypeScript 타입, 스키마 |
| `stores/useVideo6ModalStore.ts` | 모달 상태 | 모달 열기/닫기 상태 |

### 2.2 Backend (B팀 담당)

#### 핵심 파일

| 파일 | 역할 | 주요 기능 |
|------|------|----------|
| `app/api/v1/endpoints/video6.py` | API 엔드포인트 | HTTP 라우팅 |
| `app/services/agents/video_director.py` | 메인 오케스트레이터 | PLAN/RENDER 로직, `_prepare_images_v3` |
| `app/services/agents/vision_generator.py` | 이미지 생성 에이전트 | VisionGenerator 구현 |
| `app/services/media/providers/nanobanana_provider.py` | Gemini 이미지 생성 | NanoBanana Provider |
| `app/services/media/media_gateway.py` | 미디어 게이트웨이 | Provider 선택/호출 |

#### 설정 파일

| 파일 | 역할 |
|------|------|
| `backend/.env` | API 키 (GOOGLE_API_KEY 등) |
| `docker/mac-mini/.env` | Docker 환경변수 |
| `docker/mac-mini/docker-compose.yml` | 컨테이너 설정 |

### 2.3 파일 관계도

```
Frontend                              Backend
────────                              ───────

Video6Modal.tsx
    │
    ├─▶ useVideo6.ts
    │       │
    │       └─▶ video-pipeline-api.ts ──────▶ video6.py (API)
    │                                              │
    │                                              ▼
    │                                        video_director.py
    │                                              │
    │                                     ┌────────┼────────┐
    │                                     ▼        ▼        ▼
PlanReview.tsx ◀────────────────── _execute_plan_mode  _prepare_images_v3
    │                                              │
    ▼                                              ▼
SceneEditor.tsx                           vision_generator.py
                                                   │
                                                   ▼
Video6Panel.tsx ◀────────────────────── nanobanana_provider.py
    │                                              │
    ▼                                              ▼
<video> 재생                               Gemini API (❌)
```

---

## 3. 현재 문제점 상세

### 3.1 문제 1: Gemini API 이미지 생성 실패 (P0 Critical)

#### 증상
- PLAN 단계: ✅ 정상 (6개 씬, `generate_new_image: true`)
- RENDER 단계: ❌ 실패 (모든 씬이 "Scene Placeholder"로 표시)

#### 로그 분석 (V6 디버그 패치 결과)

```
>>> V6 _prepare_images_v3 CALLED
>>> V6 generation_mode=VideoGenerationMode.CREATIVE
>>> V6 plan_draft.scenes len: 6
>>> V6 scene 1: gen=True, url=False, id=False, prompt=눈 내리는 배경에 패딩 점퍼를 입은 모델...
>>> V6 scenes_to_generate indices: [1, 2, 3, 4, 5, 6]
>>> V6 condition: will_call_vision = True
>>> V6 ENTERING VisionGenerator block (FORCED)
>>> V6 calling VisionGenerator with 6 prompts
>>> V6 VisionGenerator response received
>>> V6 VisionGenerator images len: 6
>>> V6 scene 1 got image: None...
>>> V6 scene 2 got image: None...
...
[NanoBanana] Content may be blocked: FinishReason.STOP
```

#### 핵심 발견

| 항목 | 상태 | 설명 |
|------|------|------|
| PLAN 데이터 | ✅ 정상 | `generate_new_image: true`, `image_prompt` 모두 있음 |
| VisionGenerator 호출 | ✅ 정상 | 6개 프롬프트로 호출됨 |
| NanoBanana 호출 | ✅ 정상 | Gemini API 호출됨 |
| Gemini 응답 | ❌ 실패 | `FinishReason.STOP`, image=None |

#### Gemini 웹 UI vs API 비교

| 환경 | 프롬프트 | 결과 |
|------|---------|------|
| **Gemini 웹 UI** | "눈 내리는 배경에 패딩 점퍼를 입은 모델" | ✅ 이미지 생성 성공 |
| **NanoBanana API** | 동일 | ❌ `FinishReason.STOP`, image=None |

**결론**: 동일 프롬프트가 웹 UI에서는 성공하고 API에서는 실패 → **API 호출 방식 또는 설정 문제**

#### V8 패치 시도 (실패)

```python
# 변경 전
response_modalities=['IMAGE']

# 변경 후
response_modalities=['TEXT', 'IMAGE']
```

결과: 여전히 실패

### 3.2 문제 2: Mock 이미지 모드 미작동 (P1)

#### 증상
- `VIDEO_MOCK_IMAGES=1` 환경변수가 Docker 컨테이너에 설정되지 않음
- VisionGenerator 실패해도 placeholder 이미지가 적용되지 않음

#### 확인 결과

```bash
docker exec sparklio-backend env | grep VIDEO_MOCK
# 결과 없음
```

### 3.3 문제 3: PLAN 스크립트 빈약 (P2)

#### 증상

현재 생성되는 스크립트:
```
Scene 1: "겨울 특가 세일 시작!"
Scene 2: "다양한 색상과 스타일!"
Scene 3: "특별 할인 중!"
```

기대하는 스크립트:
```
Scene 1: "추운 겨울, 따뜻한 스타일을 찾고 계신가요?"
Scene 2: "프리미엄 다운 충전재로 -20도에서도 따뜻하게"
Scene 3: "다양한 컬러와 사이즈로 나만의 스타일 완성"
```

#### 가능한 원인
1. PLAN 단계에서 LLM이 실제로 호출되지 않음
2. LLM 호출되지만 프롬프트가 부실
3. LLM 응답 파싱 오류

---

## 4. 테스트 결과 요약

### 4.1 테스트 환경

| 항목 | 값 |
|------|---|
| Frontend | Windows Laptop (localhost:3001) |
| Backend | Mac mini (100.123.51.5:8000) |
| 테스트 Project ID | vp_d3fcee41 |
| 테스트 모드 | CREATIVE |
| 테스트 주제 | "겨울 패딩 세일 마케팅 영상" |

### 4.2 단계별 결과

| 단계 | API | 결과 | 비고 |
|------|-----|------|------|
| 프로젝트 생성 | POST /projects | ✅ 성공 | project_id 반환 |
| PLAN 실행 | POST /{id}/plan | ✅ 성공 | 6개 씬 생성 |
| PLAN 데이터 | - | ✅ 정상 | `generate_new_image: true` |
| RENDER 실행 | POST /{id}/render | ⚠️ 부분 성공 | 영상은 생성됨 |
| 이미지 생성 | VisionGenerator | ❌ 실패 | 모든 씬 image=None |
| 최종 영상 | - | ❌ 실패 | Scene Placeholder만 표시 |

### 4.3 API 응답 샘플

#### PLAN 응답 (성공)
```json
{
  "project_id": "vp_d3fcee41",
  "plan_draft": {
    "version": "1.0",
    "mode": "creative",
    "total_duration_sec": 15,
    "music_mood": "warm_lofi",
    "scenes": [
      {
        "scene_index": 1,
        "caption": "겨울 특가 세일 시작!",
        "duration_sec": 2.5,
        "generate_new_image": true,
        "image_prompt": "눈 내리는 배경에 패딩 점퍼를 입은 모델"
      }
    ]
  }
}
```

#### VisionGenerator 응답 (실패)
```python
# 내부 로그
>>> V6 scene 1 got image: None
>>> V6 scene 2 got image: None
[NanoBanana] Content may be blocked: FinishReason.STOP
```

---

## 5. B팀 요청 사항

### 5.1 우선순위별 정리

| 순위 | 문제 | 요청 사항 | 예상 소요 |
|------|------|----------|----------|
| **P0** | Gemini API 이미지 None | 디버그 로그 추가 + 모델명/설정 확인 | 1시간 |
| **P1** | Mock 이미지 미작동 | `VIDEO_MOCK_IMAGES=1` 환경변수 추가 | 5분 |
| **P2** | 스크립트 빈약 | PLAN LLM 호출 확인 및 디버깅 | 1시간 |

### 5.2 P0: Gemini API 디버깅 요청

#### 필요한 디버그 로그

```python
# nanobanana_provider.py - generate() 함수 내부
response = self.client.models.generate_content(
    model=model_name,
    contents=[enhanced_prompt],
    config=config
)

# ===== 디버그 로그 추가 =====
print(f">>> NANO DEBUG: response type = {type(response)}")
print(f">>> NANO DEBUG: response = {response}")
print(f">>> NANO DEBUG: response.text = {getattr(response, 'text', 'N/A')}")
print(f">>> NANO DEBUG: response.parts = {response.parts}")
print(f">>> NANO DEBUG: response.candidates = {response.candidates}")

if response.candidates:
    candidate = response.candidates[0]
    print(f">>> NANO DEBUG: candidate.content = {candidate.content}")
    print(f">>> NANO DEBUG: candidate.finish_reason = {candidate.finish_reason}")
    print(f">>> NANO DEBUG: candidate.safety_ratings = {candidate.safety_ratings}")

if response.parts:
    for i, part in enumerate(response.parts):
        print(f">>> NANO DEBUG: part[{i}] = {part}")
        print(f">>> NANO DEBUG: part[{i}].inline_data = {getattr(part, 'inline_data', 'N/A')}")
```

#### 확인 필요 사항

1. **모델명 확인**
   - 현재: `gemini-2.5-flash-image`
   - 이 모델이 실제로 존재하는지?
   - 이미지 생성을 지원하는지?

2. **사용 가능한 모델 확인**
   ```python
   for model in client.models.list():
       print(model.name, model.supported_generation_methods)
   ```

3. **API 키 권한 확인**
   - Google AI Studio에서 API 키 제한사항 확인
   - "이미지 생성" 권한 있는지?

### 5.3 P1: Mock 이미지 환경변수

```yaml
# docker/mac-mini/docker-compose.yml
services:
  backend:
    environment:
      - VIDEO_MOCK_IMAGES=1  # ← 추가
```

```bash
# 재시작
docker compose -f docker-compose.yml restart backend
```

### 5.4 P2: PLAN LLM 디버깅

```python
# video_director.py - _execute_plan_mode 또는 관련 함수
print(f">>> PLAN LLM call: topic={topic}")
print(f">>> PLAN LLM response: {llm_response[:500]}...")
print(f">>> PLAN parsed scenes: {len(scenes)}")
```

---

## 6. 참고 문서

- [B_TEAM_REQUEST_V6_DEBUG_2025-11-29.md](./B_TEAM_REQUEST_V6_DEBUG_2025-11-29.md)
- [B_TEAM_REQUEST_V7_FINAL_2025-11-29.md](./B_TEAM_REQUEST_V7_FINAL_2025-11-29.md)
- [B_TEAM_REQUEST_V8_NANOBANANA_2025-11-29.md](./B_TEAM_REQUEST_V8_NANOBANANA_2025-11-29.md)

---

## 7. 연락처

- **C팀 Frontend 담당**: 현재 세션
- **테스트 Project ID**: vp_d3fcee41
- **Frontend**: Windows Laptop (localhost:3001)
- **Backend**: Mac mini (100.123.51.5:8000)

---

**작성 완료: 2025-11-29 18:30**
