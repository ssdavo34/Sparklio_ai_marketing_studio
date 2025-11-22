# C팀 빠른 시작 가이드 - 이미지 통합

**작성일**: 2025-11-22
**작성자**: B팀 (Backend)
**대상**: C팀 (Frontend)

---

## 🚀 5분 안에 시작하기

### 1️⃣ API 요청에 플래그 추가

**Before (텍스트만):**
```typescript
const response = await fetch('http://100.123.51.5:8000/api/v1/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    kind: 'product_detail',
    brandId: 'brand_123',
    input: {
      product_name: '스마트워치',
      features: ['GPS', '심박수 측정'],
    }
  })
});
```

**After (텍스트 + 이미지):**
```typescript
const response = await fetch('http://100.123.51.5:8000/api/v1/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    kind: 'product_detail',
    brandId: 'brand_123',
    input: {
      product_name: '스마트워치',
      features: ['GPS', '심박수 측정'],
      include_image: true  // ← 이 줄만 추가!
    }
  })
});
```

---

### 2️⃣ 타입 정의 추가

**파일**: `types/generator.ts`

```typescript
// 이미지 페이로드
export interface ImagePayload {
  type: 'base64' | 'url';  // 현재는 base64만 지원
  format: string;          // 'png', 'jpg' 등
  data?: string;           // Base64 데이터
  url?: string;            // URL (향후 지원)
}

// 텍스트 페이로드 (image 필드 추가)
export interface TextPayload {
  headline?: string;
  subheadline?: string;
  body?: string;
  bullets?: string[];
  cta?: string;
  image?: ImagePayload;  // ← 새로 추가
}
```

---

### 3️⃣ 이미지 렌더링

**Base64 → Data URL 변환:**

```typescript
// 유틸리티 함수
function base64ToDataUrl(base64: string, format: string = 'png'): string {
  return `data:image/${format};base64,${base64}`;
}

// 컴포넌트에서 사용
function ProductImage({ text }: { text: TextPayload }) {
  if (!text.image || text.image.type !== 'base64') {
    return <div>이미지 없음</div>;
  }

  const imageUrl = base64ToDataUrl(text.image.data!, text.image.format);

  return (
    <img
      src={imageUrl}
      alt={text.headline || 'Product'}
      className="w-full h-auto"
    />
  );
}
```

---

## 📦 완성된 예제 코드

### React Component (TypeScript)

```typescript
import { useState } from 'react';

interface GenerateResponse {
  kind: string;
  document: any;
  text: {
    headline?: string;
    subheadline?: string;
    body?: string;
    bullets?: string[];
    cta?: string;
    image?: {
      type: 'base64' | 'url';
      format: string;
      data?: string;
      url?: string;
    };
  };
  meta: any;
}

function ProductGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://100.123.51.5:8000/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'product_detail',
          brandId: 'test',
          input: {
            product_name: '프리미엄 무선 이어폰',
            features: ['노이즈 캔슬링', '30시간 배터리', 'IPX7 방수'],
            target_audience: '2030 직장인',
            include_image: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = () => {
    if (!result?.text?.image) return null;
    if (result.text.image.type === 'base64' && result.text.image.data) {
      return `data:image/${result.text.image.format};base64,${result.text.image.data}`;
    }
    return result.text.image.url || null;
  };

  return (
    <div className="p-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? '생성 중... (약 60초)' : '제품 생성'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          에러: {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          {/* 이미지 */}
          {getImageUrl() && (
            <div className="border rounded p-4">
              <h3 className="font-bold mb-2">생성된 이미지:</h3>
              <img
                src={getImageUrl()!}
                alt={result.text.headline || 'Product'}
                className="max-w-md mx-auto"
              />
            </div>
          )}

          {/* 텍스트 */}
          <div className="border rounded p-4">
            <h3 className="font-bold mb-2">생성된 텍스트:</h3>
            <h1 className="text-2xl font-bold">{result.text.headline}</h1>
            <h2 className="text-lg text-gray-600">{result.text.subheadline}</h2>
            <p className="mt-2">{result.text.body}</p>
            {result.text.bullets && (
              <ul className="mt-2 list-disc list-inside">
                {result.text.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
            <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
              {result.text.cta}
            </button>
          </div>

          {/* 메타 정보 */}
          <div className="text-sm text-gray-500">
            생성 시간: {result.meta.elapsed_seconds?.toFixed(1)}초
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductGenerator;
```

