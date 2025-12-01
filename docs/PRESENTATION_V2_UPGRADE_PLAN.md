# 프레젠테이션 V2 고도화 계획서

**작성일**: 2025-12-01
**작성자**: B팀/C팀 통합
**목표**: 실제 사용 가능한 프레젠테이션 시스템 구축

---

## 1. 현재 문제점

### 1.1 Frontend (C팀 영역)
| 문제 | 상세 |
|------|------|
| 썸네일 미표시 | 12장 슬라이드 생성 → 좌측에 1개만 표시 |
| 스크롤 발생 | 슬라이드 콘텐츠가 페이지 사이즈 초과 |
| 에디터 미연결 | Polotno 캔버스와 슬라이드 데이터 연결 안 됨 |
| 편집 불가 | 도형/텍스트 추가, 삭제, 수정 불가 |
| 입력 placeholder | 실제 콘텐츠 대신 "입력하세요" 텍스트 |

### 1.2 Backend (B팀 영역)
| 문제 | 상세 |
|------|------|
| 콘텐츠 품질 | LLM 출력이 구체적이지 않음 |
| 이미지 없음 | 슬라이드에 비주얼 요소 부재 |
| 레이아웃 단순 | 다양한 레이아웃 템플릿 부족 |

---

## 2. 고도화 목표

### Phase 1: 기본 기능 완성 (P0)
1. **12장 슬라이드 썸네일 표시** - 좌측 패널에 프리뷰
2. **슬라이드 → Polotno 캔버스 연결** - 클릭 시 편집 가능
3. **스크롤 제거** - 페이지 사이즈 내 콘텐츠 배치
4. **실제 콘텐츠 표시** - placeholder 대신 LLM 생성 텍스트

### Phase 2: 템플릿 시스템 (P1)
1. **슬라이드 템플릿 5종** - 레이아웃별 Polotno JSON 템플릿
2. **자동 콘텐츠 매핑** - 슬라이드 데이터 → 템플릿 적용
3. **브랜드 스타일 적용** - 컬러, 폰트 자동 설정

### Phase 3: 이미지 & 편집 (P2)
1. **AI 이미지 생성** - 슬라이드별 배경/일러스트
2. **Stock 이미지 연동** - Unsplash 통합
3. **완전한 편집** - 도형, 텍스트, 이미지 자유 편집

---

## 3. 슬라이드 템플릿 설계

### 3.1 템플릿 종류 (5종)

