/**
 * Brief Validation Indicator
 *
 * 브리프 완성도 및 유효성 표시 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 3.3
 */

'use client';

import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import type { BriefValidation } from '@/types/brief';

// ============================================================================
// Types
// ============================================================================

export interface BriefValidationIndicatorProps {
  /** 유효성 검사 결과 */
  validation: BriefValidation;

  /** 클래스명 (선택) */
  className?: string;

  /** 간단한 모드 (완성도만 표시) */
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function BriefValidationIndicator({
  validation,
  className = '',
  compact = false,
}: BriefValidationIndicatorProps) {
  const { isValid, completeness, missingRequired, missingRecommended } = validation;

  // 완성도 색상 결정
  const getCompletenessColor = () => {
    if (completeness >= 80) return 'text-green-600 bg-green-100';
    if (completeness >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressColor = () => {
    if (completeness >= 80) return 'bg-green-600';
    if (completeness >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  // Compact 모드
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - completeness / 100)}`}
              className={getProgressColor()}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">{completeness}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">완성도</p>
          <p className="text-xs text-gray-500">
            {isValid ? '필수 항목 완료' : `필수 ${missingRequired.length}개 누락`}
          </p>
        </div>
      </div>
    );
  }

  // Full 모드
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">브리프 완성도</h3>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getCompletenessColor()}`}
          >
            {completeness}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4">
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${getProgressColor()} transition-all duration-300 rounded-full`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      {/* Validation Status */}
      <div className="px-4 pb-4 space-y-3">
        {/* Valid Status */}
        {isValid ? (
          <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">필수 항목 완료</p>
              <p className="text-xs text-green-700 mt-1">
                모든 필수 항목이 입력되었습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                필수 항목 누락 ({missingRequired.length}개)
              </p>
              <ul className="mt-2 space-y-1">
                {missingRequired.map((field, index) => (
                  <li key={index} className="text-xs text-red-700">
                    • {getFieldLabel(field)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Recommended Fields */}
        {missingRecommended.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                권장 항목 ({missingRecommended.length}개)
              </p>
              <p className="text-xs text-blue-700 mt-1">
                다음 항목을 추가하면 더 완성도 높은 브리프가 됩니다:
              </p>
              <ul className="mt-2 space-y-1">
                {missingRecommended.map((field, index) => (
                  <li key={index} className="text-xs text-blue-700">
                    • {getFieldLabel(field)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    goal: '캠페인 목표',
    target: '타겟 고객',
    insight: '핵심 인사이트',
    keyMessages: '주요 메시지',
    channels: '채널 선택',
    budget: '예산',
    startDate: '시작일',
    endDate: '종료일',
    kpis: '성과 지표 (KPI)',
    notes: '추가 메모',
  };

  return labels[field] || field;
}
