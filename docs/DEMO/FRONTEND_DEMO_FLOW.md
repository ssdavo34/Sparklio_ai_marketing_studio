# Frontend Demo Flow

**문서 버전**: v1.0
**작성일**: 2025-11-25
**작성자**: A팀 (백엔드/문서 총괄)
**목적**: 프론트엔드 관점의 라우트, 레이아웃, 뷰 전환, 챗 시나리오 정의

**상위 문서**: [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md)
**관련 문서**: [CHAT_ONEPAGE_STUDIO_PRINCIPLES.md](./CHAT_ONEPAGE_STUDIO_PRINCIPLES.md), [BACKEND_DEMO_APIS.md](./BACKEND_DEMO_APIS.md)

---

## 1. 라우트 & 레이아웃

### 1.1 기본 라우트

**데모 메인 화면**: `/studio/demo`

**원칙**:
- 데모 전체 플로우는 **하나의 라우트** 안에서 진행
- 페이지 전환 없이 중앙 뷰만 전환
- 좌/중/우 패널 구조 항상 유지

### 1.2 레이아웃 구조

```
┌─────────────────────────────────────────────────────────┐
│                     Header (Optional)                   │
├──────────┬────────────────────────────┬─────────────────┤
│          │                            │                 │
│  Left    │        Center              │     Right       │
│  Panel   │        View                │     Panel       │
│  (20%)   │        (50-60%)            │     (20-30%)    │
│          │                            │                 │
│ - Brand  │ - Meeting Summary          │ - Chat          │
│ - Meeting│ - Concept Board            │   (Sparklio     │
│   List   │ - Slides Preview           │    Assistant)   │
│ - Project│ - Detail Preview           │                 │
│          │ - Instagram Preview        │ - Inspector     │
│          │ - Shorts Preview           │   (Optional)    │
│          │                            │                 │
│          │                            │ - Suggested     │
│          │                            │   Actions       │
│          │                            │                 │
└──────────┴────────────────────────────┴─────────────────┘
```

---

## 2. 패널별 상세 구성

### 2.1 좌측 패널 (Left Panel) - 컨텍스트 선택

**역할**: 브랜드, Meeting, 프로젝트 선택

**구성 요소**:

#### 1) 브랜드 선택 (Brand Selector)
```tsx
<BrandSelector>
  <Dropdown>
    <Option value="brand-1">제주 감귤 브랜드</Option>
    <Option value="brand-2">Sample Brand</Option>
  </Dropdown>
</BrandSelector>
```

**동작**:
- 브랜드 선택 시 → 우측 Chat에 컨텍스트 반영
- 선택된 브랜드의 Brand Kit 자동 로드

#### 2) Meeting 리스트 (Meeting List)
```tsx
<MeetingList>
  <MeetingCard
    id="meeting-1"
    title="제주 감귤 젤리 런칭 회의"
    date="2025-11-24"
    status="summary_ready"
  />
  <MeetingCard
    id="meeting-2"
    title="신제품 마케팅 전략 회의"
    date="2025-11-23"
    status="ready_for_summary"
  />
</MeetingList>
```

**동작**:
- Meeting 카드 클릭 시 → 중앙 뷰에 Meeting Summary 표시
- Chat에 "Meeting을 불러왔습니다" 메시지 표시

#### 3) 프로젝트 선택 (Optional)
```tsx
<ProjectSelector>
  <Option value="project-1">제주 감귤 캠페인</Option>
  <Option value="project-2">신제품 런칭</Option>
</ProjectSelector>
```

**상태 관리**:
```typescript
interface LeftPanelState {
  selectedBrandId: string | null;
  selectedMeetingId: string | null;
  selectedProjectId: string | null;
  meetings: Meeting[];
}
```

---

### 2.2 중앙 영역 (Center View) - 결과물 표시

**역할**: 메인 캔버스, 결과물 표시

**뷰 타입**:
1. `meeting_summary` - Meeting 요약
2. `concept_board` - Concept Board (기본 뷰)
3. `slides_preview` - Presentation 미리보기
4. `detail_preview` - Product Detail 미리보기
5. `instagram_preview` - Instagram Ad 미리보기
6. `shorts_preview` - Shorts Script & Preview

#### View 1: Meeting Summary

**컴포넌트**: `<MeetingSummaryView />`

