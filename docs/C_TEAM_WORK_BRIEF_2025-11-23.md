# C팀 작업 지침서 요약본

**기간**: 2025-11-25 ~ 2025-12-06 (2주)
**목표**: StrategistAgent UI 구현 및 ContentPlan 통합
**우선순위**: 🟡 Medium (B팀 구현 완료 후 본격 시작)

---

## 🚀 Week 1 작업 (2025-11-25 ~ 2025-11-29)

### 수요일 (11/27): TypeScript 타입 정의
- **파일**: `frontend/src/types/strategist.ts` (신규 생성)
- **내용**:
  ```typescript
  // Input 타입
  export interface CampaignStrategyInput {
    brandName: string;
    productCategory: string;
    targetAudience: string;
    campaignObjective: string;
    budgetRange: string;
    tone: 'professional' | 'casual' | 'luxury' | 'friendly';
    brandValues?: string[];
    competitorInfo?: string;
    keyMessages?: string[];
    channelPreferences?: string[];
  }

  // Output 타입
  export interface StrategicPillar {
    title: string;
    description: string;
    keyActions: string[];
  }

  export interface ChannelStrategy {
    channel: string;
    objective: string;
    contentTypes: string[];
    kpi: string;
  }

  export interface FunnelStructure {
    awareness: string[];
    consideration: string[];
    conversion: string[];
    retention: string[];
  }

  export interface CampaignStrategyOutput {
    coreMessage: string;
    positioning: string;
    targetInsights: string[];
    bigIdea: string;
    strategicPillars: StrategicPillar[];
    channelStrategy: ChannelStrategy[];
    funnelStructure: FunnelStructure;
    riskFactors: string[];
    successMetrics: string[];
  }
  ```
- **참고**: [STRATEGIST_AGENT_SPEC_V1.md](STRATEGIST_AGENT_SPEC_V1.md) Line 87-183
- **검증**: TypeScript 컴파일 에러 없음 확인

### 목요일-금요일 (11/28-11/29): API 연동 준비
- **파일**: `frontend/src/api/strategist.ts` (신규 생성)
- **내용**:
  ```typescript
  import { CampaignStrategyInput, CampaignStrategyOutput } from '@/types/strategist';

  export const strategistApi = {
    // 캠페인 전략 생성
    async generateCampaignStrategy(
      input: CampaignStrategyInput
    ): Promise<CampaignStrategyOutput> {
      const response = await fetch('/api/v1/agents/strategist/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'campaign_strategy',
          input,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate campaign strategy');
      }

      const data = await response.json();
      return data.output;
    },
  };
  ```
- **검증**: B팀 API 구현 완료 후 테스트 (Week 2)

---

## 🎯 Week 2 작업 (2025-12-02 ~ 2025-12-06)

