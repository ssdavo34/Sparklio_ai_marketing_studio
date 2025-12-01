'use client';

import React, { useEffect, useState } from 'react';
import { Edit } from 'lucide-react';
import { useCenterViewStore } from '../stores/useCenterViewStore';
import { useGeneratedAssetsStore } from '../stores/useGeneratedAssetsStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { addInstagramAdsToCanvas } from '@/lib/canvas/instagramTemplate';
import { toast } from '@/components/ui/Toast';

// 통합 타입 (Mock + Generated 모두 지원)
interface InstagramAdData {
  ad_id: string;
  ad_type: 'single_image' | 'carousel';
  format: 'feed' | 'story';
  aspect_ratio: string;
  creative: {
    headline: string;
    primary_text: string;
    cta_text: string;
    image_url?: string;
    cards?: {
      card_number: number;
      title: string;
      description: string;
    }[];
  };
}

interface InstagramData {
  id: string;
  title: string;
  ads: InstagramAdData[];
  hashtags: string[];
}

export function InstagramPreviewView() {
  const { selectedConcept, backToConceptBoard, backToCanvas, setView } = useCenterViewStore();
  const generatedInstagramData = useGeneratedAssetsStore((state) => state.instagramData);
  const polotnoStore = useCanvasStore((state) => state.canvases.get(state.activeCanvasType) || null);
  const [mockData, setMockData] = useState<InstagramData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'generated' | 'mock'>('generated');

  // Mock 데이터 로드 (생성된 데이터가 없을 때만)
  useEffect(() => {
    async function loadMockData() {
      if (generatedInstagramData) {
        setIsLoading(false);
        setDataSource('generated');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/mock-data/instagram-ads-sample.json');
        const data = await response.json();
        setMockData(data);
        setDataSource('mock');
      } catch (err) {
        console.error('Error loading instagram ads:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMockData();
  }, [generatedInstagramData]);

  // 표시할 데이터 결정
  const adsData: InstagramData | null = generatedInstagramData
    ? {
        id: generatedInstagramData.id,
        title: generatedInstagramData.title,
        ads: generatedInstagramData.ads.map((ad) => ({
          ad_id: ad.ad_id,
          ad_type: ad.ad_type,
          format: ad.format,
          aspect_ratio: ad.aspect_ratio,
          creative: {
            headline: ad.creative.headline,
            primary_text: ad.creative.primary_text,
            cta_text: ad.creative.cta_text,
            image_url: ad.creative.image_url,
            cards: ad.creative.cards,
          },
        })),
        hashtags: generatedInstagramData.hashtags,
      }
    : mockData;

  // Canvas로 변환 핸들러
  const handleEditInCanvas = () => {
    if (!polotnoStore) {
      toast.error('Canvas가 준비되지 않았습니다');
      return;
    }

    if (!adsData || !adsData.ads || adsData.ads.length === 0) {
      toast.error('인스타그램 광고 데이터가 없습니다');
      return;
    }

    try {
      // Instagram Ads를 Canvas에 추가
      addInstagramAdsToCanvas(polotnoStore, adsData.ads);

      // Canvas 뷰로 전환
      setView('canvas');

      toast.success(`${adsData.ads.length}개 광고가 Canvas에 추가되었습니다`);
    } catch (error: any) {
      console.error('[InstagramPreview] Canvas 변환 실패:', error);
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

  if (!adsData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">인스타그램 광고 데이터를 불러올 수 없습니다.</p>
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
          <h2 className="font-semibold text-gray-900">📸 인스타그램 광고 미리보기</h2>
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
          <span className="text-sm text-gray-500">{adsData.ads.length}개 광고</span>
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
            Chat AI가 생성한 인스타그램 광고입니다.
          </p>
        </div>
      )}

      {/* 광고 카드 그리드 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* 해시태그 표시 */}
          {adsData.hashtags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {adsData.hashtags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-6 justify-center">
            {adsData.ads.map((ad) => (
              <InstagramAdCard key={ad.ad_id} ad={ad} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Instagram 광고 카드 컴포넌트
function InstagramAdCard({ ad }: { ad: InstagramAdData }) {
  const getFormatLabel = (format: string, adType: string) => {
    if (adType === 'carousel') return '캐러셀';
    switch (format) {
      case 'feed': return '피드';
      case 'story': return '스토리';
      default: return format;
    }
  };

  const getAspectRatio = (format: string) => {
    switch (format) {
      case 'story': return 'aspect-[9/16] max-w-[280px]';
      case 'feed': return 'aspect-square max-w-[320px]';
      default: return 'aspect-square max-w-[320px]';
    }
  };

  const isCarousel = ad.ad_type === 'carousel';

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${getAspectRatio(ad.format)} w-full`}>
      {/* 이미지 영역 */}
      <div className="relative h-3/5 bg-gradient-to-br from-purple-400 to-pink-400">
        {/* 실제 이미지가 있으면 표시 */}
        {ad.creative.image_url && (
          <img
            src={ad.creative.image_url}
            alt={ad.creative.headline}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* 타입 배지 */}
        <span className="absolute top-3 left-3 px-2 py-1 bg-black/50 text-white text-xs rounded">
          {getFormatLabel(ad.format, ad.ad_type)}
        </span>

        {/* 캐러셀 카드 수 표시 */}
        {isCarousel && ad.creative.cards && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded">
            1/{ad.creative.cards.length}
          </span>
        )}

        {/* 플레이스홀더 아이콘 (이미지 없을 때만) */}
        {!ad.creative.image_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-50">{isCarousel ? '🎠' : '📷'}</span>
          </div>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div className="p-4 h-2/5 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
            {ad.creative.headline}
          </h3>
          <p className="text-gray-600 text-xs line-clamp-2">
            {ad.creative.primary_text}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded">
            {ad.creative.cta_text}
          </button>
          {isCarousel && ad.creative.cards && (
            <span className="text-xs text-gray-500">
              {ad.creative.cards.length}장
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstagramPreviewView;
