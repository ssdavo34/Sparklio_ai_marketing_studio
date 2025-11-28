# 📊 C팀 일일 작업 보고서 - 2025-11-28

**작성일**: 2025-11-28
**작성자**: C팀 (Frontend Team)
**주요 작업**: 서비스 생성 플로우 분석 및 백엔드 통합 전략 수립

---

## 🎯 작업 요약

B팀의 에이전트 구현 현황 분석 결과, **VisionGeneratorAgent가 방금 구현 완료**되었음을 확인했습니다.
현재 프론트엔드는 **Nano Banana API를 직접 호출**하고 있으며, 백엔드 Agent 시스템과의 통합이 필요한 상황입니다.

---

## 📋 B팀 에이전트 구현 현황 확인 결과

### ✅ 구현 완료된 에이전트

| 에이전트 | 파일 위치 | 상태 | 비고 |
|---------|----------|------|------|
| **VisionGeneratorAgent** | `backend/app/services/agents/vision_generator.py` | ✅ **신규 구현** | B팀이 방금 완성 |
| VideoBuilder | `backend/app/services/agents/video_builder.py` | ✅ 구현됨 | 비LLM, ffmpeg 기반 |
| VisualPromptAgent | `backend/app/services/agents/visual_prompt.py` | ✅ 구현됨 | 프롬프트 생성 |

### ❌ 미구현 에이전트 (B팀 분석 일치)

| 에이전트 | 우선순위 | 비고 |
|---------|---------|------|
| StoryboardBuilderAgent | 🟡 중간 | 영상 기획 |
| VideoDirectorAgent | 🟡 중간 | 영상 제작 |
| VideoReviewerAgent | 🟡 중간 | 영상 품질 검증 |

---

## 🔍 VisionGeneratorAgent 분석

### 주요 기능

```python
# backend/app/services/agents/vision_generator.py

class VisionGeneratorAgent(AgentBase):
    """
    이미지 생성 에이전트

    지원 Provider:
    - Nanobanana API (기본) ✅
    - ComfyUI (로컬) ✅
    - OpenAI DALL-E (백업) ✅

    특징:
    - 배치 처리 (병렬 생성)
    - 자동 폴백 (Nanobanana 실패 시 DALL-E)
    - 품질/스타일 제어
    - 브랜드 컨텍스트 자동 적용
    """
```

### API 엔드포인트

**VisionGenerator 전용**:
```
POST /api/v1/agents/vision-generator/generate
```

**MediaGateway 공통**:
```
POST /api/v1/media/generate
GET  /api/v1/media/health
```

### 요청/응답 예시

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
      "prompt_text": "A modern product photo...",
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

---

## 🏗️ 현재 프론트엔드 구현 분석

### 현재 아키텍처: **직접 API 호출**

```
사용자
  ↓
Canvas Studio (Polotno)
  ↓
ImageGenerationPanel
  ↓
useImageGeneration Hook
  ↓
lib/api/nano-banana-api.ts
  ↓
fetch('https://api.nanobanana.ai/generate')  ← 직접 호출
  ↓
Nano Banana API (외부)
```

### 구현 완료된 기능

| 기능 | 파일 | 상태 |
|------|------|------|
| Nano Banana API Client | `lib/api/nano-banana-api.ts` | ✅ 완료 |
| 이미지 메타데이터 시스템 | `lib/canvas/image-metadata.ts` | ✅ 완료 |
| 배치 생성 Hook | `hooks/useImageGeneration.ts` | ✅ 완료 |
| 자동 생성 UI 패널 | `components/canvas-studio/components/ImageGenerationPanel.tsx` | ✅ 완료 |
| 재생성/Variation 기능 | `components/canvas-studio/panels/right/RightDock.tsx` | ✅ 완료 |
| Unsplash 통합 | `lib/api/unsplash-api.ts` | ✅ 완료 |
| 설정 가이드 문서 | `docs/IMAGE_GENERATION_SETUP.md` | ✅ 완료 |

### 장단점 분석

