# Phase 1 테스트 계획서: VisionAnalyzerAgent

**작성일**: 2025-11-19 (수요일)
**작성자**: A팀 QA 리더
**대상 Agent**: VisionAnalyzerAgent
**Phase**: Agent 확장 플랜 Phase 1 (2주)
**테스트 기간**: Phase 1 Week 2 (통합 테스트 2일)

---

## 📋 Executive Summary

### 테스트 목표
VisionAnalyzerAgent의 이미지 품질 평가 기능을 검증하여 Designer Agent 생성 결과물의 자동 품질 검증이 가능한지 확인합니다.

### 성공 기준
- ✅ Mock 모드: 10개 테스트 케이스 100% 통과
- ✅ Live 모드: 10개 테스트 케이스 100% 통과
- ✅ 품질 점수 정확도: ±0.1 이내
- ✅ 응답 시간: < 5초 (P90)
- ✅ Vision API 비용: < $0.10/request

### 테스트 범위
1. **Mock 모드 테스트** (Day 1)
   - 이미지 품질 점수 정확도
   - 품질 평가 항목 검증
   - 에러 핸들링

2. **Live 모드 테스트** (Day 2)
   - Vision API (GPT-4V) 실제 호출
   - 응답 시간 측정
   - 비용 추적
   - 통합 테스트 (Designer → VisionAnalyzer 파이프라인)

---

## 1️⃣ Agent 개요

### 1.1 VisionAnalyzerAgent 역할
**출처**: [AGENTS_SPEC.md](../PHASE0/AGENTS_SPEC.md) 섹션 2.4

VisionGeneratorAgent가 생성한 이미지의 품질을 자동으로 평가하는 Agent입니다.

**입력**:
```json
{
  "image_url": "https://cdn.sparklio.ai/image_001.png",
  "brand_kit": {
    "colors": ["#F2EDE8", "#7C4D3A"],
    "style": "minimal_natural"
  },
  "evaluation_criteria": ["composition", "colors", "lighting", "brand_match"]
}
```

**출력**:
```json
{
  "quality_score": 0.87,
  "analysis": {
    "composition": {"balance": 0.9, "focal_point": "center"},
    "colors": {"brand_match": 0.92, "harmony": 0.88},
    "technical": {"resolution": "high", "sharpness": 0.85}
  },
  "issues": ["배경 노이즈 약간 있음"],
  "improvements": ["색상 채도 +5%"]
}
```

### 1.2 KPI
- **Analysis Accuracy**: > 95%
- **Issue Detection Rate**: > 90%
- **Response Time**: < 5s (P90)

---

## 2️⃣ Mock 모드 테스트 (Day 1)

### 2.1 목적
Vision API 호출 없이 VisionAnalyzerAgent의 로직과 데이터 처리가 정확한지 검증합니다.

