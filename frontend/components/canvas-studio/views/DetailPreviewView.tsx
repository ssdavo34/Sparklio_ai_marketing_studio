'use client';

import React, { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { useCenterViewStore } from '../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../stores/useGeneratedAssetsStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { addProductDetailToCanvas } from '@/lib/canvas/productDetailTemplate';
import { toast } from '@/components/ui/Toast';

// 통합 타입
interface DetailSection {
  section_type: string;
  order: number;
  content: any;
}

interface DetailData {
  id: string;
  title: string;
  sections: DetailSection[];
}

export function DetailPreviewView() {
  const { selectedConcept, backToConceptBoard, backToCanvas, setView } = useCenterViewStore();
  const generatedDetailData = useGeneratedAssetsStore((state) => state.detailData);
  const polotnoStore = useCanvasStore((state) => state.canvases.get(state.activeCanvasType) || null);
  const [mockData, setMockData] = useState<DetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'generated' | 'mock'>('generated');

  // Mock 데이터 로드 (생성된 데이터가 없을 때만)
  useEffect(() => {
    async function loadMockData() {
      if (generatedDetailData) {
        setIsLoading(false);
        setDataSource('generated');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/mock-data/product-detail-sample.json');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setMockData(data);
        setDataSource('mock');
      } catch (err) {
        console.error('Error loading product detail:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    loadMockData();
  }, [generatedDetailData]);

  // 표시할 데이터 결정
  const detailData: DetailData | null = generatedDetailData
    ? {
        id: generatedDetailData.id,
        title: generatedDetailData.title,
        sections: generatedDetailData.sections,
      }
    : mockData;

  // Canvas로 변환 핸들러
  const handleEditInCanvas = () => {
    if (!polotnoStore) {
      toast.error('Canvas가 준비되지 않았습니다');
      return;
    }

    if (!detailData || !detailData.sections || detailData.sections.length === 0) {
      toast.error('상세페이지 데이터가 없습니다');
      return;
    }

    try {
      // Product Detail을 Canvas에 추가 (타입 호환을 위해 as any 사용)
      addProductDetailToCanvas(polotnoStore, detailData as any);

      // Canvas 뷰로 전환
      setView('canvas');

      toast.success(`${detailData.sections.length}개 섹션이 Canvas에 추가되었습니다`);
    } catch (error: any) {
      console.error('[DetailPreview] Canvas 변환 실패:', error);
      toast.error('Canvas 변환 실패: ' + (error?.message || '알 수 없는 오류'));
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">상세페이지 데이터를 불러올 수 없습니다.</p>
          <button
            onClick={backToCanvas}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            캔버스로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={backToConceptBoard}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600"
          >
            ← 컨셉보드로
          </button>
          <span className="text-gray-300">|</span>
          <h2 className="font-semibold text-gray-900">📄 상세페이지 미리보기</h2>
          {dataSource === 'generated' && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              AI 생성
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEditInCanvas}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            Canvas에서 편집
          </button>
          <span className="text-sm text-gray-500">{detailData.sections.length}개 섹션</span>
        </div>
      </div>

      {/* 콘셉트 컨텍스트 */}
      {selectedConcept && (
        <div className="bg-purple-50 px-6 py-2 border-b">
          <p className="text-sm text-purple-700">
            <span className="font-medium">Concept:</span> {selectedConcept.concept_name}
          </p>
        </div>
      )}

      {/* 생성된 데이터 안내 */}
      {dataSource === 'generated' && (
        <div className="bg-green-50 px-6 py-2 border-b">
          <p className="text-sm text-green-700">
            Chat AI가 생성한 상세페이지입니다.
          </p>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 px-6 py-2 border-b text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 상세페이지 프리뷰 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto py-8 px-4">
          {/* 상세페이지 섹션들 */}
          {detailData.sections.map((section, idx) => (
            <div key={idx} className="mb-8">
              {/* Hero Section */}
              {section.section_type === 'hero' && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white text-center">
                  <h1 className="text-3xl font-bold mb-4">{section.content?.headline}</h1>
                  {section.content?.subheadline && (
                    <p className="text-xl opacity-90 mb-6">{section.content.subheadline}</p>
                  )}
                  {section.content?.cta_text && (
                    <button className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg">
                      {section.content.cta_text}
                    </button>
                  )}
                </div>
              )}

              {/* Problem Section */}
              {section.section_type === 'problem' && (
                <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                  <h2 className="text-xl font-bold text-red-800 mb-4">{section.content?.title}</h2>
                  {section.content?.problems && (
                    <div className="grid gap-4">
                      {section.content.problems.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                          <span className="text-2xl">😰</span>
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Solution Section */}
              {section.section_type === 'solution' && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                  <h2 className="text-xl font-bold text-green-800 mb-3">{section.content?.title}</h2>
                  <p className="text-green-700 mb-4">{section.content?.description}</p>
                  {section.content?.features && (
                    <div className="grid gap-3">
                      {section.content.features.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                          <span className="text-xl">✨</span>
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Demo Section */}
              {section.section_type === 'demo' && (
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">🎬 {section.content?.title}</h2>
                  {section.content?.steps && (
                    <div className="space-y-3">
                      {section.content.steps.map((step: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                            {step.step}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{step.title}</p>
                          </div>
                          <span className="text-sm text-gray-500">{step.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Benefits Section */}
              {section.section_type === 'benefits' && (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h2 className="text-xl font-bold text-blue-800 mb-4">📈 {section.content?.title}</h2>
                  {section.content?.metrics && (
                    <div className="grid grid-cols-3 gap-4">
                      {section.content.metrics.map((item: any, i: number) => (
                        <div key={i} className="text-center p-4 bg-white rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">{item.value}</p>
                          <p className="text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Testimonials Section */}
              {section.section_type === 'testimonials' && (
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">💬 {section.content?.title}</h2>
                  {section.content?.reviews && (
                    <div className="space-y-4">
                      {section.content.reviews.map((review: any, i: number) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-700 italic mb-3">"{review.content}"</p>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                              {review.name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{review.name}</p>
                              <p className="text-xs text-gray-500">{review.role} @ {review.company}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pricing Section */}
              {section.section_type === 'pricing' && (
                <div className="bg-white rounded-xl p-6 border shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">💰 {section.content?.title}</h2>
                  {section.content?.plans && (
                    <div className="grid grid-cols-3 gap-4">
                      {section.content.plans.map((plan: any, i: number) => (
                        <div key={i} className={`p-4 rounded-lg border-2 ${plan.popular ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                          <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                          <p className="text-2xl font-bold text-purple-600 my-2">
                            {plan.price}<span className="text-sm text-gray-500">/{plan.period}</span>
                          </p>
                          <ul className="text-sm space-y-1 mb-4">
                            {plan.features.map((f: string, fi: number) => (
                              <li key={fi} className="text-gray-600">✓ {f}</li>
                            ))}
                          </ul>
                          <button className={`w-full py-2 rounded font-medium ${plan.popular ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            {plan.cta}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CTA Section */}
              {section.section_type === 'cta' && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">{section.content?.title}</h2>
                  <p className="text-white opacity-90 mb-6">{section.content?.subtitle}</p>
                  <div className="flex justify-center gap-4">
                    {section.content?.primary_cta && (
                      <button className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100">
                        {section.content.primary_cta.text}
                      </button>
                    )}
                    {section.content?.secondary_cta && (
                      <button className="px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10">
                        {section.content.secondary_cta.text}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DetailPreviewView;
