# 🔄 Sparklio AI 서비스 생성 플로우

**작성일**: 2025-11-28
**작성자**: C팀 (Frontend Team)
**업데이트**: B팀 VisionGeneratorAgent 통합 완료

---

## 📋 목차

1. [개요](#개요)
2. [현재 아키텍처 상태](#현재-아키텍처-상태)
3. [이미지 생성 플로우](#이미지-생성-플로우)
4. [통합 옵션 비교](#통합-옵션-비교)
5. [권장 아키텍처](#권장-아키텍처)
6. [마이그레이션 계획](#마이그레이션-계획)

---

## 개요

Sparklio AI 마케팅 스튜디오는 **프론트엔드(C팀)**와 **백엔드(B팀)**가 협력하여 AI 기반 콘텐츠를 생성합니다. 특히 이미지 생성 기능은 두 가지 접근 방식이 가능합니다:

1. **직접 API 호출**: 프론트엔드 → Nano Banana API (현재 구현)
2. **에이전트 통합**: 프론트엔드 → 백엔드 VisionGeneratorAgent → Media Gateway → Nano Banana API (B팀 신규 구현)

---

## 현재 아키텍처 상태

### B팀 에이전트 구현 현황 (2025-11-28 기준)

| 에이전트 | 구현 상태 | 비고 |
|---------|----------|------|
| **VisionGeneratorAgent** | ✅ **신규 구현됨** | B팀이 방금 완성 |
| VideoBuilder | ✅ 구현됨 | 비LLM 에이전트 |
| StoryboardBuilderAgent | ❌ 미구현 | 중기 필요 |
| VideoDirectorAgent | ❌ 미구현 | 중기 필요 |
| VideoReviewerAgent | ❌ 미구현 | 중기 필요 |

### C팀 프론트엔드 구현 현황

| 기능 | 구현 상태 | 파일 |
|------|----------|------|
| **Nano Banana 직접 호출** | ✅ 구현됨 | `lib/api/nano-banana-api.ts` |
| **이미지 메타데이터 시스템** | ✅ 구현됨 | `lib/canvas/image-metadata.ts` |
| **배치 이미지 생성 Hook** | ✅ 구현됨 | `hooks/useImageGeneration.ts` |
| **자동 생성 UI 패널** | ✅ 구현됨 | `components/canvas-studio/components/ImageGenerationPanel.tsx` |
| **백엔드 Agent 연동** | ❌ 미구현 | 통합 필요 |

---

## 이미지 생성 플로우

### 현재 플로우 (프론트엔드 직접 호출)

```
┌─────────────────────────────────────────────────────────────┐
│ 사용자                                                       │
│  ↓                                                          │
│ Canvas Studio (Polotno Editor)                             │
│  ↓                                                          │
│ ImageGenerationPanel 컴포넌트                                │
│  - 플레이스홀더 이미지 감지                                   │
│  - "전체 생성" 버튼 클릭                                      │
│  ↓                                                          │
│ useImageGeneration Hook                                    │
│  - 배치 요청 생성                                            │
│  - 순차 처리 (API rate limit 고려)                           │
│  ↓                                                          │
│ lib/api/nano-banana-api.ts                                 │
│  - generateBatch() 함수                                     │
│  - fetch('https://api.nanobanana.ai/generate')            │
│  ↓                                                          │
│ Nano Banana API (외부)                                      │
│  - 이미지 생성                                               │
│  - URL 반환                                                 │
│  ↓                                                          │
│ 프론트엔드로 응답                                             │
│  - updateImageSource() 호출                                 │
│  - 메타데이터 저장 (source: 'nano_banana')                   │
│  - Canvas 이미지 업데이트                                     │
└─────────────────────────────────────────────────────────────┘

✅ 장점:
- 빠른 구현 (이미 완료됨)
- 낮은 지연시간 (백엔드 경유 불필요)
- 간단한 에러 처리

❌ 단점:
- API 키 노출 위험 (브라우저에서 직접 호출)
- 사용량 추적 어려움
- 다른 이미지 생성 Provider 통합 불가
- 브랜드 컨텍스트 연동 불가
```

### 권장 플로우 (백엔드 Agent 통합)

```
┌─────────────────────────────────────────────────────────────┐
│ 사용자                                                       │
│  ↓                                                          │
│ Canvas Studio (Polotno Editor)                             │
│  ↓                                                          │
│ ImageGenerationPanel 컴포넌트                                │
│  - 플레이스홀더 이미지 감지                                   │
│  - "전체 생성" 버튼 클릭                                      │
│  ↓                                                          │
│ useImageGeneration Hook (수정 필요)                         │
│  - 배치 요청 생성                                            │
│  - POST /api/v1/agents/vision-generator/generate           │
│  ↓                                                          │
│ 백엔드 API (FastAPI)                                         │
│  - 인증 검증                                                 │
│  - 브랜드 컨텍스트 조회                                       │
│  ↓                                                          │
│ VisionGeneratorAgent (B팀 신규)                             │
│  - 프롬프트 검증                                             │
│  - 배치 처리 (병렬/순차)                                      │
│  - 브랜드 스타일 적용                                         │
│  ↓                                                          │
│ MediaGateway                                               │
│  - Provider 선택 (Nanobanana, ComfyUI, DALL-E)             │
│  - POST /api/v1/media/generate                             │
│  ↓                                                          │
│ Nano Banana API (외부)                                      │
│  - 이미지 생성                                               │
│  - URL 반환                                                 │
│  ↓                                                          │
│ MediaGateway → VisionGeneratorAgent                        │
│  - Asset 저장 (MinIO)                                       │
│  - DB 메타데이터 저장                                         │
│  ↓                                                          │
│ 백엔드 API 응답                                              │
│  {                                                          │
│    "images": [                                              │
│      {                                                      │
│        "image_id": "img_abc123",                            │
│        "image_url": "https://cdn.sparklio.ai/...",         │
│        "prompt_text": "...",                                │
│        "seed_used": 12345                                   │
│      }                                                      │
│    ],                                                       │
│    "total_generated": 5                                     │
│  }                                                          │
│  ↓                                                          │
│ 프론트엔드                                                   │
│  - updateImageSource() 호출                                 │
│  - 메타데이터 저장                                            │
│  - Canvas 업데이트                                           │
└─────────────────────────────────────────────────────────────┘

✅ 장점:
- API 키 보안 (백엔드에서만 관리)
- 사용량 추적 및 과금 관리
- Provider 자동 전환 (Nanobanana 실패 시 DALL-E)
- 브랜드 컨텍스트 자동 적용
- Asset 자동 저장 및 관리
- 품질 검증 (ReviewerAgent 통합 가능)

❌ 단점:
- 약간의 지연시간 증가 (~200ms)
- 백엔드 의존성
```

---

## 통합 옵션 비교

### 옵션 1: 현재 구현 유지 (프론트엔드 직접 호출)

**시나리오**: 데모/프로토타입, 빠른 출시

```typescript
// lib/api/nano-banana-api.ts (현재)
export async function generateBatch(
  prompts: string[],
  style?: string
): Promise<GeneratedImage[]> {
  const response = await fetch('https://api.nanobanana.ai/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompts, style })
  });
  return response.json();
}
```

**결정 기준**:
- ✅ 데모 환경
- ✅ 빠른 프로토타입
- ❌ 프로덕션 환경
- ❌ 보안 중요

---

### 옵션 2: 백엔드 Agent 통합 (권장)

**시나리오**: 프로덕션, 엔터프라이즈, 확장성

```typescript
// lib/api/vision-generator-api.ts (신규 생성 필요)
export async function generateImagesViaAgent(
  prompts: ImageGenerationRequest[]
): Promise<VisionGeneratorOutput> {
  const response = await fetch('/api/v1/agents/vision-generator/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`, // 백엔드 인증
    },
    body: JSON.stringify({
      prompts: prompts.map(p => ({
        prompt_text: p.prompt,
        aspect_ratio: p.aspectRatio || '1:1',
        style: p.style || 'realistic',
      })),
      provider: 'nanobanana',
      batch_mode: true,
      max_concurrent: 3,
    })
  });

  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.status}`);
  }

  return response.json();
}
```

**결정 기준**:
- ✅ 프로덕션 환경
- ✅ 사용자 인증 필요
- ✅ 사용량 추적 필요
- ✅ 여러 Provider 지원 필요
- ✅ 브랜드 컨텍스트 적용

---

### 옵션 3: 하이브리드 (점진적 마이그레이션)

**시나리오**: 단계적 전환, A/B 테스트

```typescript
// lib/api/image-generation-api.ts (통합)
export async function generateImages(
  prompts: ImageGenerationRequest[],
  options?: {
    useAgent?: boolean; // true면 백엔드, false면 직접
    brandId?: string;
  }
): Promise<GeneratedImage[]> {
  if (options?.useAgent || options?.brandId) {
    // 백엔드 Agent 사용
    return generateImagesViaAgent(prompts);
  } else {
    // 직접 API 호출 (레거시)
    return generateBatch(prompts.map(p => p.prompt));
  }
}
```

**Feature Flag로 제어**:
```typescript
// .env.local
NEXT_PUBLIC_USE_VISION_AGENT=true  # true면 백엔드, false면 직접
```

---

## 권장 아키텍처

### 최종 권장: **옵션 3 (하이브리드)** → **옵션 2 (완전 통합)**

**Phase 1: 하이브리드 구현 (1주)**
1. 백엔드 API 연동 코드 추가
2. Feature Flag로 선택 가능
3. 데모에서는 직접 호출 유지
4. 프로덕션에서는 Agent 사용

**Phase 2: 완전 통합 (2주)**
1. 모든 호출을 Agent로 전환
2. 직접 호출 코드 제거
3. 브랜드 컨텍스트 자동 연동
4. Asset 자동 저장

---

## 마이그레이션 계획

### Step 1: 백엔드 API 확인 (완료)

✅ VisionGeneratorAgent 구현 확인됨
✅ MediaGateway 구현 확인됨
✅ `/api/v1/media/generate` 엔드포인트 확인됨

### Step 2: 프론트엔드 API Client 생성

**생성 필요한 파일**:
```
lib/api/vision-generator-api.ts
```

**참고할 기존 파일**:
- `lib/api/shorts-api.ts` (백엔드 Agent 연동 예시)
- `lib/api/meeting-api.ts` (백엔드 API 호출 패턴)

### Step 3: Hook 수정

**수정 필요한 파일**:
```
hooks/useImageGeneration.ts
```

**변경 사항**:
```diff
// Before
const response = await generateBatch(prompts, style);

// After
const response = await generateImagesViaAgent({
  prompts: prompts.map(p => ({
    prompt_text: p,
    style: style || 'realistic',
    aspect_ratio: '1:1',
  })),
  provider: 'nanobanana',
  batch_mode: true,
});
```

### Step 4: 환경 변수 설정

**.env.local 업데이트**:
```bash
# 기존
NEXT_PUBLIC_NANO_BANANA_API_KEY=your_key_here

# 추가
NEXT_PUBLIC_USE_VISION_AGENT=true  # Feature Flag
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # 백엔드 URL (이미 있음)
```

### Step 5: 타입 정의 추가

**생성 필요한 파일**:
```typescript
// lib/api/vision-generator-types.ts

export interface ImageGenerationRequest {
  prompt_text: string;
  negative_prompt?: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '3:4';
  style?: 'realistic' | 'illustration' | '3d' | 'anime';
  seed?: number;
  quality?: 'draft' | 'standard' | 'high';
}

export interface GeneratedImage {
  image_id: string;
  prompt_text: string;
  image_url: string;
  width: number;
  height: number;
  seed_used?: number;
  generation_time: number;
  status: 'completed' | 'failed';
  error?: string;
}

export interface VisionGeneratorOutput {
  images: GeneratedImage[];
  total_requested: number;
  total_generated: number;
  total_failed: number;
  total_time: number;
}
```

### Step 6: 테스트

**테스트 시나리오**:
1. ✅ 단일 이미지 생성
2. ✅ 배치 이미지 생성 (3개)
3. ✅ 에러 처리 (API 실패)
4. ✅ 프로그레스 트래킹
5. ✅ 메타데이터 저장

---

## 백엔드 API 스펙 (참고)

### VisionGeneratorAgent API

**엔드포인트**:
```
POST /api/v1/agents/vision-generator/generate
```

**요청**:
```json
{
  "prompts": [
    {
      "prompt_text": "A modern product photo of wireless earbuds",
      "negative_prompt": "blurry, low quality",
      "aspect_ratio": "1:1",
      "style": "realistic",
      "seed": 12345
    }
  ],
  "provider": "nanobanana",
  "batch_mode": true,
  "max_concurrent": 3
}
```

**응답**:
```json
{
  "images": [
    {
      "image_id": "img_abc123",
      "prompt_text": "A modern product photo of wireless earbuds",
      "image_url": "https://cdn.sparklio.ai/images/img_abc123.png",
      "width": 1024,
      "height": 1024,
      "seed_used": 12345,
      "generation_time": 3.2,
      "status": "completed"
    }
  ],
  "total_requested": 1,
  "total_generated": 1,
  "total_failed": 0,
  "total_time": 3.2
}
```

### MediaGateway API (대체 가능)

**엔드포인트**:
```
POST /api/v1/media/generate
```

**요청**:
```json
{
  "prompt": "A modern product photo of wireless earbuds",
  "task": "product_image",
  "media_type": "image",
  "options": {
    "width": 1024,
    "height": 1024,
    "style": "realistic",
    "negative_prompt": "blurry, low quality"
  }
}
```

---

## 결론 및 권장사항

### 현재 상황
- ✅ C팀: 프론트엔드 직접 API 호출 완료
- ✅ B팀: VisionGeneratorAgent 구현 완료
- ❌ 통합: 프론트엔드 ↔ 백엔드 연동 필요

### 권장 Next Steps

**즉시 (Week 1)**:
1. ✅ 현재 구현으로 데모 진행 (이미 완료)
2. 🔲 백엔드 API 엔드포인트 문서화 요청 (B팀)
3. 🔲 Feature Flag 추가 (`NEXT_PUBLIC_USE_VISION_AGENT`)

**단기 (Week 2-3)**:
4. 🔲 `lib/api/vision-generator-api.ts` 생성
5. 🔲 `useImageGeneration` Hook에 Agent 모드 추가
6. 🔲 데모에서 하이브리드 모드 테스트

**중기 (Week 4-6)**:
7. 🔲 모든 호출을 Agent로 전환
8. 🔲 브랜드 컨텍스트 자동 연동
9. 🔲 Asset 자동 저장 통합

**장기 (Phase 2)**:
10. 🔲 VideoBuilder Agent 통합 (Shorts 영상)
11. 🔲 ReviewerAgent 통합 (품질 검증)
12. 🔲 자동 재시도 및 폴백 전략

---

**최종 업데이트**: 2025-11-28
**다음 업데이트**: B팀 API 엔드포인트 확정 후
