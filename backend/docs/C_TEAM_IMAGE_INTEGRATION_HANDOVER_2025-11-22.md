# C팀 이미지 통합 핸드오버 문서

> **작성일**: 2025년 11월 22일 (토요일)
> **작성 시간**: 오후 8시 30분
> **작성자**: B팀 (Backend Team)
> **수신**: C팀 (Frontend Team)
> **문서 버전**: 1.0.0
> **상태**: ✅ 구현 완료, 서버 재시작 후 사용 가능

---

## 📋 Executive Summary

C팀의 지침에 따라 `/api/v1/generate` API에서 `include_image: true`일 때 **텍스트 + 이미지(Base64)를 한 번에 반환**하도록 구현을 완료했습니다.

### 핵심 성과
1. ✅ **API 응답 스펙 확정**: `text.image` 필드 추가 (type 기반 Base64/URL 양방향 지원)
2. ✅ **ComfyUI 연동 완료**: MediaGateway를 통한 이미지 생성 로직 구현
3. ✅ **Designer 가이드라인 적용**: 흰색/밝은 회색 배경, Canvas 최적화 프롬프트
4. ✅ **Git 커밋 완료**: 2개 커밋 (프롬프트 개선 + ComfyUI 연동)

### 다음 단계
⏳ **A팀 서버 재시작 대기 중** → 재시작 후 즉시 사용 가능

---

## 🎯 API 응답 스펙 (확정)

### 요청 예시
```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "brand_001",
    "input": {
      "product_name": "프리미엄 무선 이어폰",
      "category": "전자제품",
      "target_audience": "20-30대 직장인",
      "features": ["노이즈 캔슬링", "30시간 배터리", "IPX7 방수"],
      "include_image": true
    }
  }'
```

### 응답 예시
```json
{
  "kind": "product_detail",
  "document": {
    "documentId": "doc_abc123",
    "type": "product_detail",
    "canvas_json": { ... }
  },
  "text": {
    "headline": "프리미엄 무선 이어폰",
    "subheadline": "음질과 편의성을 원하는 당신을 위한 최고 선택!",
    "body": "20-30대 직장인들을 위해 설계된 프리미엄 무선 이어폰...",
    "bullets": ["노이즈 캔슬링", "30시간 배터리", "IPX7 방수"],
    "cta": "프리미엄 사운드와 편안함을 경험해보세요!",
    "image": {
      "type": "base64",
      "format": "png",
      "data": "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEA..."
    }
  },
  "meta": {
    "workflow": "product_content_pipeline",
    "agents_used": ["copywriter", "reviewer", "optimizer"],
    "elapsed_seconds": 35.2,
    "tokens_used": 1935
  }
}
```

---

## 📦 `text.image` 필드 상세 스펙

### 필드 정의
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `type` | string | ✅ | 이미지 타입: `"base64"` 또는 `"url"` |
| `format` | string | ✅ | 이미지 포맷: `"png"`, `"jpg"` 등 (기본값: `"png"`) |
| `data` | string? | ⚪ | Base64 인코딩된 이미지 데이터 (`type="base64"`일 때) |
| `url` | string? | ⚪ | 이미지 URL (`type="url"`일 때, 향후 확장) |

### 현재 버전 (v1.0)
```typescript
interface ImagePayload {
  type: "base64";  // 현재는 base64만 지원
  format: "png";   // ComfyUI 기본 포맷
  data: string;    // Base64 문자열 (약 1-2MB)
}
```

### 향후 버전 (v2.0 - MinIO/S3 저장 후)
```typescript
interface ImagePayload {
  type: "url";
  format: "png";
  url: "https://cdn.sparklio.ai/generated/abc123.png";
}
```

**중요**: `type` 필드 기반 분기 처리를 구현하면 Backend 수정 시 Frontend 코드 변경 불필요!

---

## 💻 C팀 Frontend 구현 가이드

### 1. TypeScript 타입 정의

**파일**: `types/generator.ts` (새로 생성)

