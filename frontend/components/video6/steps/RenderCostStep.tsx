/**
 * Step 4: 렌더 비용 확인 및 실행 UI
 *
 * 상태: motion_approved
 * - dry_run=true로 먼저 비용 확인
 * - 표시 항목: 예상 비용, 일일 사용량, 비용 내역
 * - 렌더 모드 선택: Mock (무료) vs Real (유료)
 * - "렌더 시작" 버튼 → POST /api/v1/video6/{id}/render
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Play,
  AlertTriangle,
  Info,
  Loader2,
  Zap,
  TestTube,
  Film,
} from 'lucide-react';
import type {
  RenderMode,
  VideoRenderResponse,
  VideoPlanDraftV2,
  CostGuardError,
  VideoRenderError,
} from '@/types/video-pipeline-v2';
import { VIDEO_RENDER_ERROR_MESSAGES } from '@/types/video-pipeline-v2';

interface RenderCostStepProps {
  plan: VideoPlanDraftV2;
  costEstimate?: VideoRenderResponse;
  onFetchCostEstimate: (renderMode: RenderMode) => Promise<void>;
  onStartRender: (renderMode: RenderMode) => void;
  isLoading?: boolean;
  isFetchingCost?: boolean;
  error?: string | CostGuardError;
  disabled?: boolean;
}

/**
 * 비용 표시 포맷
 */
function formatCost(cost: number | undefined): string {
  if (cost === undefined) return '-';
  return `$${cost.toFixed(2)}`;
}

/**
 * 일일 사용량 프로그레스 바
 */
function DailyUsageBar({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">일일 사용량</span>
        <span
          className={`font-medium ${
            isOverLimit
              ? 'text-red-600'
              : isNearLimit
              ? 'text-amber-600'
              : 'text-gray-900'
          }`}
        >
          {formatCost(used)} / {formatCost(limit)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isOverLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-amber-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isNearLimit && !isOverLimit && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          일일 한도의 80%를 초과했습니다.
        </p>
      )}
      {isOverLimit && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          일일 한도를 초과했습니다!
        </p>
      )}
    </div>
  );
}

/**
 * 비용 내역 테이블
 */
function CostBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown);
  if (entries.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">비용 내역</span>
      </div>
      <div className="divide-y divide-gray-100">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center px-4 py-2"
          >
            <span className="text-sm text-gray-600 capitalize">{key}</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCost(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 에러 메시지 컴포넌트
 */
function CostLimitErrorBanner({ error }: { error: CostGuardError }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-red-900">일일 비용 한도 초과</h4>
          <p className="text-sm text-red-700 mt-1">
            현재 사용: {formatCost(error.daily_cost_used)} / 한도:{' '}
            {formatCost(error.daily_cost_limit)}
          </p>
          <p className="text-sm text-red-600 mt-2">
            내일 다시 시도하거나 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export function RenderCostStep({
  plan,
  costEstimate,
  onFetchCostEstimate,
  onStartRender,
  isLoading,
  isFetchingCost,
  error,
  disabled,
}: RenderCostStepProps) {
  const [selectedMode, setSelectedMode] = useState<RenderMode>('mock');

  // 모드 변경 시 비용 재조회
  useEffect(() => {
    onFetchCostEstimate(selectedMode);
  }, [selectedMode, onFetchCostEstimate]);

  // 에러 타입 확인
  const isCostGuardError =
    error &&
    typeof error === 'object' &&
    'error_code' in error &&
    error.error_code === 'cost_limit_exceeded';

  const handleStartRender = () => {
    onStartRender(selectedMode);
  };

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
        <DollarSign className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-purple-900">렌더링 비용 확인</h4>
          <p className="text-sm text-purple-700 mt-1">
            렌더링 모드를 선택하고 예상 비용을 확인한 후 영상 생성을 시작하세요.
          </p>
        </div>
      </div>

      {/* 에러 표시 */}
      {isCostGuardError && (
        <CostLimitErrorBanner error={error as CostGuardError} />
      )}

      {/* 일반 에러 */}
      {error && !isCostGuardError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            {typeof error === 'string'
              ? error
              : VIDEO_RENDER_ERROR_MESSAGES[
                  (error as CostGuardError).error_code as VideoRenderError
                ] || '오류가 발생했습니다.'}
          </p>
        </div>
      )}

      {/* 렌더 모드 선택 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          렌더링 모드 선택
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* Mock 모드 */}
          <button
            onClick={() => setSelectedMode('mock')}
            disabled={disabled}
            className={`relative p-4 border-2 rounded-lg text-left transition-all ${
              selectedMode === 'mock'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <TestTube
                className={`w-6 h-6 ${
                  selectedMode === 'mock' ? 'text-purple-600' : 'text-gray-400'
                }`}
              />
              <span className="font-medium text-gray-900">Mock</span>
            </div>
            <p className="text-sm text-gray-600">
              테스트용 렌더링 (무료)
            </p>
            <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              무료
            </span>
          </button>

          {/* Real 모드 */}
          <button
            onClick={() => setSelectedMode('real')}
            disabled={disabled}
            className={`relative p-4 border-2 rounded-lg text-left transition-all ${
              selectedMode === 'real'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Film
                className={`w-6 h-6 ${
                  selectedMode === 'real' ? 'text-purple-600' : 'text-gray-400'
                }`}
              />
              <span className="font-medium text-gray-900">Real</span>
            </div>
            <p className="text-sm text-gray-600">
              실제 AI 영상 생성 (유료)
            </p>
            <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              유료
            </span>
          </button>
        </div>
      </div>

      {/* 비용 정보 */}
      {isFetchingCost ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          <span className="ml-2 text-sm text-gray-600">
            비용 계산 중...
          </span>
        </div>
      ) : costEstimate ? (
        <div className="space-y-4">
          {/* 예상 비용 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">예상 비용</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCost(costEstimate.estimated_cost)}
              </span>
            </div>
            {costEstimate.estimated_time_sec && (
              <p className="text-sm text-gray-500 mt-1">
                예상 소요 시간: {Math.ceil(costEstimate.estimated_time_sec / 60)}분
              </p>
            )}
          </div>

          {/* 일일 사용량 */}
          {costEstimate.daily_cost_used !== undefined &&
            costEstimate.daily_cost_limit !== undefined && (
              <DailyUsageBar
                used={costEstimate.daily_cost_used}
                limit={costEstimate.daily_cost_limit}
              />
            )}

          {/* 비용 내역 */}
          {costEstimate.cost_breakdown && (
            <CostBreakdown breakdown={costEstimate.cost_breakdown} />
          )}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            렌더링 모드를 선택하면 비용이 표시됩니다.
          </p>
        </div>
      )}

      {/* 영상 정보 요약 */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-xs text-gray-500">총 씬 수</span>
          <p className="text-lg font-semibold text-gray-900">
            {plan.scenes.length}개
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">총 길이</span>
          <p className="text-lg font-semibold text-gray-900">
            {plan.total_duration_sec}초
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">AI 영상 씬</span>
          <p className="text-lg font-semibold text-purple-600">
            {plan.scenes.filter((s) => s.use_ai_video).length}개
          </p>
        </div>
      </div>

      {/* 렌더 시작 버튼 */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleStartRender}
          disabled={disabled || isLoading || isFetchingCost || !!isCostGuardError}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              렌더링 시작 중...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              {selectedMode === 'mock' ? '테스트 렌더 시작' : '렌더 시작'}
            </>
          )}
        </button>
      </div>

      {/* Mock 모드 안내 */}
      {selectedMode === 'mock' && (
        <p className="text-center text-xs text-gray-500">
          Mock 모드는 테스트 용도로, 실제 AI 영상 생성 없이 플레이스홀더 영상이
          생성됩니다.
        </p>
      )}
    </div>
  );
}

export default RenderCostStep;
