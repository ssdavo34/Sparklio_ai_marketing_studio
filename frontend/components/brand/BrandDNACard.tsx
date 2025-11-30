/**
 * Brand DNA Card
 *
 * Brand DNA 분석 결과 표시 컴포넌트
 * - V1/V2 Brand DNA 지원
 * - Canvas에 추가 버튼 포함
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-30
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 2.3
 */

'use client';

import { useState } from 'react';
import {
  Edit2,
  Target,
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  PlusCircle,
  Palette,
} from 'lucide-react';
import type { BrandDNA } from '@/types/brand';
import { useBrandToCanvas } from '@/hooks/useBrandToCanvas';

// ============================================================================
// Types
// ============================================================================

export interface BrandDNACardProps {
  /** Brand DNA 데이터 */
  brandDNA: BrandDNA;

  /** 편집 핸들러 (선택) */
  onEdit?: () => void;

  /** 클래스명 (선택) */
  className?: string;

  /** 편집 버튼 표시 여부 */
  showEditButton?: boolean;

  /** Canvas 추가 버튼 표시 여부 */
  showAddToCanvasButton?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function BrandDNACard({
  brandDNA,
  onEdit,
  className = '',
  showEditButton = true,
  showAddToCanvasButton = true,
}: BrandDNACardProps) {
  const { addToCanvasAndNavigate, isLoading, error, clearError } = useBrandToCanvas();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCanvas = async () => {
    clearError();
    const success = await addToCanvasAndNavigate(brandDNA);
    if (success) {
      setShowSuccess(true);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Brand DNA 분석 결과</h2>
          <p className="text-sm text-gray-500 mt-1">
            AI가 분석한 브랜드의 핵심 아이덴티티
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showAddToCanvasButton && (
            <button
              onClick={handleAddToCanvas}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  이동 중...
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4" />
                  Canvas에 추가
                </>
              )}
            </button>
          )}
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
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Tone & Manner */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900">톤 & 매너</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed bg-purple-50 p-4 rounded-lg">
            {brandDNA.tone}
          </p>
        </div>

        {/* Target Audience */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">타겟 고객</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed bg-indigo-50 p-4 rounded-lg">
            {brandDNA.target_audience}
          </p>
        </div>

        {/* Key Messages */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-semibold text-gray-900">핵심 메시지</h3>
          </div>
          <ul className="space-y-2">
            {brandDNA.key_messages.map((message, index) => (
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

        {/* Do's and Don'ts */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Do's */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">권장 표현</h3>
            </div>
            <ul className="space-y-2">
              {brandDNA.dos.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700 bg-green-50 p-3 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Don'ts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-semibold text-gray-900">금지 표현</h3>
            </div>
            <ul className="space-y-2">
              {brandDNA.donts.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 p-3 rounded-lg"
                >
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sample Copies */}
        {brandDNA.sample_copies && brandDNA.sample_copies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">샘플 카피</h3>
            </div>
            <div className="space-y-2">
              {brandDNA.sample_copies.map((copy, index) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg"
                >
                  <p className="text-sm text-gray-700 italic">"{copy}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meta Information */}
        {brandDNA.meta && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              {brandDNA.meta.analyzed_at && (
                <div>
                  <span className="font-medium">분석 일시:</span>{' '}
                  {new Date(brandDNA.meta.analyzed_at).toLocaleString('ko-KR')}
                </div>
              )}
              {brandDNA.meta.model && (
                <div>
                  <span className="font-medium">모델:</span> {brandDNA.meta.model}
                </div>
              )}
              {brandDNA.meta.agent_version && (
                <div>
                  <span className="font-medium">Agent 버전:</span>{' '}
                  {brandDNA.meta.agent_version}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
