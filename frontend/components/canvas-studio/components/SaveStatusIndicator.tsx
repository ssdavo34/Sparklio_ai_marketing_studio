/**
 * Save Status Indicator
 *
 * 문서 저장 상태 표시 컴포넌트
 * - 저장 중, 저장됨, 에러 상태
 * - 마지막 저장 시간
 * - 수동 저장 버튼
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-28
 */

'use client';

import React from 'react';
import { Loader2, Check, AlertCircle, Cloud } from 'lucide-react';
import type { SaveStatus } from '../stores/useEditorStore';

// ============================================================================
// Types
// ============================================================================

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  isDirty: boolean;
  lastError: Error | null;
  onManualSave?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SaveStatusIndicator({
  status,
  lastSaved,
  isDirty,
  lastError,
  onManualSave,
  className = '',
}: SaveStatusIndicatorProps) {
  /**
   * 상태별 UI 정보
   */
  const getStatusInfo = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />,
          text: '저장 중...',
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
        };
      case 'saved':
        return {
          icon: <Check className="w-4 h-4 text-green-600" />,
          text: '저장됨',
          color: 'text-green-600',
          bg: 'bg-green-50',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          text: '저장 실패',
          color: 'text-red-600',
          bg: 'bg-red-50',
        };
      default:
        if (isDirty) {
          return {
            icon: <Cloud className="w-4 h-4 text-amber-600" />,
            text: '저장 안됨',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          };
        }
        return {
          icon: <Cloud className="w-4 h-4 text-gray-400" />,
          text: '동기화됨',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
        };
    }
  };

  /**
   * 마지막 저장 시간 포맷
   */
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    return `${Math.floor(seconds / 86400)}일 전`;
  };

  const info = getStatusInfo();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${info.bg}`}>
        {info.icon}
        <span className={`text-sm font-medium ${info.color}`}>{info.text}</span>
        {lastSaved && status === 'idle' && (
          <span className="text-xs text-gray-500 ml-1">
            ({formatLastSaved(lastSaved)})
          </span>
        )}
      </div>

      {/* Manual Save Button */}
      {onManualSave && status !== 'saving' && (
        <button
          onClick={onManualSave}
          disabled={!isDirty}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="수동 저장 (Ctrl+S)"
        >
          저장
        </button>
      )}

      {/* Error Message */}
      {status === 'error' && lastError && onManualSave && (
        <button
          onClick={onManualSave}
          className="text-xs text-red-600 underline hover:text-red-700"
          title={lastError.message}
        >
          재시도
        </button>
      )}
    </div>
  );
}
