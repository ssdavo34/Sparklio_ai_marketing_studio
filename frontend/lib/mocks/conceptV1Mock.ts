/**
 * ConceptV1 Mock Data
 *
 * Backend API 없이 UI 개발을 위한 Mock 데이터
 *
 * 작성일: 2025-11-27
 * 작성팀: C팀 (Frontend)
 * 참조: CONCEPT_SPEC.md
 *
 * 사용 방법:
 * ```typescript
 * import { mockConceptV1Response } from '@/lib/mocks/conceptV1Mock';
 *
 * // Hook에서 사용
 * const { generateConcepts } = useConceptGenerate({ useMock: true });
 * const result = await generateConcepts("단백질 스낵 홍보");
 * // → mockConceptV1Response 반환
 * ```
 */

import type { ConceptV1, ConceptV1Response } from '@/types/concept';

// =============================================================================
// Concept 1: 퇴근길 속 편한 단백질 루틴 (감성적 접근)
// =============================================================================

export const mockConceptV1_1: ConceptV1 = {
  // 기본 정보
  id: 'CONCEPT_abc123',
  version: 1,
  name: '퇴근길 속 편한 단백질 루틴',
  topic: '단백질 스낵',
  mode: 'launch_campaign',

  // 전략 핵심
  audience_insight:
    '퇴근길에 허기져서 자꾸 편의점 과자를 사게 되는데, 내일 아침 속이 불편하고 후회가 밀려온다.',
  core_promise: '배는 차게, 속은 편하게 채워주는 단백질 루틴',
  brand_role: '나를 챙겨주는 "퇴근 후 루틴" 가이드',

  // 근거
  reason_to_believe: [
    '당 5g 이하, 단백질 15g 이상',
    '위에 부담을 줄이는 원료 조합',
    '1,000명 이상의 직장인 후기 평점 4.8/5.0',
    '소화 효소 첨가로 속 편함 입증',
  ],

  // 크리에이티브
  creative_device: '하루의 "마침표"를 찍는 작은 의식',
  hook_patterns: [
    '오늘도 무사히 버틴 당신에게',
    '퇴근 후 딱 5분, 내 몸을 위해 쓰자',
    '내일 아침을 위한 밤 9시 루틴',
  ],

  // 비주얼
  visual_world: {
    color_palette: '밤+네온 (퇴근길 도시 조명)',
    photo_style: '실내 조명 아래 책상/소파 컷, 릴렉스한 분위기',
    layout_motifs: ['루틴 체크리스트', 'ONE DAY 타임라인', '시계 아이콘'],
    hex_colors: ['#1F2937', '#F59E0B', '#10B981', '#3B82F6'],
  },

  // 채널 전략
  channel_strategy: {
    shorts: '퇴근 → 집 도착 → 간식 먹기 → 편안한 표정 15초 내, ASMR 효과',
    instagram_news: '하루 루틴을 뉴스처럼 브리핑하는 톤 ("오늘의 루틴 리포트")',
    product_detail: '루틴 스토리 → 성분/근거 → 후기 → 구매 유도 순서',
    presentation: '직장인 Pain Point → 루틴 제안 → 성분 근거 → 후기 데이터',
  },

  // 가드레일
  guardrails: {
    avoid_claims: ['살 빠진다', '질병 치료', '즉각적인 효과', '다이어트 식품'],
    must_include: ['위에 부담 적음', '퇴근 후 루틴', '내일을 위한'],
  },

  // 기존 호환
  target_audience: '20-30대 직장인 (특히 야근/회식 잦은 이들)',
  tone_and_manner: '공감+위로, 실용적이되 따뜻한',
  keywords: ['퇴근', '루틴', '단백질', '편한', '속', '밤', '내일'],

  // 메타
  meta: {
    created_by: 'mock_generator',
    created_at: new Date().toISOString(),
    status: 'active',
  },
};

// =============================================================================
// Concept 2: 아침을 여는 단백질 시작 버튼 (이성적 접근)
// =============================================================================

