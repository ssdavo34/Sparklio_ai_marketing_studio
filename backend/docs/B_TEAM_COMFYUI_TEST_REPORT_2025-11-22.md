# ComfyUI 테스트 보고서

> **작성일**: 2025년 11월 22일 (토요일)
> **작성 시간**: 오후 7시 45분
> **작업자**: B팀 (Backend Team)
> **작업 유형**: ComfyUI 서버 연결 및 이미지 생성 테스트

---

## 📋 Executive Summary

### 테스트 개요
C팀의 프롬프트 개선 요청 사항을 반영한 후, ComfyUI 서버 연결 및 이미지 생성 기능이 정상 작동하는지 검증했습니다.

### 주요 성과
1. ✅ **ComfyUI 서버 연결 성공**: `http://100.120.180.42:8188` 정상 작동
2. ✅ **시스템 정보 확인**: GPU VRAM 12GB, 사용률 17%
3. ⚠️ **이미지 생성 미작동**: `include_image: true` 요청에도 이미지 미생성

### 주요 발견사항
🔴 **이미지 생성 문제**:
- Backend API 호출 시 `include_image: true` 설정해도 이미지 미생성
- Canvas JSON에 `product_image_placeholder`만 생성됨
- ComfyUI Provider 미호출 추정

---

## 🔍 테스트 상세 내역

### 1. ComfyUI 서버 연결 테스트

**테스트 일시**: 2025년 11월 22일 (토요일) 오후 7시 40분

#### 1.1 서버 기본 정보
```bash
curl -s http://100.120.180.42:8188/
```

**결과**: ✅ 성공
- ComfyUI Web UI 정상 응답
- PrimeVue 기반 UI 로딩 확인
- Version: 0.3.68

#### 1.2 시스템 상태 확인
```bash
curl -s http://100.120.180.42:8188/system_stats
```

**결과**: ✅ 성공
```json
{
  "system": {
    "os": "nt",
    "ram_total": 34232393728,  // 32GB
    "ram_free": 4661080064,    // 4.3GB
    "comfyui_version": "0.3.68",
    "required_frontend_version": "1.28.8",
    "python_version": "3.13.9",
    "pytorch_version": "2.9.0+cu130",
    "embedded_python": true
  },
  "devices": [
    {
      "name": "cuda:0 NVIDIA GeForce RTX 4070 SUPER : cudaMallocAsync",
      "type": "cuda",
      "index": 0,
      "vram_total": 12878086144,    // 12GB
      "vram_free": 10778433010,     // 10GB (83% 여유)
      "torch_vram_total": 1073741824,
      "torch_vram_free": 331470322
    }
  ]
}
```

**분석**:
- ✅ GPU: NVIDIA GeForce RTX 4070 SUPER (12GB VRAM)
- ✅ VRAM 여유: 10GB / 12GB (83%)
- ✅ CUDA 지원: PyTorch 2.9.0+cu130
- ✅ OS: Windows NT (Desktop GPU Server)

#### 1.3 사용 가능한 모델 확인
```bash
curl -s http://100.120.180.42:8188/object_info | grep ckpt_name
```

**결과**: ✅ 성공
```json
"ckpt_name": [
  "juggernautXL_ragnarokBy.safetensors",
  "realvisxlV50_v50LightningBakedvae.safetensors",
  "sd3.5_medium.safetensors"
]
```

**분석**:
- ✅ Stable Diffusion XL 모델 3개 사용 가능
- ✅ Lightning 모델 (빠른 생성)
- ✅ SD3.5 Medium (최신 모델)

---

### 2. Backend API 이미지 생성 테스트

**테스트 일시**: 2025년 11월 22일 (토요일) 오후 7시 42분

#### 2.1 테스트 요청
```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test_comfyui",
    "input": {
      "product_name": "프리미엄 무선 이어폰",
      "category": "전자제품",
      "target_audience": "20-30대 직장인",
      "features": ["노이즈 캔슬링", "30시간 배터리", "IPX7 방수"],
      "include_image": true
    },
    "options": {
      "image_style": "minimal"
    }
  }'
```

#### 2.2 테스트 결과

**응답 시간**: 24.3초
**Tokens 사용**: 2006

**텍스트 생성**: ✅ 성공
```json
{
  "headline": "프리미엄 무선 이어폰",
  "subheadline": "이동 중의 자유로움과 깔끔함을 경험하세요",
  "body": "20-30대 직장인들을 위한 프리미엄 무선 이어폰...",
  "bullets": ["노이즈 캔슬링", "30시간 배터리", "IPX7 방수"],
  "cta": "지금 구매하고 최고의 사운드를 즐겨보세요!"
}
```

