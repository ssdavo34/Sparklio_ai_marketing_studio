/**
 * Shapes Section
 *
 * 도형 추가 섹션
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BASIC_SHAPES, ARROW_SHAPES, CALLOUT_SHAPES, generateShapeSVG, svgToDataUri } from '../shapes';
import type { ShapeConfig } from '../types';

interface ShapesSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onAddShape: (shapeId: string) => void;
}

// Shape 그룹 정의
const SHAPE_GROUPS = [
  { id: 'basic', name: '기본 도형', shapes: BASIC_SHAPES },
  { id: 'arrows', name: '화살표', shapes: ARROW_SHAPES },
  { id: 'callouts', name: '말풍선', shapes: CALLOUT_SHAPES },
];

export function ShapesSection({ isExpanded, onToggle, onAddShape }: ShapesSectionProps) {
  const [activeGroup, setActiveGroup] = useState<string>('basic');

  const activeShapes = SHAPE_GROUPS.find((g) => g.id === activeGroup)?.shapes || BASIC_SHAPES;

  return (
    <div className="border-b border-gray-200">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-800">도형</span>
        </div>
        <span className="text-xs text-gray-400">{BASIC_SHAPES.length + ARROW_SHAPES.length + CALLOUT_SHAPES.length}</span>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Group Tabs */}
          <div className="flex gap-1 mb-3">
            {SHAPE_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                className={`
                  px-2 py-1 text-xs rounded transition-colors
                  ${activeGroup === group.id
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'}
                `}
              >
                {group.name}
              </button>
            ))}
          </div>

          {/* Shape Grid */}
          <div className="grid grid-cols-4 gap-2">
            {activeShapes.map((shape) => (
              <ShapeButton key={shape.id} shape={shape} onClick={() => onAddShape(shape.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Shape Button Component
function ShapeButton({ shape, onClick }: { shape: ShapeConfig; onClick: () => void }) {
  const previewSvg = generateShapeSVG(shape, shape.defaultFill);
  const previewUri = svgToDataUri(previewSvg);

  return (
    <button
      onClick={onClick}
      className="aspect-square flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group"
      title={shape.name}
    >
      <img
        src={previewUri}
        alt={shape.name}
        className="w-full h-full object-contain group-hover:scale-110 transition-transform"
        style={{ maxWidth: '32px', maxHeight: '32px' }}
      />
    </button>
  );
}

export default ShapesSection;