#### 1) `title_center` - 타이틀 슬라이드
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         [큰 제목]               │
│         [서브타이틀]            │
│                                 │
│                                 │
└─────────────────────────────────┘
```
- 용도: 표지, 섹션 구분, CTA
- 요소: 중앙 정렬 제목 + 부제목
- 배경: 그라데이션 또는 이미지

#### 2) `two_column` - 2단 레이아웃
```
┌─────────────────────────────────┐
│ [제목]                          │
├────────────────┬────────────────┤
│                │                │
│   [텍스트/    │   [이미지/     │
│    불릿]       │    차트]       │
│                │                │
└────────────────┴────────────────┘
```
- 용도: 문제-해결, 비교, 설명
- 요소: 좌측 텍스트 + 우측 비주얼

#### 3) `three_bullets` - 3포인트
```
┌─────────────────────────────────┐
│ [제목]                          │
├──────────┬──────────┬──────────┤
│  [1]     │  [2]     │  [3]     │
│ 아이콘   │ 아이콘   │ 아이콘   │
│ 텍스트   │ 텍스트   │ 텍스트   │
└──────────┴──────────┴──────────┘
```
- 용도: 핵심 포인트, 기능 소개
- 요소: 3개 컬럼, 각각 아이콘 + 텍스트

#### 4) `full_image` - 전체 이미지
```
┌─────────────────────────────────┐
│                                 │
│     [배경 이미지 전체]          │
│                                 │
│         [오버레이 텍스트]       │
│                                 │
└─────────────────────────────────┘
```
- 용도: 임팩트 슬라이드, 비전
- 요소: 전체 배경 + 중앙 텍스트

#### 5) `stats` - 숫자/통계
```
┌─────────────────────────────────┐
│ [제목]                          │
├──────────┬──────────┬──────────┤
│   85%    │   10x    │   $1M    │
│  성장률   │  효율성  │   매출   │
└──────────┴──────────┴──────────┘
```
- 용도: 성과, 투자 유치, 설득
- 요소: 큰 숫자 + 라벨

### 3.2 템플릿 파일 구조

```
frontend/lib/canvas/presentationTemplates/
├── index.ts                    # 템플릿 매니저
├── titleCenterTemplate.ts      # 타이틀 슬라이드
├── twoColumnTemplate.ts        # 2단 레이아웃
├── threeBulletsTemplate.ts     # 3포인트
├── fullImageTemplate.ts        # 전체 이미지
├── statsTemplate.ts            # 숫자/통계
└── baseStyles.ts               # 공통 스타일 (폰트, 컬러)
```

---

## 4. Polotno JSON 템플릿 예시

### 4.1 title_center 템플릿

```typescript
export const titleCenterTemplate = (data: SlideData) => ({
  width: 1920,
  height: 1080,
  fonts: [],
  pages: [{
    id: data.id,
    children: [
      // 배경
      {
        id: 'bg',
        type: 'image',
        x: 0, y: 0,
        width: 1920, height: 1080,
        src: data.backgroundUrl || '',
        // 또는 그라데이션
      },
      // 반투명 오버레이
      {
        id: 'overlay',
        type: 'figure',
        x: 0, y: 0,
        width: 1920, height: 1080,
        fill: 'rgba(0,0,0,0.4)',
      },
      // 제목
      {
        id: 'title',
        type: 'text',
        x: 960, y: 450,
        width: 1600,
        text: data.title,
        fontSize: 72,
        fontFamily: 'Pretendard',
        fontWeight: 'bold',
        fill: '#FFFFFF',
        align: 'center',
      },
      // 부제목
      {
        id: 'subtitle',
        type: 'text',
        x: 960, y: 550,
        width: 1400,
        text: data.subtitle || '',
        fontSize: 36,
        fontFamily: 'Pretendard',
        fill: '#E0E0E0',
        align: 'center',
      },
    ],
    background: data.backgroundColor || '#1a1a2e',
  }],
});
```

### 4.2 two_column 템플릿

```typescript
export const twoColumnTemplate = (data: SlideData) => ({
  width: 1920,
  height: 1080,
  pages: [{
    id: data.id,
    children: [
      // 제목
      {
        id: 'title',
        type: 'text',
        x: 100, y: 80,
        width: 1720,
        text: data.title,
        fontSize: 48,
        fontWeight: 'bold',
        fill: '#1F2937',
      },
      // 좌측: 불릿 포인트
      {
        id: 'bullets',
        type: 'text',
        x: 100, y: 200,
        width: 800,
        text: data.bullets?.map((b, i) => `• ${b}`).join('\n') || '',
        fontSize: 28,
        lineHeight: 1.8,
        fill: '#374151',
      },
      // 우측: 이미지 영역
      {
        id: 'image',
        type: 'image',
        x: 1000, y: 200,
        width: 820,
        height: 700,
        src: data.imageUrl || '/placeholder-slide.png',
        cornerRadius: 16,
      },
    ],
    background: '#FFFFFF',
  }],
});
```

---

## 5. Backend 개선 (B팀)

### 5.1 LLM 프롬프트 고도화

```python
PRESENTATION_SYSTEM_PROMPT = """
당신은 최고 수준의 프레젠테이션 전문가입니다.

## 슬라이드 작성 원칙
1. **제목**: 10자 이내, 임팩트 있는 한 줄
2. **불릿**: 각 15자 이내, 3-4개
3. **구체적 수치**: 가능하면 숫자/통계 포함
4. **시각적 힌트**: 배경 이미지 또는 아이콘 설명

## 레이아웃 선택 기준
- title_center: 표지, 섹션 구분, CTA
- two_column: 문제-해결, 좌우 비교
- three_bullets: 핵심 포인트 3개
- full_image: 비전, 임팩트
- stats: 숫자 강조, 성과

## 출력 규칙
- 각 슬라이드 콘텐츠는 화면에 딱 맞게 (스크롤 없이)
- 불릿은 최대 4개, 각 불릿은 1줄
- 제목과 불릿만으로 메시지 전달 완성
"""
```

### 5.2 이미지 생성 연동

```python
# 슬라이드별 이미지 생성 (VisionAgent 활용)
async def generate_slide_images(slides: List[Slide]) -> List[Slide]:
    for slide in slides:
        if slide.visual_hint:
            # VisionAgent로 이미지 생성
            image_url = await vision_agent.generate(
                prompt=slide.visual_hint,
                style="presentation",
                size="1920x1080"
            )
            slide.image_url = image_url
    return slides
