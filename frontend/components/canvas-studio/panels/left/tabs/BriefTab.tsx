/**
 * Brief Tab
 *
 * 캠페인 브리프 입력 및 관리 탭
 * - 캠페인 목표, 타겟, 인사이트 입력
 * - 핵심 메시지, 채널, KPI 관리
 * - Brief Store와 연동하여 ConceptBoard 생성 시 활용
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-02
 */

'use client';

import { useState, useCallback } from 'react';
import {
  FileText,
  Target,
  Users,
  Lightbulb,
  MessageSquare,
  Hash,
  BarChart3,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useBriefStore } from '../../../stores/useBriefStore';
import type { Brief, ChannelType } from '@/types/brief';
import { CHANNEL_TYPE_LABELS, CHANNEL_TYPE_ICONS } from '@/types/brief';
import { toast } from '@/components/ui/Toast';

// 채널 목록 (UI에서 사용할 것만)
const AVAILABLE_CHANNELS: ChannelType[] = ['product_detail', 'sns', 'banner', 'deck', 'video'];

export function BriefTab() {
  // Brief Store
  const {
    brief,
    setBrief,
    updateBriefField,
    addKeyMessage,
    removeKeyMessage,
    toggleChannel,
    addKPI,
    removeKPI,
    validation,
    isEditing,
    setIsEditing,
  } = useBriefStore();

  // 새 메시지/KPI 입력 상태
  const [newMessage, setNewMessage] = useState('');
  const [newKPI, setNewKPI] = useState('');

  // 브리프가 없으면 새로 생성
  const initializeBrief = useCallback(() => {
    const now = new Date().toISOString();
    const newBrief: Brief = {
      id: `brief-${Date.now()}`,
      projectId: 'default-project',
      goal: '',
      target: '',
      insight: '',
      keyMessages: [],
      channels: [],
      kpis: [],
      status: 'draft',
      sourceType: 'manual',
      createdAt: now,
      updatedAt: now,
    };
    setBrief(newBrief);
    setIsEditing(true);
    toast.success('새 브리프를 생성했습니다.');
  }, [setBrief, setIsEditing]);

  // 핵심 메시지 추가
  const handleAddMessage = useCallback(() => {
    if (newMessage.trim()) {
      addKeyMessage(newMessage.trim());
      setNewMessage('');
    }
  }, [newMessage, addKeyMessage]);

  // KPI 추가
  const handleAddKPI = useCallback(() => {
    if (newKPI.trim()) {
      addKPI(newKPI.trim());
      setNewKPI('');
    }
  }, [newKPI, addKPI]);

  // 완성도 표시
  const completeness = validation?.completeness || 0;
  const isValid = validation?.isValid || false;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm font-semibold text-neutral-800">Campaign Brief</h2>
        </div>
        {brief && (
          <div className="flex items-center gap-2">
            <div className={`text-xs px-2 py-1 rounded-full ${
              isValid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {completeness}% 완성
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 브리프가 없을 때 */}
        {!brief ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-500 mb-4">
              캠페인 브리프를 작성하여<br />
              AI 컨셉 생성에 활용하세요
            </p>
            <button
              onClick={initializeBrief}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              새 브리프 작성
            </button>
          </div>
        ) : (
          <>
            {/* 캠페인 목표 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                캠페인 목표 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={brief.goal}
                onChange={(e) => updateBriefField('goal', e.target.value)}
                placeholder="예: 신제품 런칭을 통해 브랜드 인지도 30% 상승"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>

            {/* 타겟 오디언스 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                타겟 오디언스 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={brief.target}
                onChange={(e) => updateBriefField('target', e.target.value)}
                placeholder="예: 20-35세 직장인, 건강에 관심이 높은 MZ세대"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>

            {/* 핵심 인사이트 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                핵심 인사이트
              </label>
              <textarea
                value={brief.insight || ''}
                onChange={(e) => updateBriefField('insight', e.target.value)}
                placeholder="예: 타겟층은 편리함보다 품질을 중시하며, 지속가능성에 높은 관심"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>

            {/* 핵심 메시지 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                핵심 메시지 <span className="text-red-500">*</span>
              </label>

              {/* 기존 메시지 목록 */}
              <div className="space-y-1.5">
                {brief.keyMessages.map((msg, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm"
                  >
                    <span className="flex-1 text-neutral-700">{msg}</span>
                    <button
                      onClick={() => removeKeyMessage(index)}
                      className="p-0.5 hover:bg-green-200 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-green-600" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 새 메시지 입력 */}
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
                  placeholder="메시지 추가..."
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleAddMessage}
                  disabled={!newMessage.trim()}
                  className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 타겟 채널 */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                타겟 채널 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CHANNELS.map((channel) => {
                  const isSelected = brief.channels.includes(channel);
                  return (
                    <button
                      key={channel}
                      onClick={() => toggleChannel(channel)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-indigo-200'
                      }`}
                    >
                      <span>{CHANNEL_TYPE_ICONS[channel]}</span>
                      <span>{CHANNEL_TYPE_LABELS[channel]}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KPI */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                <BarChart3 className="w-3.5 h-3.5 text-pink-500" />
                KPI 목표
              </label>

              {/* 기존 KPI 목록 */}
              <div className="space-y-1.5">
                {brief.kpis.map((kpi, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-lg text-sm"
                  >
                    <span className="flex-1 text-neutral-700">{kpi}</span>
                    <button
                      onClick={() => removeKPI(index)}
                      className="p-0.5 hover:bg-pink-200 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-pink-600" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 새 KPI 입력 */}
              <div className="flex gap-2">
                <input
                  value={newKPI}
                  onChange={(e) => setNewKPI(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKPI()}
                  placeholder="예: CTR 5% 이상"
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  onClick={handleAddKPI}
                  disabled={!newKPI.trim()}
                  className="px-3 py-1.5 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 유효성 검사 결과 */}
            {validation && !isValid && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700">
                    <p className="font-medium mb-1">필수 항목을 입력해주세요:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {validation.missingRequired.map((field) => (
                        <li key={field}>{getFieldLabel(field)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 완료 상태 */}
            {isValid && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-green-700 font-medium">
                    브리프가 완성되었습니다! ConceptBoard에서 컨셉을 생성하세요.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
        <p className="text-[10px] text-neutral-500">
          <Sparkles className="w-3 h-3 inline mr-1" />
          브리프 정보는 ConceptBoard와 풀셋 생성 시 자동 반영됩니다
        </p>
      </div>
    </div>
  );
}

// 필드명 → 한글 라벨
function getFieldLabel(field: keyof Brief): string {
  const labels: Partial<Record<keyof Brief, string>> = {
    goal: '캠페인 목표',
    target: '타겟 오디언스',
    insight: '핵심 인사이트',
    keyMessages: '핵심 메시지',
    channels: '타겟 채널',
    kpis: 'KPI',
  };
  return labels[field] || field;
}