**✅ 장점**:
- 빠른 구현 및 배포
- 낮은 지연시간 (백엔드 경유 불필요)
- 간단한 에러 처리
- 데모/프로토타입에 적합

**❌ 단점**:
- API 키 노출 위험 (브라우저에서 직접 호출)
- 사용량 추적 어려움
- Provider 전환 불가 (Nanobanana만 지원)
- 브랜드 컨텍스트 연동 불가
- Asset 자동 저장 불가

---

## 🎯 권장 통합 전략

### Phase 1: 하이브리드 모드 (1주) 🔲

**목표**: 두 가지 방식을 모두 지원하며 점진적 전환

**구현 계획**:

1. **Feature Flag 추가**
   ```bash
   # .env.local
   NEXT_PUBLIC_USE_VISION_AGENT=true  # true=백엔드, false=직접
   ```

2. **새 API Client 생성**
   ```typescript
   // lib/api/vision-generator-api.ts (신규)
   export async function generateImagesViaAgent(
     prompts: ImageGenerationRequest[]
   ): Promise<VisionGeneratorOutput> {
     const response = await fetch('/api/v1/agents/vision-generator/generate', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${getAuthToken()}`,
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
     return response.json();
   }
   ```

3. **Hook 수정**
   ```typescript
   // hooks/useImageGeneration.ts (수정)
   const generateSingleImage = useCallback(async (request) => {
     const useAgent = process.env.NEXT_PUBLIC_USE_VISION_AGENT === 'true';

     if (useAgent) {
       // 백엔드 Agent 사용
       return await generateImagesViaAgent([request]);
     } else {
       // 직접 API 호출 (기존)
       return await generateBatch([request.prompt], request.style);
     }
   }, []);
   ```

**예상 작업 시간**: 2-3일

---

### Phase 2: 완전 통합 (2주) 🔲

**목표**: 모든 호출을 백엔드 Agent로 전환

**구현 계획**:

1. **직접 API 호출 코드 제거**
   - `lib/api/nano-banana-api.ts` deprecate
   - 모든 호출을 Agent로 리다이렉트

2. **브랜드 컨텍스트 자동 연동**
   ```typescript
   const response = await fetch('/api/v1/agents/vision-generator/generate', {
     body: JSON.stringify({
       prompts: [...],
       brand_id: currentBrandId,  // 자동 적용
       provider: 'nanobanana',
     })
   });
   ```

3. **Asset 자동 저장**
   - 백엔드가 MinIO에 자동 저장
   - DB 메타데이터 자동 관리
   - 프론트엔드는 URL만 받음

4. **에러 처리 개선**
   - Provider 자동 폴백 (Nanobanana → DALL-E)
   - 재시도 로직 (백엔드에서 처리)

**예상 작업 시간**: 1주

---

## 📊 통합 후 예상 효과

### 보안

| 항목 | 현재 | 통합 후 |
|------|------|---------|
| API 키 노출 | ❌ 브라우저에 노출 | ✅ 백엔드에서만 관리 |
| 인증 | ❌ 없음 | ✅ JWT 토큰 인증 |
| Rate Limiting | ❌ 클라이언트 의존 | ✅ 백엔드에서 제어 |

### 기능

| 항목 | 현재 | 통합 후 |
|------|------|---------|
| Provider | Nanobanana만 | Nanobanana, ComfyUI, DALL-E |
| 자동 폴백 | ❌ 없음 | ✅ 실패 시 자동 전환 |
| 브랜드 스타일 | ❌ 수동 | ✅ 자동 적용 |
| Asset 저장 | ❌ 수동 | ✅ 자동 저장 |
| 사용량 추적 | ❌ 불가 | ✅ DB 기록 |

### 성능

| 항목 | 현재 | 통합 후 |
|------|------|---------|
| 지연시간 | ~3초 | ~3.2초 (+200ms) |
| 병렬 처리 | 순차 | 병렬 (max_concurrent) |
| 캐싱 | ❌ 없음 | ✅ Redis 캐싱 가능 |

---

## 🚀 다음 단계 (Action Items)

### C팀 (Frontend) - 즉시

- [x] ✅ 서비스 생성 플로우 문서 작성 완료
- [ ] 🔲 B팀에 API 엔드포인트 문서 요청
  - VisionGeneratorAgent 상세 스펙
  - 인증 방식 (JWT 토큰)
  - 에러 코드 정의
- [ ] 🔲 Feature Flag 환경 변수 추가

### C팀 (Frontend) - 단기 (Week 1)

- [ ] 🔲 `lib/api/vision-generator-api.ts` 생성
- [ ] 🔲 `lib/api/vision-generator-types.ts` 타입 정의
- [ ] 🔲 `useImageGeneration` Hook에 하이브리드 모드 추가
- [ ] 🔲 로컬 환경에서 백엔드 연동 테스트

### C팀 (Frontend) - 중기 (Week 2-3)

- [ ] 🔲 모든 이미지 생성을 Agent로 전환
- [ ] 🔲 브랜드 컨텍스트 자동 연동
- [ ] 🔲 에러 처리 개선
- [ ] 🔲 통합 테스트 및 성능 측정

### B팀 (Backend) - 요청 사항

- [ ] 🔲 VisionGeneratorAgent API 문서 제공
  - 엔드포인트 URL
  - 요청/응답 스키마
  - 에러 코드
  - 인증 방식
- [ ] 🔲 CORS 설정 확인 (`localhost:3000` 허용)
- [ ] 🔲 헬스 체크 엔드포인트 확인

---

## 📝 참고 문서

### 생성한 문서

- ✅ [SERVICE_GENERATION_FLOW.md](./SERVICE_GENERATION_FLOW.md) - 서비스 생성 플로우 상세 분석
- ✅ [IMAGE_GENERATION_SETUP.md](./IMAGE_GENERATION_SETUP.md) - 이미지 생성 기능 설정 가이드

### 참고할 기존 문서

- `docs/editor/008_AGENTS_INTEGRATION.md` - Agent 통합 가이드
- `lib/api/shorts-api.ts` - 백엔드 Agent 연동 예시
- `lib/api/meeting-api.ts` - 백엔드 API 호출 패턴

---

## 💬 B팀과의 협업 포인트

### 확인 필요 사항

1. **API 엔드포인트**
   - `/api/v1/agents/vision-generator/generate` 경로 확정
   - 인증 방식 (Bearer Token?)
   - CORS 설정 확인

2. **데이터 형식**
   - 요청 스키마 확정
   - 응답 스키마 확정
   - 에러 코드 정의

3. **성능**
   - 타임아웃 설정
   - Rate Limiting
   - 최대 동시 요청 수

4. **Asset 저장**
   - MinIO URL 포맷
   - Asset ID 생성 규칙
   - 메타데이터 저장 형식

---

## 🎯 결론

### 현재 상황

✅ **프론트엔드**: 이미지 생성 기능 완전 구현 (직접 API 호출)
✅ **백엔드**: VisionGeneratorAgent 신규 구현 완료
❌ **통합**: 프론트엔드 ↔ 백엔드 연동 필요

### 권장 전략

**Phase 1 (1주)**: 하이브리드 모드로 점진적 전환
- Feature Flag로 두 방식 모두 지원
- 데모에서는 직접 호출 유지
- 프로덕션 준비를 위한 Agent 통합

**Phase 2 (2주)**: 완전 통합
- 모든 호출을 백엔드 Agent로 전환
- 브랜드 컨텍스트 자동 연동
- Asset 자동 저장 및 관리

### 기대 효과

🔒 **보안**: API 키 보호, 인증 강화
📊 **추적**: 사용량 모니터링, 비용 관리
🎨 **품질**: 브랜드 스타일 자동 적용, Provider 자동 폴백
⚡ **확장성**: 여러 Provider 지원, 병렬 처리

---

**최종 업데이트**: 2025-11-28 15:30
**다음 업데이트**: B팀 API 문서 확인 후
**작성자**: C팀 (Frontend Team)
