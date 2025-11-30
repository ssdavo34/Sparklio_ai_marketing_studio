/**
 * SNS Tab (SNS 광고)
 *
 * SNS 광고 콘텐츠 생성 및 관리 탭
 * - Instagram, Facebook, Twitter, LinkedIn, YouTube 등
 * - 플랫폼별 다양한 사이즈 템플릿 제공
 * - 광고 카피 + 이미지 생성
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-30
 */

'use client';

import { useState } from 'react';
import { Share2, Plus, Instagram, Facebook, Twitter, Linkedin, Youtube, Settings2, Check } from 'lucide-react';

// 플랫폼별 사이즈 템플릿 정의
interface SizeTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  description?: string;
  recommended?: boolean;
}

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
  templates: SizeTemplate[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    hoverColor: 'hover:border-pink-300 hover:bg-pink-50',
    templates: [
      { id: 'ig-story', name: '스토리', width: 1080, height: 1920, aspectRatio: '9:16', description: '스토리, 릴스용' },
      { id: 'ig-post', name: '포스트', width: 1080, height: 1080, aspectRatio: '1:1', description: '피드용', recommended: true },
      { id: 'ig-portrait', name: '세로 포스트', width: 1080, height: 1350, aspectRatio: '4:5', description: '세로형 피드' },
      { id: 'ig-landscape', name: '가로 포스트', width: 1080, height: 566, aspectRatio: '1.91:1', description: '가로형 피드' },
      { id: 'ig-carousel', name: '캐러셀', width: 1080, height: 1080, aspectRatio: '1:1', description: '여러 이미지' },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    hoverColor: 'hover:border-blue-300 hover:bg-blue-50',
    templates: [
      { id: 'fb-post', name: '포스트', width: 1200, height: 630, aspectRatio: '1.91:1', description: '피드용', recommended: true },
      { id: 'fb-story', name: '스토리', width: 1080, height: 1920, aspectRatio: '9:16', description: '스토리용' },
      { id: 'fb-cover', name: '커버 이미지', width: 820, height: 312, aspectRatio: '2.63:1', description: '페이지 커버' },
      { id: 'fb-event', name: '이벤트 커버', width: 1920, height: 1080, aspectRatio: '16:9', description: '이벤트용' },
      { id: 'fb-ad', name: '광고', width: 1200, height: 628, aspectRatio: '1.91:1', description: '광고용' },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: Twitter,
    color: 'text-sky-500',
    hoverColor: 'hover:border-sky-300 hover:bg-sky-50',
    templates: [
      { id: 'tw-post', name: '포스트', width: 1200, height: 675, aspectRatio: '16:9', description: '트윗용', recommended: true },
      { id: 'tw-header', name: '헤더', width: 1500, height: 500, aspectRatio: '3:1', description: '프로필 헤더' },
      { id: 'tw-card', name: '카드', width: 800, height: 418, aspectRatio: '1.91:1', description: '트위터 카드' },
      { id: 'tw-square', name: '정사각형', width: 1080, height: 1080, aspectRatio: '1:1', description: '인포그래픽' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    hoverColor: 'hover:border-blue-400 hover:bg-blue-50',
    templates: [
      { id: 'li-post', name: '포스트', width: 1200, height: 627, aspectRatio: '1.91:1', description: '피드용', recommended: true },
      { id: 'li-article', name: '아티클 커버', width: 1280, height: 720, aspectRatio: '16:9', description: '아티클용' },
      { id: 'li-story', name: '스토리', width: 1080, height: 1920, aspectRatio: '9:16', description: '스토리용' },
      { id: 'li-banner', name: '배너', width: 1584, height: 396, aspectRatio: '4:1', description: '회사 페이지' },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    hoverColor: 'hover:border-red-300 hover:bg-red-50',
    templates: [
      { id: 'yt-thumbnail', name: '썸네일', width: 1280, height: 720, aspectRatio: '16:9', description: '영상 썸네일', recommended: true },
      { id: 'yt-banner', name: '채널 배너', width: 2560, height: 1440, aspectRatio: '16:9', description: '채널 아트' },
      { id: 'yt-shorts', name: 'Shorts', width: 1080, height: 1920, aspectRatio: '9:16', description: '쇼츠용' },
      { id: 'yt-endscreen', name: '엔드스크린', width: 1920, height: 1080, aspectRatio: '16:9', description: '종료 화면' },
    ],
  },
];

export function SNSTab() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ig-post');
  const [customWidth, setCustomWidth] = useState<number>(1080);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [showCustomSize, setShowCustomSize] = useState<boolean>(false);

  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform);
  const currentTemplate = currentPlatform?.templates.find(t => t.id === selectedTemplate);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowCustomSize(false);
  };

  const handleCustomSize = () => {
    setShowCustomSize(true);
    setSelectedTemplate('');
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-pink-500" />
        <h2 className="text-lg font-semibold text-neutral-800">SNS 광고</h2>
      </div>

      {/* 설명 */}
      <p className="text-sm text-neutral-600 mb-4">
        소셜 미디어용 광고 콘텐츠를 생성합니다. 플랫폼별 최적화된 사이즈를 선택하세요.
      </p>

      {/* 플랫폼 선택 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">플랫폼 선택</h3>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => {
                  setSelectedPlatform(platform.id);
                  // 첫 번째 템플릿 자동 선택
                  if (platform.templates.length > 0) {
                    const recommended = platform.templates.find(t => t.recommended);
                    setSelectedTemplate(recommended?.id || platform.templates[0].id);
                  }
                  setShowCustomSize(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg transition-all ${
                  isSelected
                    ? `border-2 ${platform.color} bg-opacity-10 bg-current`
                    : `border-neutral-200 ${platform.hoverColor}`
                }`}
              >
                <Icon className={`w-4 h-4 ${platform.color}`} />
                <span className={`text-xs font-medium ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}>
                  {platform.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 사이즈 템플릿 선택 */}
      {currentPlatform && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">
            사이즈 템플릿
          </h3>
          <div className="space-y-2">
            {currentPlatform.templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-all ${
                  selectedTemplate === template.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 미리보기 아이콘 */}
                  <div
                    className="bg-neutral-200 rounded flex items-center justify-center"
                    style={{
                      width: template.width > template.height ? 32 : 24,
                      height: template.height > template.width ? 32 : 24,
                      aspectRatio: `${template.width}/${template.height}`,
                    }}
                  >
                    <span className="text-[8px] text-neutral-500">{template.aspectRatio}</span>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-800">{template.name}</span>
                      {template.recommended && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded">추천</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {template.width} × {template.height}px · {template.description}
                    </p>
                  </div>
                </div>
                {selectedTemplate === template.id && (
                  <Check className="w-4 h-4 text-purple-600" />
                )}
              </button>
            ))}

            {/* 사용자 정의 사이즈 */}
            <button
              onClick={handleCustomSize}
              className={`w-full flex items-center justify-between p-3 border rounded-lg transition-all ${
                showCustomSize
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-200 rounded flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-neutral-800">사용자 정의</span>
                  <p className="text-xs text-neutral-500">원하는 사이즈 직접 입력</p>
                </div>
              </div>
              {showCustomSize && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
          </div>

          {/* 사용자 정의 사이즈 입력 */}
          {showCustomSize && (
            <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-neutral-600">너비 (px)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min={100}
                    max={4096}
                  />
                </div>
                <span className="text-neutral-400 mt-5">×</span>
                <div className="flex-1">
                  <label className="text-xs text-neutral-600">높이 (px)</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min={100}
                    max={4096}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 현재 선택 정보 */}
      <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg mb-4">
        <p className="text-xs font-medium text-purple-800">현재 선택</p>
        <p className="text-sm text-purple-900 mt-1">
          {currentPlatform?.name} · {showCustomSize ? `${customWidth} × ${customHeight}px` : `${currentTemplate?.name} (${currentTemplate?.width} × ${currentTemplate?.height}px)`}
        </p>
      </div>

      {/* 생성된 SNS 콘텐츠 목록 */}
      <div className="flex-1 min-h-0">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">생성된 콘텐츠</h3>
        <div className="p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50 text-center">
          <Plus className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
          <p className="text-xs text-neutral-500">아직 생성된 SNS 콘텐츠가 없습니다</p>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="mt-auto pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500">
          ConceptBoard에서 &quot;풀셋 생성&quot; 시 SNS 콘텐츠도 함께 생성됩니다.
        </p>
      </div>
    </div>
  );
}