**내용**:
```tsx
<MeetingSummaryView>
  <Title>제주 감귤 젤리 신제품 런칭 기획 회의</Title>

  <OneLiner>
    국내산 제주 감귤을 활용한 건강한 젤리 신제품 기획
  </OneLiner>

  <KeyMessages>
    <Message>국내산 제주 감귤 100%</Message>
    <Message>합성 첨가물 무첨가</Message>
    <Message>어린이도 안심하고 먹을 수 있는 비타민 간식</Message>
  </KeyMessages>

  <TargetPersona>
    30-40대 엄마, 자녀 간식에 관심 많은 소비자
  </TargetPersona>

  <ProblemSolution>
    <Problem>시중 젤리는 합성 첨가물 과다</Problem>
    <Solution>천연 재료로 만든 건강한 젤리</Solution>
  </ProblemSolution>

  <ActionButton onClick={handleCreateCampaign}>
    캠페인 만들기
  </ActionButton>
</MeetingSummaryView>
```

#### View 2: Concept Board (핵심 뷰)

**컴포넌트**: `<ConceptBoardView />`

**레이아웃**:
```tsx
<ConceptBoardView>
  {/* 상단: Meeting/Brand 정보 */}
  <ConceptBoardHeader>
    <MeetingInfo>
      <Title>제주 감귤 젤리 신제품 런칭 기획 회의</Title>
      <Target>타깃: 30-40대 엄마</Target>
      <KeyMessage>핵심: 국내산 제주 감귤 100%, 합성 첨가물 무첨가</KeyMessage>
    </MeetingInfo>
    <BrandInfo>
      <BrandName>제주 감귤 브랜드</BrandName>
      <BrandColors>
        <Color hex="#FFA500" />
        <Color hex="#FFD700" />
      </BrandColors>
    </BrandInfo>
  </ConceptBoardHeader>

  {/* 하단: Concept 카드 가로 배열 */}
  <ConceptCardGrid>
    <ConceptCard conceptId="concept-a">
      <ConceptTitle>Concept A</ConceptTitle>
      <ConceptSubtitle>상큼한 하루 리프레시</ConceptSubtitle>

      <CoreMessage>
        제주 감귤의 상큼함으로 하루를 상쾌하게
      </CoreMessage>

      <ToneKeywords>
        <Keyword>밝은</Keyword>
        <Keyword>경쾌한</Keyword>
        <Keyword>활기찬</Keyword>
      </ToneKeywords>

      <SampleHeadlines>
        <Headline>아침마다 상큼하게, 제주 감귤 젤리</Headline>
        <Headline>하루를 깨우는 비타민 한 입</Headline>
      </SampleHeadlines>

      <AssetLinks>
        <Button onClick={() => openSlides('concept-a')}>
          슬라이드 보기
        </Button>
        <Button onClick={() => openDetail('concept-a')}>
          상세 보기
        </Button>
        <Button onClick={() => openInstagram('concept-a')}>
          인스타 보기
        </Button>
        <Button onClick={() => openShorts('concept-a')}>
          쇼츠 보기
        </Button>
      </AssetLinks>
    </ConceptCard>

    <ConceptCard conceptId="concept-b">
      {/* Concept B 구성 동일 */}
    </ConceptCard>
  </ConceptCardGrid>
</ConceptBoardView>
```

**상호작용**:
- 카드 클릭 → 중앙 뷰 전환 (해당 콘셉트 산출물로)
- 버튼 클릭 → 특정 뷰 오픈 (예: 슬라이드 보기)
- Chat에 "지금 Concept A를 보고 있습니다" 컨텍스트 표시

#### View 3: Slides Preview

**컴포넌트**: `<SlidesPreviewView />`

**Polotno 통합**:
```tsx
<SlidesPreviewView>
  <ConceptContext>
    현재 보는 콘셉트: Concept A - 상큼한 하루 리프레시
  </ConceptContext>

  <PolotnoViewer
    slides={slidesData}
    readOnly={true}
    currentSlide={currentSlideIndex}
  />

  <SlideNavigation>
    <Button onClick={previousSlide}>이전</Button>
    <SlideIndicator>1 / 5</SlideIndicator>
    <Button onClick={nextSlide}>다음</Button>
  </SlideNavigation>

  <BackButton onClick={() => setView('concept_board')}>
    컨셉보드로 돌아가기
  </BackButton>
</SlidesPreviewView>
```

#### View 4: Detail Preview

**컴포넌트**: `<DetailPreviewView />`