### 2.2 테스트 환경
- **Backend**: 맥미니 서버 (http://100.123.51.5:8000)
- **모드**: Mock
- **테스트 도구**: curl + Python script
- **예상 소요 시간**: 3시간

---

### 2.3 테스트 케이스 (Mock 모드 5개)

#### **TC-M01: 고품질 이미지 분석**

**목적**: 완벽한 이미지에 대한 높은 점수 부여 검증

**입력**:
```json
{
  "image_url": "https://cdn.sparklio.ai/test/high_quality_001.png",
  "brand_kit": {
    "colors": ["#F2EDE8", "#7C4D3A"],
    "style": "minimal_natural"
  },
  "evaluation_criteria": ["composition", "colors", "lighting", "brand_match"]
}
```

**기대 출력**:
```json
{
  "quality_score": 0.90 ~ 1.0,
  "analysis": {
    "composition": {"balance": >= 0.9},
    "colors": {"brand_match": >= 0.9},
    "technical": {"resolution": "high"}
  },
  "issues": [],
  "improvements": []
}
```

**성공 기준**:
- ✅ `quality_score >= 0.9`
- ✅ `issues` 배열 비어 있음
- ✅ `composition.balance >= 0.9`
- ✅ 응답 시간 < 1s (Mock)

---

#### **TC-M02: 저품질 이미지 분석**

**목적**: 품질 이슈가 있는 이미지에 대한 낮은 점수 및 개선 제안 검증

**입력**:
```json
{
  "image_url": "https://cdn.sparklio.ai/test/low_quality_001.png",
  "brand_kit": {
    "colors": ["#F2EDE8", "#7C4D3A"],
    "style": "minimal_natural"
  },
  "evaluation_criteria": ["composition", "colors", "lighting", "brand_match"]
}
```

**기대 출력**:
```json
{
  "quality_score": 0.4 ~ 0.6,
  "analysis": {
    "composition": {"balance": < 0.7},
    "colors": {"brand_match": < 0.7},
    "technical": {"resolution": "low", "sharpness": < 0.6}
  },
  "issues": ["배경 노이즈 심함", "색상 불일치"],
  "improvements": ["해상도 개선", "색상 보정 필요"]
}
```

**성공 기준**:
- ✅ `quality_score < 0.7`
- ✅ `issues` 배열에 2개 이상 항목
- ✅ `improvements` 배열에 구체적 제안 포함

---

#### **TC-M03: 브랜드 컬러 불일치 감지**

**목적**: 브랜드킷 색상과 다른 이미지를 정확히 감지하는지 검증

**입력**:
```json
{
  "image_url": "https://cdn.sparklio.ai/test/color_mismatch_001.png",
  "brand_kit": {
    "colors": ["#F2EDE8", "#7C4D3A"],  // 밝은 베이지 + 브라운
    "style": "minimal_natural"
  },
  "evaluation_criteria": ["colors", "brand_match"]
}
```

**Mock 데이터 설정**:
- 이미지 주요 색상: `["#FF0000", "#0000FF"]` (빨강 + 파랑)
- 브랜드 색상과 완전히 불일치

**기대 출력**:
```json
{
  "quality_score": 0.3 ~ 0.5,
  "analysis": {
    "colors": {
      "brand_match": < 0.4,
      "harmony": "any",
      "detected_colors": ["#FF0000", "#0000FF"]
    }
  },
  "issues": ["브랜드 색상과 불일치"],
  "improvements": ["브랜드 컬러 팔레트 적용"]
}
```

**성공 기준**:
- ✅ `colors.brand_match < 0.5`
- ✅ `issues`에 "브랜드 색상" 키워드 포함
- ✅ `improvements`에 구체적 색상 제안

---

#### **TC-M04: 잘못된 이미지 URL 에러 핸들링**

**목적**: 유효하지 않은 URL 입력 시 적절한 에러 반환 검증

**입력**:
```json
{
  "image_url": "https://invalid-url.com/nonexistent.png",
  "brand_kit": {},
  "evaluation_criteria": ["composition"]
}
```

**기대 출력**:
```json
{
  "status": "error",
  "error": {
    "code": "IMAGE_LOAD_FAILED",
    "message": "이미지를 불러올 수 없습니다",
    "details": {
      "url": "https://invalid-url.com/nonexistent.png"
    }
  }
}
```

**성공 기준**:
- ✅ `status == "error"`
- ✅ `error.code == "IMAGE_LOAD_FAILED"`
- ✅ HTTP 400 또는 500 응답 코드

---

#### **TC-M05: 필수 입력 누락 검증**

**목적**: `image_url` 누락 시 적절한 검증 에러 반환

**입력**:
```json
{
  "brand_kit": {"colors": ["#F2EDE8"]},
  "evaluation_criteria": ["composition"]
}
```

**기대 출력**:
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_INPUT",
    "message": "image_url이 필요합니다"
  }
}
```

**성공 기준**:
- ✅ `status == "error"`
- ✅ `error.code == "INVALID_INPUT"`
- ✅ HTTP 400 응답 코드

---

## 3️⃣ Live 모드 테스트 (Day 2)

### 3.1 목적
실제 Vision API (GPT-4V)를 호출하여 이미지 분석 정확도 및 성능을 검증합니다.

### 3.2 테스트 환경
- **Backend**: 맥미니 서버 (http://100.123.51.5:8000)
- **모드**: Live
- **Vision API**: GPT-4V (OpenAI)
- **비용**: 약 $0.05 ~ $0.10/request
- **예상 소요 시간**: 3시간

---

### 3.3 테스트 케이스 (Live 모드 5개)

#### **TC-L01: 실제 제품 이미지 품질 평가**

**목적**: 실제 제품 사진에 대한 GPT-4V 분석 정확도 검증

**테스트 데이터**:
- 이미지: 화장품 제품 사진 (고품질)
- 해상도: 1024x1024
- 브랜드 스타일: minimal_natural

**입력**:
```json
{
  "image_url": "https://cdn.sparklio.ai/test/real_product_001.png",
  "brand_kit": {
    "colors": ["#F2EDE8", "#7C4D3A"],
    "style": "minimal_natural"
  },
  "evaluation_criteria": ["composition", "colors", "lighting", "brand_match"]
}
```

**검증 항목**:
1. GPT-4V가 실제로 호출되는가?
2. 응답 시간이 5초 이내인가?
3. `quality_score`가 0.0 ~ 1.0 범위인가?
4. `analysis` 객체가 모든 criteria를 포함하는가?
5. `issues`와 `improvements`가 구체적인가?

**성공 기준**:
- ✅ API 호출 성공
- ✅ 응답 시간 < 5s
- ✅ `quality_score` 범위 검증
- ✅ `analysis` 완전성 검증
- ✅ 비용 < $0.10

---

#### **TC-L02: 브랜드 컬러 일치도 평가**

**목적**: GPT-4V가 브랜드 컬러 일치도를 정확히 평가하는지 검증

**테스트 데이터**:
- 이미지 A: 브랜드 컬러와 일치 (베이지 + 브라운)
- 이미지 B: 브랜드 컬러와 불일치 (빨강 + 파랑)

**입력 A** (일치):
```json
{
  "image_url": "https://cdn.sparklio.ai/test/brand_color_match.png",
  "brand_kit": {"colors": ["#F2EDE8", "#7C4D3A"]},
  "evaluation_criteria": ["colors", "brand_match"]
}
```

**입력 B** (불일치):
```json
{
  "image_url": "https://cdn.sparklio.ai/test/brand_color_mismatch.png",
  "brand_kit": {"colors": ["#F2EDE8", "#7C4D3A"]},
  "evaluation_criteria": ["colors", "brand_match"]
}
```

**검증**:
- 이미지 A의 `colors.brand_match` > 이미지 B의 `colors.brand_match`

**성공 기준**:
- ✅ 이미지 A: `brand_match >= 0.8`
- ✅ 이미지 B: `brand_match < 0.5`
- ✅ A > B 관계 성립

---

#### **TC-L03: 구도 균형 평가**

**목적**: GPT-4V가 이미지 구도 균형을 정확히 평가하는지 검증

**테스트 데이터**:
- 이미지 A: 중앙 정렬, 균형 잡힌 구도
- 이미지 B: 불균형한 구도 (한쪽으로 치우침)

**성공 기준**:
- ✅ 이미지 A: `composition.balance >= 0.8`
- ✅ 이미지 B: `composition.balance < 0.6`
- ✅ focal_point 정확히 감지 (center, left, right 등)

---

#### **TC-L04: 조명 품질 평가**

**목적**: 조명이 너무 어둡거나 밝은 이미지를 감지하는지 검증

**테스트 데이터**:
- 이미지 A: 적절한 조명
- 이미지 B: 과도하게 어두운 이미지
- 이미지 C: 과도하게 밝은 이미지 (과다 노출)

**성공 기준**:
- ✅ 이미지 A: `lighting.quality >= 0.8`
- ✅ 이미지 B: `lighting.quality < 0.6`, issues에 "어두움" 키워드
- ✅ 이미지 C: `lighting.quality < 0.6`, issues에 "밝음" 또는 "과다 노출" 키워드

---

#### **TC-L05: 성능 및 비용 벤치마크**

**목적**: 연속 호출 시 응답 시간 및 비용 안정성 검증

**테스트 시나리오**:
1. 동일한 이미지에 대해 5회 연속 호출
2. 각 호출의 응답 시간 및 비용 측정

**측정 항목**:
- 평균 응답 시간
- P90 응답 시간 (90% 요청이 이 시간 이내)
- P99 응답 시간
- 평균 비용
- 총 비용

**성공 기준**:
- ✅ 평균 응답 시간 < 3s
- ✅ P90 응답 시간 < 5s
- ✅ 평균 비용 < $0.08/request
- ✅ 총 비용 < $0.50 (5회)
- ✅ 5회 모두 성공 (에러율 0%)

---

## 4️⃣ 통합 테스트 (Day 2 오후)

### 4.1 목적
Designer Agent → VisionAnalyzer Agent 파이프라인이 정상 작동하는지 검증합니다.

### 4.2 테스트 시나리오

#### **시나리오 1: 제품 이미지 생성 및 자동 품질 검증**

**Step 1**: Designer Agent로 제품 이미지 생성
```bash
curl -X POST http://100.123.51.5:8000/api/v1/agents/designer/execute \
  -H "Content-Type: application/json" \
  -d '{
    "description": "자연 성분 스킨케어 제품",
    "style": "minimal_natural",
    "dimensions": {"width": 1024, "height": 1024},
    "brand_colors": ["#F2EDE8", "#7C4D3A"]
  }'