```typescript
/**
 * 이미지 페이로드 (Base64 또는 URL)
 */
export interface ImagePayload {
  type: "base64" | "url";
  format: string;
  data?: string;  // type="base64"일 때 사용
  url?: string;   // type="url"일 때 사용
}

/**
 * 텍스트 페이로드
 */
export interface TextPayload {
  headline?: string;
  subheadline?: string;
  body?: string;
  bullets?: string[];
  cta?: string;
  image?: ImagePayload;  // ← 새로 추가!
}

/**
 * Generator 응답
 */
export interface GenerateResponse {
  kind: string;
  document: {
    documentId: string;
    type: string;
    canvas_json: any;
  };
  text: TextPayload;
  meta: {
    workflow: string;
    agents_used: string[];
    elapsed_seconds: number;
    tokens_used: number;
  };
}
```

### 2. Base64 → Data URL 변환 유틸

**파일**: `lib/image-utils.ts` (새로 생성)

```typescript
/**
 * ImagePayload를 브라우저에서 사용 가능한 URL로 변환
 */
export function getImageUrl(image: ImagePayload | undefined): string | null {
  if (!image) return null;

  if (image.type === "base64" && image.data) {
    // Base64 → Data URL
    return `data:image/${image.format};base64,${image.data}`;
  } else if (image.type === "url" && image.url) {
    // URL 그대로 사용
    return image.url;
  }

  return null;
}
```

### 3. React 컴포넌트 예시

**파일**: `components/ProductPreview.tsx`

```tsx
import { GenerateResponse } from "@/types/generator";
import { getImageUrl } from "@/lib/image-utils";

interface ProductPreviewProps {
  data: GenerateResponse;
}

export function ProductPreview({ data }: ProductPreviewProps) {
  const { text } = data;
  const imageUrl = getImageUrl(text.image);

  return (
    <div className="product-preview">
      <h1>{text.headline}</h1>
      {text.subheadline && <h2>{text.subheadline}</h2>}

      {/* 이미지 표시 */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={text.headline || "Product"}
          className="product-image"
        />
      )}

      <p>{text.body}</p>

      {text.bullets && (
        <ul>
          {text.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}

      <button>{text.cta}</button>
    </div>
  );
}
```

### 4. API 호출 예시

**파일**: `lib/api/generator.ts`

```typescript
import { GenerateResponse } from "@/types/generator";

export async function generateProductContent(
  productName: string,
  features: string[],
  includeImage: boolean = false
): Promise<GenerateResponse> {
  const response = await fetch("http://100.123.51.5:8000/api/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind: "product_detail",
      brandId: "your_brand_id",
      input: {
        product_name: productName,
        category: "제품",
        target_audience: "일반 소비자",
        features: features,
        include_image: includeImage,  // ← 이미지 생성 여부
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// 사용 예시
const result = await generateProductContent(
  "프리미엄 무선 이어폰",
  ["노이즈 캔슬링", "30시간 배터리", "IPX7 방수"],
  true  // 이미지 생성 요청
);

console.log("Image URL:", getImageUrl(result.text.image));
```

---

## ⚙️ Backend 구현 세부사항

### 1. 파일 변경 내역

#### `app/schemas/generator.py`
```python
class ImagePayload(BaseModel):
    """생성된 이미지 데이터"""
    type: str = Field(..., description="이미지 타입: 'base64' 또는 'url'")
    format: str = Field(default="png", description="이미지 포맷")
    data: Optional[str] = Field(None, description="Base64 데이터")
    url: Optional[str] = Field(None, description="이미지 URL")

class TextPayload(BaseModel):
    """생성된 텍스트 블록"""
    headline: Optional[str]
    subheadline: Optional[str]
    body: Optional[str]
    bullets: Optional[List[str]]
    cta: Optional[str]
    image: Optional[ImagePayload] = Field(None, description="생성된 이미지")
```

