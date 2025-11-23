/**
 * Strategist Mock Data
 *
 * StrategistAgent 결과를 테스트하기 위한 Mock 데이터
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

import type { CampaignStrategyOutputV1 } from '../types/strategist';

export const mockCampaignStrategy: CampaignStrategyOutputV1 = {
  schema_version: '1.0',

  meta: {
    generated_at: '2025-11-23T10:30:00Z',
    model: 'claude-sonnet-3.5',
    agent_name: 'StrategistAgent',
  },

  core_message: '프리미엄 스킨케어로 매일 빛나는 당신의 피부를 완성하세요',

  positioning: '과학적으로 검증된 성분과 럭셔리한 경험을 동시에 제공하는 프리미엄 K-뷰티 브랜드',

  big_idea: '당신의 피부에 투자하는 시간이 곧 당신의 미래를 빛나게 합니다',

  target_insights: [
    {
      category: 'Demographic',
      insight: '25-40세 여성, 중상위 소득층, 대도시 거주',
      implication: '프리미엄 가격대 정당화 및 온라인 채널 중심 마케팅',
    },
    {
      category: 'Psychographic',
      insight: '자기 관리와 웰빙에 높은 가치를 두며, 성분과 효과를 꼼꼼히 확인하는 성향',
      implication: '과학적 근거와 투명한 성분 공개를 핵심 메시지로 활용',
    },
    {
      category: 'Behavioral',
      insight: 'SNS와 뷰티 커뮤니티에서 제품 리뷰와 추천을 적극 탐색',
      implication: '인플루언서 마케팅과 UGC(사용자 생성 콘텐츠) 전략 강화',
    },
  ],

  strategic_pillars: [
    {
      name: '과학적 신뢰성',
      description: '피부과 전문의와 공동 개발, 임상 테스트 완료, 안전성 입증',
      proof_points: [
        '서울대 피부과 연구소와 2년간 공동 연구',
        '100명 대상 8주 임상 시험에서 피부 탄력 38% 개선',
        'FDA 승인 성분만 사용, 20가지 유해 성분 무첨가',
      ],
    },
    {
      name: '프리미엄 경험',
      description: '고급스러운 패키징, 섬세한 텍스처, 은은한 향으로 럭셔리 경험 제공',
      proof_points: [
        '이탈리아 디자인 스튜디오와 협업한 미니멀 패키징',
        '프랑스 그라스 지역의 천연 에센셜 오일 사용',
        '5성급 호텔 스파에서 사용되는 프리미엄 제형',
      ],
    },
    {
      name: '지속 가능성',
      description: '환경을 생각하는 착한 소비, 동물 실험 반대, 친환경 포장재',
      proof_points: [
        '비건 인증 (Vegan Society 공식 인증)',
        '재활용 가능한 유리 용기 및 재생 종이 박스',
        '판매 수익의 1%를 해양 보호 단체에 기부',
      ],
    },
  ],

  channel_strategy: [
    {
      channel: 'Instagram',
      role: 'awareness',
      message_angle: '일상 속 럭셔리 뷰티 루틴, Before/After 비포애프터 컨텐츠',
      kpi: '도달 100만, 참여율 5% 이상',
      budget_allocation: 0.3,
    },
    {
      channel: 'YouTube',
      role: 'consideration',
      message_angle: '성분 분석, 피부과 전문의 인터뷰, 사용 후기',
      kpi: '조회수 50만, 평균 시청 시간 3분 이상',
      budget_allocation: 0.25,
    },
    {
      channel: 'Naver Shopping Live',
      role: 'conversion',
      message_angle: '실시간 Q&A, 한정 특가 프로모션',
      kpi: '전환율 8%, 평균 객단가 12만원 이상',
      budget_allocation: 0.2,
    },
    {
      channel: 'Email Marketing',
      role: 'retention',
      message_angle: '개인화된 스킨케어 팁, VIP 고객 전용 혜택',
      kpi: '오픈율 25%, 재구매율 40%',
      budget_allocation: 0.1,
    },
    {
      channel: 'Kakao Channel',
      role: 'retention',
      message_angle: '1:1 피부 상담, 정기 구독 서비스 안내',
      kpi: '친구 추가 3만명, 구독 전환율 15%',
      budget_allocation: 0.15,
    },
  ],

  funnel_structure: {
    awareness: {
      objective: '프리미엄 K-뷰티 브랜드로서의 인지도 확보',
      key_messages: [
        '과학적으로 검증된 프리미엄 스킨케어',
        '피부과 전문의가 추천하는 안전한 성분',
        '럭셔리한 일상 뷰티 경험',
      ],
      content_types: [
        'Instagram Reels',
        'YouTube Shorts',
        '인플루언서 협업',
        '브랜드 스토리 영상',
      ],
      expected_conversion_rate: '3-5% (인지 → 고려)',
    },
    consideration: {
      objective: '제품의 차별점과 효능을 구체적으로 전달',
      key_messages: [
        '8주 임상에서 입증된 피부 개선 효과',
        '프리미엄 성분과 친환경 가치',
        '실제 사용자들의 진솔한 후기',
      ],
      content_types: [
        '성분 분석 콘텐츠',
        '피부과 전문의 인터뷰',
        '사용자 후기 영상',
        '비교 인포그래픽',
      ],
      expected_conversion_rate: '15-20% (고려 → 전환)',
    },
    conversion: {
      objective: '첫 구매 유도 및 장벽 제거',
      key_messages: [
        '지금 구매하면 30% 할인',
        '30일 환불 보장 정책',
        '첫 구매 고객 무료 배송',
      ],
      content_types: [
        '라이브 커머스',
        '한정 프로모션',
        '리타게팅 광고',
        '장바구니 이탈 방지 이메일',
      ],
      expected_conversion_rate: '8-12% (구매 전환율)',
    },
  },

  risk_factors: [
    {
      risk: '경쟁사 대비 높은 가격대로 인한 진입 장벽',
      severity: 'high',
      mitigation: '성분 투명성과 임상 결과를 강조하여 가격 정당성 확보, 첫 구매 할인 및 샘플 증정 프로그램 운영',
    },
    {
      risk: 'K-뷰티 시장 포화로 인한 차별화 어려움',
      severity: 'medium',
      mitigation: '과학적 근거와 지속 가능성이라는 두 가지 차별점을 일관되게 메시지화, 피부과 전문의 추천 활용',
    },
    {
      risk: '신규 브랜드로서의 낮은 인지도',
      severity: 'medium',
      mitigation: 'Top-tier 뷰티 인플루언서와 독점 파트너십, 주요 뷰티 미디어 PR 집중 공략',
    },
    {
      risk: '온라인 전용 채널 전략의 체험 한계',
      severity: 'low',
      mitigation: '팝업 스토어 운영, 유명 백화점 및 올리브영과 제휴를 통한 샘플 배포',
    },
  ],

  success_metrics: [
    {
      metric: '브랜드 인지도',
      target: '타겟 고객층 30% 이상 브랜드 인지',
      measurement: '분기별 브랜드 인지도 조사 (외부 리서치 기관)',
      importance: 0.9,
    },
    {
      metric: '첫 구매 전환율',
      target: '웹사이트 방문자 대비 8% 이상 전환',
      measurement: 'Google Analytics 및 자체 CRM 데이터',
      importance: 1.0,
    },
    {
      metric: '고객 재구매율',
      target: '첫 구매 후 6개월 내 40% 이상 재구매',
      measurement: '자체 CRM 및 구독 서비스 데이터',
      importance: 0.95,
    },
    {
      metric: 'SNS 참여율',
      target: 'Instagram 평균 참여율 5% 이상 유지',
      measurement: 'Instagram Insights 및 소셜 미디어 분석 툴',
      importance: 0.7,
    },
    {
      metric: '고객 만족도 (NPS)',
      target: 'Net Promoter Score 60 이상',
      measurement: '구매 후 30일 이내 이메일 설문',
      importance: 0.85,
    },
    {
      metric: '평균 객단가',
      target: '12만원 이상',
      measurement: '월별 매출 데이터 분석',
      importance: 0.8,
    },
  ],
};