```tsx
<DetailPreviewView>
  <ConceptContext>
    현재 보는 콘셉트: Concept A - 상큼한 하루 리프레시
  </ConceptContext>

  <DetailContent>
    <ProductTitle>제주 감귤 젤리 - 상큼한 하루 리프레시</ProductTitle>

    <OneLiner>
      국내산 제주 감귤 100%로 만든 상큼하고 건강한 젤리
    </OneLiner>

    <Benefits>
      <Benefit>✅ 국내산 제주 감귤 100% 사용</Benefit>
      <Benefit>✅ 합성 첨가물 무첨가</Benefit>
      <Benefit>✅ 비타민 C 풍부</Benefit>
      <Benefit>✅ 어린이도 안심</Benefit>
    </Benefits>

    <Description>
      {detailText}
    </Description>

    <CTA>지금 바로 구매하기 →</CTA>
  </DetailContent>

  <BackButton onClick={() => setView('concept_board')}>
    컨셉보드로 돌아가기
  </BackButton>
</DetailPreviewView>
```

#### View 5: Instagram Preview

**컴포넌트**: `<InstagramPreviewView />`

```tsx
<InstagramPreviewView>
  <ConceptContext>
    현재 보는 콘셉트: Concept A - 상큼한 하루 리프레시
  </ConceptContext>

  <InstagramCardGrid>
    <InstagramCard>
      <ImageArea>{/* 이미지 영역 */}</ImageArea>
      <Headline>아침마다 상큼하게, 제주 감귤 젤리</Headline>
      <Subcopy>국내산 감귤 100%로 만든 건강한 간식</Subcopy>
      <CTA>지금 확인하기 →</CTA>
    </InstagramCard>

    <InstagramCard>
      {/* Card 2 */}
    </InstagramCard>

    <InstagramCard>
      {/* Card 3 */}
    </InstagramCard>
  </InstagramCardGrid>

  <BackButton onClick={() => setView('concept_board')}>
    컨셉보드로 돌아가기
  </BackButton>
</InstagramPreviewView>
```

#### View 6: Shorts Preview

**컴포넌트**: `<ShortsPreviewView />`

```tsx
<ShortsPreviewView>
  <ConceptContext>
    현재 보는 콘셉트: Concept A - 상큼한 하루 리프레시
  </ConceptContext>

  <ShortsScript>
    <SceneList>
      <Scene number={1} duration="0-4초">
        <Role>Hook</Role>
        <Visual>아침 침대에서 일어나는 모습</Visual>
        <Narration>"아침마다 피곤하신가요?"</Narration>
        <Subtitle>피곤한 아침...</Subtitle>
      </Scene>

      <Scene number={2} duration="4-8초">
        {/* Scene 2 */}
      </Scene>

      {/* 나머지 씬들 */}
    </SceneList>
  </ShortsScript>

  {/* Optional: 키프레임 이미지 프리뷰 */}
  <KeyframePreview>
    {keyframes.map((frame, idx) => (
      <Keyframe key={idx} src={frame.imageUrl} />
    ))}
  </KeyframePreview>

  {/* Optional: 영상 프리뷰 */}
  <VideoPreview>
    <video src={videoUrl} controls />
  </VideoPreview>

  <BackButton onClick={() => setView('concept_board')}>
    컨셉보드로 돌아가기
  </BackButton>
</ShortsPreviewView>
```

---

### 2.3 우측 패널 (Right Panel) - Chat & Inspector

**역할**: Chat 오케스트레이터, 세부 설정

**구성 요소**:

#### 1) Chat 패널 (상단 80%)

```tsx
<ChatPanel>
  <ChatHeader>
    <Title>Sparklio Assistant</Title>
    <Status>온라인</Status>
  </ChatHeader>

  <ChatMessages>
    {messages.map(msg => (
      <ChatMessage
        key={msg.id}
        role={msg.role}
        content={msg.content}
        nextActions={msg.nextActions}
      />
    ))}
  </ChatMessages>

  <ChatInput>
    <Textarea
      placeholder="무엇을 도와드릴까요? (예: 이 회의로 캠페인 만들어줘)"
      value={inputValue}
      onChange={handleInputChange}
    />
    <SendButton onClick={handleSendMessage}>전송</SendButton>
  </ChatInput>
</ChatPanel>
```

**Chat Message 구조**:
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  nextActions?: NextAction[];
  view?: ViewType; // 이 메시지로 인해 전환될 뷰
}