#### `app/services/generator/service.py`
```python
async def _build_response(self, kind, input_data, workflow_result):
    # ... (텍스트 생성 로직)

    # 이미지 생성 (include_image: true일 때만)
    image_payload = None
    if input_data.get("include_image", False):
        try:
            # 1. 이미지 프롬프트 생성
            image_prompt = self._build_image_prompt(input_data, text_data)

            # 2. MediaGateway를 통한 ComfyUI 호출
            media_response = await self.media_gateway.generate(
                prompt=image_prompt,
                task="product_image",
                media_type="image",
                options={"width": 1024, "height": 1024}
            )

            # 3. Base64 데이터를 ImagePayload로 변환
            if media_response.outputs:
                first_output = media_response.outputs[0]
                image_payload = ImagePayload(
                    type="base64",
                    format=first_output.format,
                    data=first_output.data
                )
        except Exception as e:
            logger.exception(f"Failed to generate image: {e}")
            # 이미지 실패해도 텍스트는 반환

    # TextPayload 생성 (image 포함)
    text = TextPayload(
        headline=text_data.get("headline"),
        # ...
        image=image_payload
    )
```

### 2. 이미지 프롬프트 가이드라인

**메서드**: `_build_image_prompt()`

```python
def _build_image_prompt(self, input_data, text_data) -> str:
    product_name = input_data.get("product_name", "product")
    features = input_data.get("features", [])

    # Designer Agent 가이드라인 적용
    prompt = (
        f"Professional product photography of {product_name}, "
        f"centered composition, studio lighting, "
        f"white to light gray gradient background, "
        f"clean and minimal, high quality, 8k resolution, "
        f"commercial advertising style"
    )

    if features:
        features_str = ", ".join(features[:3])
        prompt += f", highlighting {features_str}"

    return prompt
```

**적용된 가이드라인**:
- ✅ **배경**: 흰색/밝은 회색 그라디언트 (텍스트 가독성 최우선)
- ✅ **구도**: 중앙 배치, 스튜디오 조명
- ✅ **화질**: 8K 해상도, 전문 상업 광고 스타일
- ✅ **복잡한 배경 금지**: 패턴, 질감, 어두운 배경 사용 금지

---

## 🧪 테스트 가이드

### 1. 기본 텍스트 생성 (이미지 없음)

```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test",
    "input": {
      "product_name": "테스트 제품",
      "features": ["특징1", "특징2"]
    }
  }'
```

**예상 결과**:
- ✅ `text.headline`, `text.body`, `text.cta` 포함
- ✅ `text.image` 필드 **없음** (include_image=false)

### 2. 텍스트 + 이미지 생성 (Base64)

```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test",
    "input": {
      "product_name": "프리미엄 무선 이어폰",
      "features": ["노이즈 캔슬링", "30시간 배터리"],
      "include_image": true
    }
  }'
```

**예상 결과**:
- ✅ `text.headline`, `text.body`, `text.cta` 포함
- ✅ `text.image.type === "base64"`
- ✅ `text.image.format === "png"`
- ✅ `text.image.data` Base64 문자열 (약 1-2MB)

### 3. Base64 데이터 검증

```bash
# 응답을 파일로 저장
curl ... > response.json

# image.data 추출 및 디코딩
cat response.json | jq -r '.text.image.data' | base64 -d > test.png

# 이미지 열기
open test.png  # macOS
start test.png  # Windows
```

---

## 📊 성능 및 제약사항

### 응답 시간
| 구성 | 예상 시간 |
|------|----------|
| 텍스트만 | 20-25초 |
| 텍스트 + 이미지 | 30-40초 |

**분석**:
- 텍스트 생성: 3개 Agent 순차 실행 (copywriter → reviewer → optimizer)
- 이미지 생성: ComfyUI SDXL 모델 (약 10-15초)

### Base64 데이터 크기
| 해상도 | Base64 크기 |
|--------|-------------|
| 1024x1024 PNG | 약 1.5-2MB |

**주의사항**:
- HTTP 응답 크기가 증가하므로 네트워크 성능에 영향
- 나중에 MinIO/S3 저장 + URL 방식으로 전환 권장

### 에러 핸들링
**이미지 생성 실패 시**:
```json
{
  "text": {
    "headline": "...",
    "body": "...",
    "cta": "...",
    "image": null  // ← 이미지 없음 (텍스트는 정상 반환)
  }
}
```

**Graceful Degradation**: 이미지 생성이 실패해도 텍스트는 정상 반환됩니다.

---

## 🔮 향후 확장 로드맵

### Phase 2: URL 방식 (MinIO/S3 저장)