export const mockConceptV1_2: ConceptV1 = {
  // 기본 정보
  id: 'CONCEPT_def456',
  version: 1,
  name: '아침을 여는 단백질 시작 버튼',
  topic: '단백질 스낵',
  mode: 'launch_campaign',

  // 전략 핵심
  audience_insight:
    '아침에 일어나면 에너지가 없고, 점심까지 버티기 힘들어서 업무 효율이 떨어진다.',
  core_promise: '아침 20g 단백질로 오전 에너지 80% 상승',
  brand_role: '아침 활력의 시작 버튼',

  // 근거
  reason_to_believe: [
    '임상 연구: 아침 단백질 20g 섭취 시 오전 업무 효율 78% 증가',
    '흡수 빠른 WPI(유청 단백질 분리) 사용',
    '30분 내 빠른 에너지 공급 확인',
    '당 3g 이하로 혈당 스파이크 방지',
  ],

  // 크리에이티브
  creative_device: '아침을 여는 "시작 버튼"을 누르는 의식',
  hook_patterns: [
    '아침 20g, 오전이 달라진다',
    '시작 버튼을 눌러보세요',
    '오전 활력 80% 충전 완료',
  ],

  // 비주얼
  visual_world: {
    color_palette: '아침+햇빛 (산뜻한 에너지)',
    photo_style: '자연광 아래 아침 풍경, 밝고 깨끗한 이미지',
    layout_motifs: ['시작 버튼 아이콘', '에너지 게이지', '시간 그래프'],
    hex_colors: ['#FBBF24', '#10B981', '#FFFFFF', '#3B82F6'],
  },

  // 채널 전략
  channel_strategy: {
    shorts: '알람 → 기상 → 단백질 섭취 → 활력 넘치는 모습 15초, 타임랩스 효과',
    instagram_news: '데이터 중심 브리핑 ("아침 단백질 연구 결과")',
    product_detail: '데이터/그래프 → 성분 설명 → 사용법 → 효과 타임라인',
    presentation: '문제 (오전 피로) → 솔루션 (단백질) → 데이터 → 제품',
  },

  // 가드레일
  guardrails: {
    avoid_claims: ['질병 치료', '100% 효과', '의학적 효능'],
    must_include: ['임상 연구 기반', '오전 활력', '빠른 흡수'],
  },

  // 기존 호환
  target_audience: '20-40대 직장인 (특히 아침 활력 필요한 이들)',
  tone_and_manner: '효율적, 데이터 중심, 신뢰감 있는',
  keywords: ['아침', '활력', '에너지', '효율', '데이터', '연구'],

  // 메타
  meta: {
    created_by: 'mock_generator',
    created_at: new Date().toISOString(),
    status: 'active',
  },
};

// =============================================================================
// Concept 3: 운동 효율 200% 단백질 부스터 (혁신적 접근)
// =============================================================================

