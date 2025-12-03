/**
 * Editor Actions Hook
 *
 * 에디터 동작을 위한 커스텀 훅
 * Polotno Store와 상호작용하여 요소 추가/수정/삭제
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import { useCanvasStore } from '../../../stores/useCanvasStore';
import { getCanvasStore } from '../../../polotno/polotnoStoreSingleton';
import { getShapeById, generateShapeSVG, svgToDataUri } from './shapes';
import { getTextPresetById, getDefaultTextPreset } from './textPresets';
import { getIconById, iconSvgToDataUri } from './icons';
import type { TextPreset, EditorActions } from './types';

// ============================================================================
// Hook
// ============================================================================

export function useEditorActions(): EditorActions {
  const activeCanvasType = useCanvasStore((state) => state.activeCanvasType);
  const zustandPolotnoStore = useCanvasStore((state) => state.canvases.get(state.activeCanvasType) || null);
  // 현재 활성 캔버스 타입의 store를 가져옴 (싱글톤 또는 Zustand 폴백)
  const polotnoStore = getCanvasStore(activeCanvasType) || zustandPolotnoStore;

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // History 상태 업데이트
  useEffect(() => {
    if (!polotnoStore) return;

    const updateHistoryState = () => {
      setCanUndo(polotnoStore.history?.canUndo ?? false);
      setCanRedo(polotnoStore.history?.canRedo ?? false);
    };

    updateHistoryState();

    // 변경 감지
    const unsubscribe = polotnoStore.on?.('change', updateHistoryState);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [polotnoStore]);

  // ========================================
  // Shape Actions
  // ========================================

  const addShape = useCallback(
    (shapeId: string, fill?: string) => {
      if (!polotnoStore?.activePage) {
        console.warn('[useEditorActions] No active page');
        return;
      }

      const shape = getShapeById(shapeId);
      if (!shape) {
        console.warn(`[useEditorActions] Shape not found: ${shapeId}`);
        return;
      }

      const svg = generateShapeSVG(shape, fill);
      const dataUri = svgToDataUri(svg);

      // 캔버스 중앙에 배치
      const page = polotnoStore.activePage;
      const pageWidth = typeof page.width === 'number' ? page.width : 1080;
      const pageHeight = typeof page.height === 'number' ? page.height : 1080;

      const x = (pageWidth - shape.defaultWidth) / 2;
      const y = (pageHeight - shape.defaultHeight) / 2;

      polotnoStore.activePage.addElement({
        type: 'svg',
        name: shape.name,
        x,
        y,
        width: shape.defaultWidth,
        height: shape.defaultHeight,
        src: dataUri,
        keepRatio: true,
      });

      console.log(`[useEditorActions] Added shape: ${shape.name}`);
    },
    [polotnoStore]
  );

  // ========================================
  // Text Actions
  // ========================================

  const addText = useCallback(
    (preset?: TextPreset) => {
      if (!polotnoStore?.activePage) {
        console.warn('[useEditorActions] No active page');
        return;
      }

      const textPreset = preset || getDefaultTextPreset();

      // 캔버스 중앙에 배치
      const page = polotnoStore.activePage;
      const pageWidth = typeof page.width === 'number' ? page.width : 1080;
      const pageHeight = typeof page.height === 'number' ? page.height : 1080;

      const estimatedWidth = textPreset.text.length * textPreset.fontSize * 0.6;
      const x = Math.max(50, (pageWidth - estimatedWidth) / 2);
      const y = (pageHeight - textPreset.fontSize) / 2;

      polotnoStore.activePage.addElement({
        type: 'text',
        name: textPreset.name,
        x,
        y,
        text: textPreset.text,
        fontSize: textPreset.fontSize,
        fontFamily: textPreset.fontFamily || 'Pretendard',
        fontWeight: textPreset.fontWeight || 'normal',
        fill: textPreset.fill || '#000000',
        width: Math.max(200, estimatedWidth),
      });

      console.log(`[useEditorActions] Added text: ${textPreset.name}`);
    },
    [polotnoStore]
  );

  const addTextByPresetId = useCallback(
    (presetId: string) => {
      const preset = getTextPresetById(presetId);
      addText(preset);
    },
    [addText]
  );

  // ========================================
  // Image Actions
  // ========================================

  const addImage = useCallback(
    (src: string, name?: string) => {
      if (!polotnoStore?.activePage) {
        console.warn('[useEditorActions] No active page');
        return;
      }

      // 캔버스 중앙에 배치
      const page = polotnoStore.activePage;
      const pageWidth = typeof page.width === 'number' ? page.width : 1080;
      const pageHeight = typeof page.height === 'number' ? page.height : 1080;

      const imageWidth = Math.min(400, pageWidth * 0.5);
      const imageHeight = Math.min(400, pageHeight * 0.5);

      const x = (pageWidth - imageWidth) / 2;
      const y = (pageHeight - imageHeight) / 2;

      polotnoStore.activePage.addElement({
        type: 'image',
        name: name || 'Image',
        x,
        y,
        width: imageWidth,
        height: imageHeight,
        src,
        keepRatio: true,
      });

      console.log(`[useEditorActions] Added image`);
    },
    [polotnoStore]
  );

  const uploadImage = useCallback(() => {
    // 파일 선택 다이얼로그 열기
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          addImage(dataUrl, file.name);
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }, [addImage]);

  // ========================================
  // Icon Actions
  // ========================================

  const addIcon = useCallback(
    (iconId: string, color?: string) => {
      if (!polotnoStore?.activePage) {
        console.warn('[useEditorActions] No active page');
        return;
      }

      const icon = getIconById(iconId);
      if (!icon) {
        console.warn(`[useEditorActions] Icon not found: ${iconId}`);
        return;
      }

      const dataUri = iconSvgToDataUri(icon.svg, color || '#000000');

      // 캔버스 중앙에 배치
      const page = polotnoStore.activePage;
      const pageWidth = typeof page.width === 'number' ? page.width : 1080;
      const pageHeight = typeof page.height === 'number' ? page.height : 1080;

      const iconSize = 80;
      const x = (pageWidth - iconSize) / 2;
      const y = (pageHeight - iconSize) / 2;

      polotnoStore.activePage.addElement({
        type: 'svg',
        name: icon.name,
        x,
        y,
        width: iconSize,
        height: iconSize,
        src: dataUri,
        keepRatio: true,
      });

      console.log(`[useEditorActions] Added icon: ${icon.name}`);
    },
    [polotnoStore]
  );

  // ========================================
  // History Actions
  // ========================================

  const undo = useCallback(() => {
    if (!polotnoStore?.history) {
      console.warn('[useEditorActions] No history available');
      return;
    }

    if (polotnoStore.history.canUndo) {
      polotnoStore.history.undo();
      console.log('[useEditorActions] Undo');
    }
  }, [polotnoStore]);

  const redo = useCallback(() => {
    if (!polotnoStore?.history) {
      console.warn('[useEditorActions] No history available');
      return;
    }

    if (polotnoStore.history.canRedo) {
      polotnoStore.history.redo();
      console.log('[useEditorActions] Redo');
    }
  }, [polotnoStore]);

  // ========================================
  // Return Actions
  // ========================================

  return {
    addShape,
    addText,
    addImage,
    uploadImage,
    addIcon,
    undo,
    redo,
    canUndo,
    canRedo,
    polotnoStore,
  };
}

export default useEditorActions;