interface NextAction {
  label: string;
  action: 'open_concept_board' | 'open_slides' | 'open_detail' | 'open_instagram' | 'open_shorts' | 'create_campaign' | 'generate_shorts';
  payload?: Record<string, any>;
}
```

**Next Actions 렌더링**:
```tsx
<ChatMessage>
  <MessageContent>{message.content}</MessageContent>

  {message.nextActions && (
    <NextActionButtons>
      {message.nextActions.map(action => (
        <ActionButton
          key={action.label}
          onClick={() => handleAction(action)}
        >
          {action.label}
        </ActionButton>
      ))}
    </NextActionButtons>
  )}
</ChatMessage>
```

#### 2) Inspector (하단 20%, Optional)

```tsx
<Inspector>
  <InspectorHeader>설정</InspectorHeader>

  {/* 선택된 콘셉트/뷰에 따라 다른 설정 표시 */}
  {currentView === 'concept_board' && (
    <ConceptSettings>
      <Label>콘셉트 필터</Label>
      <Checkbox checked={showConceptA}>Concept A</Checkbox>
      <Checkbox checked={showConceptB}>Concept B</Checkbox>
    </ConceptSettings>
  )}

  {currentView === 'slides_preview' && (
    <SlideSettings>
      <Label>슬라이드 크기</Label>
      <Slider min={50} max={150} value={slideZoom} />
    </SlideSettings>
  )}
</Inspector>
```

#### 3) Suggested Actions (Quick Chips)

```tsx
<SuggestedActions>
  <Label>빠른 작업</Label>
  <ChipGroup>
    <Chip onClick={() => handleQuickAction('meeting_summary')}>
      회의 요약 보기
    </Chip>
    <Chip onClick={() => handleQuickAction('concept_board')}>
      컨셉보드 열기
    </Chip>
    <Chip onClick={() => handleQuickAction('create_shorts')}>
      쇼츠 만들기
    </Chip>
  </ChipGroup>
</SuggestedActions>
```

---

## 3. 상태 관리

### 3.1 전역 상태 (Global State)

```typescript
interface StudioState {
  // 컨텍스트
  selectedBrandId: string | null;
  selectedMeetingId: string | null;
  selectedProjectId: string | null;
  selectedConceptId: string | null;

  // 뷰 상태
  currentView: ViewType;

  // 데이터
  meeting: Meeting | null;
  campaign: Campaign | null;
  concepts: Concept[];

  // Chat 상태
  chatMessages: ChatMessage[];
  chatLoading: boolean;

  // UI 상태
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
}

type ViewType =
  | 'meeting_summary'
  | 'concept_board'
  | 'slides_preview'
  | 'detail_preview'
  | 'instagram_preview'
  | 'shorts_preview';
```

### 3.2 상태 전이 규칙

```typescript
// Meeting 선택 시
function handleMeetingSelect(meetingId: string) {
  setState({
    selectedMeetingId: meetingId,
    currentView: 'meeting_summary',
    meeting: await fetchMeeting(meetingId),
  });

  addChatMessage({
    role: 'assistant',
    content: 'Meeting을 불러왔습니다. 요약을 확인하세요.',
    nextActions: [
      { label: '캠페인 만들기', action: 'create_campaign' }
    ]
  });
}

// 캠페인 생성 시
function handleCreateCampaign() {
  setState({ chatLoading: true });

  addChatMessage({
    role: 'assistant',
    content: '캠페인 브리프를 작성 중입니다...',
  });

  const campaign = await createCampaign(meetingId, brandId);

  setState({
    campaign,
    concepts: campaign.concepts,
    currentView: 'concept_board',
    chatLoading: false,
  });

  addChatMessage({
    role: 'assistant',
    content: '모든 산출물이 준비되었습니다!',
    nextActions: [
      { label: '컨셉보드 열기', action: 'open_concept_board' },
      { label: 'Concept A 슬라이드 보기', action: 'open_slides', payload: { conceptId: 'concept-a' } },
    ],
    view: 'concept_board',
  });
}

// Concept 카드 클릭 시
function handleConceptCardClick(conceptId: string) {
  setState({ selectedConceptId: conceptId });

  addChatMessage({
    role: 'system',
    content: `지금 Concept ${conceptId}를 보고 있습니다.`,
  });
}

