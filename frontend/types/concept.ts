/**
 * ConceptV1 Type Definitions
 *
 * Sparklio Concept System v1 - First-class Concept Object
 *
 * 참조 문서: CONCEPT_SPEC.md, CONCEPT_AGENT_V2_UPGRADE_PLAN.md
 * 작성일: 2025-11-27
 * 작성팀: C팀 (Frontend)
 *
 * 이 타입은 Backend의 ConceptV1 Pydantic 모델과 1:1 대응됩니다.
 */

// =============================================================================
// Visual World
// =============================================================================

/**
 * 비주얼 세계관
 *
 * 컨셉의 시각적 정체성을 정의하는 모든 요소
 */
export interface VisualWorld {
  /**
   * 색상 팔레트 설명
   *
   * @example "밤+네온 (퇴근길 도시 조명)"
   * @example "파스텔+화이트 (봄날 아침)"
   */
  color_palette: string;

  /**
   * 사진 스타일
   *
   * @example "실내 조명 아래 책상/소파 컷"
   * @example "자연광 아래 야외 풍경"
   */
  photo_style: string;

  /**
   * 레이아웃 모티프 리스트
   *
   * 디자인에서 반복 사용할 시각적 요소
   *
   * @example ["루틴 체크리스트", "ONE DAY 타임라인"]
   * @example ["그리드 레이아웃", "원형 배지"]
   */
  layout_motifs: string[];

  /**
   * HEX 색상 코드 (3-5개)
   *
   * @example ["#1F2937", "#F59E0B", "#10B981"]
   */
  hex_colors: string[];
}

// =============================================================================
// Channel Strategy
// =============================================================================

/**
 * 채널별 전략
 *
 * 각 채널에서 이 컨셉을 어떻게 적용할지에 대한 요약
 */
export interface ChannelStrategy {
  /**
   * Shorts 전략 (15-60초 영상)
   *
   * @example "퇴근 → 집 → 간식 → 편안한 표정 15초 내"
   */
  shorts?: string;

  /**
   * Instagram 뉴스 광고 전략
   *
   * @example "하루 루틴을 뉴스처럼 브리핑하는 톤"
   */
  instagram_news?: string;

  /**
   * 상품 상세 페이지 전략
   *
   * @example "루틴 스토리 → 성분/근거 → 후기 순서"
   */
  product_detail?: string;

  /**
   * 프레젠테이션 전략
   *
   * @example "문제 제기 → 솔루션 → 성과 데이터 순서"
   */
  presentation?: string;
}

// =============================================================================
// Guardrails
// =============================================================================

/**
 * 가드레일 (필수 준수 사항)
 *
 * 컨셉을 실행할 때 반드시 지켜야 할 규칙
 */
export interface Guardrails {
  /**
   * 피해야 할 표현 리스트
   *
   * 법적/윤리적 문제가 될 수 있는 표현
   *
   * @example ["살 빠진다", "질병 치료", "즉각적인 효과"]
   */
  avoid_claims: string[];

  /**
   * 반드시 포함해야 할 메시지 리스트
   *
   * 브랜드 정책상 필수 포함 문구
   *
   * @example ["위에 부담 적음", "퇴근 후 루틴"]
   */
  must_include: string[];
}

// =============================================================================
// Concept Meta
// =============================================================================

/**
 * 컨셉 메타데이터
 *
 * 컨셉 관리를 위한 부가 정보
 */
export interface ConceptMeta {
  /**
   * 브랜드 ID (UUID)
   */
  brand_id?: string;

  /**
   * 프로젝트 ID (UUID)
   */
  project_id?: string;

  /**
   * 생성자
   *
   * @example "concept_agent"
   * @example "user_123"
   */
  created_by: string;

  /**
   * 생성 시각 (ISO 8601)
   *
   * @example "2025-11-27T10:30:00Z"
   */
  created_at: string;

