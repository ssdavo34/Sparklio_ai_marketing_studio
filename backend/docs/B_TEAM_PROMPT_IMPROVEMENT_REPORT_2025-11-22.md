# B팀 프롬프트 개선 작업 보고서

> **작성일**: 2025년 11월 22일 (토요일)
> **작성 시간**: 오후 7시 30분
> **작업자**: B팀 (Backend Team)
> **작업 유형**: C팀 요청 프롬프트 개선 + ComfyUI 이슈 발견

---

## 📋 Executive Summary

### 작업 개요
C팀의 `BACKEND_PROMPT_IMPROVEMENTS.md` 요청사항을 기반으로 LLM Gateway 시스템 프롬프트를 개선하고, ComfyUI 관련 문서 검토 중 이미지 URL 문제의 근본 원인을 발견했습니다.

### 주요 성과
1. ✅ **Copywriter Agent 개선**: Canvas 최적화를 위한 텍스트 길이 제약 추가
2. ✅ **Designer Agent 개선**: 배경 단순화로 텍스트 가독성 향상
3. ✅ **ComfyUI 이슈 발견**: Base64 인코딩 vs URL 반환 구조 파악

### 긴급 발견사항
🔴 **ComfyUI 이미지 URL 문제 원인 파악**:
- ComfyUI Provider는 이미지를 **Base64 문자열**로 반환
- C팀이 기대하는 **URL 형식이 아님**
- 이로 인해 Frontend에서 이미지 로딩 실패 발생
- C팀과 협의하여 Base64 처리 로직 추가 필요

---

## 🎯 작업 상세 내역

### 1. Copywriter Agent - Product Detail Task 개선

**파일**: `backend/app/services/llm/gateway.py`
**라인**: 329-366
**작업 시간**: 오후 7시 10분

#### 변경 내용
Canvas Studio v3.1 (1080x1080 Instagram 광고 포맷)에 최적화된 텍스트 길이 제약 추가:

```python
## ⚠️ 텍스트 길이 제약 (Canvas 최적화 - 필수 준수)
🔴 **Headline**: 최대 20자 (공백 포함)
🔴 **Subheadline**: 최대 30자 (선택적 - 없어도 됨)
🔴 **Body**: 최대 80자 (2-3문장으로 구성)
🔴 **Bullets**: 최대 3개, 각 불릿당 최대 20자
🔴 **CTA**: 최대 10자

이 제약사항을 초과하면 Canvas에서 텍스트가 잘리므로 반드시 준수하세요!
```

#### JSON 출력 형식 가이드 추가
```json
{
  "headline": "제품명 + 핵심 가치 (최대 20자)",
  "subheadline": "구매 이유 (최대 30자, 선택)",
  "body": "본문 (최대 80자)",
  "bullets": ["특징1 (최대 20자)", "특징2 (최대 20자)", "특징3 (최대 20자)"],
  "cta": "행동 유도 (최대 10자)"
}
```

#### 기대 효과
- Canvas에서 텍스트 오버플로우 방지
- 1080x1080 포맷에서 모든 텍스트 요소 완전 표시
- 사용자 경험 개선

---

### 2. Copywriter Agent - Ad Copy Task 개선

**파일**: `backend/app/services/llm/gateway.py`
**라인**: 479-512
**작업 시간**: 오후 7시 15분

#### 변경 내용
광고 카피 생성 시에도 동일한 길이 제약 적용:

```python
## ⚠️ 텍스트 길이 제약 (Canvas 최적화 - 필수 준수)
🔴 **Headline**: 최대 20자 (공백 포함)
🔴 **Body**: 최대 80자 (2-3문장으로 구성)
🔴 **CTA**: 최대 10자

이 제약사항을 초과하면 Canvas에서 텍스트가 잘리므로 반드시 준수하세요!
```

#### JSON 출력 형식
```json
{
  "headline": "임팩트 있는 헤드라인 (최대 20자)",
  "body": "핵심 메시지 (최대 80자)",
  "cta": "행동 유도 (최대 10자)"
}
```

