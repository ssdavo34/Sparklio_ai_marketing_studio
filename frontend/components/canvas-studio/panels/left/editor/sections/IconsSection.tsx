/**
 * Icons Section
 *
 * 아이콘 추가 섹션
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Smile, Search } from 'lucide-react';
import { ICON_CATEGORIES, iconSvgToDataUri } from '../icons';
import type { IconConfig, IconCategory } from '../types';

interface IconsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onAddIcon: (iconId: string, color?: string) => void;
}

export function IconsSection({ isExpanded, onToggle, onAddIcon }: IconsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<IconCategory>('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');

  const activeIcons = ICON_CATEGORIES.find((c) => c.id === activeCategory)?.icons || [];

  // 검색 필터링
  const filteredIcons = searchQuery
    ? activeIcons.filter((icon) => icon.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeIcons;

  // 색상 프리셋
  const colorPresets = ['#000000', '#374151', '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

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
          <span className="text-sm font-medium text-gray-800">아이콘</span>
        </div>
        <Smile className="w-4 h-4 text-gray-400" />
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아이콘 검색..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            />
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">색상:</span>
            <div className="flex gap-1">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-5 h-5 rounded-full border-2 transition-all
                    ${selectedColor === color ? 'border-purple-500 scale-110' : 'border-gray-200 hover:border-gray-400'}
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer"
                title="사용자 정의 색상"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1">
            {ICON_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  px-2 py-1 text-xs rounded transition-colors
                  ${activeCategory === category.id
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'}
                `}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Icon Grid */}
          <div className="grid grid-cols-5 gap-2">
            {filteredIcons.map((icon) => (
              <IconButton
                key={icon.id}
                icon={icon}
                color={selectedColor}
                onClick={() => onAddIcon(icon.id, selectedColor)}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredIcons.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">검색 결과가 없습니다</div>
          )}
        </div>
      )}
    </div>
  );
}

// Icon Button Component
function IconButton({ icon, color, onClick }: { icon: IconConfig; color: string; onClick: () => void }) {
  const previewUri = iconSvgToDataUri(icon.svg, color);

  return (
    <button
      onClick={onClick}
      className="aspect-square flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group"
      title={icon.name}
    >
      <img
        src={previewUri}
        alt={icon.name}
        className="w-5 h-5 group-hover:scale-110 transition-transform"
      />
    </button>
  );
}

export default IconsSection;