export const mockConceptV1_3: ConceptV1 = {
  // 기본 정보
  id: 'CONCEPT_ghi789',
  version: 1,
  name: '운동 효율 200% 단백질 부스터',
  topic: '단백질 스낵',
  mode: 'launch_campaign',

  // 전략 핵심
  audience_insight:
    '헬스장 다니는데 근육이 잘 안 생기고, 운동 후에도 피곤해서 다음날 회복이 느리다.',
  core_promise: '운동 전후 단백질로 회복 속도 2배, 근육 합성 효율 상승',
  brand_role: '운동 효과를 극대화하는 "부스터"',

  // 근거
  reason_to_believe: [
    '운동 전후 단백질 섭취 시 근육 합성 효율 2배 증가 (스포츠 과학 연구)',
    'BCAA + 글루타민 추가로 회복 속도 향상',
    '운동 후 30분 골든타임 최적화',
    '프로 운동선수 300명 이상 사용 중',
  ],

  // 크리에이티브
  creative_device: '운동 효과를 "부스터"처럼 증폭시키는 개념',
  hook_patterns: [
    '운동 효율 200% 부스트',
    '30분 골든타임을 놓치지 마세요',
    '프로들이 선택한 단백질',
  ],

  // 비주얼
  visual_world: {
    color_palette: '스포츠+그라디언트 (역동적 에너지)',
    photo_style: '운동 중/운동 후 역동적인 컷, 땀과 에너지 느낌',
    layout_motifs: ['게이지 상승 그래프', '타이머', '근육 다이어그램'],
    hex_colors: ['#DC2626', '#3B82F6', '#10B981', '#1F2937'],
  },

  // 채널 전략
  channel_strategy: {
    shorts: '운동 중 → 단백질 섭취 → 근육 펌핑 → 만족스러운 표정 15초, 빠른 템포',
    instagram_news: '스포츠 과학 데이터 중심 ("운동 효율 업그레이드 가이드")',
    product_detail: '운동 Pain Point → 과학적 근거 → 성분 → 프로 추천',
    presentation: '운동 효율 문제 → 골든타임 개념 → 제품 솔루션 → 성과',
  },

  // 가드레일
  guardrails: {
    avoid_claims: ['근육 무조건 증가', '약물 대체', '의학적 효능'],
    must_include: ['과학적 연구 기반', '운동과 병행 필수', '개인차 있음'],
  },

  // 기존 호환
  target_audience: '20-30대 헬스/운동 애호가 (특히 근성장 목표)',
  tone_and_manner: '혁신적, 역동적, 데이터 기반',
  keywords: ['운동', '근육', '효율', '회복', '부스터', '골든타임'],

  // 메타
  meta: {
    created_by: 'mock_generator',
    created_at: new Date().toISOString(),
    status: 'active',
  },
};

// =============================================================================
// Combined Response
// =============================================================================

/**
 * Mock ConceptV1 Response (3개 컨셉)
 *
 * POST /api/v1/concepts/from-prompt 응답 Mock
 */
export const mockConceptV1Response: ConceptV1Response = {
  concepts: [mockConceptV1_1, mockConceptV1_2, mockConceptV1_3],
  reasoning: `3가지 서로 다른 접근 방식으로 컨셉을 생성했습니다:

1. **감성적 접근 (퇴근길 루틴)**: 직장인의 일상적 고민에 공감하며, 루틴이라는 프레임으로 편안함을 강조합니다. 타겟은 감성적 소비를 선호하는 20-30대 직장인입니다.

2. **이성적 접근 (아침 활력)**: 데이터와 연구 결과를 중심으로 효율성을 강조합니다. 타겟은 합리적 의사결정을 선호하는 직장인입니다.

3. **혁신적 접근 (운동 부스터)**: 운동 효과 극대화라는 새로운 관점으로, 단백질을 "부스터"로 포지셔닝합니다. 타겟은 적극적으로 운동하는 헬스 애호가입니다.

각 컨셉은 서로 다른 시간대(밤/아침/운동 시), 다른 니즈(편안함/효율/성과), 다른 톤앤매너(감성/이성/혁신)로 차별화되어 있습니다.`,
};

/**
 * 단일 컨셉 Mock (테스트용)
 */
export const mockSingleConceptV1: ConceptV1 = mockConceptV1_1;

/**
 * 빈 컨셉 템플릿 (새 컨셉 생성용)
 */
export const emptyConceptV1Template: Partial<ConceptV1> = {
  version: 1,
  mode: 'launch_campaign',
  reason_to_believe: [],
  hook_patterns: [],
  visual_world: {
    color_palette: '',
    photo_style: '',
    layout_motifs: [],
    hex_colors: [],
  },
  channel_strategy: {},
  guardrails: {
    avoid_claims: [],
    must_include: [],
  },
  keywords: [],
  meta: {
    created_by: 'user',
    created_at: new Date().toISOString(),
    status: 'draft',
  },
};