#### 기대 효과
- 모든 광고 카피가 Canvas 포맷에 최적화
- 일관된 텍스트 길이 정책 적용

---

### 3. Designer Agent - Product Image Task 개선

**파일**: `backend/app/services/llm/gateway.py`
**라인**: 911-954
**작업 시간**: 오후 7시 20분

#### 변경 내용
Canvas 통합을 위한 배경 단순화 가이드라인 추가:

```python
## ⚠️ Canvas 통합을 위한 필수 가이드라인
🔴 **배경**: 반드시 단색 또는 미세한 그라디언트 (흰색, 밝은 회색, 크림색 권장)
🔴 **복잡한 배경 금지**: 패턴, 질감, 어두운 배경 사용 금지 (텍스트 가독성 저해)
🔴 **비율**: 3:2 (가로:세로), 가로 중심 구도
🔴 **제품 배치**: 중앙 또는 상단 배치 (하단은 텍스트 공간)
🔴 **여백**: 충분한 여백으로 텍스트 오버레이 공간 확보
```

#### 프롬프트 구조 예시
```
Professional product photography of [제품명], centered composition,
studio lighting, white to light gray gradient background, clean and minimal,
high quality, 8k resolution, commercial advertising style, 3:2 aspect ratio
```

#### 배경색 권장 목록
- ✅ 흰색 (white)
- ✅ 밝은 회색 (light gray)
- ✅ 크림색 (cream)
- ✅ 밝은 베이지 (light beige)
- ✅ 파스텔 톤 (pastel tones)
- ❌ 어두운 배경 (dark backgrounds) - 금지
- ❌ 복잡한 패턴 (complex patterns) - 금지

#### 기대 효과
- 텍스트 오버레이 시 가독성 극대화
- Canvas Studio에서 텍스트와 이미지의 조화
- 전문적인 광고 디자인 품질 유지

---

## 🔍 ComfyUI 이슈 발견 및 분석

### 배경
C팀이 보고한 "ComfyUI 이미지 URL 로딩 실패" 문제의 근본 원인을 조사하기 위해 ComfyUI 관련 문서 및 코드를 검토했습니다.

### 조사 대상 문서
1. ✅ `backend/GENERATORS_SPEC.md` - ComfyUI 워크플로우 정의
2. ✅ `backend/app/services/media/providers/comfyui.py` - ComfyUI Provider 구현

### 핵심 발견사항

**파일**: `backend/app/services/media/providers/comfyui.py`
**라인**: 380-400

#### 코드 분석
```python
# 이미지 다운로드
image_url = f"{self.base_url}/view"
params = {
    "filename": filename,
    "subfolder": subfolder,
    "type": file_type
}

img_response = await client.get(image_url, params=params)
img_response.raise_for_status()

# ⚠️ 여기서 Base64로 인코딩!
image_data = base64.b64encode(img_response.content).decode('utf-8')

media_outputs.append(MediaProviderOutput(
    type="image",
    format="png",
    data=image_data,  # ← Base64 문자열, URL이 아님!
    width=workflow.get("workflow", {}).get("5", {}).get("inputs", {}).get("width"),
    height=workflow.get("workflow", {}).get("5", {}).get("inputs", {}).get("height")
))
```

#### 문제 구조
```
ComfyUI Server → /view 엔드포인트 → 바이너리 이미지 다운로드
                                      ↓
                              Base64 인코딩
                                      ↓
                          MediaProviderOutput.data = "iVBORw0KG..." (Base64 문자열)
                                      ↓
                          Frontend 기대값: "https://..." (URL)
                                      ↓
                                   ❌ 불일치!
```

### 해결 방안 제안

#### 옵션 1: Frontend에서 Base64 처리 (권장)
**장점**:
- 이미지 데이터 즉시 사용 가능
- 별도 파일 저장 불필요
- 빠른 렌더링

**구현**:
```typescript
// Frontend에서 Base64를 Data URL로 변환
const imageUrl = `data:image/png;base64,${response.data}`;
```

