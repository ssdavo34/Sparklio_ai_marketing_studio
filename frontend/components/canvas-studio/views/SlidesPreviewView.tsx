'use client';

import React, { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { useCenterViewStore } from '../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../stores/useGeneratedAssetsStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { addSlidesToCanvas } from '@/lib/canvas/slidesTemplate';
import { toast } from '@/components/ui/Toast';
import type { PresentationData } from '@/types/demo';

// 통합 슬라이드 타입
interface SlideViewData {
  id: string;
  title: string;
  content: string | any[];
  bullets?: string[];
  speakerNotes?: string;
  slide_type?: string;
  subtitle?: string;
  cta_button?: { text: string; url?: string };
}

interface PresentationViewData {
  id: string;
  title: string;
  slides: SlideViewData[];
}

export function SlidesPreviewView() {
  const { selectedConcept, backToConceptBoard, backToCanvas, setView } = useCenterViewStore();
  const generatedSlidesData = useGeneratedAssetsStore((state) => state.slidesData);
  const polotnoStore = useCanvasStore((state) => state.polotnoStore);
  const [mockData, setMockData] = useState<PresentationData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'generated' | 'mock'>('generated');

  // Mock 데이터 로드 (생성된 데이터가 없을 때만)
  useEffect(() => {
    async function loadMockData() {
      if (generatedSlidesData) {
        setIsLoading(false);
        setDataSource('generated');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/mock-data/presentation-sample.json');
        const data = await response.json();
        setMockData(data);
        setDataSource('mock');
      } catch (err) {
        console.error('Error loading presentation:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMockData();
  }, [generatedSlidesData]);

  // 표시할 데이터 결정
  const presentationData: PresentationViewData | null = generatedSlidesData
    ? {
        id: generatedSlidesData.id,
        title: generatedSlidesData.title,
        slides: generatedSlidesData.slides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          content: slide.content,
          bullets: slide.bullets,
          speakerNotes: slide.speakerNotes,
          slide_type: 'content',
        })),
      }
    : mockData
      ? {
          id: mockData.id,
          title: mockData.title,
          slides: mockData.slides.map((slide, idx) => ({
            id: `slide-${slide.slide_number || idx + 1}`,
            title: slide.title,
            content: slide.content || '',
            slide_type: slide.slide_type,
            subtitle: slide.subtitle,
            cta_button: slide.cta_button,
          })),
        }
      : null;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!presentationData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">프레젠테이션 데이터를 불러올 수 없습니다.</p>
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

  const slide = presentationData.slides[currentSlide];
  const totalSlides = presentationData.slides.length;

  // Canvas로 변환 핸들러
  const handleEditInCanvas = () => {
    if (!polotnoStore) {
      toast.error('Canvas가 준비되지 않았습니다');
      return;
    }

    if (!presentationData) {
      toast.error('프레젠테이션 데이터가 없습니다');
      return;
    }

    try {
      // Slides를 Canvas에 추가
      const slides = presentationData.slides.map((s) => ({
        id: s.id,
        title: s.title,
        content: typeof s.content === 'string' ? s.content : '',
        bullets: s.bullets,
        subtitle: s.subtitle,
        speakerNotes: s.speakerNotes,
      }));

      addSlidesToCanvas(polotnoStore, slides);

      // Canvas 뷰로 전환
      setView('canvas');

      toast.success(`${slides.length}개 슬라이드가 Canvas에 추가되었습니다`);
    } catch (error: any) {
      console.error('[SlidesPreview] Canvas 변환 실패:', error);
      toast.error('Canvas 변환 실패: ' + (error?.message || '알 수 없는 오류'));
    }
  };

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
          <h2 className="font-semibold text-gray-900">📊 {presentationData.title}</h2>
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
          <span className="text-sm text-gray-500">
            {currentSlide + 1} / {totalSlides}
          </span>
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
            Chat AI가 생성한 슬라이드입니다.
          </p>
        </div>
      )}

      {/* 슬라이드 영역 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="bg-white rounded-xl shadow-xl max-w-3xl w-full aspect-[16/9] p-8 flex flex-col justify-center"
        >
          {/* 슬라이드 타입 배지 */}
          {slide.slide_type && (
            <div className="mb-4">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded uppercase">
                {slide.slide_type}
              </span>
            </div>
          )}

          {/* 타이틀 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{slide.title}</h1>

          {/* 서브타이틀 */}
          {slide.subtitle && (
            <p className="text-xl text-gray-600 mb-6">{slide.subtitle}</p>
          )}

          {/* 콘텐츠 */}
          {slide.content && (
            <div className="text-gray-700">
              {Array.isArray(slide.content) ? (
                <ul className="space-y-2">
                  {slide.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      <span>
                        {typeof item === 'string'
                          ? item
                          : 'feature' in item
                            ? `${item.feature}: ${item.description}`
                            : `${item.metric}: ${item.value} (${item.description})`
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{slide.content}</p>
              )}
            </div>
          )}

          {/* Bullets (생성된 슬라이드용) */}
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-2 mt-4">
              {slide.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-purple-500">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA 버튼 */}
          {slide.cta_button && (
            <div className="mt-8">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium">
                {slide.cta_button.text}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 발표자 노트 (생성된 슬라이드용) */}
      {slide.speakerNotes && (
        <div className="bg-yellow-50 border-t px-6 py-3">
          <p className="text-xs font-semibold text-yellow-700 mb-1">발표자 노트:</p>
          <p className="text-sm text-yellow-800">{slide.speakerNotes}</p>
        </div>
      )}

      {/* 네비게이션 */}
      <div className="bg-white border-t px-6 py-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          ← 이전
        </button>

        {/* 슬라이드 인디케이터 */}
        <div className="flex gap-1">
          {presentationData.slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentSlide ? 'bg-purple-500' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
          disabled={currentSlide === totalSlides - 1}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

export default SlidesPreviewView;
