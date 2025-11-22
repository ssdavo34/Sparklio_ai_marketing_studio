/**
 * Template Selector Component
 *
 * SNS 플랫폼 템플릿 선택 UI
 * - 다양한 플랫폼 크기 지원 (Instagram, Facebook, Twitter 등)
 * - 드롭다운 형태로 제공
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '../stores/useCanvasStore';
import { getTemplateList, type CanvasTemplate } from '@/types/canvas-templates';

export function TemplateSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentTemplate = useCanvasStore((state) => state.currentTemplate);
  const setTemplate = useCanvasStore((state) => state.setTemplate);

  const templates = getTemplateList();

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

  const handleTemplateSelect = (template: CanvasTemplate) => {
    setTemplate(template.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Template Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <span className="text-lg">{currentTemplate.icon}</span>
        <span className="hidden sm:inline">{currentTemplate.name}</span>
        <span className="text-xs text-gray-500 hidden md:inline">
          ({currentTemplate.aspectRatio})
        </span>
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
        <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SNS 플랫폼 템플릿
            </div>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                  currentTemplate.id === template.id
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {/* Icon */}
                <span className="text-2xl flex-shrink-0">{template.icon}</span>

                {/* Template Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{template.name}</span>
                    {template.recommended && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                        추천
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {template.width} × {template.height}px ({template.aspectRatio})
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {template.description}
                  </div>
                </div>

                {/* Selected Indicator */}
                {currentTemplate.id === template.id && (
                  <svg
                    className="w-5 h-5 text-indigo-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
