/**
 * Theme Selector Component
 *
 * 캔버스 색상 테마 선택 UI
 * - 다양한 그라디언트 및 단색 테마 지원
 * - 실시간 미리보기
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '../stores/useCanvasStore';
import { getThemeList, type ColorTheme } from '@/types/color-themes';
import { Palette } from 'lucide-react';

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentTheme = useCanvasStore((state) => state.currentTheme);
  const setTheme = useCanvasStore((state) => state.setTheme);

  const themes = getThemeList();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeSelect = (theme: ColorTheme) => {
    setTheme(theme.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">테마</span>
        {/* Color Preview */}
        <div className="flex gap-0.5">
          {currentTheme.previewColors.map((color, index) => (
            <div
              key={index}
              className="w-4 h-4 rounded-sm border border-gray-200"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              색상 테마
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-2 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme)}
                  className={`flex flex-col gap-2 p-3 rounded-md text-left transition-all ${
                    currentTheme.id === theme.id
                      ? 'bg-indigo-50 ring-2 ring-indigo-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Theme Preview */}
                  <div className="relative w-full h-16 rounded overflow-hidden border border-gray-200">
                    {theme.type === 'gradient' ? (
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(135deg, ${theme.startColor}, ${theme.endColor})`,
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: theme.solidColor }}
                      />
                    )}
                    {/* Selected Indicator */}
                    {currentTheme.id === theme.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Theme Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {theme.name}
                      </span>
                      {theme.recommended && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded flex-shrink-0">
                          추천
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {theme.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