```

**Step 2**: 생성된 이미지 URL을 VisionAnalyzer에 전달
```bash
curl -X POST http://100.123.51.5:8000/api/v1/agents/vision-analyzer/execute \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "<Designer가 생성한 이미지 URL>",
    "brand_kit": {"colors": ["#F2EDE8", "#7C4D3A"]},
    "evaluation_criteria": ["composition", "colors", "lighting", "brand_match"]
  }'
```

**검증**:
- ✅ Designer Agent 성공 (이미지 URL 반환)
- ✅ VisionAnalyzer Agent 성공 (quality_score 반환)
- ✅ `quality_score >= 0.7` (Designer 생성 이미지는 기본적으로 양호)
- ✅ 전체 파이프라인 소요 시간 < 30s

---

#### **시나리오 2: 품질 불합격 → 재생성 루프**

**목적**: VisionAnalyzer가 낮은 점수를 주면 Designer가 재생성하는 로직 검증

**Step 1**: 의도적으로 저품질 이미지 생성 (Mock 모드)

**Step 2**: VisionAnalyzer 평가 → `quality_score < 0.7`

**Step 3**: 자동 재생성 요청 (Workflow Orchestrator)

**Step 4**: 재생성된 이미지 평가 → `quality_score >= 0.7`

**성공 기준**:
- ✅ 1차 평가 실패 감지
- ✅ 자동 재생성 트리거
- ✅ 2차 평가 통과
- ✅ 최대 재시도 횟수 (3회) 제한 동작

---

## 5️⃣ 테스트 데이터 준비

### 5.1 Mock 모드 테스트 이미지 (5개)

| ID | 파일명 | 설명 | 품질 | 브랜드 일치 |
|----|--------|------|------|------------|
| 1 | `high_quality_001.png` | 고품질 제품 사진 | 0.95 | 0.92 |
| 2 | `low_quality_001.png` | 저해상도, 노이즈 많음 | 0.45 | 0.50 |
| 3 | `color_mismatch_001.png` | 브랜드 컬러 불일치 | 0.70 | 0.30 |
| 4 | `invalid_url` | (존재하지 않는 URL) | N/A | N/A |
| 5 | (입력 누락) | `image_url` 필드 없음 | N/A | N/A |

**저장 위치**: `backend/tests/fixtures/vision_analyzer/`

---

### 5.2 Live 모드 테스트 이미지 (5개)

| ID | 파일명 | 설명 | 예상 점수 |
|----|--------|------|----------|
| 1 | `real_product_001.png` | 실제 화장품 사진 | 0.85 ~ 0.95 |
| 2 | `brand_color_match.png` | 브랜드 컬러 일치 | 0.80 ~ 0.90 |
| 3 | `brand_color_mismatch.png` | 브랜드 컬러 불일치 | 0.30 ~ 0.50 |
| 4 | `dark_image.png` | 어두운 조명 | 0.40 ~ 0.60 |
| 5 | `overexposed_image.png` | 과다 노출 | 0.40 ~ 0.60 |

**저장 위치**: CDN 또는 `backend/tests/fixtures/vision_analyzer_live/`

**이미지 소스**:
- Unsplash (무료 고품질 이미지)
- Pexels (무료 스톡 사진)
- 자체 제작 (Photoshop/GIMP)

---

## 6️⃣ 테스트 실행 방법

### 6.1 Mock 모드 테스트 실행

**스크립트**: `backend/tests/test_vision_analyzer_mock.py`

```python
import pytest
import httpx

