# Backend Prompt 개선 요청사항

**작성일**: 2025-11-22
**작성자**: C팀 (Frontend Team)
**대상**: B팀 (Backend Team)
**목적**: Canvas Auto-Generation 품질 향상을 위한 LLM 프롬프트 개선

---

## 1. 현재 상황

Frontend에서 Canvas Studio의 자동 광고 생성 기능을 구현했습니다:

- **Canvas 크기**: 1080x1080 (Instagram 1:1 포맷)
- **레이아웃**: 상단 이미지 (600x400) + 하단 텍스트 영역
- **폰트**: Noto Sans KR (한글 폰트)
- **배경**: 그라디언트 (#8B5CF6 → #6366F1)
- **디자인 요소**: 중앙 정렬, CTA 버튼, Bullets

---

## 2. 개선이 필요한 부분

### 2.1 Copywriter Agent 프롬프트 개선

**현재 문제점**:
- 텍스트가 너무 길어서 1080x1080 캔버스에 다 들어가지 않음
- Headline과 Body의 구분이 명확하지 않음
- Bullets가 너무 많거나 너무 길게 생성됨

**개선 요청사항**:

```
Copywriter Agent가 광고 카피를 생성할 때, 다음 제약사항을 준수하도록 프롬프트를 수정해 주세요:

1. **Headline (헤드라인)**:
   - 최대 20자 이내 (한글 기준)
   - 임팩트 있는 한 문장
   - 제품의 핵심 가치를 담은 짧은 문구

2. **Subheadline (서브헤드라인)**:
   - 최대 30자 이내
   - Headline을 보완하는 부가 설명
   - 선택적 (없어도 됨)

3. **Body (본문)**:
   - 최대 80자 이내
   - 제품 설명 및 장점을 간결하게
   - 2-3문장으로 구성

4. **Bullets (불릿 포인트)**:
   - 최대 3개
   - 각 불릿당 최대 20자
   - 핵심 특징/혜택만 포함

5. **CTA (Call to Action)**:
   - 최대 10자
   - 행동 유도 문구 (예: "지금 구매하기", "자세히 보기")

6. **SNS 포스트 형식 (선택적)**:
   - Post: 최대 100자
   - Hashtags: 최대 5개, 각 해시태그는 15자 이내
```

**예시 JSON 출력 형식**:

```json
{
  "headline": "갤럭시 S25 출시",
  "subheadline": "혁신을 경험하세요",
  "body": "최신 AI 카메라와 초고속 충전. 당신의 일상을 바꿀 스마트폰.",
  "bullets": [
    "200MP AI 카메라",
    "45W 초고속 충전",
    "6.8인치 다이나믹 AMOLED"
  ],
  "cta": "지금 예약"
}
```

또는 SNS 포스트 형식:

```json
{
  "post": "새로운 갤럭시 S25가 출시되었습니다! 🚀\n200MP AI 카메라로 순간을 담고, 45W 초고속 충전으로 하루 종일 사용하세요.",
  "hashtags": ["갤럭시S25", "삼성", "스마트폰", "신제품", "AI카메라"],
  "cta": "자세히 보기"
}
```

---

### 2.2 Designer Agent 프롬프트 개선

**현재 문제점**:
- 생성된 이미지가 ComfyUI에서 정상적으로 생성되지만, Frontend에서 로딩되지 않음 (URL 형식 문제 가능성)
- 이미지가 텍스트와 어울리지 않을 때가 있음
- 배경이 복잡하여 텍스트 가독성을 해침

**개선 요청사항**:

```
Designer Agent가 이미지를 생성할 때, 다음 가이드라인을 준수하도록 프롬프트를 수정해 주세요:

1. **이미지 스타일**:
   - Professional product photography
   - Studio lighting with soft shadows
   - Clean and minimal background (단색 또는 미세한 그라디언트)
   - High resolution, sharp focus on product

2. **배경 권장사항**:
   - 흰색, 밝은 회색, 또는 미세한 그라디언트
   - 복잡한 패턴이나 어두운 배경 지양
   - 텍스트가 하단에 배치되므로 상단에 제품 중심 배치

3. **이미지 비율**:
   - 3:2 비율 (600x400px에 최적화)
   - 가로 중심 구도

4. **프롬프트 예시**:
   "Professional product photography of {product_name}, centered composition, studio lighting, white to light gray gradient background, high quality, 8k resolution, commercial advertising style"

5. **이미지 URL 반환 형식**:
   - 현재 ComfyUI가 반환하는 이미지 URL이 Frontend에서 로드되지 않음
   - URL 형식 확인 필요: 절대 경로인지, 상대 경로인지, CORS 설정이 필요한지 확인 필요
   - 가능하면 Base64 인코딩된 이미지를 반환하거나, 안정적인 CDN URL 사용 권장
```

**현재 Frontend에서 사용하는 이미지 생성 코드**:

```typescript
const imageUrl = await generateImage({
  prompt: `Professional product photography of ${productName}, high quality, studio lighting, white background`,
});
```

**Backend에서 확인 필요한 사항**:
- ComfyUI가 반환하는 이미지 URL 형식이 무엇인가?
- 해당 URL이 브라우저에서 접근 가능한가? (CORS 설정)
- 이미지가 파일 시스템에 저장되는가, 아니면 메모리에만 있는가?
- 안정적인 이미지 호스팅 방법 제안 (예: S3, CDN, Base64)

---

## 3. 구현 우선순위

1. **High Priority**: Copywriter Agent 텍스트 길이 제약 (현재 캔버스 오버플로우 문제)
2. **High Priority**: Designer Agent 이미지 URL 안정성 (현재 이미지 로딩 실패)
3. **Medium Priority**: Copywriter Agent 톤앤매너 개선 (브랜드 일관성)
4. **Low Priority**: 다국어 지원 (영어, 일본어 등)

---

## 4. Frontend 측 대응

Frontend에서는 다음과 같이 대응하고 있습니다:

- **레이아웃 최적화**: 1080x1080 캔버스에 맞춰 텍스트 크기 및 간격 조정 완료
- **폰트 최적화**: Noto Sans KR 한글 폰트 적용 완료
- **백그라운드 디자인**: 그라디언트 배경 자동 추가 완료
- **에러 핸들링**: 이미지 로딩 실패 시 텍스트만 표시되도록 구현

하지만 **Backend의 프롬프트 개선 없이는 근본적인 품질 향상이 어렵습니다**.

---

## 5. 테스트 케이스

개선 후 다음 케이스로 테스트 부탁드립니다:

### Case 1: 제품 광고
**입력**: "갤럭시 S25 광고 만들어줘"

**기대 출력**:
```json
{
  "headline": "갤럭시 S25 출시",
  "body": "200MP AI 카메라와 45W 초고속 충전. 혁신을 경험하세요.",
  "bullets": ["200MP AI 카메라", "45W 초고속 충전", "6.8인치 AMOLED"],
  "cta": "지금 예약"
}
```

### Case 2: 서비스 광고
**입력**: "넷플릭스 프리미엄 구독 광고 만들어줘"

**기대 출력**:
```json
{
  "headline": "넷플릭스 프리미엄",
  "body": "4K UHD 화질로 최대 4명이 동시 시청. 광고 없이 무제한 감상하세요.",
  "bullets": ["4K UHD 화질", "동시 4명 시청", "광고 없음"],
  "cta": "무료 체험"
}
```

### Case 3: 이벤트 광고
**입력**: "블랙프라이데이 할인 이벤트 광고 만들어줘"

**기대 출력**:
```json
{
  "headline": "블랙프라이데이 최대 70% 할인",
  "body": "11월 한정! 전 품목 최대 70% 할인 + 무료배송 혜택까지.",
  "bullets": ["최대 70% 할인", "무료배송", "11/29까지"],
  "cta": "지금 쇼핑"
}
```

---

## 6. 연락처

문의사항이나 추가 논의가 필요한 경우:
- **Frontend Team (C팀)**: 프론트엔드 개발팀
- **이슈 트래킹**: GitHub Issues 또는 프로젝트 관리 도구 활용

---

**감사합니다!**
더 나은 광고 생성 품질을 위해 협력해 주셔서 감사드립니다.