---

## ⏱️ 예상 응답 시간

| 시나리오 | 응답 시간 |
|---------|---------|
| 텍스트만 (`include_image: false`) | ~21초 |
| 텍스트 + 이미지 (`include_image: true`) | ~57초 |

**UI 권장사항:**
- 로딩 인디케이터 표시 필수
- 예상 시간 표시 ("약 60초 소요됩니다")
- 취소 버튼 제공 고려

---

## 🎨 이미지 특징

### 생성되는 이미지
- **해상도**: 1024x1024 픽셀
- **포맷**: PNG
- **배경**: 흰색 → 밝은 회색 그라디언트
- **스타일**: 프로페셔널 제품 사진
- **구도**: 제품 중심, 스튜디오 조명

### 크기
- **원본 PNG**: ~500KB
- **Base64 인코딩 후**: ~666KB (33% 증가)

---

## ⚠️ 주의사항

### 1. 응답 크기
Base64로 인해 응답 크기가 큽니다 (최대 ~700KB).
- 모바일 네트워크 고려 필요
- 로딩 인디케이터 필수

### 2. 에러 핸들링
이미지 생성 실패 시에도 텍스트는 반환됩니다:
```typescript
if (result.text.image) {
  // 이미지가 있으면 표시
  renderImage(result.text.image);
} else {
  // 이미지가 없으면 플레이스홀더 표시
  renderPlaceholder();
}
```

### 3. 브라우저 메모리
Base64 이미지는 메모리에 로드됩니다.
- 한 페이지에 많은 이미지 표시 시 주의
- Virtual scrolling 고려

---

## 🧪 테스트 방법

### cURL로 빠른 테스트
```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test",
    "input": {
      "product_name": "테스트 제품",
      "features": ["기능1", "기능2"],
      "include_image": true
    }
  }' | jq '.text.image.type'
```

**예상 출력**: `"base64"`

---

## 📚 상세 문서

더 자세한 정보는 다음 문서를 참조하세요:

1. **C팀 이미지 통합 핸드오버 문서** (19 섹션)
   `docs/C_TEAM_IMAGE_INTEGRATION_HANDOVER_2025-11-22.md`
   - API 스펙 상세
   - 전체 TypeScript 타입
   - 유틸리티 함수 모음
   - 성능 최적화 팁

2. **최종 완료 보고서**
   `docs/FINAL_COMFYUI_INTEGRATION_REPORT_2025-11-22.md`
   - 구현 세부사항
   - 성능 분석
   - 아키텍처

---

## 🆘 문제 해결

### Q: 이미지가 생성되지 않아요
**A**: 다음을 확인하세요:
1. `include_image: true` 플래그 확인
2. Backend 로그 확인 (`docker logs sparklio-backend`)
3. ComfyUI 서버 실행 상태 확인 (Desktop GPU)

### Q: 응답이 너무 느려요
**A**: 정상입니다. 이미지 생성은 약 36초 소요됩니다.
- 로딩 UI로 사용자 경험 개선
- 향후 URL 방식 도입 시 개선 예정

### Q: Base64가 너무 커요
**A**: 현재는 Base64 방식만 지원합니다.
- Phase 2에서 URL 방식 도입 예정
- 그때까지는 로딩 인디케이터로 UX 개선

---

## ✅ 체크리스트

Frontend 구현 전 확인:
- [ ] TypeScript 타입 정의 추가
- [ ] Base64 → Data URL 유틸리티 함수 구현
- [ ] 이미지 렌더링 컴포넌트 구현
- [ ] 로딩 상태 UI 추가 (60초 대응)
- [ ] 에러 핸들링 구현 (이미지 없을 때)
- [ ] 플레이스홀더 이미지 준비
- [ ] 모바일 네트워크 테스트

---

## 🎉 요약

**한 줄 요약**: `include_image: true` 추가하면 `text.image.data`에 Base64 PNG가 옵니다!

**최소 구현**:
1. 요청에 `include_image: true` 추가
2. 응답의 `text.image.data`를 `<img src="data:image/png;base64,...">`로 표시
3. 로딩 인디케이터 추가 (60초 대응)

**끝! 🚀**

---

**질문이나 문제가 있으면 B팀에게 연락주세요!**