// 뷰 전환 시
function handleViewChange(view: ViewType, payload?: any) {
  setState({ currentView: view });

  if (payload?.conceptId) {
    setState({ selectedConceptId: payload.conceptId });
  }
}
```

---

## 4. 챗 시나리오 (3가지)

### 시나리오 1: 회의 불러오기

**유저 입력**:
```
이 회의로 캠페인 만들어줘.
https://www.youtube.com/watch?v=XXXXX
```

**시스템 처리**:
1. Intent 파싱: `create_campaign_from_url`
2. API 호출: `POST /api/v1/meetings/from-url`
3. Meeting 생성 및 요약

**Chat 응답 시퀀스**:

```typescript
// Message 1
{
  role: 'assistant',
  content: '알겠습니다. 회의 내용을 불러와서 요약하고, 캠페인 브리프를 만들게요.',
}

// Message 2 (진행 중)
{
  role: 'assistant',
  content: '회의 영상을 다운로드 중입니다...',
}

// Message 3 (진행 중)
{
  role: 'assistant',
  content: '회의 내용을 분석 중입니다...\n핵심 키메시지를 추출하고 있어요.',
}

// Message 4 (완료)
{
  role: 'assistant',
  content: `회의 요약이 완료되었습니다!

📋 회의 제목: "제주 감귤 젤리 신제품 런칭 기획 회의"

📝 한 줄 요약:
"국내산 제주 감귤을 활용한 건강한 젤리 신제품 기획"

🎯 핵심 키메시지:
1. 국내산 제주 감귤 100%
2. 합성 첨가물 무첨가
3. 어린이도 안심하고 먹을 수 있는 비타민 간식

👥 타깃 페르소나:
"30-40대 엄마, 자녀 간식에 관심 많은 소비자"

이 내용으로 브랜드 [제주 감귤 브랜드] 기반 캠페인을 만들어볼까요?`,
  nextActions: [
    { label: '캠페인 만들기', action: 'create_campaign' },
    { label: '요약 다시 보기', action: 'open_meeting_summary' },
  ],
  view: 'meeting_summary',
}
```

**UI 변화**:
- 중앙 뷰: `meeting_summary`로 전환
- Meeting 정보 표시
- `[캠페인 만들기]` 버튼 활성화

---

### 시나리오 2: 캠페인 + 멀티 채널 생성

**유저 액션**: `[캠페인 만들기]` 버튼 클릭

**시스템 처리**:
1. API 호출: `POST /api/v1/demo/meeting-to-campaign`
2. Strategist, Concept, Copywriter 에이전트 실행
3. 2-3개 Concept + 각 4종 산출물 생성

**Chat 응답 시퀀스**:

```typescript
// Message 1
{
  role: 'assistant',
  content: '캠페인 브리프를 작성 중입니다...',
}

// Message 2
{
  role: 'assistant',
  content: `콘셉트를 생성하고 있어요...
- Concept A: "상큼한 하루 리프레시"
- Concept B: "아이와 함께하는 비타민 간식"`,
}

// Message 3 (진행률 표시)
{
  role: 'assistant',
  content: '각 콘셉트별로 슬라이드, 상세페이지, 인스타 광고, 쇼츠 스크립트를 만들고 있습니다...\n\nConcept A 기반 산출물 생성 중... (1/4)',
}

// Message 4 (진행률 업데이트)
{
  role: 'assistant',
  content: 'Concept A 기반 산출물 생성 중... (2/4)',
}

// ... (3/4, 4/4)

// Message 5 (Concept B 시작)
{
  role: 'assistant',
  content: 'Concept B 기반 산출물 생성 중... (1/4)',
}

// ... (2/4, 3/4, 4/4)

// Message 6 (완료)
{
  role: 'assistant',
  content: `✨ 모든 산출물이 준비되었습니다!

2개의 콘셉트와 8종의 마케팅 자료가 만들어졌어요.
아래 버튼을 눌러 확인해보세요.`,
  nextActions: [
    { label: '컨셉보드 열기', action: 'open_concept_board' },
    { label: 'Concept A 슬라이드 보기', action: 'open_slides', payload: { conceptId: 'concept-a' } },
    { label: 'Concept B 슬라이드 보기', action: 'open_slides', payload: { conceptId: 'concept-b' } },
  ],
  view: 'concept_board',
}
```

**UI 변화**:
- 중앙 뷰: 진행률 표시 (0% → 100%)
- 완료 후: `concept_board`로 전환
- Concept Card 2개 표시

---

### 시나리오 3: 쇼츠/영상 생성 요청

**유저 입력**:
```
Concept A로 20초짜리 쇼츠도 만들어줘
```

**시스템 처리**:
1. Intent 파싱: `generate_shorts`
2. API 호출: `POST /api/v1/demo/campaign-to-shorts`
3. ShortsScript, VisualPrompt, VideoBuilder 실행

**Chat 응답 시퀀스**:

```typescript
// Message 1
{
  role: 'assistant',
  content: 'Concept A 기준으로 쇼츠 스크립트를 만들고 있어요...',
}

