'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Edit, Save, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCenterViewStore } from '../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../stores/useGeneratedAssetsStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { addSlidesToCanvas } from '@/lib/canvas/slidesTemplate';
import { toast } from '@/components/ui/Toast';
import type { PresentationData, SlideData, SlideLayout } from '@/types/demo';

export function SlidesPreviewView() {
  const { selectedConcept, backToConceptBoard, backToCanvas, setView } = useCenterViewStore();
  const { slidesData: generatedSlidesData, setSlidesData } = useGeneratedAssetsStore();
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for editing to avoid global store thrashing
  // We sync this with the store when changing slides or saving
  const [localSlides, setLocalSlides] = useState<SlideData[]>([]);

  // Initialize local slides from store
  useEffect(() => {
    if (generatedSlidesData?.slides) {
      // Ensure compatibility with SlideData type
      const mappedSlides: SlideData[] = generatedSlidesData.slides.map(s => ({
        ...s,
        slide_number: s.slide_number || 0, // Ensure slide_number exists
        slide_type: (s.slide_type as any) || 'default',
        layout: (s.layout as any) || 'standard',
      } as SlideData));
      setLocalSlides(mappedSlides);
    }
  }, [generatedSlidesData]);

  const currentSlide = localSlides[currentSlideIndex];
  const totalSlides = localSlides.length;

  // Update a specific field of the current slide
  const updateSlideField = (field: keyof SlideData, value: any) => {
    const updatedSlides = [...localSlides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      [field]: value,
    };
    setLocalSlides(updatedSlides);

    // Sync to global store immediately for "Single Source of Truth"
    if (generatedSlidesData) {
      setSlidesData({
        ...generatedSlidesData,
        slides: updatedSlides as any // Casting to satisfy the store's type which might be slightly different
      });
    }
  };

  // Canvas로 변환 핸들러
  const handleEditInCanvas = () => {
    if (!polotnoStore) {
      toast.error('Canvas가 준비되지 않았습니다');
      return;
    }

    if (localSlides.length === 0) {
      toast.error('프레젠테이션 데이터가 없습니다');
      return;
    }

    try {
      addSlidesToCanvas(polotnoStore, localSlides);
      setView('canvas');
      toast.success(`${localSlides.length}개 슬라이드가 Canvas에 추가되었습니다`);
    } catch (error: any) {
      console.error('[SlidesPreview] Canvas 변환 실패:', error);
      toast.error('Canvas 변환 실패: ' + (error?.message || '알 수 없는 오류'));
    }
  };

  // 저장 핸들러 (Mock)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, we would POST to /api/v1/presentations
      // For now, we just ensure the store is updated (which is done in updateSlideField)

      toast.success('프레젠테이션이 저장되었습니다');
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // 내보내기 핸들러 (Mock)
  const handleExport = () => {
    toast.success('내보내기 준비 중... (PNG 다운로드)');
    // TODO: Implement actual export logic re-using ExportDialog
  };

  if (!generatedSlidesData && localSlides.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">프레젠테이션 데이터를 불러올 수 없습니다.</p>
          <button
            onClick={backToConceptBoard}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            컨셉보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!currentSlide) return null;

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
          <h2 className="font-semibold text-gray-900">
            {generatedSlidesData?.title || '프레젠테이션 미리보기'}
          </h2>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            Light Editor
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '저장 중...' : '저장'}
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            내보내기
          </button>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          <button
            onClick={handleEditInCanvas}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            Canvas에서 편집
          </button>
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden">

        {/* 슬라이드 프리뷰 & 에디터 */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-4xl">

            {/* 슬라이드 카드 */}
            <div className="bg-white rounded-xl shadow-xl aspect-[16/9] p-12 flex flex-col relative group">

              {/* 슬라이드 타입/레이아웃 표시 (Hover 시) */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border">
                  Type: {currentSlide.slide_type}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border">
                  Layout: {currentSlide.layout}
                </span>
              </div>

              {/* 제목 편집 */}
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => updateSlideField('title', e.target.value)}
                className="text-4xl font-bold text-gray-900 mb-4 w-full border-b border-transparent hover:border-gray-200 focus:border-purple-500 focus:outline-none bg-transparent transition-colors"
                placeholder="슬라이드 제목"
              />

              {/* 부제목 편집 */}
              <input
                type="text"
                value={currentSlide.subtitle || ''}
                onChange={(e) => updateSlideField('subtitle', e.target.value)}
                className="text-xl text-gray-600 mb-8 w-full border-b border-transparent hover:border-gray-200 focus:border-purple-500 focus:outline-none bg-transparent transition-colors"
                placeholder="부제목을 입력하세요"
              />

              {/* 본문 편집 */}
              <div className="flex-1 overflow-y-auto">
                {typeof currentSlide.content === 'string' ? (
                  <textarea
                    value={currentSlide.content}
                    onChange={(e) => updateSlideField('content', e.target.value)}
                    className="w-full h-full resize-none text-lg text-gray-700 leading-relaxed border border-transparent hover:border-gray-200 focus:border-purple-500 focus:outline-none rounded p-2 -ml-2 bg-transparent transition-colors"
                    placeholder="본문 내용을 입력하세요"
                  />
                ) : (
                  <div className="text-gray-400 italic">
                    복잡한 콘텐츠는 Canvas 모드에서 편집해주세요.
                  </div>
                )}

                {/* Bullets 편집 (간단히 텍스트로 변환하여 편집하거나, 별도 UI 제공 가능) */}
                {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {currentSlide.bullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1.5">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...(currentSlide.bullets || [])];
                            newBullets[idx] = e.target.value;
                            updateSlideField('bullets', newBullets);
                          }}
                          className="flex-1 text-lg text-gray-700 border-b border-transparent hover:border-gray-200 focus:border-purple-500 focus:outline-none bg-transparent"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 발표자 노트 에디터 */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="block text-xs font-bold text-yellow-800 mb-2 uppercase tracking-wide">
                Speaker Notes
              </label>
              <textarea
                value={currentSlide.speakerNotes || ''}
                onChange={(e) => updateSlideField('speakerNotes', e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-yellow-900 resize-none placeholder-yellow-800/50"
                rows={3}
                placeholder="발표자 노트를 입력하세요..."
              />
            </div>

          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="bg-white border-t px-6 py-4 flex items-center justify-center gap-8">
        <button
          onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
          disabled={currentSlideIndex === 0}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-lg font-medium text-gray-900">
            {currentSlideIndex + 1} <span className="text-gray-400">/</span> {totalSlides}
          </span>
          <span className="text-xs text-gray-500 uppercase mt-0.5">
            {currentSlide.slide_type.replace('_', ' ')}
          </span>
        </div>

        <button
          onClick={() => setCurrentSlideIndex(Math.min(totalSlides - 1, currentSlideIndex + 1))}
          disabled={currentSlideIndex === totalSlides - 1}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export default SlidesPreviewView;