  /**
   * 컨셉 상태
   *
   * - draft: 초안
   * - active: 활성화
   * - archived: 보관됨
   */
  status: 'draft' | 'active' | 'archived';
}

// =============================================================================
// ConceptV1 - Main Type
// =============================================================================

/**
 * ConceptV1 - Sparklio Concept System v1
 *
 * Sparklio의 "컨셉"은 단순한 주제+톤이 아니라,
 * Audience Insight → Promise → Evidence → Creative Device
 * → Visual World → Channel Strategy → Guardrails
 * 까지를 포함하는 First-class 객체입니다.
 *
 * @see CONCEPT_SPEC.md - 전체 시스템 스펙
 * @see CONCEPT_AGENT_V2_UPGRADE_PLAN.md - Backend 구현 계획
 */
export interface ConceptV1 {
  // ---------------------------------------------------------------------------
  // 기본 정보
  // ---------------------------------------------------------------------------

  /**
   * 컨셉 ID
   *
   * @example "CONCEPT_abc123"
   */
  id: string;

  /**
   * 컨셉 스키마 버전
   *
   * @example 1
   */
  version: number;

  /**
   * 컨셉 이름 (5-15자)
   *
   * @example "퇴근길 속 편한 단백질 루틴"
   */
  name: string;

  /**
   * 제품/서비스 카테고리
   *
   * @example "단백질 스낵"
   * @example "마케팅 자동화 SaaS"
   */
  topic: string;

  /**
   * 캠페인 모드
   *
   * @example "launch_campaign" - 신제품 런칭
   * @example "evergreen" - 상시 운영
   * @example "seasonal" - 계절/이벤트 기반
   */
  mode: string;

  // ---------------------------------------------------------------------------
  // 전략 핵심 (🆕 Phase 1에서 추가)
  // ---------------------------------------------------------------------------

  /**
   * 고객 인사이트 (1줄)
   *
   * 고객이 겪는 심리적/상황적 문제에 대한 공감
   *
   * @example "퇴근길에 허기져서 자꾸 편의점 과자를 사게 되는데, 내일 아침이 걱정된다."
   */
  audience_insight: string;

  /**
   * 핵심 약속 (Core Promise)
   *
   * 이 컨셉이 고객에게 제공하는 핵심 가치
   *
   * @example "배는 차게, 속은 편하게 채워주는 단백질 루틴"
   */
  core_promise: string;

  /**
   * 브랜드 역할
   *
   * 이 브랜드가 고객의 삶에서 맡는 역할
   *
   * @example "나를 챙겨주는 '퇴근 후 루틴' 가이드"
   */
  brand_role: string;

  // ---------------------------------------------------------------------------
  // 근거 (🆕 Phase 1에서 추가)
  // ---------------------------------------------------------------------------

  /**
   * 믿을 수 있는 이유 (Reason to Believe)
   *
   * core_promise를 믿게 하는 구체적 근거
   * 스펙, 데이터, 성분, 증거 등
   *
   * @example ["당 5g 이하, 단백질 15g 이상", "위에 부담을 줄이는 원료 조합", "1,000명 이상의 직장인 후기"]
   */
  reason_to_believe: string[];

  // ---------------------------------------------------------------------------
  // 크리에이티브 (🆕 Phase 1에서 추가)
  // ---------------------------------------------------------------------------

  /**
   * 크리에이티브 장치 (Creative Device)
   *
   * 캠페인 전반을 묶는 비유, 스토리 장치, 또는 프레임
   *
   * @example "하루의 '마침표'를 찍는 작은 의식"
   * @example "아침을 여는 '시작 버튼'"
   */
  creative_device: string;

  /**
   * 훅 패턴 (Hook Patterns)
   *
   * 헤드라인, 오프닝에서 반복 사용할 문장 패턴
   *
   * @example ["오늘도 무사히 버틴 당신에게", "퇴근 후 딱 5분, 내 몸을 위해 쓰자"]
   */
  hook_patterns: string[];

