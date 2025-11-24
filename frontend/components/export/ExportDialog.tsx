/**
 * Export Dialog
 *
 * 내보내기 다이얼로그 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 7
 */

'use client';

import { useState } from 'react';
import { Download, FileImage, FileText, Presentation, Code, X, Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'png' | 'pdf' | 'pptx' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // PNG quality (1-100)
  scale?: number; // Scale factor (1-3)
  includeBleed?: boolean; // Include bleed area
  backgroundColor?: string; // Background color for transparent areas
}

export interface ExportDialogProps {
  /** 다이얼로그 표시 여부 */
  isOpen: boolean;

  /** 닫기 핸들러 */
  onClose: () => void;

  /** 내보내기 핸들러 */
  onExport: (options: ExportOptions) => Promise<void>;

  /** 로딩 상태 */
  isLoading?: boolean;

  /** 클래스명 (선택) */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const EXPORT_FORMATS: {
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'png',
    label: 'PNG 이미지',
    description: '고품질 이미지 파일',
    icon: FileImage,
  },
  {
    value: 'pdf',
    label: 'PDF 문서',
    description: '인쇄용 문서 파일',
    icon: FileText,
  },
  {
    value: 'pptx',
    label: 'PowerPoint',
    description: 'PPT 프레젠테이션',
    icon: Presentation,
  },
  {
    value: 'html',
    label: 'HTML',
    description: '웹 페이지 코드',
    icon: Code,
  },
];

// ============================================================================
// Component
// ============================================================================

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  isLoading = false,
  className = '',
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(2);
  const [includeBleed, setIncludeBleed] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  if (!isOpen) return null;

  const handleExport = async () => {
    const options: ExportOptions = {
      format: selectedFormat,
      quality: selectedFormat === 'png' ? quality : undefined,
      scale: selectedFormat === 'png' ? scale : undefined,
      includeBleed: selectedFormat === 'pdf' || selectedFormat === 'pptx' ? includeBleed : undefined,
      backgroundColor: selectedFormat === 'png' ? backgroundColor : undefined,
    };

    await onExport(options);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">내보내기</h2>
              <p className="text-sm text-gray-500 mt-1">
                디자인을 다양한 형식으로 내보내세요
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Format Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">파일 형식</h3>
              <div className="grid grid-cols-2 gap-3">
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon;
                  const isSelected = selectedFormat === format.value;

                  return (
                    <button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      disabled={isLoading}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all
                        ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className={`w-6 h-6 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`}
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {format.label}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PNG Options */}
            {selectedFormat === 'png' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    품질: {quality}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>낮음 (작은 파일)</span>
                    <span>높음 (큰 파일)</span>
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    해상도: {scale}x
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScale(s)}
                        disabled={isLoading}
                        className={`
                          flex-1 py-2 rounded border-2 text-sm font-medium transition-colors
                          ${
                            scale === s
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }
                        `}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배경색
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PDF/PPTX Options */}
            {(selectedFormat === 'pdf' || selectedFormat === 'pptx') && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBleed}
                    onChange={(e) => setIncludeBleed(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    disabled={isLoading}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      재단선 포함
                    </span>
                    <p className="text-xs text-gray-500">
                      인쇄용 여백(bleed) 영역을 포함합니다
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* HTML Options */}
            {selectedFormat === 'html' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>HTML 내보내기:</strong> 인터랙티브 웹 페이지로 변환됩니다.
                  CSS와 이미지가 포함된 완전한 HTML 파일이 생성됩니다.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  내보내는 중...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  내보내기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
