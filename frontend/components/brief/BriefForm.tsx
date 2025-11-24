/**
 * Brief Form
 *
 * 캠페인 브리프 입력/편집 폼
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 3.1
 */

'use client';

import { useState } from 'react';
import { Save, Plus, X, Calendar } from 'lucide-react';
import type { Brief, ChannelType } from '@/types/brief';

// ============================================================================
// Types
// ============================================================================

export interface BriefFormProps {
  /** 초기 브리프 데이터 (편집 모드) */
  initialData?: Brief | null;

  /** 저장 핸들러 */
  onSave: (data: BriefFormData) => Promise<void>;

  /** 취소 핸들러 (선택) */
  onCancel?: () => void;

  /** 로딩 상태 */
  isLoading?: boolean;

  /** 클래스명 (선택) */
  className?: string;
}

export interface BriefFormData {
  goal: string;
  target: string;
  insight: string;
  keyMessages: string[];
  channels: ChannelType[];
  budget?: number;
  startDate?: string;
  endDate?: string;
  kpis: string[];
  notes?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_OPTIONS: { value: ChannelType; label: string; description: string }[] = [
  { value: 'product_detail', label: '상세 페이지', description: '제품/서비스 상세 설명' },
  { value: 'sns', label: 'SNS', description: 'Instagram, Facebook 등' },
  { value: 'banner', label: '배너', description: '웹/앱 광고 배너' },
  { value: 'deck', label: '발표 자료', description: 'PPT, Keynote 등' },
  { value: 'video', label: '영상', description: '광고 영상, 유튜브 등' },
];

// ============================================================================
// Component
// ============================================================================

export function BriefForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
  className = '',
}: BriefFormProps) {
  // ==================== State ====================

  const [goal, setGoal] = useState(initialData?.goal || '');
  const [target, setTarget] = useState(initialData?.target || '');
  const [insight, setInsight] = useState(initialData?.insight || '');
  const [keyMessages, setKeyMessages] = useState<string[]>(initialData?.keyMessages || []);
  const [channels, setChannels] = useState<ChannelType[]>(initialData?.channels || []);
  const [budget, setBudget] = useState<number | undefined>(initialData?.budget);
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [kpis, setKpis] = useState<string[]>(initialData?.kpis || []);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [currentMessageInput, setCurrentMessageInput] = useState('');
  const [currentKpiInput, setCurrentKpiInput] = useState('');

  // ==================== Channel Handlers ====================

  const toggleChannel = (channel: ChannelType) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  // ==================== Key Message Handlers ====================

  const addKeyMessage = () => {
    if (currentMessageInput.trim()) {
      setKeyMessages([...keyMessages, currentMessageInput.trim()]);
      setCurrentMessageInput('');
    }
  };

  const removeKeyMessage = (index: number) => {
    setKeyMessages(keyMessages.filter((_, i) => i !== index));
  };

  // ==================== KPI Handlers ====================

  const addKPI = () => {
    if (currentKpiInput.trim()) {
      setKpis([...kpis, currentKpiInput.trim()]);
      setCurrentKpiInput('');
    }
  };

  const removeKPI = (index: number) => {
    setKpis(kpis.filter((_, i) => i !== index));
  };

  // ==================== Submit Handler ====================

  const handleSubmit = async () => {
    const data: BriefFormData = {
      goal,
      target,
      insight,
      keyMessages,
      channels,
      budget,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      kpis,
      notes: notes || undefined,
    };

    await onSave(data);
  };

  // ==================== Rendering ====================

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">캠페인 브리프</h2>
        <p className="text-sm text-gray-500 mt-1">
          캠페인의 목표와 전략을 정의하세요.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Goal (Required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            캠페인 목표 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="이번 캠페인을 통해 달성하고자 하는 목표를 명확히 작성하세요. (예: 신제품 인지도 향상, 브랜드 이미지 개선 등)"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Target (Required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            타겟 고객 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="캠페인의 주요 타겟 고객을 구체적으로 정의하세요. (예: 20-30대 여성, 건강에 관심 많은 직장인 등)"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Insight (Required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            핵심 인사이트 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            placeholder="타겟 고객에 대한 핵심 인사이트나 니즈를 작성하세요. (예: 바쁜 일상 속에서도 건강을 챙기고 싶어하지만 시간이 부족함)"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Key Messages (Required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주요 메시지 <span className="text-red-500">*</span>
          </label>
          {keyMessages.length > 0 && (
            <div className="space-y-2 mb-3">
              {keyMessages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-200 text-purple-700 rounded-full text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <p className="flex-1 text-sm text-gray-700">{message}</p>
                  <button
                    onClick={() => removeKeyMessage(index)}
                    className="p-1 hover:bg-purple-100 rounded transition-colors flex-shrink-0"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={currentMessageInput}
              onChange={(e) => setCurrentMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyMessage()}
              placeholder="캠페인에서 전달할 주요 메시지를 입력하세요"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              onClick={addKeyMessage}
              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>
        </div>

        {/* Channels (Required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            채널 선택 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CHANNEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleChannel(option.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  channels.includes(option.value)
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={isLoading}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      channels.includes(option.value)
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {channels.includes(option.value) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                </div>
                <p className="text-xs text-gray-500 ml-7">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Budget & Dates */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">예산 (원)</label>
            <input
              type="number"
              value={budget || ''}
              onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="10000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            성과 지표 (KPI)
          </label>
          {kpis.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {kpis.map((kpi, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                >
                  {kpi}
                  <button
                    onClick={() => removeKPI(index)}
                    className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                    disabled={isLoading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={currentKpiInput}
              onChange={(e) => setCurrentKpiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKPI()}
              placeholder="KPI 입력 후 Enter (예: 도달률 100만, 전환율 3% 이상)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              onClick={addKPI}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            추가 메모
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="기타 참고 사항이나 제약 조건 등을 자유롭게 작성하세요."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isLoading ? '저장 중...' : '브리프 저장'}
        </button>
      </div>
    </div>
  );
}