**Backend 수정**:
```python
# 이미지를 MinIO에 저장
image_path = await save_to_minio(image_data, brand_id, doc_id)
presigned_url = await get_presigned_url(image_path)

# URL 방식으로 반환
image_payload = ImagePayload(
    type="url",
    format="png",
    url=presigned_url
)
```

**Frontend 수정 불필요**:
```typescript
// 기존 코드 그대로 작동!
const imageUrl = getImageUrl(result.text.image);
// type="base64" → Data URL
// type="url" → URL 그대로
```

### Phase 3: 다중 이미지 지원

**스펙 확장**:
```typescript
interface TextPayload {
  // ...
  images?: ImagePayload[];  // 복수형
}
```

---

## ✅ 체크리스트 (C팀 확인 사항)

### 구현 전 확인
- [ ] TypeScript 타입 정의 추가 (`types/generator.ts`)
- [ ] 이미지 유틸 함수 작성 (`lib/image-utils.ts`)
- [ ] API 클라이언트 수정 (`include_image` 파라미터 추가)

### 테스트 확인
- [ ] `include_image: false` 테스트 (이미지 없음 확인)
- [ ] `include_image: true` 테스트 (Base64 데이터 확인)
- [ ] Base64 → Data URL 변환 테스트
- [ ] `<img>` 태그 렌더링 테스트

### 에러 처리
- [ ] 이미지 생성 실패 시 Fallback UI (placeholder 이미지)
- [ ] 네트워크 타임아웃 처리 (40초 이상 대기)

---

## 📚 관련 문서

### Backend 문서
1. [B_TEAM_PROMPT_IMPROVEMENT_REPORT_2025-11-22.md](./B_TEAM_PROMPT_IMPROVEMENT_REPORT_2025-11-22.md)
   - Canvas 최적화 프롬프트 개선 상세 보고서

2. [B_TEAM_COMFYUI_TEST_REPORT_2025-11-22.md](./B_TEAM_COMFYUI_TEST_REPORT_2025-11-22.md)
   - ComfyUI 서버 테스트 및 이슈 분석 보고서

### Git 커밋
1. **커밋 1**: `6b0a5b7` - Canvas 최적화 프롬프트 개선
2. **커밋 2**: `dcceba1` - ComfyUI 연동 + 이미지 응답 스펙 확정

---

## 🚀 배포 및 사용 시작

### A팀 작업 (서버 재시작)
⏳ **대기 중**: 맥미니 서버 + Backend 서버 재시작

### C팀 작업 (즉시 시작 가능)
1. ✅ TypeScript 타입 정의 추가
2. ✅ 이미지 유틸 함수 작성
3. ✅ React 컴포넌트 수정
4. ⏳ **A팀 재시작 완료 후** API 테스트

---

## 📞 문의 및 지원

### B팀 담당
- **프롬프트 개선**: Designer Agent 가이드라인 조정
- **API 스펙 수정**: `text.image` 필드 확장
- **ComfyUI 설정**: 이미지 크기, 모델 변경

### 긴급 연락
- Backend API 이슈: B팀에 보고
- 서버 재시작: A팀에 요청
- 프롬프트 품질: B팀 + Designer Agent 검토

---

## 🎯 최종 요약

### ✅ 완료 사항
1. **API 스펙 확정**: `text.image` 필드 (Base64/URL 양방향 지원)
2. **ComfyUI 연동**: MediaGateway 통합 완료
3. **프롬프트 최적화**: Canvas 최적화 가이드라인 적용
4. **Git 커밋**: 2개 커밋 (프롬프트 + 이미지)
5. **문서화**: C팀 핸드오버 문서 작성

### ⏳ 대기 중
- **A팀 서버 재시작**: 맥미니 + Backend 서버
- **재시작 후 즉시 사용 가능**

### 🎉 기대 효과
- ✅ 텍스트 + 이미지 **한 번에 생성**
- ✅ Canvas 최적화 (흰색 배경, 텍스트 가독성)
- ✅ 향후 URL 방식 확장 시 **Frontend 코드 수정 불필요**

---

**작성 완료**: 2025년 11월 22일 (토요일) 오후 8시 30분
**작성자**: B팀 (Backend Team)
**문서 버전**: 1.0.0
**상태**: ✅ 구현 완료, A팀 서버 재시작 대기 중
