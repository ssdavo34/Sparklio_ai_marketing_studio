/**
 * Detail Tab (상세페이지)
 *
 * 상세페이지 생성 및 관리 탭
 * - 제품/서비스 상세페이지 생성
 * - 랜딩페이지 템플릿
 * - 생성된 상세페이지 섹션 표시
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-02
 */

'use client';

import { useState, useCallback } from 'react';
import { FileText, Plus, Layout, Image, Loader2, Sparkles, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useGeneratedAssetsStore, type GeneratedDetailData, type GeneratedConcept } from '../../../stores/useGeneratedAssetsStore';
import { useCenterViewStore } from '../../../stores/useCenterViewStore';
import { useCanvasStore } from '../../../stores/useCanvasStore';

// 템플릿 타입
type TemplateType = 'product' | 'service' | 'landing' | 'event';

const TEMPLATES: { id: TemplateType; name: string; description: string; icon: typeof Layout }[] = [
  { id: 'product', name: '제품 소개', description: '제품 스펙 중심', icon: Layout },
  { id: 'service', name: '서비스 랜딩', description: '서비스 가치 강조', icon: Image },
  { id: 'landing', name: '랜딩 페이지', description: '전환 최적화', icon: FileText },
  { id: 'event', name: '이벤트/프로모션', description: '긴급성/혜택 강조', icon: Sparkles },
];

// 섹션 타입 라벨
const SECTION_LABELS: Record<string, { name: string; color: string }> = {
  hero: { name: '히어로', color: 'bg-purple-100 text-purple-700' },
  problem: { name: '문제 제기', color: 'bg-red-100 text-red-700' },
  solution: { name: '솔루션', color: 'bg-green-100 text-green-700' },
  demo: { name: '데모', color: 'bg-blue-100 text-blue-700' },
  benefits: { name: '혜택', color: 'bg-amber-100 text-amber-700' },
  testimonials: { name: '후기', color: 'bg-pink-100 text-pink-700' },
  pricing: { name: '가격', color: 'bg-indigo-100 text-indigo-700' },
  cta: { name: 'CTA', color: 'bg-orange-100 text-orange-700' },
  features: { name: '기능', color: 'bg-teal-100 text-teal-700' },
};

export function DetailTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('product');
  const [topic, setTopic] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  // Stores
  const { detailData, conceptBoardData, generateDetailFromConcept, isGeneratingDetail } = useGeneratedAssetsStore();
  const { openDetailPreview } = useCenterViewStore();
  const setActiveCanvasType = useCanvasStore((state) => state.setActiveCanvasType);

  // 섹션 토글
  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  // 컨셉에서 상세페이지 생성
  const handleGenerateFromConcept = useCallback(async (concept: GeneratedConcept) => {
    setActiveCanvasType('detail');
    await generateDetailFromConcept(concept);
  }, [generateDetailFromConcept, setActiveCanvasType]);

  // 직접 생성 (Mock)
  const handleDirectGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    const mockConcept: GeneratedConcept = {
      concept_id: `direct-${Date.now()}`,
      concept_name: topic,
      description: topic,
      headline: topic,
      target_audience: '전체 고객',
      tone: '전문적',
    };

    setActiveCanvasType('detail');
    await generateDetailFromConcept(mockConcept);
  }, [topic, generateDetailFromConcept, setActiveCanvasType]);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-neutral-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h2 className="text-sm font-semibold text-neutral-800">상세페이지</h2>
          {detailData && (
            <span className="text-xs px-1.5 py-0.5 bg-green-200 text-green-700 rounded">
              생성됨
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 생성된 상세페이지가 있으면 먼저 표시 */}
        {detailData && (
          <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-green-800">
                {detailData.title}
              </h3>
              <span className="text-[10px] text-green-600">
                {detailData.sections.length}개 섹션
              </span>
            </div>

            {/* 섹션 목록 */}
            <div className="space-y-2">
              {detailData.sections.map((section, index) => {
                const isExpanded = expandedSections.has(index);
                const label = SECTION_LABELS[section.section_type] || { name: section.section_type, color: 'bg-gray-100 text-gray-700' };

                return (
                  <div key={index} className="bg-white rounded-lg border border-green-100 overflow-hidden">
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full flex items-center justify-between p-2 hover:bg-green-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${label.color}`}>
                          {label.name}
                        </span>
                        <span className="text-xs text-neutral-600">
                          섹션 {section.order}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-2 pb-2 text-xs text-neutral-600">
                        {typeof section.content === 'object' ? (
                          <div className="space-y-1">
                            {section.content.headline && (
                              <p><span className="font-medium">헤드라인:</span> {section.content.headline}</p>
                            )}
                            {section.content.subheadline && (
                              <p><span className="font-medium">서브:</span> {section.content.subheadline}</p>
                            )}
                            {section.content.title && (
                              <p><span className="font-medium">제목:</span> {section.content.title}</p>
                            )}
                            {section.content.cta && (
                              <p><span className="font-medium">CTA:</span> {section.content.cta}</p>
                            )}
                          </div>
                        ) : (
                          <p>{JSON.stringify(section.content).slice(0, 100)}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Canvas에서 편집 버튼 */}
            <button
              onClick={() => openDetailPreview('generated', detailData.id)}
              className="w-full mt-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Canvas에서 편집
            </button>
          </div>
        )}

        {/* 템플릿 선택 */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-700 mb-2">템플릿</h3>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-2 border rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-green-600' : 'text-neutral-500'}`} />
                  <p className="text-xs font-medium text-neutral-800">{template.name}</p>
                  <p className="text-[10px] text-neutral-500">{template.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 직접 생성 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-neutral-700">직접 생성</h3>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="제품/서비스 설명을 입력하세요"
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={2}
            disabled={isGeneratingDetail}
          />
          <button
            onClick={handleDirectGenerate}
            disabled={isGeneratingDetail || !topic.trim()}
            className={`w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
              isGeneratingDetail || !topic.trim()
                ? 'bg-neutral-100 text-neutral-400'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isGeneratingDetail ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                상세페이지 생성
              </>
            )}
          </button>
        </div>

        {/* 컨셉 기반 생성 */}
        {conceptBoardData && conceptBoardData.concepts && conceptBoardData.concepts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 mb-2">컨셉 기반 생성</h3>
            <div className="space-y-2">
              {conceptBoardData.concepts.map((concept) => (
                <button
                  key={concept.concept_id}
                  onClick={() => handleGenerateFromConcept(concept)}
                  disabled={isGeneratingDetail}
                  className="w-full flex items-center gap-2 p-2 border border-neutral-200 rounded-lg hover:border-green-300 hover:bg-green-50 text-left transition-colors disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-800 truncate">
                      {concept.concept_name}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate">
                      {concept.headline || concept.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {!detailData && !conceptBoardData?.concepts?.length && (
          <div className="text-center py-6 text-neutral-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">상세페이지를 생성해보세요</p>
            <p className="text-xs">또는 ConceptBoard에서 컨셉을 먼저 생성하세요</p>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50">
        <p className="text-[10px] text-neutral-500">
          💡 ConceptBoard에서 &quot;상세페이지&quot; 버튼으로도 생성 가능
        </p>
      </div>
    </div>
  );
}
