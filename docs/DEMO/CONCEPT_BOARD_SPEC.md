# Concept Board Spec

**문서 버전**: v1.0
**작성일**: 2025-11-25
**작성자**: A팀 (백엔드/문서 총괄)
**목적**: Concept Board 화면/데이터/동작 정의

**상위 문서**: [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md)
**관련 문서**: [FRONTEND_DEMO_FLOW.md](./FRONTEND_DEMO_FLOW.md), [CHAT_ONEPAGE_STUDIO_PRINCIPLES.md](./CHAT_ONEPAGE_STUDIO_PRINCIPLES.md)

---

## 1. Concept Board 목적 & 정의

### 1.1 목적

> **"여러 마케팅 콘셉트를 한 눈에 비교하고, 최적의 방향을 선택할 수 있게 하는 대시보드"**

**Concept Board는**:
- 2-3개의 서로 다른 콘셉트를 가로 카드 형태로 나란히 표시
- 각 콘셉트의 핵심 메시지, 톤, 샘플 헤드라인을 한 화면에서 비교
- 콘셉트별 산출물(슬라이드/상세/인스타/쇼츠)로 바로 이동 가능
- **Mixboard/Moodboard** 느낌의 직관적인 UI

### 1.2 핵심 가치

1. **빠른 비교**: A안 vs B안을 한 화면에서 즉시 비교
2. **일관성 확인**: 같은 Meeting 기반이지만 다른 콘셉트의 차별화 확인
3. **빠른 탐색**: 각 산출물로 바로 이동

---

## 2. 화면 구성

### 2.1 전체 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│                    Concept Board Header                     │
│  - Meeting 정보 (제목, 타깃, 키메시지)                      │
│  - Brand 정보 (이름, 컬러 팔레트)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Concept A   │  │  Concept B   │  │  Concept C   │      │
│  │  Card        │  │  Card        │  │  Card        │      │
│  │              │  │              │  │  (Optional)  │      │
│  │  - Title     │  │  - Title     │  │              │      │
│  │  - Message   │  │  - Message   │  │              │      │
│  │  - Tone      │  │  - Tone      │  │              │      │
│  │  - Headlines │  │  - Headlines │  │              │      │
│  │  - Assets    │  │  - Assets    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 상단 Header

**Meeting 정보**:
```tsx
<ConceptBoardHeader>
  <MeetingInfo>
    <Title>제주 감귤 젤리 신제품 런칭 기획 회의</Title>
    <Target>타깃: 30-40대 엄마, 자녀 간식에 관심 많은 소비자</Target>
    <KeyMessages>
      <Message>국내산 제주 감귤 100%</Message>
      <Message>합성 첨가물 무첨가</Message>
      <Message>어린이도 안심하고 먹을 수 있는 비타민 간식</Message>
    </KeyMessages>
  </MeetingInfo>

  <BrandInfo>
    <BrandName>제주 감귤 브랜드</BrandName>
    <ColorPalette>
      <ColorChip color="#FFA500" />
      <ColorChip color="#FFD700" />
    </ColorPalette>
  </BrandInfo>
</ConceptBoardHeader>
```

