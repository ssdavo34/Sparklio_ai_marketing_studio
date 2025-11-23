/**
 * AI Response Renderer
 *
 * AI 응답 타입을 자동 감지하여 적절한 뷰어로 렌더링
 * - ContentPlanPages → ContentPlanViewer
 * - AdCopy → AdCopyOutput
 * - Error → ErrorMessage
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference TEAM_TODOS_2025-11-23.md P1
 */

'use client';

import React, { useMemo } from 'react';
import { AlertCircle, FileText, Layout } from 'lucide-react';
import { detectResponseType, type DetectionResult } from '@/lib/utils/response-type-detector';
import { ContentPlanViewer } from './pages/ContentPlanViewer';
import { AdCopyOutput } from './AdCopyOutput';
import { ErrorMessage } from './ErrorMessage';
import type { ContentPlanPagesSchema } from '../types/content-plan';
import type { AdCopySimpleOutputV2 } from './AdCopyOutput';

// ============================================================================
// Types
// ============================================================================

export interface AIResponseRendererProps {
  /** AI 응답 데이터 (any 타입, 자동 감지) */
  response: any;

  /** 응답 ID (피드백/로깅용) */
  responseId?: string;

  /** 편집 가능 여부 */
  editable?: boolean;

  /** 피드백 표시 여부 */
  showFeedback?: boolean;

  /** 품질 점수 표시 여부 */
  showQualityScore?: boolean;

  /** 디버그 모드 (감지 정보 표시) */
  debug?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function AIResponseRenderer({
  response,
  responseId,
  editable = false,
  showFeedback = true,
  showQualityScore = false,
  debug = false,
}: AIResponseRendererProps) {
  // 응답 타입 자동 감지
  const detection: DetectionResult = useMemo(() => {
    const result = detectResponseType(response);

    if (debug) {
      console.group('[AIResponseRenderer] Detection');
      console.log('Type:', result.type);
      console.log('Confidence:', `${(result.confidence * 100).toFixed(1)}%`);
      console.log('Reason:', result.reason);
      console.log('Data:', result.data);
      console.groupEnd();
    }

    return result;
  }, [response, debug]);

  // 디버그 정보 표시
  if (debug) {
    return (
      <div className="space-y-4">
        <DetectionDebugInfo detection={detection} />
        {renderContent()}
      </div>
    );
  }

  return renderContent();

  function renderContent() {
    // 1. ContentPlanPages 렌더링
    if (detection.type === 'content_plan_pages' && detection.data) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">콘텐츠 플랜 (다중 페이지)</h3>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {detection.data.pages?.length || 0}개 페이지
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              페이지 네비게이션으로 이동하거나 Canvas에 바로 적용할 수 있습니다
            </p>
          </div>

          <ContentPlanViewer
            contentPlan={detection.data as ContentPlanPagesSchema}
            editable={editable}
            showFeedback={showFeedback}
            planId={responseId}
          />
        </div>
      );
    }

    // 2. AdCopy 렌더링
    if (detection.type === 'ad_copy' && detection.data) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">광고 카피</h3>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              AI가 생성한 광고 카피를 확인하고 편집할 수 있습니다
            </p>
          </div>

          <AdCopyOutput
            adCopy={detection.data as AdCopySimpleOutputV2}
            editable={editable}
            showFeedback={showFeedback}
            showQualityScore={showQualityScore}
            copyId={responseId}
          />
        </div>
      );
    }

    // 3. Error 렌더링
    if (detection.type === 'error') {
      const errorMessage =
        detection.data?.error ||
        detection.data?.detail ||
        'Unknown error occurred';

      return (
        <ErrorMessage
          title="오류 발생"
          message={errorMessage}
          details={detection.data}
        />
      );
    }

    // 4. Unknown - 원본 데이터 JSON 표시
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-semibold text-yellow-900">
              알 수 없는 응답 타입
            </h4>
            <p className="text-xs text-yellow-800">
              이 응답을 자동으로 렌더링할 수 없습니다.
              {detection.reason && ` (이유: ${detection.reason})`}
            </p>

            {/* Raw JSON 표시 */}
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-yellow-700 hover:text-yellow-900">
                원본 데이터 보기
              </summary>
              <pre className="mt-2 max-h-96 overflow-auto rounded bg-yellow-100 p-3 text-xs text-yellow-900">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }
}

// ============================================================================
// Debug Info Component
// ============================================================================

function DetectionDebugInfo({ detection }: { detection: DetectionResult }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
      <h4 className="text-sm font-semibold text-blue-900 mb-2">
        🐛 Detection Debug Info
      </h4>
      <div className="space-y-1 text-xs text-blue-800">
        <div className="flex items-center justify-between">
          <span className="font-medium">Type:</span>
          <span className="rounded bg-blue-100 px-2 py-0.5 font-mono">
            {detection.type}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Confidence:</span>
          <span className={`font-semibold ${detection.confidence >= 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
            {(detection.confidence * 100).toFixed(1)}%
          </span>
        </div>
        {detection.reason && (
          <div className="flex items-start gap-2">
            <span className="font-medium">Reason:</span>
            <span className="flex-1">{detection.reason}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * ContentPlan 전용 렌더러
 */
export function ContentPlanRenderer({
  contentPlan,
  ...props
}: Omit<AIResponseRendererProps, 'response'> & {
  contentPlan: ContentPlanPagesSchema;
}) {
  return <AIResponseRenderer response={contentPlan} {...props} />;
}

/**
 * AdCopy 전용 렌더러
 */
export function AdCopyRenderer({
  adCopy,
  ...props
}: Omit<AIResponseRendererProps, 'response'> & {
  adCopy: AdCopySimpleOutputV2;
}) {
  return <AIResponseRenderer response={adCopy} {...props} />;
}