**작업 필요**:
- C팀에 Base64 → Data URL 변환 로직 추가 요청
- `lib/llm-gateway-client.ts` 수정

#### 옵션 2: Backend에서 파일 저장 후 URL 반환
**장점**:
- Frontend 로직 변경 최소화
- 이미지 캐싱 가능

**단점**:
- 파일 스토리지 필요
- 추가 I/O 오버헤드
- 스토리지 관리 필요

**구현**:
```python
# comfyui.py 수정
import os
from pathlib import Path

# 이미지 저장
output_dir = Path("static/generated_images")
output_dir.mkdir(parents=True, exist_ok=True)

image_path = output_dir / f"{prompt_id}_{filename}"
image_path.write_bytes(img_response.content)

# URL 반환
image_url = f"/static/generated_images/{prompt_id}_{filename}"

media_outputs.append(MediaProviderOutput(
    type="image",
    format="png",
    data=image_url,  # URL로 변경
    width=...,
    height=...
))
```

#### 옵션 3: 양방향 지원 (최선)
**구현**:
```python
media_outputs.append(MediaProviderOutput(
    type="image",
    format="png",
    data=image_data,  # Base64
    url=image_url,    # URL (새 필드 추가)
    width=...,
    height=...
))
```

**작업 필요**:
- `MediaProviderOutput` 스키마에 `url` 필드 추가
- Frontend에서 `url` 우선 사용, 없으면 `data` (Base64) 사용

---

## 📊 변경 사항 요약

### 수정된 파일
| 파일 | 라인 | 변경 내용 | 영향도 |
|------|------|-----------|--------|
| `app/services/llm/gateway.py` | 329-366 | Copywriter - product_detail 길이 제약 | 높음 |
| `app/services/llm/gateway.py` | 479-512 | Copywriter - ad_copy 길이 제약 | 중간 |
| `app/services/llm/gateway.py` | 911-954 | Designer - 배경 단순화 가이드 | 높음 |

### 검토된 파일
| 파일 | 목적 | 발견사항 |
|------|------|----------|
| `app/services/media/providers/comfyui.py` | ComfyUI 이슈 조사 | Base64 인코딩 구조 파악 |
| `GENERATORS_SPEC.md` | ComfyUI 워크플로우 확인 | 3개 워크플로우 정상 |

---

## ✅ 테스트 권장사항

### 1. Copywriter Agent 테스트
```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test_brand",
    "input": {
      "product_name": "프리미엄 무선 이어폰",
      "category": "전자제품",
      "target_audience": "20-30대 직장인"
    }
  }'
```

**검증 항목**:
- ✅ headline ≤ 20자
- ✅ subheadline ≤ 30자 (선택)
- ✅ body ≤ 80자
- ✅ bullets ≤ 3개, 각 ≤ 20자
- ✅ cta ≤ 10자

### 2. Designer Agent 테스트
```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test_brand",
    "input": {
      "product_name": "스마트워치",
      "include_image": true
    }
  }'
```

**검증 항목**:
- ✅ 배경: 흰색/밝은 회색 그라디언트
- ✅ 복잡한 패턴/질감 없음
- ✅ 비율: 3:2 (가로:세로)
- ✅ 제품 배치: 중앙/상단
- ✅ 충분한 여백 (텍스트 공간)

### 3. ComfyUI Base64 테스트
```python
# Frontend에서 Base64 처리 테스트
response = await fetch('http://100.123.51.5:8000/api/v1/generate', {
  method: 'POST',
  body: JSON.stringify({
    kind: 'product_detail',
    brandId: 'test',
    input: { product_name: 'test', include_image: true }
  })
});

const data = await response.json();
const imageData = data.meta.media_outputs[0].data; // Base64 문자열
const imageUrl = `data:image/png;base64,${imageData}`; // Data URL 변환

// <img src={imageUrl} /> 로 렌더링 테스트
```

---

## 🚧 C팀 협업 필요 사항

