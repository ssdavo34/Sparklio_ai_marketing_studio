/**
 * Strategist Strategy View
 *
 * StrategistAgent의 campaign_strategy 결과를 시각화하는 읽기 전용 뷰어
 *
 * 구성:
 * - 상단: Core Message + Big Idea 카드
 * - 중간: Strategic Pillars (좌) + Channel Strategy (우)
 * - 하단: Funnel Structure (3단 컬럼)
 * - 우측/하단: Risk Factors + Success Metrics
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

'use client';

import { useMemo } from 'react';
import type {
  CampaignStrategyOutputV1,
  ChannelStrategy,
  RiskFactor,
} from '../types/strategist';
import {
  groupChannelsByRole,
  groupRisksBySeverity,
  sortMetricsByImportance,
} from '../types/strategist';
import { Target, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface StrategistStrategyViewProps {
  /** 캠페인 전략 데이터 */
  strategy: CampaignStrategyOutputV1;

  /** 편집 가능 여부 (v2에서 구현 예정) */
  editable?: boolean;

  /** 액션 핸들러 (v2에서 구현 예정) */
  onAction?: (action: string, data?: any) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function StrategistStrategyView({
  strategy,
  editable = false,
  onAction,
}: StrategistStrategyViewProps) {
  // 채널 전략을 역할별로 그룹화
  const channelsByRole = useMemo(
    () => groupChannelsByRole(strategy.channel_strategy),
    [strategy.channel_strategy]
  );

  // 위험 요소를 심각도별로 그룹화
  const risksBySeverity = useMemo(
    () => groupRisksBySeverity(strategy.risk_factors),
    [strategy.risk_factors]
  );

  // 성공 지표를 중요도순으로 정렬
  const sortedMetrics = useMemo(
    () => sortMetricsByImportance(strategy.success_metrics),
    [strategy.success_metrics]
  );

  return (
    <div className="space-y-6">
      {/* 상단: 핵심 카드 2개 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CoreMessageCard message={strategy.core_message} positioning={strategy.positioning} />
        <BigIdeaCard idea={strategy.big_idea} />
      </div>

      {/* 타겟 인사이트 */}
      {strategy.target_insights.length > 0 && (
        <TargetInsightsSection insights={strategy.target_insights} />
      )}

      {/* 중간: Strategic Pillars + Channel Strategy */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StrategicPillarsSection pillars={strategy.strategic_pillars} />
        <ChannelStrategySection channelsByRole={channelsByRole} />
      </div>

      {/* 하단: Funnel Structure */}
      <FunnelStructureSection funnel={strategy.funnel_structure} />

      {/* 위험 요소 + 성공 지표 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RiskFactorsSection risksBySeverity={risksBySeverity} />
        <SuccessMetricsSection metrics={sortedMetrics} />
      </div>

      {/* 액션 버튼 (v2에서 구현 예정) */}
      {editable && onAction && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onAction('regenerate_copy')}
            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            이 전략으로 카피 다시 생성
          </button>
          <button
            onClick={() => onAction('create_slides')}
            className="rounded bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600"
          >
            이 전략 기반 슬라이드 만들기
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Core Message Card
// ============================================================================

function CoreMessageCard({ message, positioning }: { message: string; positioning: string }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-blue-900">핵심 메시지</h3>
      </div>
      <p className="mb-4 text-base font-medium text-blue-900">{message}</p>
      <div className="rounded-md bg-white/60 p-3">
        <p className="text-xs font-medium text-blue-700">포지셔닝</p>
        <p className="mt-1 text-sm text-blue-900">{positioning}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Big Idea Card
// ============================================================================

function BigIdeaCard({ idea }: { idea: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-900">빅 아이디어</h3>
      </div>
      <p className="text-base font-medium text-amber-900">{idea}</p>
    </div>
  );
}

// ============================================================================
// Target Insights Section
// ============================================================================

function TargetInsightsSection({ insights }: { insights: any[] }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-neutral-800">타겟 인사이트</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase text-neutral-500">
              {insight.category}
            </p>
            <p className="mb-2 text-sm font-medium text-neutral-800">{insight.insight}</p>
            <p className="text-xs text-neutral-600">→ {insight.implication}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Strategic Pillars Section
// ============================================================================

function StrategicPillarsSection({ pillars }: { pillars: any[] }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-neutral-800">전략적 기둥</h3>
      <div className="space-y-4">
        {pillars.map((pillar, idx) => (
          <div key={idx} className="rounded-md border-l-4 border-green-500 bg-green-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-green-900">{pillar.name}</h4>
            <p className="mb-3 text-sm text-green-800">{pillar.description}</p>
            {pillar.proof_points.length > 0 && (
              <ul className="space-y-1">
                {pillar.proof_points.map((point: string, pointIdx: number) => (
                  <li key={pointIdx} className="flex items-start gap-2 text-xs text-green-700">
                    <span className="mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Channel Strategy Section
// ============================================================================

function ChannelStrategySection({ channelsByRole }: { channelsByRole: Record<string, ChannelStrategy[]> }) {
  const roleLabels: Record<string, string> = {
    awareness: '인지',
    consideration: '고려',
    conversion: '전환',
    retention: '유지',
  };

  const roleColors: Record<string, { bg: string; border: string; text: string }> = {
    awareness: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
    consideration: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
    conversion: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
    retention: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-neutral-800">채널 전략</h3>
      <div className="space-y-4">
        {Object.entries(channelsByRole).map(([role, channels]) => {
          const colors = roleColors[role] || roleColors.awareness;
          return (
            <div key={role}>
              <h4 className="mb-2 text-xs font-semibold uppercase text-neutral-500">
                {roleLabels[role] || role}
              </h4>
              <div className="space-y-2">
                {channels.map((channel, idx) => (
                  <div
                    key={idx}
                    className={`rounded-md border ${colors.border} ${colors.bg} p-3`}
                  >
                    <p className={`mb-1 text-sm font-semibold ${colors.text}`}>
                      {channel.channel}
                    </p>
                    <p className="mb-2 text-xs text-neutral-700">{channel.message_angle}</p>
                    <p className="text-xs text-neutral-600">
                      <span className="font-medium">핵심 지표:</span> {channel.kpi}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Funnel Structure Section
// ============================================================================

function FunnelStructureSection({ funnel }: { funnel: any }) {
  const stages = [
    { key: 'awareness', label: '인지 단계', color: 'bg-blue-500', data: funnel.awareness },
    { key: 'consideration', label: '고려 단계', color: 'bg-purple-500', data: funnel.consideration },
    { key: 'conversion', label: '전환 단계', color: 'bg-green-500', data: funnel.conversion },
  ];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-neutral-600" />
        <h3 className="text-sm font-semibold text-neutral-800">퍼널 구조</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stages.map((stage) => (
          <div key={stage.key} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className={`mb-3 inline-block rounded px-2 py-1 text-xs font-semibold text-white ${stage.color}`}>
              {stage.label}
            </div>
            <p className="mb-3 text-sm font-medium text-neutral-800">{stage.data.objective}</p>
            {stage.data.key_messages.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold text-neutral-600">핵심 메시지</p>
                <ul className="space-y-1">
                  {stage.data.key_messages.map((msg: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                      <span className="mt-0.5">•</span>
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stage.data.content_types.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-neutral-600">콘텐츠 타입</p>
                <div className="flex flex-wrap gap-1">
                  {stage.data.content_types.map((type: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Risk Factors Section
// ============================================================================

function RiskFactorsSection({ risksBySeverity }: { risksBySeverity: Record<string, RiskFactor[]> }) {
  const severityLabels: Record<string, string> = {
    high: '높음',
    medium: '중간',
    low: '낮음',
  };

  const severityColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    high: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: 'text-red-500' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', icon: 'text-yellow-500' },
    low: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', icon: 'text-blue-500' },
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="text-sm font-semibold text-neutral-800">위험 요소</h3>
      </div>
      <div className="space-y-3">
        {Object.entries(risksBySeverity).map(([severity, risks]) => {
          const colors = severityColors[severity] || severityColors.medium;
          return (
            <div key={severity}>
              <h4 className="mb-2 text-xs font-semibold uppercase text-neutral-500">
                {severityLabels[severity] || severity}
              </h4>
              <div className="space-y-2">
                {risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className={`rounded-md border ${colors.border} ${colors.bg} p-3`}
                  >
                    <p className={`mb-2 text-sm font-medium ${colors.text}`}>{risk.risk}</p>
                    <p className="text-xs text-neutral-700">
                      <span className="font-semibold">완화 전략:</span> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Success Metrics Section
// ============================================================================

function SuccessMetricsSection({ metrics }: { metrics: any[] }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <h3 className="text-sm font-semibold text-neutral-800">성공 지표</h3>
      </div>
      <div className="space-y-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="rounded-md border border-green-200 bg-green-50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-semibold text-green-900">{metric.metric}</p>
              {metric.importance !== undefined && (
                <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800">
                  중요도 {Math.round(metric.importance * 100)}%
                </span>
              )}
            </div>
            <p className="mb-2 text-sm text-green-800">
              <span className="font-medium">목표:</span> {metric.target}
            </p>
            <p className="text-xs text-green-700">
              <span className="font-medium">측정:</span> {metric.measurement}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
