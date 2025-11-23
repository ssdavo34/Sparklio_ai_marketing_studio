/**
 * Strategist Agent Types
 *
 * StrategistAgent의 campaign_strategy 출력 스키마
 * - 캠페인 전략 요약
 * - 타겟 인사이트
 * - 전략적 기둥 (Strategic Pillars)
 * - 채널 전략
 * - 퍼널 구조
 * - 위험 요소 및 성공 지표
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

// ============================================================================
// Core Strategy Types
// ============================================================================

export interface CampaignStrategyOutputV1 {
  /** 스키마 버전 */
  schema_version: '1.0';

  /** 메타데이터 */
  meta?: {
    generated_at?: string;
    model?: string;
    agent_name?: string;
  };

  /** 핵심 메시지 */
  core_message: string;

  /** 포지셔닝 */
  positioning: string;

  /** 빅 아이디어 */
  big_idea: string;

  /** 타겟 인사이트 */
  target_insights: TargetInsight[];

  /** 전략적 기둥 */
  strategic_pillars: StrategicPillar[];

  /** 채널 전략 */
  channel_strategy: ChannelStrategy[];

  /** 퍼널 구조 */
  funnel_structure: FunnelStructure;

  /** 위험 요소 */
  risk_factors: RiskFactor[];

  /** 성공 지표 */
  success_metrics: SuccessMetric[];
}

// ============================================================================
// Target Insights
// ============================================================================

export interface TargetInsight {
  /** 인사이트 카테고리 (예: demographic, psychographic, behavioral) */
  category: string;

  /** 인사이트 설명 */
  insight: string;

  /** 전략적 시사점 */
  implication: string;
}

// ============================================================================
// Strategic Pillars
// ============================================================================

export interface StrategicPillar {
  /** 기둥 이름 */
  name: string;

  /** 설명 */
  description: string;

  /** 증거/근거 포인트 */
  proof_points: string[];
}

// ============================================================================
// Channel Strategy
// ============================================================================

export interface ChannelStrategy {
  /** 채널 이름 (예: Facebook, Instagram, Google Ads) */
  channel: string;

  /** 채널 역할 (예: awareness, consideration, conversion) */
  role: 'awareness' | 'consideration' | 'conversion' | 'retention';

  /** 메시지 앵글 */
  message_angle: string;

  /** 핵심 KPI */
  kpi: string;

  /** 예산 배분 (선택적, 0.0-1.0) */
  budget_allocation?: number;
}

// ============================================================================
// Funnel Structure
// ============================================================================

export interface FunnelStructure {
  /** 인지 단계 */
  awareness: FunnelStage;

  /** 고려 단계 */
  consideration: FunnelStage;

  /** 전환 단계 */
  conversion: FunnelStage;
}

export interface FunnelStage {
  /** 단계 목표 */
  objective: string;

  /** 핵심 메시지 */
  key_messages: string[];

  /** 추천 콘텐츠 타입 */
  content_types: string[];

  /** 예상 전환율 (선택적) */
  expected_conversion_rate?: string;
}

// ============================================================================
// Risk Factors
// ============================================================================

export interface RiskFactor {
  /** 위험 요소 설명 */
  risk: string;

  /** 심각도 (low, medium, high) */
  severity: 'low' | 'medium' | 'high';

  /** 완화 전략 */
  mitigation: string;
}

// ============================================================================
// Success Metrics
// ============================================================================

export interface SuccessMetric {
  /** 지표 이름 */
  metric: string;

  /** 목표 값 */
  target: string;

  /** 측정 방법 */
  measurement: string;

  /** 중요도 (선택적, 0.0-1.0) */
  importance?: number;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * CampaignStrategyOutputV1 타입 가드
 */
export function isCampaignStrategyOutput(
  payload: unknown
): payload is CampaignStrategyOutputV1 {
  if (!payload || typeof payload !== 'object') return false;

  const obj = payload as any;

  // Required fields check
  return (
    obj.schema_version === '1.0' &&
    typeof obj.core_message === 'string' &&
    typeof obj.positioning === 'string' &&
    typeof obj.big_idea === 'string' &&
    Array.isArray(obj.target_insights) &&
    Array.isArray(obj.strategic_pillars) &&
    Array.isArray(obj.channel_strategy) &&
    obj.funnel_structure &&
    typeof obj.funnel_structure === 'object' &&
    Array.isArray(obj.risk_factors) &&
    Array.isArray(obj.success_metrics)
  );
}

/**
 * TargetInsight 타입 가드
 */
export function isTargetInsight(obj: unknown): obj is TargetInsight {
  if (!obj || typeof obj !== 'object') return false;
  const insight = obj as any;
  return (
    typeof insight.category === 'string' &&
    typeof insight.insight === 'string' &&
    typeof insight.implication === 'string'
  );
}

/**
 * StrategicPillar 타입 가드
 */
export function isStrategicPillar(obj: unknown): obj is StrategicPillar {
  if (!obj || typeof obj !== 'object') return false;
  const pillar = obj as any;
  return (
    typeof pillar.name === 'string' &&
    typeof pillar.description === 'string' &&
    Array.isArray(pillar.proof_points)
  );
}

/**
 * ChannelStrategy 타입 가드
 */
export function isChannelStrategy(obj: unknown): obj is ChannelStrategy {
  if (!obj || typeof obj !== 'object') return false;
  const channel = obj as any;
  return (
    typeof channel.channel === 'string' &&
    typeof channel.role === 'string' &&
    ['awareness', 'consideration', 'conversion', 'retention'].includes(channel.role) &&
    typeof channel.message_angle === 'string' &&
    typeof channel.kpi === 'string'
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 채널 전략을 역할별로 그룹화
 */
export function groupChannelsByRole(
  channels: ChannelStrategy[]
): Record<string, ChannelStrategy[]> {
  return channels.reduce((acc, channel) => {
    const role = channel.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(channel);
    return acc;
  }, {} as Record<string, ChannelStrategy[]>);
}

/**
 * 위험 요소를 심각도별로 그룹화
 */
export function groupRisksBySeverity(
  risks: RiskFactor[]
): Record<string, RiskFactor[]> {
  return risks.reduce((acc, risk) => {
    const severity = risk.severity;
    if (!acc[severity]) {
      acc[severity] = [];
    }
    acc[severity].push(risk);
    return acc;
  }, {} as Record<string, RiskFactor[]>);
}

/**
 * 성공 지표를 중요도순으로 정렬
 */
export function sortMetricsByImportance(
  metrics: SuccessMetric[]
): SuccessMetric[] {
  return [...metrics].sort((a, b) => {
    const importanceA = a.importance ?? 0.5;
    const importanceB = b.importance ?? 0.5;
    return importanceB - importanceA;
  });
}

/**
 * 전략 요약 텍스트 생성 (프리뷰용)
 */
export function generateStrategySummary(
  strategy: CampaignStrategyOutputV1
): string {
  return `${strategy.core_message}\n\n포지셔닝: ${strategy.positioning}\n\n빅 아이디어: ${strategy.big_idea}`;
}
