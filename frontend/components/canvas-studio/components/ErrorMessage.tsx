/**
 * Error Message Component
 *
 * 사용자 친화적인 에러 메시지 표시 및 재시도 기능
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference TEAM_TODOS_2025-11-23.md P0-2
 */

'use client';

import React from 'react';
import { AlertCircle, RefreshCw, XCircle, AlertTriangle, Info } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ErrorType =
  | 'json_parsing_failed'
  | 'length_exceeded'
  | 'language_mixed'
  | 'forbidden_word'
  | 'network_error'
  | 'generation_failed'
  | 'unknown';

export interface ErrorMessageProps {
  /** 에러 타입 */
  type: ErrorType;
  /** 원본 에러 메시지 (개발자용) */
  originalMessage?: string;
  /** 사용자 정의 메시지 */
  customMessage?: string;
  /** 재시도 콜백 함수 */
  onRetry?: () => void;
  /** 에러 닫기 콜백 */
  onDismiss?: () => void;
  /** 재시도 버튼 표시 여부 */
  showRetry?: boolean;
  /** 자동 재시도 중 여부 */
  isRetrying?: boolean;
  /** 추가 세부사항 */
  details?: Record<string, any>;
}

// ============================================================================
// Error Message Definitions
// ============================================================================

interface ErrorDefinition {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  getMessage: (details?: Record<string, any>) => string;
  suggestion: string;
}

const ERROR_DEFINITIONS: Record<ErrorType, ErrorDefinition> = {
  json_parsing_failed: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: '카피 생성 오류',
    getMessage: () => '카피 생성 중 오류가 발생했습니다.',
    suggestion: '다시 시도해주세요. 문제가 계속되면 요청 내용을 간단하게 변경해보세요.',
  },
  length_exceeded: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: '길이 초과',
    getMessage: (details) => {
      const { field, current, max } = details || {};
      if (field && current && max) {
        const fieldName = {
          headline: '헤드라인',
          subheadline: '서브헤드라인',
          body: '본문',
        }[field] || field;
        return `${fieldName}이 너무 깁니다 (${current}/${max}자).`;
      }
      return '텍스트가 허용된 길이를 초과했습니다.';
    },
    suggestion: '자동으로 줄였습니다. 필요하면 직접 수정하거나 다시 생성해주세요.',
  },
  language_mixed: {
    icon: AlertCircle,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: '언어 혼입 감지',
    getMessage: () => '부적절한 언어가 감지되었습니다.',
    suggestion: '한국어로 다시 생성합니다.',
  },
  forbidden_word: {
    icon: Info,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: '표현 개선',
    getMessage: (details) => {
      const { word } = details || {};
      if (word) {
        return `일반적인 표현("${word}")이 사용되었습니다.`;
      }
      return '일반적인 표현이 사용되었습니다.';
    },
    suggestion: '더 구체적인 카피로 수정했습니다.',
  },
  network_error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: '네트워크 오류',
    getMessage: () => '서버와 연결할 수 없습니다.',
    suggestion: '인터넷 연결을 확인하고 다시 시도해주세요.',
  },
  generation_failed: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: '생성 실패',
    getMessage: () => 'AI 응답 생성에 실패했습니다.',
    suggestion: '다시 시도해주세요. 문제가 계속되면 잠시 후 다시 시도해보세요.',
  },
  unknown: {
    icon: AlertCircle,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: '오류 발생',
    getMessage: () => '알 수 없는 오류가 발생했습니다.',
    suggestion: '다시 시도해주세요.',
  },
};

// ============================================================================
// Component
// ============================================================================

export function ErrorMessage({
  type,
  originalMessage,
  customMessage,
  onRetry,
  onDismiss,
  showRetry = true,
  isRetrying = false,
  details,
}: ErrorMessageProps) {
  const definition = ERROR_DEFINITIONS[type] || ERROR_DEFINITIONS.unknown;
  const Icon = definition.icon;

  const userMessage = customMessage || definition.getMessage(details);

  return (
    <div
      className={`
        rounded-lg border p-4
        ${definition.bgColor}
        ${definition.borderColor}
        transition-all duration-300
        animate-in slide-in-from-top-2
      `}
      role="alert"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${definition.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {definition.title}
          </h3>

          {/* User Message */}
          <p className="text-sm text-gray-700 mb-2">
            {userMessage}
          </p>

          {/* Suggestion */}
          <p className="text-xs text-gray-600">
            {definition.suggestion}
          </p>

          {/* Developer Info (Development Only) */}
          {process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' && originalMessage && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                기술적 세부사항 (개발자용)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32">
                {originalMessage}
              </pre>
              {details && Object.keys(details).length > 0 && (
                <pre className="mt-1 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32">
                  {JSON.stringify(details, null, 2)}
                </pre>
              )}
            </details>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-start gap-2">
          {/* Retry Button */}
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className={`
                inline-flex items-center gap-1.5
                px-3 py-1.5
                text-xs font-medium
                rounded-md
                transition-colors
                ${
                  isRetrying
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }
              `}
              aria-label="다시 생성하기"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? '생성 중...' : '다시 생성'}
            </button>
          )}

          {/* Dismiss Button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper: Error Type 감지
// ============================================================================

/**
 * 원본 에러 메시지로부터 ErrorType을 자동 감지
 */
export function detectErrorType(error: Error | string): ErrorType {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  // JSON 파싱 에러
  if (
    lowerMessage.includes('json') ||
    lowerMessage.includes('parse') ||
    lowerMessage.includes('unexpected token')
  ) {
    return 'json_parsing_failed';
  }

  // 네트워크 에러
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout')
  ) {
    return 'network_error';
  }

  // 길이 초과
  if (lowerMessage.includes('length') || lowerMessage.includes('too long')) {
    return 'length_exceeded';
  }

  // 언어 혼입
  if (lowerMessage.includes('language') || lowerMessage.includes('korean')) {
    return 'language_mixed';
  }

  // 금지어
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('prohibited')) {
    return 'forbidden_word';
  }

  // 생성 실패
  if (lowerMessage.includes('generation') || lowerMessage.includes('generate')) {
    return 'generation_failed';
  }

  return 'unknown';
}

// ============================================================================
// Helper: 사용자 친화적 에러 메시지 생성
// ============================================================================

/**
 * 에러 객체를 받아서 사용자 친화적인 메시지 생성
 */
export function createUserFriendlyError(
  error: Error | string,
  context?: Record<string, any>
): {
  type: ErrorType;
  message: string;
  details?: Record<string, any>;
} {
  const type = detectErrorType(error);
  const definition = ERROR_DEFINITIONS[type];

  return {
    type,
    message: definition.getMessage(context),
    details: context,
  };
}