// Message 2
{
  role: 'assistant',
  content: '쇼츠 스크립트가 완성되었습니다!\n총 6개 씬, 25초 분량입니다.',
  nextActions: [
    { label: '쇼츠 프리뷰 보기', action: 'open_shorts', payload: { conceptId: 'concept-a' } },
    { label: '스크립트 수정 요청', action: 'edit_shorts_script' },
  ],
  view: 'shorts_preview',
}

// Optional: 이미지 생성
{
  role: 'assistant',
  content: '키프레임 이미지를 생성하고 있어요... (1/6)',
}

// ... (2/6, 3/6, ..., 6/6)

{
  role: 'assistant',
  content: '모든 키프레임 이미지가 준비되었습니다!\n이제 영상을 조립할게요.',
}

// Optional: 영상 조립
{
  role: 'assistant',
  content: '영상을 조립 중입니다... (ffmpeg 처리 중)',
}

{
  role: 'assistant',
  content: '✨ 쇼츠 영상이 완성되었습니다!\n아래에서 바로 재생할 수 있어요.',
  nextActions: [
    { label: '영상 재생', action: 'play_video' },
    { label: '영상 다운로드', action: 'download_video' },
  ],
}
```

**UI 변화**:
- 중앙 뷰: `shorts_preview`로 전환
- 스크립트 표시
- (Optional) 키프레임 이미지 표시
- (Optional) 영상 플레이어 표시

---

## 5. 상태 동기화 규칙 (Chat ↔ 중앙 뷰)

### 5.1 Chat → View 동기화

**원칙**: Chat의 `nextActions`가 클릭되면 중앙 뷰 전환

```typescript
function handleChatAction(action: NextAction) {
  switch (action.action) {
    case 'open_concept_board':
      setCurrentView('concept_board');
      break;

    case 'open_slides':
      setCurrentView('slides_preview');
      setSelectedConceptId(action.payload.conceptId);
      break;

    case 'open_detail':
      setCurrentView('detail_preview');
      setSelectedConceptId(action.payload.conceptId);
      break;

    case 'open_instagram':
      setCurrentView('instagram_preview');
      setSelectedConceptId(action.payload.conceptId);
      break;

    case 'open_shorts':
      setCurrentView('shorts_preview');
      setSelectedConceptId(action.payload.conceptId);
      break;

    case 'create_campaign':
      handleCreateCampaign();
      break;

    case 'generate_shorts':
      handleGenerateShorts(action.payload);
      break;
  }
}
```

### 5.2 View → Chat 동기화

**원칙**: 중앙 뷰 전환 시 Chat에 컨텍스트 메시지 추가

```typescript
function syncViewToChat(view: ViewType, conceptId?: string) {
  const contextMessages = {
    meeting_summary: 'Meeting 요약을 보고 있습니다.',
    concept_board: '컨셉보드를 보고 있습니다.',
    slides_preview: `Concept ${conceptId}의 프레젠테이션을 보고 있습니다.`,
    detail_preview: `Concept ${conceptId}의 상세페이지를 보고 있습니다.`,
    instagram_preview: `Concept ${conceptId}의 인스타 광고를 보고 있습니다.`,
    shorts_preview: `Concept ${conceptId}의 쇼츠 스크립트를 보고 있습니다.`,
  };

  addChatMessage({
    role: 'system',
    content: contextMessages[view],
  });
}
```

### 5.3 Suggested Actions 업데이트

**원칙**: 현재 뷰/상태에 따라 Quick Chips 동적 변경

```typescript
function getSuggestedActions(state: StudioState): QuickAction[] {
  if (!state.meeting) {
    return [
      { label: '회의 불러오기', action: 'load_meeting' },
    ];
  }

  if (!state.campaign) {
    return [
      { label: '캠페인 만들기', action: 'create_campaign' },
      { label: '회의 요약 보기', action: 'open_meeting_summary' },
    ];
  }

  if (state.currentView === 'concept_board') {
    return [
      { label: 'Concept A 슬라이드', action: 'open_slides', payload: { conceptId: 'concept-a' } },
      { label: 'Concept B 슬라이드', action: 'open_slides', payload: { conceptId: 'concept-b' } },
      { label: '쇼츠 만들기', action: 'generate_shorts' },
    ];
  }

  // ... 다른 뷰별 Suggested Actions
}
```

---

## 6. API 연동

### 6.1 Chat 입력 → Backend 파이프라인

```typescript
async function handleChatSubmit(userInput: string) {
  // 1. 유저 메시지 추가
  addChatMessage({
    role: 'user',
    content: userInput,
  });

  // 2. Loading 상태
  setChatLoading(true);

  // 3. Backend 호출 (OrchestratorAgent)
  const response = await fetch('/api/v1/chat/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userInput,
      context: {
        brandId: selectedBrandId,
        meetingId: selectedMeetingId,
        projectId: selectedProjectId,
        currentView: currentView,
      },
    }),
  });

  const data = await response.json();

  // 4. Assistant 메시지 추가
  addChatMessage({
    role: 'assistant',
    content: data.message,
    nextActions: data.nextActions,
    view: data.view,
  });

  // 5. 뷰 전환 (필요 시)
  if (data.view) {
    setCurrentView(data.view);
  }

  // 6. Loading 해제
  setChatLoading(false);
}
```

### 6.2 실시간 상태 스트리밍 (SSE)

```typescript
function subscribeToProgress(taskId: string) {
  const eventSource = new EventSource(`/api/v1/tasks/${taskId}/stream`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // 진행률 메시지 추가
    addChatMessage({
      role: 'assistant',
      content: data.message,
    });

    // 진행률 UI 업데이트
    setProgress(data.progress);
  };

  eventSource.onerror = () => {
    eventSource.close();
  };
}
```

---

## 7. 컴포넌트 구조 (React)

```
/app/studio/demo/
├── page.tsx                      // 메인 라우트
├── layout.tsx                    // 레이아웃
├── components/
│   ├── LeftPanel/
│   │   ├── BrandSelector.tsx
│   │   ├── MeetingList.tsx
│   │   └── ProjectSelector.tsx
│   ├── CenterView/
│   │   ├── MeetingSummaryView.tsx
│   │   ├── ConceptBoardView.tsx
│   │   ├── SlidesPreviewView.tsx
│   │   ├── DetailPreviewView.tsx
│   │   ├── InstagramPreviewView.tsx
│   │   └── ShortsPreviewView.tsx
│   ├── RightPanel/
│   │   ├── ChatPanel.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── Inspector.tsx
│   │   └── SuggestedActions.tsx
│   └── shared/
│       ├── ConceptCard.tsx
│       ├── LoadingSpinner.tsx
│       └── ProgressBar.tsx
├── hooks/
│   ├── useChatOrchestrator.ts
│   ├── useViewSync.ts
│   └── useStudioState.ts
├── store/
│   └── studioStore.ts            // Zustand/Redux store
└── utils/
    ├── apiClient.ts
    └── chatParser.ts
```

---

## 8. 데모 최적화 팁

### 8.1 로딩 UX
- **진행률 표시**: 0% → 100% 진행바
- **중간 메시지**: "슬라이드 생성 중 (1/4)" 같은 단계별 안내
- **스켈레톤 UI**: 데이터 로드 전 레이아웃 미리 표시

### 8.2 오류 처리
- **Fallback**: API 실패 시 미리 준비한 데이터 로드
- **재시도**: 타임아웃 시 자동 재시도 (최대 3회)
- **사용자 알림**: 명확한 에러 메시지 표시

### 8.3 성능 최적화
- **Lazy Loading**: 뷰 전환 시 해당 컴포넌트만 로드
- **Memoization**: React.memo로 불필요한 리렌더 방지
- **Debounce**: Chat 입력 디바운스 처리

---

**문서 상태**: ✅ 완성
**다음 문서**: [CHAT_ONEPAGE_STUDIO_PRINCIPLES.md](./CHAT_ONEPAGE_STUDIO_PRINCIPLES.md)
**버전**: v1.0
**최종 수정**: 2025-11-25