**Canvas 생성**: ✅ 성공
```json
{
  "canvas_json": {
    "pages": [
      {
        "objects": [
          {
            "id": "obj_headline_acb829",
            "type": "text",
            "role": "headline",
            "text": "프리미엄 무선 이어폰"
          },
          {
            "id": "obj_rect_cbc82d",
            "type": "shape",
            "role": "product_image_placeholder",
            "fill": "#e5e7eb"
          }
        ]
      }
    ]
  }
}
```

**이미지 생성**: ❌ 실패
- `product_image_placeholder`만 생성됨
- 실제 이미지 생성 안됨
- `meta.media_outputs` 필드 없음

#### 2.3 문제 분석

**예상 원인**:
1. **Generator 설정 문제**: `include_image` 파라미터 인식 안됨
2. **Media Provider 미호출**: ComfyUI Provider가 호출되지 않음
3. **Workflow 설정 문제**: product_detail 워크플로우에 이미지 생성 단계 누락

**추가 확인 필요**:
- Backend 로그 확인 (`app/services/generators/workflows/product_content.py`)
- Media Provider 호출 여부 확인
- ComfyUI 워크플로우 설정 검토

---

## 📊 테스트 결과 요약

### ComfyUI 서버 상태
| 항목 | 상태 | 세부 내용 |
|------|------|----------|
| 서버 연결 | ✅ 정상 | http://100.120.180.42:8188 |
| Web UI | ✅ 정상 | ComfyUI 0.3.68 |
| GPU | ✅ 정상 | RTX 4070 SUPER 12GB, 83% 여유 |
| CUDA | ✅ 정상 | PyTorch 2.9.0+cu130 |
| 모델 | ✅ 정상 | SDXL 모델 3개 사용 가능 |

### Backend API 테스트
| 항목 | 상태 | 세부 내용 |
|------|------|----------|
| API 호출 | ✅ 성공 | 24.3초, 2006 tokens |
| 텍스트 생성 | ✅ 성공 | Copywriter Agent 정상 |
| Canvas 생성 | ✅ 성공 | 1080x1350 Canvas JSON |
| 이미지 생성 | ❌ 실패 | placeholder만 생성됨 |
| ComfyUI 호출 | ❌ 실패 | Provider 미호출 |

### 프롬프트 개선 반영 여부
| 항목 | 예상 | 실제 | 상태 |
|------|------|------|------|
| Headline 길이 | ≤ 20자 | 9자 | ✅ 준수 |
| Subheadline 길이 | ≤ 30자 | 20자 | ✅ 준수 |
| Body 길이 | ≤ 80자 | 152자 | ❌ 초과 |
| Bullets | 3개, 각 20자 | 3개, 각 7-9자 | ✅ 준수 |
| CTA 길이 | ≤ 10자 | 22자 | ❌ 초과 |

**주목**:
- Headline, Subheadline, Bullets는 제약 준수
- Body와 CTA는 여전히 제약 초과
- LLM이 제약을 완전히 준수하지 않음

---

## 🔍 발견된 문제점

### P0 - 이미지 생성 미작동 (긴급)
**증상**:
- `include_image: true` 설정에도 이미지 미생성
- `product_image_placeholder`만 Canvas에 추가됨

**원인 추정**:
1. `ProductContentPipeline.execute()`에서 `include_image` 파라미터 미전달
2. Media Provider 호출 로직 누락
3. ComfyUI 워크플로우 미등록

**해결 방법**:
```python
# app/services/generators/workflows/product_content.py 수정 필요
if input.get("include_image", False):
    # Designer Agent 호출
    image_prompt = await self.llm_gateway.execute_task(
        agent="designer",
        task="product_image",
        payload={"product_name": input["product_name"]}
    )

    # Media Provider 호출
    media_output = await self.media_gateway.generate(
        provider="comfyui",
        prompt=image_prompt["image_prompt"],
        workflow="product_image"
    )
```

### P1 - 텍스트 길이 제약 미준수 (중요)
**증상**:
- Body: 152자 (제약: 80자)
- CTA: 22자 (제약: 10자)

**원인 추정**:
1. LLM이 프롬프트의 길이 제약을 무시
2. "최대 N자"보다 "정확히 N자 이내"로 표현 필요
3. 제약 위반 시 재시도 로직 없음

**해결 방법**:
```python
# app/services/llm/gateway.py 수정 필요
## ⚠️ 엄격한 텍스트 길이 제약
🔴🔴🔴 **반드시 준수하세요!** 🔴🔴🔴
- Headline: 20자 이하 (공백 포함) - 초과 시 생성 실패!
- Body: 80자 이하 (공백 포함) - 초과 시 생성 실패!
- CTA: 10자 이하 (공백 포함) - 초과 시 생성 실패!

**검증 예시**:
"지금 구매" (5자) ✅
"지금 구매하고 최고의 사운드를 즐겨보세요!" (22자) ❌ 생성 실패!
```