### 긴급 (P0)
1. **ComfyUI Base64 처리**:
   - Frontend에서 Base64 → Data URL 변환 로직 추가
   - 또는 Backend 수정 방식 선택 (옵션 1/2/3)
   - **결정 필요**: 어느 방식으로 진행할지 협의

### 중요 (P1)
2. **텍스트 길이 제약 테스트**:
   - Canvas Studio에서 실제 렌더링 테스트
   - 길이 제약이 적절한지 확인
   - 필요 시 미세 조정

3. **배경 가이드라인 검증**:
   - 생성된 이미지가 Canvas에서 텍스트 가독성 확보하는지 확인
   - 다양한 제품 카테고리 테스트

---

## 📈 예상 효과

### Canvas Studio 사용성 개선
- **Before**: 텍스트 오버플로우, 복잡한 배경으로 가독성 저하
- **After**: 모든 텍스트 완전 표시, 깔끔한 배경으로 가독성 극대화

### 사용자 경험 향상
- 전문적인 광고 디자인 품질
- 일관된 비주얼 스타일
- 즉시 사용 가능한 광고 콘텐츠

### 개발 생산성 향상
- ComfyUI 이슈 원인 파악으로 빠른 해결 가능
- 명확한 텍스트 길이 정책으로 반복 작업 감소

---

## 🔄 다음 단계

### B팀 작업
1. ✅ Git 커밋 실행 (이 보고서 작성 후)
2. ⏳ ComfyUI 실제 테스트 (C팀 결정 후)
3. ⏳ Base64 처리 방식 구현 (C팀과 협의 후)

### C팀 작업 요청
1. ⏳ ComfyUI Base64 처리 방식 결정 (옵션 1/2/3)
2. ⏳ Frontend에서 Data URL 변환 로직 추가 (옵션 1 선택 시)
3. ⏳ Canvas Studio 텍스트 길이 제약 테스트
4. ⏳ 배경 가이드라인 검증 테스트

### A팀 협조 요청
1. ⏳ 변경된 프롬프트로 QA 재테스트
2. ⏳ Canvas 렌더링 품질 검증
3. ⏳ 텍스트 길이 제약 준수 확인

---

## 📞 현재 상태

### ✅ 완료
- Copywriter Agent 텍스트 길이 제약 추가
- Designer Agent 배경 단순화 가이드 추가
- ComfyUI 이슈 근본 원인 파악
- 작업 보고서 작성

### ⏳ 대기 중
- Git 커밋 (이 보고서 작성 직후 실행)
- C팀의 Base64 처리 방식 결정
- ComfyUI 실제 테스트

### ❓ 블로커
- ComfyUI Base64 처리 방식 미정 (C팀 결정 필요)

---

## 📚 참고 자료

### C팀 요청 문서
- `frontend/docs/BACKEND_PROMPT_IMPROVEMENTS.md` - 프롬프트 개선 요청서

### 관련 Backend 코드
- `app/services/llm/gateway.py` - LLM Gateway (수정됨)
- `app/services/media/providers/comfyui.py` - ComfyUI Provider (분석됨)

### 관련 문서
- `GENERATORS_SPEC.md` - Generator 종류 및 워크플로우
- `docs/LLM_INTEGRATION_GUIDE.md` - C팀용 통합 가이드

---

## 🎯 최종 결론

### 성과
1. ✅ C팀 요청 3가지 모두 완료
2. ✅ Canvas 최적화 프롬프트 개선
3. ✅ ComfyUI 이슈 근본 원인 파악
4. ✅ 해결 방안 3가지 제시

### 핵심 메시지
**"C팀과 협의하여 ComfyUI Base64 처리 방식을 빠르게 결정해야 이미지 로딩 문제가 해결됩니다."**

---

**작업 종료**: 2025년 11월 22일 (토요일) 오후 7시 30분
**다음 작업**: Git 커밋 → ComfyUI 테스트
**작성자**: B팀 (Backend Team)
**문서 버전**: 1.0.0