  // ---------------------------------------------------------------------------
  // 비주얼 (🆕 Phase 1에서 확장)
  // ---------------------------------------------------------------------------

  /**
   * 비주얼 세계관
   *
   * 색상, 사진 스타일, 레이아웃 모티프, HEX 코드
   */
  visual_world: VisualWorld;

  // ---------------------------------------------------------------------------
  // 채널 전략 (🆕 Phase 1에서 추가)
  // ---------------------------------------------------------------------------

  /**
   * 채널별 적용 전략
   *
   * Shorts, Instagram, 상세페이지, 프레젠테이션 등
   */
  channel_strategy: ChannelStrategy;

  // ---------------------------------------------------------------------------
  // 가드레일 (🆕 Phase 1에서 추가)
  // ---------------------------------------------------------------------------

  /**
   * 가드레일 (필수 준수 사항)
   *
   * 피해야 할 표현, 반드시 포함할 메시지
   */
  guardrails: Guardrails;

  // ---------------------------------------------------------------------------
  // 기존 호환 필드 (ConceptAgent v1.0과 호환)
  // ---------------------------------------------------------------------------

  /**
   * 타겟 고객
   *
   * @example "20-30대 직장인 (특히 야근/회식 잦은 이들)"
   */
  target_audience: string;

  /**
   * 톤앤매너
   *
   * @example "공감+위로, 실용적이되 따뜻한"
   */
  tone_and_manner: string;

  /**
   * 연관 키워드
   *
   * @example ["퇴근", "루틴", "단백질", "편한", "속"]
   */
  keywords: string[];

  // ---------------------------------------------------------------------------
  // 메타데이터
  // ---------------------------------------------------------------------------

  /**
   * 컨셉 메타데이터
   *
   * 브랜드 ID, 프로젝트 ID, 생성 정보, 상태 등
   */
  meta: ConceptMeta;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * ConceptV1 생성 API 응답
 *
 * POST /api/v1/concepts/from-prompt 응답 타입
 */
export interface ConceptV1Response {
  /**
   * 생성된 컨셉 목록 (보통 3개)
   */
  concepts: ConceptV1[];

  /**
   * 컨셉 도출 근거
   *
   * ConceptAgent가 왜 이 3가지 컨셉을 선택했는지 설명
   *
   * @example "3가지 서로 다른 시간대/상황별 컨셉을 생성했습니다..."
   */
  reasoning: string;
}

/**
 * ConceptV1 생성 API 요청
 *
 * POST /api/v1/concepts/from-prompt 요청 타입
 */
export interface ConceptV1Request {
  /**
   * 사용자 프롬프트
   *
   * @example "단백질 스낵을 홍보하고 싶어요"
   */
  prompt: string;

  /**
   * 생성할 컨셉 수 (1-5)
   *
   * @default 3
   */
  concept_count?: number;

  /**
   * 브랜드 컨텍스트 (선택)
   *
   * @example "Sparklio AI - 마케팅 자동화 플랫폼"
   */
  brand_context?: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * 컨셉 상태
 */
export type ConceptStatus = 'draft' | 'active' | 'archived';

/**
 * 캠페인 모드
 */
export type CampaignMode = 'launch_campaign' | 'evergreen' | 'seasonal';

/**
 * 부분 컨셉 (편집용)
 *
 * UI에서 컨셉을 부분적으로 수정할 때 사용
 */
export type PartialConceptV1 = Partial<ConceptV1>;

/**
 * 컨셉 생성 옵션
 */
export interface ConceptGenerateOptions {
  /**
   * Mock 모드 사용 여부
   *
   * - true: Mock 데이터 사용 (Backend 불필요)
   * - false: 실제 API 호출 (Backend 필요)
   *
   * @default true (Phase 1에서는 Mock 사용)
   */
  useMock?: boolean;

  /**
   * 타임아웃 (ms)
   *
   * @default 30000 (30초)
   */
  timeout?: number;
}