**스타일**:
- 배경: 연한 회색 (#F9FAFB)
- 패딩: 24px
- Meeting 정보와 Brand 정보를 좌우로 배치

### 2.3 하단 Concept Card Grid

**레이아웃**:
- Flexbox, 가로 배열 (`display: flex; gap: 24px;`)
- 각 카드: 동일 너비, 최소 너비 300px
- 2개 카드: 50% 너비
- 3개 카드: 33% 너비

---

## 3. Concept Card 구성 요소

### 3.1 Card 구조

```tsx
<ConceptCard conceptId="concept-a">
  {/* 1. 헤더 */}
  <CardHeader>
    <ConceptTag>Concept A</ConceptTag>
    <ConceptTitle>상큼한 하루 리프레시</ConceptTitle>
    <ConceptSubtitle>제주 감귤의 상큼함으로 하루를 상쾌하게</ConceptSubtitle>
  </CardHeader>

  {/* 2. 핵심 메시지 */}
  <CoreMessage>
    "제주 감귤의 상큼함으로 하루를 상쾌하게"
  </CoreMessage>

  {/* 3. 톤앤매너 */}
  <ToneKeywords>
    <Keyword color="#FFA500">밝은</Keyword>
    <Keyword color="#FFD700">경쾌한</Keyword>
    <Keyword color="#FF6347">활기찬</Keyword>
  </ToneKeywords>

  {/* 4. 컬러 팔레트 */}
  <ColorPalette>
    <ColorChip color="#FFA500" />
    <ColorChip color="#FFFFFF" />
    <ColorChip color="#FFD700" />
  </ColorPalette>

  {/* 5. 샘플 헤드라인 */}
  <SampleHeadlines>
    <Headline>"아침마다 상큼하게, 제주 감귤 젤리"</Headline>
    <Headline>"하루를 깨우는 비타민 한 입"</Headline>
  </SampleHeadlines>

  {/* 6. 산출물 링크 */}
  <AssetLinks>
    <AssetButton onClick={() => openSlides('concept-a')}>
      📊 슬라이드 보기
    </AssetButton>
    <AssetButton onClick={() => openDetail('concept-a')}>
      📄 상세 보기
    </AssetButton>
    <AssetButton onClick={() => openInstagram('concept-a')}>
      📸 인스타 보기
    </AssetButton>
    <AssetButton onClick={() => openShorts('concept-a')}>
      🎬 쇼츠 보기
    </AssetButton>
  </AssetLinks>
</ConceptCard>
```

### 3.2 Card 스타일

**기본 스타일**:
- 배경: 흰색 (#FFFFFF)
- 테두리: 1px solid #E5E7EB
- 둥근 모서리: 12px
- 그림자: `box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)`
- 패딩: 24px

**Hover 효과**:
- 그림자 확대: `box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15)`
- 테두리 색상: 브랜드 메인 컬러
- Transform: `translateY(-4px)`
- Transition: `all 0.3s ease`

**클릭 시**:
- 테두리: 2px solid 브랜드 메인 컬러
- 배경: 연한 브랜드 컬러 (#FFF5E6)

---

## 4. ConceptConfig 데이터 모델

### 4.1 TypeScript 인터페이스

```typescript
interface ConceptBoardData {
  meeting: MeetingInfo;
  brand: BrandInfo;
  concepts: Concept[];
}

interface MeetingInfo {
  meeting_id: string;
  title: string;
  key_messages: string[];
  target: string;
}

interface BrandInfo {
  brand_id: string;
  name: string;
  colors: string[];
  logo_url?: string;
}

interface Concept {
  concept_id: string;
  title: string;
  subtitle: string;
  core_message: string;
  tone_keywords: string[];
  color_palette: string[];
  sample_headlines: string[];
  linked_assets: LinkedAssets;
}

interface LinkedAssets {
  presentation_id: string;
  product_detail_id: string;
  instagram_ids: string[];
  shorts_script_id: string;
}
```

### 4.2 API 응답 예시

```json
{
  "meeting": {
    "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "제주 감귤 젤리 신제품 런칭 기획 회의",
    "key_messages": [
      "국내산 제주 감귤 100%",
      "합성 첨가물 무첨가",
      "어린이도 안심"
    ],
    "target": "30-40대 엄마"
  },
  "brand": {
    "brand_id": "brand-123",
    "name": "제주 감귤 브랜드",
    "colors": ["#FFA500", "#FFD700"]
  },
  "concepts": [
    {
      "concept_id": "concept-a",
      "title": "상큼한 하루 리프레시",
      "subtitle": "제주 감귤의 상큼함으로 하루를 상쾌하게",
      "core_message": "제주 감귤의 상큼함으로 하루를 상쾌하게",
      "tone_keywords": ["밝은", "경쾌한", "활기찬"],
      "color_palette": ["#FFA500", "#FFFFFF", "#FFD700"],
      "sample_headlines": [
        "아침마다 상큼하게, 제주 감귤 젤리",
        "하루를 깨우는 비타민 한 입"
      ],
      "linked_assets": {
        "presentation_id": "presentation-001",
        "product_detail_id": "detail-001",
        "instagram_ids": ["insta-001", "insta-002", "insta-003"],
        "shorts_script_id": "shorts-001"
      }
    },
    // Concept B...
  ]
}
```

---

## 5. UX 상호작용

### 5.1 카드 클릭 → 뷰 전환

**동작**:
1. 사용자가 Concept Card 클릭
2. 선택된 카드 하이라이트 (테두리 + 배경색 변경)
3. 중앙 뷰 전환 (기본: 해당 콘셉트의 슬라이드 뷰)
4. 우측 Chat에 컨텍스트 메시지 추가:
   - "지금 Concept A를 보고 있습니다."

**코드 예시**:
```typescript
function handleConceptCardClick(conceptId: string) {
  // 1. 선택 상태 업데이트
  setSelectedConceptId(conceptId);

  // 2. 중앙 뷰 전환
  setCurrentView('slides_preview');

  // 3. Chat 컨텍스트 메시지
  addChatMessage({
    role: 'system',
    content: `지금 Concept ${conceptId}를 보고 있습니다.`,
  });

  // 4. 분석 트래킹 (optional)
  trackEvent('concept_card_clicked', { concept_id: conceptId });
}
```

### 5.2 산출물 버튼 클릭 → 특정 뷰 오픈

**동작**:
1. 사용자가 `[슬라이드 보기]` 버튼 클릭
2. 중앙 뷰를 `slides_preview`로 전환
3. 해당 Concept의 슬라이드 데이터 로드
4. Chat에 "Concept A의 프레젠테이션을 보고 있습니다." 메시지

**코드 예시**:
```typescript
function openSlides(conceptId: string) {
  setSelectedConceptId(conceptId);
  setCurrentView('slides_preview');

  addChatMessage({
    role: 'system',
    content: `Concept ${conceptId}의 프레젠테이션을 보고 있습니다.`,
  });
}
```

### 5.3 컨셉보드로 돌아가기

**버튼 위치**: 각 산출물 뷰의 하단

**동작**:
1. `[컨셉보드로 돌아가기]` 버튼 클릭
2. 중앙 뷰를 `concept_board`로 전환
3. 선택된 카드는 여전히 하이라이트 유지

**코드 예시**:
```typescript
function backToConceptBoard() {
  setCurrentView('concept_board');

  addChatMessage({
    role: 'system',
    content: '컨셉보드로 돌아왔습니다.',
  });
}
```

---

## 6. 반응형 디자인

### 6.1 데스크탑 (1920px 이상)
- 3개 카드: 나란히 표시 (33% 너비)
- 2개 카드: 나란히 표시 (50% 너비)

### 6.2 태블릿 (768px - 1919px)
- 2개 카드: 나란히 표시 (50% 너비)
- 3개 카드: 2개 나란히 + 1개 아래

### 6.3 모바일 (768px 미만)
- 모든 카드: 세로 스택 (100% 너비)
- 스크롤 가능

---

## 7. 접근성 (Accessibility)

### 7.1 키보드 네비게이션
- Tab: 다음 카드로 이동
- Enter/Space: 카드 선택
- Esc: 컨셉보드로 돌아가기

### 7.2 스크린 리더 지원
- ARIA 라벨 추가:
  - `aria-label="Concept A 카드. 상큼한 하루 리프레시"`
  - `aria-describedby="concept-a-description"`
- 버튼 명확한 텍스트: "슬라이드 보기" (아이콘만 X)

### 7.3 색상 대비
- WCAG AA 기준 충족 (대비 4.5:1 이상)
- 색맹 사용자를 위한 아이콘 추가

---

## 8. 성능 최적화

### 8.1 데이터 로딩
- Concept Board 데이터: API 호출 1회만
- 캐싱: Redis (10분)
- Lazy Loading: 산출물은 버튼 클릭 시 로드

### 8.2 렌더링 최적화
- React.memo로 Concept Card 메모이제이션
- Virtual Scrolling (카드 3개 초과 시)

---

## 9. 확장 가능성

### 9.1 필터링 기능 (미래)
- 톤앤매너별 필터 (밝은 / 따뜻한)
- 타깃별 필터 (Z세대 / 30-40대)

### 9.2 정렬 기능 (미래)
- ReviewerAgent 점수 높은 순
- 최신 생성 순
- 사용자 즐겨찾기 순

### 9.3 비교 모드 (미래)
- 2개 콘셉트 Side-by-side 비교
- 차이점 하이라이트

---

**문서 상태**: ✅ 완성
**다음 문서**: [SHORTS_VIDEO_PIPELINE.md](./SHORTS_VIDEO_PIPELINE.md)
**버전**: v1.0
**최종 수정**: 2025-11-25
