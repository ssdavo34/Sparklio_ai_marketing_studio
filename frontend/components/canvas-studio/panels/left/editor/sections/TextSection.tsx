/**
 * Text Section
 *
 * 텍스트 추가 섹션
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Type, Plus } from 'lucide-react';
import { TEXT_PRESET_GROUPS } from '../textPresets';
import type { TextPreset } from '../types';

interface TextSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onAddText: (preset?: TextPreset) => void;
}

export function TextSection({ isExpanded, onToggle, onAddText }: TextSectionProps) {
  const [activeGroup, setActiveGroup] = useState<string>('headings');

  const activePresets = TEXT_PRESET_GROUPS.find((g) => g.id === activeGroup)?.presets || [];

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
          <span className="text-sm font-medium text-gray-800">텍스트</span>
        </div>
        <Type className="w-4 h-4 text-gray-400" />
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Quick Add Button */}
          <button
            onClick={() => onAddText()}
            className="w-full flex items-center gap-2 px-3 py-2 mb-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">텍스트 추가</span>
          </button>

          {/* Group Tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {TEXT_PRESET_GROUPS.map((group) => (
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

          {/* Preset List */}
          <div className="space-y-1.5">
            {activePresets.map((preset) => (
              <TextPresetButton key={preset.id} preset={preset} onClick={() => onAddText(preset)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Text Preset Button Component
function TextPresetButton({ preset, onClick }: { preset: TextPreset; onClick: () => void }) {
  // 폰트 크기에 따른 표시 크기 계산 (최소 12px, 최대 24px)
  const displaySize = Math.min(24, Math.max(12, preset.fontSize * 0.4));

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
      title={preset.name}
    >
      <div className="flex-1 min-w-0">
        <p
          className="truncate group-hover:text-purple-700 transition-colors"
          style={{
            fontSize: `${displaySize}px`,
            fontWeight: preset.fontWeight || 'normal',
            fontFamily: preset.fontFamily || 'inherit',
            color: preset.fill || '#374151',
          }}
        >
          {preset.text}
        </p>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0">{preset.fontSize}px</span>
    </button>
  );
}

export default TextSection;