BASE_URL = "http://100.123.51.5:8000"

@pytest.mark.asyncio
async def test_high_quality_image():
    """TC-M01: 고품질 이미지 분석"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/agents/vision-analyzer/execute",
            json={
                "image_url": "https://cdn.sparklio.ai/test/high_quality_001.png",
                "brand_kit": {"colors": ["#F2EDE8", "#7C4D3A"]},
                "evaluation_criteria": ["composition", "colors", "lighting"]
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["quality_score"] >= 0.9
        assert len(data["issues"]) == 0
        assert data["analysis"]["composition"]["balance"] >= 0.9

# 나머지 TC-M02 ~ TC-M05 테스트 함수...
```

**실행**:
```bash
pytest backend/tests/test_vision_analyzer_mock.py -v
```

---

### 6.2 Live 모드 테스트 실행

**스크립트**: `backend/tests/test_vision_analyzer_live.py`

```python
import pytest
import httpx
import time

BASE_URL = "http://100.123.51.5:8000"

@pytest.mark.asyncio
async def test_real_product_analysis():
    """TC-L01: 실제 제품 이미지 품질 평가"""
    start_time = time.time()

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/agents/vision-analyzer/execute",
            json={
                "image_url": "https://cdn.sparklio.ai/test/real_product_001.png",
                "brand_kit": {"colors": ["#F2EDE8", "#7C4D3A"]},
                "evaluation_criteria": ["composition", "colors", "lighting", "brand_match"]
            }
        )

        elapsed = time.time() - start_time

        assert response.status_code == 200
        assert elapsed < 5.0  # 응답 시간 검증

        data = response.json()
        assert 0.0 <= data["quality_score"] <= 1.0
        assert "analysis" in data
        assert "composition" in data["analysis"]

        # 비용 추적
        cost = data.get("meta", {}).get("cost", 0)
        assert cost < 0.10

# 나머지 TC-L02 ~ TC-L05 테스트 함수...
```

**실행**:
```bash
# Live 모드로 전환
export VISION_MODE=live

# 테스트 실행
pytest backend/tests/test_vision_analyzer_live.py -v --tb=short
```

---

## 7️⃣ 성공 기준 (종합)

### 7.1 기능 검증
- ✅ Mock 모드: 5개 테스트 케이스 100% 통과
- ✅ Live 모드: 5개 테스트 케이스 100% 통과
- ✅ 통합 테스트: 2개 시나리오 100% 통과

### 7.2 성능 검증
- ✅ Mock 모드 응답 시간: < 1s
- ✅ Live 모드 평균 응답 시간: < 3s
- ✅ Live 모드 P90 응답 시간: < 5s

### 7.3 품질 검증
- ✅ 품질 점수 정확도: ±0.1 이내 (고품질 이미지 >= 0.9, 저품질 < 0.7)
- ✅ 브랜드 컬러 일치도 감지 정확도: > 90%
- ✅ 에러 핸들링: 100% (잘못된 입력 시 적절한 에러 반환)

### 7.4 비용 검증
- ✅ Live 모드 평균 비용: < $0.08/request
- ✅ 총 테스트 비용: < $1.00 (전체 테스트)

---

## 8️⃣ 리스크 및 대응

### 리스크 1: Vision API 응답 시간 불안정
**가능성**: Medium
**영향**: High (5초 초과 시 사용자 경험 저하)

**대응책**:
- Timeout 설정 (10초)
- Retry 로직 추가 (최대 3회)
- 응답 캐싱 (동일 이미지 재요청 시)

---

### 리스크 2: Vision API 비용 초과
**가능성**: Low
**영향**: Medium

**대응책**:
- Mock 모드 우선 사용
- Live 모드는 최종 검증용으로만 사용
- 일일 비용 한도 설정 ($5/day)

---

### 리스크 3: 품질 점수 정확도 낮음
**가능성**: Medium
**영향**: High (자동 품질 검증 신뢰도 저하)

**대응책**:
- GPT-4V Prompt 개선 (더 구체적인 평가 기준 명시)
- 여러 이미지로 테스트하여 평균 정확도 측정
- 사람의 평가와 비교 (Ground Truth 확보)

---

## 9️⃣ 일정 및 담당

### Day 1 (Phase 1 Week 2 - Day 1)
**담당**: A팀 QA 리더
**소요 시간**: 3시간

| 시간 | 작업 |
|------|------|
| 09:00 - 09:30 | 테스트 환경 설정 (Backend Mock 모드 전환) |
| 09:30 - 10:30 | TC-M01 ~ TC-M05 실행 |
| 10:30 - 11:00 | 결과 분석 및 버그 리포트 작성 |
| 11:00 - 12:00 | B팀과 버그 수정 협의 및 재테스트 |

---

### Day 2 (Phase 1 Week 2 - Day 2)
**담당**: A팀 QA 리더
**소요 시간**: 4시간

| 시간 | 작업 |
|------|------|
| 09:00 - 09:30 | 테스트 환경 설정 (Backend Live 모드 전환) |
| 09:30 - 11:00 | TC-L01 ~ TC-L05 실행 |
| 11:00 - 12:00 | 통합 테스트 (Designer → VisionAnalyzer) |
| 13:00 - 14:00 | 성능 벤치마크 및 비용 분석 |
| 14:00 - 15:00 | 최종 테스트 보고서 작성 |

---

## 🔟 산출물

### 10.1 테스트 보고서
**파일**: `docs/testing/PHASE1_TEST_REPORT.md`

**포함 내용**:
- 테스트 실행 결과 (통과/실패)
- 성능 벤치마크 데이터
- 발견된 버그 목록
- 품질 점수 정확도 분석
- 비용 분석
- 개선 제안

---

### 10.2 버그 리포트
**파일**: `docs/testing/PHASE1_BUG_REPORTS.md`

**포맷**:
```markdown
## Bug #1: 브랜드 컬러 일치도 과대 평가

**심각도**: Medium
**발견 일시**: 2025-11-XX 10:30
**테스트 케이스**: TC-L02

**재현 방법**:
1. 브랜드 컬러: ["#F2EDE8", "#7C4D3A"]
2. 이미지 주요 색상: ["#FF0000", "#0000FF"]
3. VisionAnalyzer 실행

**기대 결과**: `brand_match < 0.5`
**실제 결과**: `brand_match = 0.75`

**원인 분석**: GPT-4V Prompt가 색상 일치도를 느슨하게 평가

**해결 방안**: Prompt 개선 (HEX 코드 직접 비교 요청)

**담당**: B팀
```

---

### 10.3 테스트 데이터셋
**위치**: `backend/tests/fixtures/vision_analyzer/`

**포함 파일**:
- Mock 모드 테스트 이미지 5개
- Live 모드 테스트 이미지 5개
- 테스트 입력 JSON 파일
- 기대 출력 JSON 파일 (Ground Truth)

---

## 1️⃣1️⃣ 후속 작업

### Phase 2 준비 (ScenePlanner + Template)
- VisionAnalyzer 테스트 결과 반영
- 이미지 품질 자동 검증 파이프라인 확장
- 영상 씬 품질 평가로 확장

### Phase 3 준비 (Intelligence Agents)
- 대량 이미지 품질 평가 성능 테스트
- 배치 처리 성능 벤치마크

---

## 📚 참고 문서

1. **[AGENTS_SPEC.md](../PHASE0/AGENTS_SPEC.md)** - VisionAnalyzerAgent 명세
2. **[A_TEAM_REVIEW_AGENT_EXPANSION_2025-11-18.md](../A_TEAM_REVIEW_AGENT_EXPANSION_2025-11-18.md)** - Agent 확장 플랜 검토
3. **[WORK_REGULATIONS.md](../WORK_REGULATIONS.md)** - 테스트 규정 (규정 6)

---

**작성 완료**: 2025-11-19 (수) 10:30
**검토자**: B팀 Backend 리더 (검토 요청)
**승인자**: A팀 QA 리더
**다음 단계**: B팀 Phase 1 착수 시 본 계획서 기반 테스트 실행
