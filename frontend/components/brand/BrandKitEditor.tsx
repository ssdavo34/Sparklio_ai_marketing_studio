/**
 * Brand Kit Editor
 *
 * 브랜드 키트 편집 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 2.2
 */

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Upload, X, Plus, Save, Palette } from 'lucide-react';
import type { BrandKit } from '@/types/brand';

// ============================================================================
// Types
// ============================================================================

export interface BrandKitEditorProps {
  /** 초기 브랜드 키트 데이터 (편집 모드) */
  initialData?: BrandKit | null;

  /** 저장 핸들러 */
  onSave: (data: BrandKitFormData) => Promise<void>;

  /** 로딩 상태 */
  isLoading?: boolean;

  /** 클래스명 (선택) */
  className?: string;
}

export interface BrandKitFormData {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fonts: string[];
  toneKeywords: string[];
  forbiddenExpressions: string[];
  keyMessages: string[];
}

// ============================================================================
// Component
// ============================================================================

export function BrandKitEditor({
  initialData,
  onSave,
  isLoading = false,
  className = '',
}: BrandKitEditorProps) {
  // ==================== State ====================

  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || '#6366F1');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondaryColor || '#8B5CF6');
  const [accentColor, setAccentColor] = useState(initialData?.accentColor || '#EC4899');
  const [fonts, setFonts] = useState<string[]>(initialData?.fonts || []);
  const [toneKeywords, setToneKeywords] = useState<string[]>(
    initialData?.toneKeywords || []
  );
  const [forbiddenExpressions, setForbiddenExpressions] = useState<string[]>(
    initialData?.forbiddenExpressions || []
  );
  const [keyMessages, setKeyMessages] = useState<string[]>(
    initialData?.keyMessages || []
  );

  const [currentToneInput, setCurrentToneInput] = useState('');
  const [currentForbiddenInput, setCurrentForbiddenInput] = useState('');
  const [currentMessageInput, setCurrentMessageInput] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);

  // ==================== Logo Upload ====================

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 실제로는 서버 업로드 후 URL을 받아야 함
      // 여기서는 임시로 FileReader 사용
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl('');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // ==================== Tag Input Handlers ====================

  const handleToneKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentToneInput.trim()) {
      e.preventDefault();
      if (!toneKeywords.includes(currentToneInput.trim())) {
        setToneKeywords([...toneKeywords, currentToneInput.trim()]);
      }
      setCurrentToneInput('');
    }
  };

  const removeToneKeyword = (index: number) => {
    setToneKeywords(toneKeywords.filter((_, i) => i !== index));
  };

  const handleForbiddenKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentForbiddenInput.trim()) {
      e.preventDefault();
      if (!forbiddenExpressions.includes(currentForbiddenInput.trim())) {
        setForbiddenExpressions([...forbiddenExpressions, currentForbiddenInput.trim()]);
      }
      setCurrentForbiddenInput('');
    }
  };

  const removeForbiddenExpression = (index: number) => {
    setForbiddenExpressions(forbiddenExpressions.filter((_, i) => i !== index));
  };

  // ==================== Key Messages Handlers ====================

  const addKeyMessage = () => {
    if (currentMessageInput.trim()) {
      setKeyMessages([...keyMessages, currentMessageInput.trim()]);
      setCurrentMessageInput('');
    }
  };

  const removeKeyMessage = (index: number) => {
    setKeyMessages(keyMessages.filter((_, i) => i !== index));
  };

  // ==================== Save Handler ====================

  const handleSubmit = async () => {
    const data: BrandKitFormData = {
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      fonts,
      toneKeywords,
      forbiddenExpressions,
      keyMessages,
    };

    await onSave(data);
  };

  // ==================== Rendering ====================

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">브랜드 키트 편집</h2>
        <p className="text-sm text-gray-500 mt-1">
          브랜드의 시각적 아이덴티티와 톤앤매너를 설정하세요.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            브랜드 로고
          </label>
          {logoUrl ? (
            <div className="relative inline-block">
              <img
                src={logoUrl}
                alt="Brand Logo"
                className="w-32 h-32 object-contain border border-gray-300 rounded-lg"
              />
              <button
                onClick={removeLogo}
                className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => logoInputRef.current?.click()}
              className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG, SVG 파일 지원 (권장: 투명 배경 PNG)
          </p>
        </div>

        {/* Color Pickers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            브랜드 컬러
          </label>
          <div className="grid grid-cols-3 gap-4">
            {/* Primary Color */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">주 색상</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#6366F1"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">보조 색상</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#8B5CF6"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">강조 색상</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#EC4899"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tone Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            톤 & 매너 키워드
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {toneKeywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {keyword}
                <button
                  onClick={() => removeToneKeyword(index)}
                  className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={currentToneInput}
            onChange={(e) => setCurrentToneInput(e.target.value)}
            onKeyDown={handleToneKeyDown}
            placeholder="키워드 입력 후 Enter (예: 친근한, 전문적인, 혁신적인)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-2">
            브랜드의 톤앤매너를 나타내는 키워드를 추가하세요.
          </p>
        </div>

        {/* Forbidden Expressions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            금지 표현
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {forbiddenExpressions.map((expression, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {expression}
                <button
                  onClick={() => removeForbiddenExpression(index)}
                  className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={currentForbiddenInput}
            onChange={(e) => setCurrentForbiddenInput(e.target.value)}
            onKeyDown={handleForbiddenKeyDown}
            placeholder="금지 표현 입력 후 Enter (예: 저렴한, 싸구려, 최저가)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-2">
            브랜드에서 사용하지 않을 표현이나 단어를 추가하세요.
          </p>
        </div>

        {/* Key Messages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            핵심 메시지
          </label>
          {keyMessages.length > 0 && (
            <div className="space-y-2 mb-3">
              {keyMessages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <p className="flex-1 text-sm text-gray-700">{message}</p>
                  <button
                    onClick={() => removeKeyMessage(index)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={currentMessageInput}
              onChange={(e) => setCurrentMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyMessage()}
              placeholder="핵심 메시지를 입력하세요"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              onClick={addKeyMessage}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            브랜드가 전달하고자 하는 핵심 메시지를 추가하세요.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isLoading ? '저장 중...' : '브랜드 키트 저장'}
        </button>
      </div>
    </div>
  );
}
