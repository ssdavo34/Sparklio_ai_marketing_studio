/**
 * Editor Panel
 *
 * 캔버스 편집 도구 패널
 * - 도형, 텍스트, 이미지, 아이콘 추가
 * - Undo/Redo 기능
 * - 각 섹션은 접었다 펼 수 있음
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, PencilRuler } from 'lucide-react';
import { useEditorActions } from './useEditorActions';
import { ShapesSection, TextSection, ImagesSection, IconsSection, HistorySection } from './sections';

interface EditorPanelProps {
  /** 패널 전체 접힘 상태 */
  isCollapsed?: boolean;
  /** 패널 토글 핸들러 */
  onToggleCollapse?: () => void;
}

export function EditorPanel({ isCollapsed = false, onToggleCollapse }: EditorPanelProps) {
  // 에디터 액션 훅
  const { addShape, addText, addImage, uploadImage, addIcon, undo, redo, canUndo, canRedo, polotnoStore } =
    useEditorActions();

  // 각 섹션의 확장 상태
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    shapes: true,
    text: true,
    images: false,
    icons: false,
    history: true,
  });

  // 섹션 토글
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // 새 레이아웃: 세로 리스트 (가로 탭 안에서 사용)
  // isCollapsed는 이제 사용하지 않음 (탭으로 전환)
  return (
    <div className="flex flex-col h-full bg-white">

      {/* Store Status Indicator */}
      {!polotnoStore && (
        <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-100">
          <p className="text-xs text-yellow-700">캔버스를 로드하는 중...</p>
        </div>
      )}

      {/* Sections Container */}
      <div className="flex-1 overflow-y-auto">
        {/* History Section (상단에 배치) */}
        <HistorySection
          isExpanded={expandedSections.history}
          onToggle={() => toggleSection('history')}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {/* Shapes Section */}
        <ShapesSection
          isExpanded={expandedSections.shapes}
          onToggle={() => toggleSection('shapes')}
          onAddShape={addShape}
        />

        {/* Text Section */}
        <TextSection
          isExpanded={expandedSections.text}
          onToggle={() => toggleSection('text')}
          onAddText={addText}
        />

        {/* Images Section */}
        <ImagesSection
          isExpanded={expandedSections.images}
          onToggle={() => toggleSection('images')}
          onAddImage={addImage}
          onUploadImage={uploadImage}
        />

        {/* Icons Section */}
        <IconsSection
          isExpanded={expandedSections.icons}
          onToggle={() => toggleSection('icons')}
          onAddIcon={addIcon}
        />
      </div>
    </div>
  );
}

export default EditorPanel;