### 화요일 (12/3): StrategistStrategyView 컴포넌트 구현
- **파일**: `frontend/src/components/strategist/StrategistStrategyView.tsx` (신규 생성)
- **구조**:
  ```typescript
  interface StrategistStrategyViewProps {
    strategy: CampaignStrategyOutput;
    onEdit?: (field: string, value: any) => void;
    readonly?: boolean;
  }

  export const StrategistStrategyView: React.FC<StrategistStrategyViewProps> = ({
    strategy,
    onEdit,
    readonly = false,
  }) => {
    return (
      <div className="strategist-strategy-view">
        {/* 1. Core Message & Positioning */}
        <section className="core-section">
          <h2>핵심 메시지</h2>
          <p>{strategy.coreMessage}</p>

          <h2>포지셔닝</h2>
          <p>{strategy.positioning}</p>
        </section>

        {/* 2. Big Idea */}
        <section className="big-idea-section">
          <h2>빅 아이디어</h2>
          <p>{strategy.bigIdea}</p>
        </section>

        {/* 3. Strategic Pillars */}
        <section className="pillars-section">
          <h2>전략 축 ({strategy.strategicPillars.length}개)</h2>
          {strategy.strategicPillars.map((pillar, index) => (
            <div key={index} className="pillar-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
              <ul>
                {pillar.keyActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* 4. Channel Strategy */}
        <section className="channel-section">
          <h2>채널 전략</h2>
          {strategy.channelStrategy.map((channel, index) => (
            <div key={index} className="channel-card">
              <h3>{channel.channel}</h3>
              <p><strong>목표:</strong> {channel.objective}</p>
              <p><strong>콘텐츠 유형:</strong> {channel.contentTypes.join(', ')}</p>
              <p><strong>KPI:</strong> {channel.kpi}</p>
            </div>
          ))}
        </section>

        {/* 5. Funnel Structure */}
        <section className="funnel-section">
          <h2>퍼널 구조</h2>
          <div className="funnel-stages">
            <div className="stage">
              <h3>인지 (Awareness)</h3>
              <ul>{strategy.funnelStructure.awareness.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="stage">
              <h3>고려 (Consideration)</h3>
              <ul>{strategy.funnelStructure.consideration.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="stage">
              <h3>전환 (Conversion)</h3>
              <ul>{strategy.funnelStructure.conversion.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="stage">
              <h3>유지 (Retention)</h3>
              <ul>{strategy.funnelStructure.retention.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* 6. Target Insights */}
        <section className="insights-section">
          <h2>타겟 인사이트</h2>
          <ul>
            {strategy.targetInsights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </section>

        {/* 7. Risk Factors */}
        <section className="risk-section">
          <h2>리스크 요인</h2>
          <ul>
            {strategy.riskFactors.map((risk, index) => (
              <li key={index}>{risk}</li>
            ))}
          </ul>
        </section>

        {/* 8. Success Metrics */}
        <section className="metrics-section">
          <h2>성공 지표</h2>
          <ul>
            {strategy.successMetrics.map((metric, index) => (
              <li key={index}>{metric}</li>
            ))}
          </ul>
        </section>
      </div>
    );
  };
  ```
- **스타일**: `strategist-strategy-view.css` 별도 작성
- **참고**: [STRATEGIST_AGENT_SPEC_V1.md](STRATEGIST_AGENT_SPEC_V1.md) Line 235-258 (UI 가이드라인)

### 수요일 (12/4): 스타일링 및 반응형 디자인
- **파일**: `frontend/src/components/strategist/strategist-strategy-view.css`
- **요구사항**:
  - 카드 기반 레이아웃
  - Polotno Editor 우측 패널과 일관된 디자인
  - 모바일 반응형 (768px 브레이크포인트)
  - 다크 모드 지원 (선택)
- **검증**: 다양한 화면 크기에서 테스트

### 목요일 (12/5): ContentPlan/Copywriter 연결
- **파일**: `frontend/src/components/content-plan/ContentPlanView.tsx` (수정)
- **내용**:
  1. "전략 생성" 버튼 추가
  2. StrategistStrategyView 컴포넌트 임베드
  3. 전략 → Copywriter Input 자동 매핑
     ```typescript
     // 예시: BigIdea → Product Description
     const copywriterInput = {
       productName: strategy.coreMessage,
       productDescription: strategy.bigIdea,
       targetAudience: strategy.targetInsights.join(', '),
       tone: campaignInput.tone,
       // ...
     };
     ```
- **워크플로우**:
  1. 사용자가 "전략 생성" 클릭
  2. StrategistAgent 실행 (Loading 표시)
  3. 전략 결과 표시 (StrategistStrategyView)
  4. "콘텐츠 생성" 버튼 활성화
  5. CopywriterAgent로 자동 연결

### 금요일 (12/6): Edit Mode 구현
- **파일**: `frontend/src/components/strategist/StrategistStrategyEdit.tsx` (신규 생성)
- **기능**:
  1. 각 필드 인라인 편집 (Contenteditable 또는 Input)
  2. Strategic Pillar 추가/삭제
  3. Channel Strategy 추가/삭제
  4. 변경 사항 자동 저장 (Debounce 500ms)
  5. 되돌리기/다시하기 (선택)
- **예시**:
  ```typescript
  const [editableStrategy, setEditableStrategy] = useState(strategy);

  const handleFieldEdit = (field: string, value: any) => {
    setEditableStrategy({ ...editableStrategy, [field]: value });
    debouncedSave(editableStrategy);
  };
  ```
- **검증**: 편집 후 저장 → 재로드 시 변경사항 유지

---

## 📊 병행 작업

### Polotno Editor 통합 확인
- **현재 진행도**: ~70%
- **남은 작업**:
  - StrategistAgent UI 추가 (이번 Sprint)
  - 모든 Agent UI 일관성 확인
  - Edit Mode 최적화
