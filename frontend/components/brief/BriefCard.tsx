/**
 * Brief Card
 *
 * 브리프 정보 표시 카드
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 3.2
 */

'use client';

import { Edit2, Target, Users, Lightbulb, MessageSquare, Calendar, DollarSign } from 'lucide-react';
import type { Brief, ChannelType } from '@/types/brief';

// ============================================================================
// Types
// ============================================================================

export interface BriefCardProps {
  /** 브리프 데이터 */
  brief: Brief;

  /** 편집 핸들러 (선택) */
  onEdit?: () => void;

  /** 클래스명 (선택) */
  className?: string;

  /** 편집 버튼 표시 여부 */
  showEditButton?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_LABELS: Record<ChannelType, string> = {
  product_detail: '상세 페이지',
  sns: 'SNS',
  banner: '배너',
  deck: '발표 자료',
  video: '영상',
};

const CHANNEL_COLORS: Record<ChannelType, string> = {
  product_detail: 'bg-blue-100 text-blue-700',
  sns: 'bg-pink-100 text-pink-700',
  banner: 'bg-yellow-100 text-yellow-700',
  deck: 'bg-green-100 text-green-700',
  video: 'bg-purple-100 text-purple-700',
};

// ============================================================================
// Component
// ============================================================================

export function BriefCard({
  brief,
  onEdit,
  className = '',
  showEditButton = true,
}: BriefCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">캠페인 브리프</h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(brief.createdAt).toLocaleDateString('ko-KR')} 생성
          </p>
        </div>
        {showEditButton && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            편집
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Goal */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900">캠페인 목표</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed bg-purple-50 p-4 rounded-lg">
            {brief.goal}
          </p>
        </div>

        {/* Target Audience */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">타겟 고객</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed bg-indigo-50 p-4 rounded-lg">
            {brief.target}
          </p>
        </div>

        {/* Insight */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-semibold text-gray-900">핵심 인사이트</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed bg-yellow-50 p-4 rounded-lg">
            {brief.insight}
          </p>
        </div>

        {/* Key Messages */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-semibold text-gray-900">주요 메시지</h3>
          </div>
          <ul className="space-y-2">
            {brief.keyMessages.map((message, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700 bg-pink-50 p-3 rounded-lg"
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-pink-200 text-pink-700 rounded-full text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span className="flex-1">{message}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Channels */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">채널</h3>
          <div className="flex flex-wrap gap-2">
            {brief.channels.map((channel) => (
              <span
                key={channel}
                className={`px-3 py-1 rounded-full text-sm font-medium ${CHANNEL_COLORS[channel]}`}
              >
                {CHANNEL_LABELS[channel]}
              </span>
            ))}
          </div>
        </div>

        {/* Budget & Dates */}
        {(brief.budget || brief.startDate || brief.endDate) && (
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {brief.budget && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <h4 className="text-xs font-semibold text-gray-700">예산</h4>
                </div>
                <p className="text-sm text-gray-900 font-medium">
                  {brief.budget.toLocaleString('ko-KR')} 원
                </p>
              </div>
            )}
            {brief.startDate && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <h4 className="text-xs font-semibold text-gray-700">시작일</h4>
                </div>
                <p className="text-sm text-gray-900">
                  {new Date(brief.startDate).toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}
            {brief.endDate && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <h4 className="text-xs font-semibold text-gray-700">종료일</h4>
                </div>
                <p className="text-sm text-gray-900">
                  {new Date(brief.endDate).toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* KPIs */}
        {brief.kpis.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">성과 지표 (KPI)</h3>
            <div className="flex flex-wrap gap-2">
              {brief.kpis.map((kpi, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {kpi}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {brief.notes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">추가 메모</h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {brief.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
