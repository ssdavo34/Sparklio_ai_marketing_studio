/**
 * ConceptBoard Tab
 *
 * 콘셉트 보드 관리 탭
 * - 콘셉트 카드 생성/관리
 * - Meeting AI 연동
 * - 풀셋 생성 시작점
 * - 각 채널별 산출물 프리뷰 연결
 * - Brand DNA 표시 (BrandKitTab에서 전송)
 *
 * @author C팀 (Frontend Team)
 * @version 1.2
 * @date 2025-12-01
 */

'use client';

import { useState } from 'react';
import { Sparkles, Plus, Send, Presentation, FileText, Instagram, Video, ChevronDown, ChevronUp, Eye, X, Target, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useCenterViewStore } from '../../../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../../../stores/useGeneratedAssetsStore';
import { LLM_PROVIDERS } from '@/lib/api/brand-api';

export function ConceptBoardTab() {
  const [expandedCard, setExpandedCard] = useState<string | null>('concept-1');
  const [showBrandDNA, setShowBrandDNA] = useState(true);

  // CenterView Store - 각 채널 프리뷰 열기 + Brand DNA
  const {
    openSlidesPreview,
    openDetailPreview,
    openInstagramPreview,
    openShortsPreview,
    sharedBrandDNA,
    setSharedBrandDNA,
  } = useCenterViewStore();

  // Generated Assets Store - 컨셉 데이터
  const conceptBoardData = useGeneratedAssetsStore((state) => state.conceptBoardData);
  const firstConceptId = conceptBoardData?.concepts?.[0]?.concept_id || 'concept-demo';

  // 채널 프리뷰 버튼 클릭 핸들러
  const handleOpenSlides = () => openSlidesPreview(firstConceptId, 'pres-1');
  const handleOpenDetail = () => openDetailPreview(firstConceptId, 'detail-1');
  const handleOpenInstagram = () => openInstagramPreview(firstConceptId, 'insta-1');
  const handleOpenShorts = () => openShortsPreview(firstConceptId, 'shorts-1');

  return (
    <div className="flex flex-col h-full p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-neutral-800">ConceptBoard</h2>
      </div>

      {/* 설명 */}
      <p className="text-sm text-neutral-600 mb-4">
        콘셉트 카드를 생성하고 관리합니다. Meeting AI에서 추출한 인사이트를 기반으로 마케팅 콘셉트를 정리하세요.
      </p>

      {/* Brand DNA 표시 섹션 */}
      {sharedBrandDNA && showBrandDNA && (
        <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">Brand DNA</span>
              {sharedBrandDNA.llm_provider && (
                <span className="px-1.5 py-0.5 bg-purple-200 text-purple-800 text-[10px] rounded">
                  {LLM_PROVIDERS.find(p => p.id === sharedBrandDNA.llm_provider)?.name || sharedBrandDNA.llm_provider}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSharedBrandDNA(null);
                setShowBrandDNA(false);
              }}
              className="p-1 hover:bg-purple-100 rounded transition-colors"
              title="닫기"
            >
              <X className="w-3.5 h-3.5 text-purple-600" />
            </button>
          </div>

          {/* 간략한 Brand DNA 내용 */}
          <div className="space-y-2 text-xs">
            {/* 톤앤매너 */}
            {sharedBrandDNA.tone && (
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-purple-800">톤앤매너:</span>
                  <span className="text-purple-700 ml-1">
                    {typeof sharedBrandDNA.tone === 'string'
                      ? sharedBrandDNA.tone.slice(0, 100) + (sharedBrandDNA.tone.length > 100 ? '...' : '')
                      : JSON.stringify(sharedBrandDNA.tone).slice(0, 100)}
                  </span>
                </div>
              </div>
            )}

            {/* 타겟 오디언스 */}
            {sharedBrandDNA.target_audience && (
              <div className="flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-purple-800">타겟:</span>
                  <span className="text-purple-700 ml-1">
                    {typeof sharedBrandDNA.target_audience === 'string'
                      ? sharedBrandDNA.target_audience.slice(0, 80) + (sharedBrandDNA.target_audience.length > 80 ? '...' : '')
                      : JSON.stringify(sharedBrandDNA.target_audience).slice(0, 80)}
                  </span>
                </div>
              </div>
            )}

            {/* Do's (최대 2개) */}
            {sharedBrandDNA.dos && Array.isArray(sharedBrandDNA.dos) && sharedBrandDNA.dos.length > 0 && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-green-700">Do's:</span>
                  <ul className="list-disc list-inside text-green-600 mt-0.5">
                    {(sharedBrandDNA.dos as string[]).slice(0, 2).map((item, i) => (
                      <li key={i} className="truncate">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Don'ts (최대 2개) */}
            {sharedBrandDNA.donts && Array.isArray(sharedBrandDNA.donts) && sharedBrandDNA.donts.length > 0 && (
              <div className="flex items-start gap-2">
                <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-red-700">Don'ts:</span>
                  <ul className="list-disc list-inside text-red-600 mt-0.5">
                    {(sharedBrandDNA.donts as string[]).slice(0, 2).map((item, i) => (
                      <li key={i} className="truncate">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-purple-500 mt-2">
            💡 콘셉트 생성 시 이 Brand DNA가 자동으로 적용됩니다.
          </p>
        </div>
      )}

      {/* 콘셉트 카드 목록 */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {/* 새 카드 추가 */}
        <button className="w-full p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50 text-center hover:border-purple-300 hover:bg-purple-50 transition-colors">
          <Plus className="w-6 h-6 mx-auto mb-1 text-neutral-400" />
          <p className="text-sm text-neutral-500">새 콘셉트 카드 추가</p>
        </button>

        {/* 예시 콘셉트 카드 */}
        <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden">
          {/* 카드 헤더 */}
          <div
            className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
            onClick={() => setExpandedCard(expandedCard === 'concept-1' ? null : 'concept-1')}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">콘셉트</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Draft</span>
                {expandedCard === 'concept-1' ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </div>
            </div>
            <h3 className="font-medium text-neutral-800 mb-1">시간 절약 강조</h3>
            <p className="text-sm text-neutral-600">
              바쁜 현대인을 위한 효율적인 솔루션 메시지
            </p>
          </div>

          {/* 확장 영역 - 채널별 산출물 */}
          {expandedCard === 'concept-1' && (
            <div className="px-4 pb-4 border-t border-neutral-100">
              {/* 채널별 산출물 버튼들 */}
              <div className="pt-3 mb-3">
                <p className="text-xs font-medium text-neutral-500 uppercase mb-2">채널별 산출물</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Presentation */}
                  <button
                    onClick={handleOpenSlides}
                    className="flex items-center gap-2 p-2 border border-neutral-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <Presentation className="w-4 h-4 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-700">Slides</p>
                      <p className="text-[10px] text-neutral-400">프리젠테이션</p>
                    </div>
                    <Eye className="w-3 h-3 text-neutral-400" />
                  </button>

                  {/* Detail Page */}
                  <button
                    onClick={handleOpenDetail}
                    className="flex items-center gap-2 p-2 border border-neutral-200 rounded hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-700">Detail</p>
                      <p className="text-[10px] text-neutral-400">상세페이지</p>
                    </div>
                    <Eye className="w-3 h-3 text-neutral-400" />
                  </button>

                  {/* Instagram */}
                  <button
                    onClick={handleOpenInstagram}
                    className="flex items-center gap-2 p-2 border border-neutral-200 rounded hover:border-pink-300 hover:bg-pink-50 transition-colors text-left"
                  >
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-700">Instagram</p>
                      <p className="text-[10px] text-neutral-400">SNS 광고</p>
                    </div>
                    <Eye className="w-3 h-3 text-neutral-400" />
                  </button>

                  {/* Shorts */}
                  <button
                    onClick={handleOpenShorts}
                    className="flex items-center gap-2 p-2 border border-neutral-200 rounded hover:border-red-300 hover:bg-red-50 transition-colors text-left"
                  >
                    <Video className="w-4 h-4 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-700">Shorts</p>
                      <p className="text-[10px] text-neutral-400">쇼츠/릴스</p>
                    </div>
                    <Eye className="w-3 h-3 text-neutral-400" />
                  </button>
                </div>
              </div>

              {/* 풀셋 생성 버튼 */}
              <button className="w-full text-xs py-2 px-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 transition-colors">
                <Send className="w-3.5 h-3.5" />
                풀셋 생성 (모든 채널)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500">
          💡 Meeting AI에서 &quot;콘셉트 보드로 보내기&quot;를 클릭하면 자동으로 카드가 추가됩니다.
        </p>
      </div>
    </div>
  );
}