- **기한**: 이번 Sprint 종료 시점

### B팀 협업
- **API 테스트**: B팀이 구현한 `/api/v1/agents/strategist/execute` 엔드포인트 테스트
- **오류 처리**:
  - Loading 상태
  - Error 상태 (재시도 버튼)
  - Empty 상태 (아직 전략 없음)
- **성능**: 응답 시간 측정 (목표: 5초 이내)

---

## ✅ 체크리스트

### Week 1 마감 (11/29 금요일)
- [ ] TypeScript 타입 정의 완료 (`types/strategist.ts`)
- [ ] API 연동 코드 작성 (`api/strategist.ts`)
- [ ] TypeScript 컴파일 에러 없음

### Week 2 마감 (12/6 금요일)
- [ ] StrategistStrategyView 컴포넌트 구현
- [ ] 스타일링 및 반응형 디자인 완료
- [ ] ContentPlan 연결 (전략 → Copywriter 자동 매핑)
- [ ] Edit Mode 구현
- [ ] B팀 API 테스트 완료
- [ ] 오류 처리 (Loading/Error/Empty) 구현
- [ ] Polotno Editor 통합 테스트

---

## 📞 커뮤니케이션

### Daily Standup (매일 오전 10시)
- 어제 완료: ?
- 오늘 계획: ?
- 블로커: ?

### Weekly Review (금요일 오후 4시)
- Week 1 (11/29): TypeScript 타입 및 API 준비 확인
- Week 2 (12/6): UI 구현 완료 및 통합 테스트

### Slack 채널
- **#frontend-dev**: 일반 개발 논의
- **#agent-quality**: A팀과 UI/UX 관련 논의

### 담당자 연락
- **A팀 (QA/Architecture)**: UI 가이드라인, 데이터 구조 문의
- **B팀 (Backend)**: API 연동, 오류 처리 협업

---

## 🎁 참고 문서

### 필수
- [STRATEGIST_AGENT_SPEC_V1.md](STRATEGIST_AGENT_SPEC_V1.md) - 완전한 기술 사양서 (UI 가이드라인 포함)
- [STRATEGIST_AGENT_WORK_ORDER.md](STRATEGIST_AGENT_WORK_ORDER.md) - 상세 작업 지시서
- [PROJECT_STATUS_REPORT_2025-11-23.md](PROJECT_STATUS_REPORT_2025-11-23.md) - 전체 프로젝트 현황

### 참고
- Polotno Editor 문서 (기존 작업물)
- Copywriter UI 구현 (참고용)

---

## 💡 성공 Tips

1. **Copywriter UI 재사용**
   - 이미 구현된 Copywriter UI 컴포넌트 구조 참고
   - 일관된 디자인 언어 유지

2. **B팀 API 우선 테스트**
   - Week 1에 Mock 데이터로 UI 먼저 개발
   - Week 2에 실제 API 연동 및 통합 테스트

3. **점진적 구현**
   - 화요일: 기본 Read-only 뷰
   - 수요일: 스타일링
   - 목요일: ContentPlan 연결
   - 금요일: Edit Mode

4. **사용자 피드백**
   - PM과 실시간 UI 검토
   - A팀과 데이터 표시 방식 협의

---

## 🎨 UI/UX 가이드라인 (요약)

### 레이아웃
- **카드 기반**: 각 섹션을 카드로 분리
- **계층 구조**: Core Message → Big Idea → Strategic Pillars → Channel → Funnel
- **가독성**: 충분한 여백, 명확한 제목

### 색상 (예시)
- **Primary**: 전략 관련 (파란색 계열)
- **Secondary**: 채널 관련 (초록색 계열)
- **Warning**: 리스크 요인 (주황색 계열)
- **Success**: 성공 지표 (녹색 계열)

### 인터랙션
- **Hover**: 카드 하이라이트
- **Click**: Edit Mode 전환 (편집 가능 시)
- **Loading**: Skeleton UI 또는 Spinner

---

**화이팅! 2주 후 StrategistAgent UI 완성을 기대합니다!** 🎨

---

**작성일**: 2025-11-23
**작성자**: A팀 (QA & Architecture)
**버전**: v1.0