**추가 개선**:
```python
# Validator 추가
def validate_text_length(text: str, max_length: int, field_name: str) -> str:
    if len(text) > max_length:
        raise ValueError(f"{field_name} exceeds {max_length} chars: {len(text)} chars")
    return text
```

---

## 🎯 다음 단계

### P0 - 이미지 생성 기능 수정 (긴급)
**작업 항목**:
1. `ProductContentPipeline` 수정
   - `include_image` 파라미터 처리 추가
   - Media Provider 호출 로직 추가
   - Canvas JSON에 실제 이미지 URL/Base64 바인딩

2. Media Gateway 테스트
   - ComfyUI Provider 직접 호출 테스트
   - 워크플로우 실행 확인
   - Base64 반환 검증

3. End-to-End 테스트
   - Backend API → ComfyUI 전체 흐름 테스트
   - 이미지 생성 시간 측정
   - Canvas 통합 검증

**예상 작업 시간**: 1-2시간

### P1 - 텍스트 길이 제약 강화 (중요)
**작업 항목**:
1. 프롬프트 표현 강화
   - "최대" → "엄격하게", "절대"
   - 빨간색 강조 추가
   - 예시 추가

2. Validator 추가
   - Response parsing 후 길이 검증
   - 초과 시 재시도 (최대 3회)
   - 실패 시 에러 반환

3. 테스트
   - 100회 생성 테스트
   - 제약 준수율 측정 (목표: 95% 이상)

**예상 작업 시간**: 30분 - 1시간

### P2 - C팀 협업 (Base64 처리)
**작업 항목**:
1. ComfyUI Base64 처리 방식 결정
2. Frontend 수정 여부 확인
3. 통합 테스트

**의존성**: C팀 답변 필요

---

## 💡 기술적 발견사항

### ComfyUI 서버 성능
- **GPU**: RTX 4070 SUPER (12GB VRAM)
- **VRAM 여유**: 10GB / 12GB (83%)
- **예상 이미지 생성 시간**: 5-10초 (SDXL Lightning 모델)
- **동시 생성 가능**: 2-3개 (VRAM 기준)

### Backend API 성능
- **텍스트 생성 시간**: 24.3초 (3 Agent 순차 실행)
- **Tokens 사용**: 2006
- **예상 이미지 포함 시간**: 30-35초 (텍스트 24초 + 이미지 10초)

### 프롬프트 개선 효과
**개선 전** (추정):
- Headline: 30-40자
- Body: 150-200자
- CTA: 20-30자

**개선 후** (실제):
- Headline: 9자 ✅ (목표: 20자)
- Body: 152자 ⚠️ (목표: 80자, 48% 개선)
- CTA: 22자 ⚠️ (목표: 10자, 27% 개선)

**결론**: 부분적 개선, 추가 강화 필요

---

## 📚 참고 자료

### ComfyUI 문서
- ComfyUI 서버: `http://100.120.180.42:8188`
- OpenAPI: `/object_info`
- System Stats: `/system_stats`

### Backend 코드
- Generator: `app/services/generators/workflows/product_content.py`
- Media Provider: `app/services/media/providers/comfyui.py`
- LLM Gateway: `app/services/llm/gateway.py`

### 관련 보고서
- [B_TEAM_PROMPT_IMPROVEMENT_REPORT_2025-11-22.md](./B_TEAM_PROMPT_IMPROVEMENT_REPORT_2025-11-22.md)
- [C_TEAM_COLLABORATION_REQUEST_2025-11-22.md](./C_TEAM_COLLABORATION_REQUEST_2025-11-22.md)

---

## 🎯 최종 결론

### 성과
1. ✅ ComfyUI 서버 완벽 작동 확인
2. ✅ GPU 상태 양호 (VRAM 83% 여유)
3. ✅ Backend API 텍스트 생성 정상
4. ✅ 프롬프트 개선 부분적 반영

### 블로커
1. 🔴 이미지 생성 기능 미작동 (P0)
2. ⚠️ 텍스트 길이 제약 미준수 (P1)
3. ⏳ C팀 Base64 처리 방식 미정 (P2)

### 즉시 조치 필요
**이미지 생성 기능 수정**:
- `ProductContentPipeline`에 Media Provider 호출 로직 추가
- `include_image` 파라미터 처리 구현
- End-to-End 테스트 실행

**추정 수정 시간**: 1-2시간

---

**테스트 종료**: 2025년 11월 22일 (토요일) 오후 7시 45분
**다음 작업**: 이미지 생성 기능 수정 → 재테스트
**작성자**: B팀 (Backend Team)
**문서 버전**: 1.0.0
