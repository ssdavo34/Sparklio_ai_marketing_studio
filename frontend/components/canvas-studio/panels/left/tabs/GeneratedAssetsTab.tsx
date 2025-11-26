'use client';

import { useState } from 'react';
import {
  Presentation,
  Instagram,
  FileText,
  Video,
  Lightbulb,
  ChevronRight,
  Trash2,
  RefreshCw,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useGeneratedAssetsStore } from '../../../stores/useGeneratedAssetsStore';
import { useCenterViewStore } from '../../../stores/useCenterViewStore';

type AssetType = 'all' | 'slides' | 'instagram' | 'detail' | 'shorts' | 'concept';

export function GeneratedAssetsTab() {
  const [selectedType, setSelectedType] = useState<AssetType>('all');

  const {
    slidesData,
    instagramData,
    detailData,
    shortsData,
    conceptBoardData,
    lastUpdated,
    clearAll,
  } = useGeneratedAssetsStore();

  const {
    setView,
    openSlidesPreview,
    openInstagramPreview,
    openDetailPreview,
    openShortsPreview,
    openConceptBoard,
  } = useCenterViewStore();

  // 에셋 개수 계산
  const assetCounts = {
    slides: slidesData?.slides?.length || 0,
    instagram: instagramData?.ads?.length || 0,
    detail: detailData?.sections?.length || 0,
    shorts: shortsData?.scenes?.length || 0,
    concept: conceptBoardData?.concepts?.length || 0,
  };

  const totalAssets =
    assetCounts.slides + assetCounts.instagram + assetCounts.detail + assetCounts.shorts + assetCounts.concept;

  const hasAnyAssets =
    slidesData || instagramData || detailData || shortsData || conceptBoardData;

  // 에셋 타입별 아이콘 및 색상
  const assetTypeConfig = {
    slides: { icon: Presentation, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    instagram: { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
    detail: { icon: FileText, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    shorts: { icon: Video, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    concept: { icon: Lightbulb, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  };

  // 뷰 열기 핸들러
  const handleOpenView = (type: keyof typeof assetTypeConfig) => {
    switch (type) {
      case 'slides':
        openSlidesPreview('generated', 'slides-1');
        break;
      case 'instagram':
        openInstagramPreview('generated', 'instagram-1');
        break;
      case 'detail':
        openDetailPreview('generated', 'detail-1');
        break;
      case 'shorts':
        openShortsPreview('generated', 'shorts-1');
        break;
      case 'concept':
        openConceptBoard('generated');
        break;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              생성된 에셋
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              AI가 생성한 마케팅 에셋 프리뷰
            </p>
          </div>
          {hasAnyAssets && (
            <button
              onClick={clearAll}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="전체 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {lastUpdated && (
          <p className="text-xs text-gray-400 mt-2">
            마지막 업데이트: {formatDate(lastUpdated)}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasAnyAssets ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">아직 생성된 에셋이 없습니다</p>
            <p className="text-xs text-gray-400 mt-2">
              Chat에서 AI에게 마케팅 콘텐츠를<br />
              생성 요청해보세요!
            </p>
            <div className="mt-4 p-3 bg-purple-50 rounded-lg text-left">
              <p className="text-xs text-purple-700 font-medium mb-2">예시 요청:</p>
              <ul className="text-xs text-purple-600 space-y-1">
                <li>"핸드크림 광고 만들어줘"</li>
                <li>"발표자료 5장 만들어줘"</li>
                <li>"인스타그램 광고 카피 작성해줘"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                <p className="text-2xl font-bold text-purple-600">{totalAssets}</p>
                <p className="text-xs text-purple-700">총 에셋</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-600">
                  {Object.values(assetCounts).filter((c) => c > 0).length}
                </p>
                <p className="text-xs text-gray-700">에셋 타입</p>
              </div>
            </div>

            {/* Asset Type Filter */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  selectedType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              {Object.entries(assetTypeConfig).map(([type, config]) => {
                const count = assetCounts[type as keyof typeof assetCounts];
                if (count === 0) return null;
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type as AssetType)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      selectedType === type
                        ? `${config.bg} ${config.color} ${config.border} border`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {count}
                  </button>
                );
              })}
            </div>

            {/* Asset List */}
            <div className="space-y-3">
              {/* Slides */}
              {slidesData && (selectedType === 'all' || selectedType === 'slides') && (
                <AssetCard
                  type="slides"
                  title={slidesData.title}
                  count={slidesData.slides.length}
                  unit="장"
                  config={assetTypeConfig.slides}
                  onView={() => handleOpenView('slides')}
                  preview={
                    <div className="space-y-1">
                      {slidesData.slides.slice(0, 3).map((slide, idx) => (
                        <div key={slide.id} className="text-xs text-gray-500 truncate">
                          {idx + 1}. {slide.title}
                        </div>
                      ))}
                      {slidesData.slides.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{slidesData.slides.length - 3}개 더...
                        </div>
                      )}
                    </div>
                  }
                />
              )}

              {/* Instagram */}
              {instagramData && (selectedType === 'all' || selectedType === 'instagram') && (
                <AssetCard
                  type="instagram"
                  title={instagramData.title}
                  count={instagramData.ads.length}
                  unit="개 광고"
                  config={assetTypeConfig.instagram}
                  onView={() => handleOpenView('instagram')}
                  preview={
                    <div className="space-y-1">
                      {instagramData.ads.slice(0, 2).map((ad) => (
                        <div key={ad.ad_id} className="text-xs text-gray-500 truncate">
                          [{ad.format}] {ad.creative.headline}
                        </div>
                      ))}
                      {instagramData.hashtags.length > 0 && (
                        <div className="text-xs text-pink-500 truncate">
                          {instagramData.hashtags.slice(0, 3).join(' ')}
                        </div>
                      )}
                    </div>
                  }
                />
              )}

              {/* Detail Page */}
              {detailData && (selectedType === 'all' || selectedType === 'detail') && (
                <AssetCard
                  type="detail"
                  title={detailData.title}
                  count={detailData.sections.length}
                  unit="개 섹션"
                  config={assetTypeConfig.detail}
                  onView={() => handleOpenView('detail')}
                  preview={
                    <div className="space-y-1">
                      {detailData.sections.slice(0, 3).map((section, idx) => (
                        <div key={idx} className="text-xs text-gray-500 truncate capitalize">
                          {section.section_type}
                        </div>
                      ))}
                    </div>
                  }
                />
              )}

              {/* Shorts */}
              {shortsData && (selectedType === 'all' || selectedType === 'shorts') && (
                <AssetCard
                  type="shorts"
                  title={shortsData.title}
                  count={shortsData.scenes.length}
                  unit="개 씬"
                  config={assetTypeConfig.shorts}
                  onView={() => handleOpenView('shorts')}
                  preview={
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 truncate">
                        Hook: {shortsData.hook}
                      </div>
                      {shortsData.total_duration && (
                        <div className="text-xs text-red-500">
                          총 {shortsData.total_duration}
                        </div>
                      )}
                    </div>
                  }
                />
              )}

              {/* Concept Board */}
              {conceptBoardData && (selectedType === 'all' || selectedType === 'concept') && (
                <AssetCard
                  type="concept"
                  title={conceptBoardData.campaign_name}
                  count={conceptBoardData.concepts.length}
                  unit="개 컨셉"
                  config={assetTypeConfig.concept}
                  onView={() => handleOpenView('concept')}
                  preview={
                    <div className="space-y-1">
                      {conceptBoardData.concepts.slice(0, 2).map((concept) => (
                        <div key={concept.concept_id} className="text-xs text-gray-500 truncate">
                          {concept.concept_name}
                        </div>
                      ))}
                    </div>
                  }
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Asset Card Component
interface AssetCardProps {
  type: string;
  title: string;
  count: number;
  unit: string;
  config: {
    icon: any;
    color: string;
    bg: string;
    border: string;
  };
  onView: () => void;
  preview: React.ReactNode;
}

function AssetCard({ type, title, count, unit, config, onView, preview }: AssetCardProps) {
  const Icon = config.icon;

  return (
    <div
      className={`p-3 rounded-lg border ${config.border} ${config.bg} hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-white ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
              {title}
            </h4>
            <p className={`text-xs ${config.color}`}>
              {count}{unit}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className={`p-1.5 rounded-lg bg-white ${config.color} hover:bg-gray-50 transition-colors`}
          title="프리뷰 열기"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
      <div className="pl-9">{preview}</div>
    </div>
  );
}

export default GeneratedAssetsTab;