```

---

## 6. Frontend 개선 (C팀)

### 6.1 슬라이드 썸네일 컴포넌트

```tsx
// components/canvas-studio/SlideThumbnails.tsx
export function SlideThumbnails({ slides, activeIndex, onSelect }) {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          onClick={() => onSelect(index)}
          className={cn(
            "relative cursor-pointer rounded-lg overflow-hidden border-2",
            activeIndex === index
              ? "border-purple-500"
              : "border-transparent hover:border-gray-300"
          )}
        >
          {/* 미니 캔버스 프리뷰 */}
          <div className="w-full aspect-video bg-white">
            <SlidePreview slide={slide} scale={0.1} />
          </div>
          <div className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1 rounded">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 6.2 슬라이드 → Polotno 연결

```tsx
// 슬라이드 선택 시 Polotno 캔버스에 로드
const loadSlideToCanvas = (slide: Slide, store: Store) => {
  const template = getTemplateByLayout(slide.layout);
  const pageData = template({
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle,
    bullets: slide.bullets,
    imageUrl: slide.image_url,
  });

  // 기존 페이지 교체
  store.loadJSON(pageData);
};
```

---

## 7. 작업 순서 (TODO)

### Phase 1: P0 - 기본 기능 (1일)

#### B팀
- [ ] LLM 프롬프트 개선 (콘텐츠 품질 향상)
- [ ] 슬라이드 출력 필드 정리 (layout, image_url 등)

#### C팀
- [ ] 좌측 패널에 12개 슬라이드 썸네일 표시
- [ ] 슬라이드 클릭 → Polotno 캔버스 로드
- [ ] 스크롤 없이 페이지 사이즈 내 콘텐츠 배치

### Phase 2: P1 - 템플릿 시스템 (2일)

#### B팀
- [ ] 슬라이드 타입별 레이아웃 매핑 고도화
- [ ] visual_hint → 이미지 생성 연동 (선택적)

#### C팀
- [ ] 5종 Polotno 템플릿 구현
- [ ] 슬라이드 데이터 → 템플릿 자동 적용
- [ ] 브랜드 컬러/폰트 적용

### Phase 3: P2 - 편집 & 이미지 (2일)

#### C팀
- [ ] 도형/텍스트 추가, 삭제, 수정 완전 연동
- [ ] Unsplash 이미지 삽입
- [ ] AI 이미지 생성 버튼

---

## 8. 성공 기준

1. **12장 썸네일**: 좌측에 모든 슬라이드 프리뷰 표시
2. **스크롤 없음**: 각 슬라이드가 화면에 딱 맞게
3. **편집 가능**: Polotno에서 자유롭게 수정
4. **콘텐츠 완성**: "입력하세요" 없이 실제 내용
5. **이미지 포함**: 최소 3장 이상 이미지 슬라이드

---

## 9. 기술 스택

- **Backend**: FastAPI, PresentationAgent (Claude 3.5 Haiku)
- **Frontend**: Next.js, Polotno (Canvas Editor)
- **이미지**: VisionAgent (DALL-E/SD) 또는 Unsplash
- **저장**: In-Memory → PostgreSQL (추후)

---

**다음 단계**: C팀이 Phase 1 시작 (썸네일 + 캔버스 연결)
