/**
 * Brand Kit Panel Component
 *
 * Displays and manages brand identity assets in the editor
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import { Palette, Type, Image, Droplet, Plus, Check, Edit2, Trash2 } from 'lucide-react';
import type { BrandKit, BrandColor, BrandFont, BrandLogo } from '@/lib/sparklio/brand/brand-kit';
import { getBrandKitManager } from '@/lib/sparklio/brand/brand-kit';

// ============================================================================
// Color Palette Component
// ============================================================================

interface ColorPaletteProps {
  colors: BrandColor[];
  onSelect?: (color: BrandColor) => void;
  selectedColor?: string;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, onSelect, selectedColor }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Palette className="w-4 h-4" />
        Brand Colors
      </div>

      <div className="grid grid-cols-2 gap-2">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => onSelect?.(color)}
            className={`
              group relative flex items-center gap-3 p-2 rounded-lg border-2 transition-all
              hover:border-indigo-400 hover:shadow-sm
              ${selectedColor === color.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}
            `}
          >
            <div
              className="w-10 h-10 rounded-md shadow-sm ring-1 ring-slate-900/10"
              style={{ backgroundColor: color.value }}
            />
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-medium text-slate-900 truncate">
                {color.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {color.value.toUpperCase()}
              </div>
            </div>
            {selectedColor === color.value && (
              <Check className="w-4 h-4 text-indigo-600 absolute top-2 right-2" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Font List Component
// ============================================================================

interface FontListProps {
  fonts: BrandFont[];
  onSelect?: (font: BrandFont) => void;
  selectedFont?: string;
}

const FontList: React.FC<FontListProps> = ({ fonts, onSelect, selectedFont }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Type className="w-4 h-4" />
        Brand Fonts
      </div>

      <div className="space-y-2">
        {fonts.map((font) => (
          <button
            key={font.id}
            onClick={() => onSelect?.(font)}
            className={`
              w-full text-left p-3 rounded-lg border-2 transition-all
              hover:border-indigo-400 hover:shadow-sm
              ${selectedFont === font.family ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-slate-900">
                {font.name}
              </div>
              <div className="px-2 py-0.5 bg-slate-100 text-[10px] font-medium text-slate-600 rounded">
                {font.category}
              </div>
            </div>
            <div
              className="text-lg text-slate-700"
              style={{ fontFamily: font.family }}
            >
              The quick brown fox jumps
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Weights: {font.weights.join(', ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Logo Gallery Component
// ============================================================================

interface LogoGalleryProps {
  logos: BrandLogo[];
  onSelect?: (logo: BrandLogo) => void;
}

const LogoGallery: React.FC<LogoGalleryProps> = ({ logos, onSelect }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Image className="w-4 h-4" />
        Brand Logos
      </div>

      <div className="grid grid-cols-2 gap-3">
        {logos.map((logo) => (
          <button
            key={logo.id}
            onClick={() => onSelect?.(logo)}
            className="group relative aspect-square rounded-lg border-2 border-slate-200 bg-white p-4 hover:border-indigo-400 hover:shadow-sm transition-all"
          >
            <div className="w-full h-full flex items-center justify-center">
              {logo.url.endsWith('.svg') ? (
                <div className="text-4xl">🎨</div>
              ) : (
                <img
                  src={logo.url}
                  alt={logo.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                  }}
                />
              )}
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-xs font-medium text-slate-700 truncate">
              {logo.name}
            </div>
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-white rounded text-[10px] font-medium text-slate-600 border border-slate-200">
              {logo.type}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main Brand Kit Panel
// ============================================================================

export interface BrandKitPanelProps {
  onColorSelect?: (color: BrandColor) => void;
  onFontSelect?: (font: BrandFont) => void;
  onLogoSelect?: (logo: BrandLogo) => void;
}

export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({
  onColorSelect,
  onFontSelect,
  onLogoSelect,
}) => {
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [activeTab, setActiveTab] = useState<'colors' | 'fonts' | 'logos'>('colors');

  useEffect(() => {
    const manager = getBrandKitManager();
    setBrandKit(manager.getActive());
  }, []);

  if (!brandKit) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-2">
          <Droplet className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="text-sm text-slate-600">Loading brand kit...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Brand Kit</h3>
          <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
            <Edit2 className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Brand Name */}
        <div className="text-xs text-slate-600">
          {brandKit.name}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-2">
        <button
          onClick={() => setActiveTab('colors')}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            ${activeTab === 'colors'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          <Palette className="w-4 h-4" />
          Colors
        </button>
        <button
          onClick={() => setActiveTab('fonts')}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            ${activeTab === 'fonts'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          <Type className="w-4 h-4" />
          Fonts
        </button>
        <button
          onClick={() => setActiveTab('logos')}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            ${activeTab === 'logos'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          <Image className="w-4 h-4" />
          Logos
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'colors' && (
          <ColorPalette
            colors={brandKit.colors}
            onSelect={onColorSelect}
          />
        )}

        {activeTab === 'fonts' && (
          <FontList
            fonts={brandKit.fonts}
            onSelect={onFontSelect}
          />
        )}

        {activeTab === 'logos' && (
          <LogoGallery
            logos={brandKit.logos}
            onSelect={onLogoSelect}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Plus className="w-4 h-4" />
          Add {activeTab === 'colors' ? 'Color' : activeTab === 'fonts' ? 'Font' : 'Logo'}
        </button>
      </div>
    </div>
  );
};

export default BrandKitPanel;
