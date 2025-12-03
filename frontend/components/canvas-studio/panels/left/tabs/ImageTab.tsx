/**
 * Image Tab v2 (이미지)
 *
 * AI 이미지 생성 및 관리 탭 (전면 개편)
 *
 * 핵심 설계: 두뇌/손 분리
 * - 오른쪽 ChatPanel = 두뇌 (프롬프트 대화, 명령 전송)
 * - 왼쪽 ImageTab = 눈/손 (결과 표시, Mixboard 관리)
 *
 * 기능:
 * - 이미지 그리드 (생성된 이미지 표시)
 * - Mixboard (레퍼런스 이미지 관리)
 * - 설정 바 (비율, LLM, Provider)
 * - 선택 이미지 일괄 작업
 *
 * 챗 UI 없음! (ChatPanel에서 처리)
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-03
 */

'use client';

import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { useImageTabStore } from '../../../stores/useImageTabStore';
import {
  ImageSettingsBar,
  ImageGrid,
  SelectedImagesActionBar,
  EmptyState,
  MixboardPanel,
} from '../../../components/image-tab';

export function ImageTab() {
  // Store 상태
  const generatedImages = useImageTabStore((s) => s.generatedImages);
  const selectedImageIds = useImageTabStore((s) => s.selectedImageIds);
  const isGenerating = useImageTabStore((s) => s.isGenerating);
  const isMixboardOpen = useImageTabStore((s) => s.isMixboardOpen);

  // Store 액션
  const toggleImageSelection = useImageTabStore((s) => s.toggleImageSelection);
  const addSelectedToCanvas = useImageTabStore((s) => s.addSelectedToCanvas);
  const saveSelectedAsAssets = useImageTabStore((s) => s.saveSelectedAsAssets);
  const clearSelection = useImageTabStore((s) => s.clearSelection);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-green-500" />
          <h2 className="text-sm font-semibold text-neutral-800">이미지 생성</h2>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>생성 중...</span>
          </div>
        )}
      </div>

      {/* 설정 바 */}
      <ImageSettingsBar />

      {/* Mixboard 패널 (접기/펼치기) */}
      {isMixboardOpen && <MixboardPanel />}

      {/* 생성된 이미지 그리드 */}
      <div className="flex-1 overflow-auto p-2">
        {generatedImages.length === 0 ? (
          <EmptyState />
        ) : (
          <ImageGrid
            images={generatedImages}
            selectedIds={selectedImageIds}
            onToggleSelect={toggleImageSelection}
          />
        )}
      </div>

      {/* 선택된 이미지 액션 바 */}
      {selectedImageIds.length > 0 && (
        <SelectedImagesActionBar
          count={selectedImageIds.length}
          onAddToCanvas={addSelectedToCanvas}
          onSaveAsAssets={saveSelectedAsAssets}
          onClearSelection={clearSelection}
        />
      )}

      {/* 하단 안내 */}
      <div className="p-3 border-t border-neutral-200 bg-neutral-50">
        <p className="text-[11px] text-neutral-500 text-center">
          오른쪽 채팅창에서 원하는 이미지를 설명하세요
        </p>
      </div>
    </div>
  );
}
