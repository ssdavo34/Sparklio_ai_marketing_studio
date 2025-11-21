/**
 * Brand Kit System
 *
 * Manages brand identity assets (colors, fonts, logos, etc.)
 * for consistent design across all documents
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

// ============================================================================
// Types
// ============================================================================

export interface BrandColor {
  id: string;
  name: string;
  value: string; // Hex color
  category: 'primary' | 'secondary' | 'accent' | 'neutral' | 'custom';
  usage?: string; // Description of when to use this color
}

export interface BrandFont {
  id: string;
  name: string;
  family: string; // CSS font-family value
  weights: number[]; // Available font weights (400, 700, etc.)
  category: 'heading' | 'body' | 'display' | 'mono' | 'custom';
  fallback?: string; // Fallback font family
  url?: string; // URL to font file or Google Fonts link
}

export interface BrandLogo {
  id: string;
  name: string;
  url: string;
  type: 'primary' | 'secondary' | 'icon' | 'wordmark' | 'custom';
  format: 'svg' | 'png' | 'jpg';
  width?: number;
  height?: number;
  variants?: {
    light?: string; // URL for light background
    dark?: string; // URL for dark background
    color?: string; // Full color version
    monochrome?: string; // Black & white version
  };
}

export interface BrandAsset {
  id: string;
  name: string;
  type: 'image' | 'icon' | 'pattern' | 'texture';
  url: string;
  tags?: string[];
  category?: string;
}

export interface BrandGuidelines {
  spacing?: {
    unit: number; // Base spacing unit (e.g., 8px)
    scale: number[]; // Spacing scale (e.g., [4, 8, 16, 24, 32, 48, 64])
  };
  borderRadius?: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
  typography?: {
    baseSize: number;
    scale: number; // Type scale ratio (e.g., 1.25 for major third)
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  shadows?: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface BrandKit {
  id: string;
  name: string;
  description?: string;

  // Core identity
  colors: BrandColor[];
  fonts: BrandFont[];
  logos: BrandLogo[];

  // Additional assets
  assets?: BrandAsset[];

  // Design guidelines
  guidelines?: BrandGuidelines;

  // Metadata
  industry?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

// ============================================================================
// Default Brand Kit
// ============================================================================

export const DEFAULT_BRAND_KIT: BrandKit = {
  id: 'default',
  name: 'Default Brand',
  description: 'Default Sparklio brand identity',

  colors: [
    {
      id: 'primary',
      name: 'Primary Blue',
      value: '#4F46E5',
      category: 'primary',
      usage: 'Main brand color for CTAs and important elements',
    },
    {
      id: 'secondary',
      name: 'Secondary Purple',
      value: '#7C3AED',
      category: 'secondary',
      usage: 'Secondary actions and accents',
    },
    {
      id: 'accent',
      name: 'Accent Green',
      value: '#10B981',
      category: 'accent',
      usage: 'Success states and positive actions',
    },
    {
      id: 'neutral-900',
      name: 'Dark Gray',
      value: '#111827',
      category: 'neutral',
      usage: 'Primary text color',
    },
    {
      id: 'neutral-500',
      name: 'Medium Gray',
      value: '#6B7280',
      category: 'neutral',
      usage: 'Secondary text and borders',
    },
    {
      id: 'neutral-100',
      name: 'Light Gray',
      value: '#F3F4F6',
      category: 'neutral',
      usage: 'Backgrounds and subtle elements',
    },
  ],

  fonts: [
    {
      id: 'heading',
      name: 'Inter',
      family: 'Inter, sans-serif',
      weights: [400, 600, 700, 800],
      category: 'heading',
      fallback: 'system-ui, -apple-system, sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap',
    },
    {
      id: 'body',
      name: 'Inter',
      family: 'Inter, sans-serif',
      weights: [400, 500, 600],
      category: 'body',
      fallback: 'system-ui, -apple-system, sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
    },
    {
      id: 'mono',
      name: 'JetBrains Mono',
      family: 'JetBrains Mono, monospace',
      weights: [400, 700],
      category: 'mono',
      fallback: 'Consolas, Monaco, monospace',
      url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
    },
  ],

  logos: [
    {
      id: 'primary-logo',
      name: 'Sparklio Logo',
      url: '/assets/logos/sparklio-primary.svg',
      type: 'primary',
      format: 'svg',
      variants: {
        light: '/assets/logos/sparklio-light.svg',
        dark: '/assets/logos/sparklio-dark.svg',
        color: '/assets/logos/sparklio-color.svg',
      },
    },
  ],

  guidelines: {
    spacing: {
      unit: 8,
      scale: [4, 8, 12, 16, 24, 32, 48, 64, 96],
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 16,
      full: 9999,
    },
    typography: {
      baseSize: 16,
      scale: 1.25,
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    shadows: {
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      large: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
  },

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDefault: true,
};

// ============================================================================
// Brand Kit Manager
// ============================================================================

export class BrandKitManager {
  private brandKits: Map<string, BrandKit> = new Map();
  private activeBrandKit: string | null = null;

  constructor() {
    // Load default brand kit
    this.brandKits.set(DEFAULT_BRAND_KIT.id, DEFAULT_BRAND_KIT);
    this.activeBrandKit = DEFAULT_BRAND_KIT.id;

    // Load from localStorage
    this.loadFromStorage();
  }

  /**
   * Get the active brand kit
   */
  getActive(): BrandKit {
    const id = this.activeBrandKit || DEFAULT_BRAND_KIT.id;
    return this.brandKits.get(id) || DEFAULT_BRAND_KIT;
  }

  /**
   * Set active brand kit
   */
  setActive(id: string): void {
    if (this.brandKits.has(id)) {
      this.activeBrandKit = id;
      this.saveToStorage();
    }
  }

  /**
   * Get all brand kits
   */
  getAll(): BrandKit[] {
    return Array.from(this.brandKits.values());
  }

  /**
   * Get brand kit by ID
   */
  get(id: string): BrandKit | undefined {
    return this.brandKits.get(id);
  }

  /**
   * Add or update brand kit
   */
  save(brandKit: BrandKit): void {
    brandKit.updatedAt = new Date().toISOString();
    this.brandKits.set(brandKit.id, brandKit);
    this.saveToStorage();
  }

  /**
   * Delete brand kit
   */
  delete(id: string): void {
    if (id === DEFAULT_BRAND_KIT.id) {
      throw new Error('Cannot delete default brand kit');
    }
    this.brandKits.delete(id);
    if (this.activeBrandKit === id) {
      this.activeBrandKit = DEFAULT_BRAND_KIT.id;
    }
    this.saveToStorage();
  }

  /**
   * Get colors from active brand kit
   */
  getColors(): BrandColor[] {
    return this.getActive().colors;
  }

  /**
   * Get fonts from active brand kit
   */
  getFonts(): BrandFont[] {
    return this.getActive().fonts;
  }

  /**
   * Get logos from active brand kit
   */
  getLogos(): BrandLogo[] {
    return this.getActive().logos;
  }

  /**
   * Get primary color
   */
  getPrimaryColor(): BrandColor | undefined {
    return this.getColors().find(c => c.category === 'primary');
  }

  /**
   * Get heading font
   */
  getHeadingFont(): BrandFont | undefined {
    return this.getFonts().find(f => f.category === 'heading');
  }

  /**
   * Get body font
   */
  getBodyFont(): BrandFont | undefined {
    return this.getFonts().find(f => f.category === 'body');
  }

  /**
   * Load brand kits from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('sparklio_brand_kits');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.kits) {
          for (const kit of data.kits) {
            this.brandKits.set(kit.id, kit);
          }
        }
        if (data.activeId) {
          this.activeBrandKit = data.activeId;
        }
      }
    } catch (error) {
      console.error('Failed to load brand kits from storage:', error);
    }
  }

  /**
   * Save brand kits to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        kits: Array.from(this.brandKits.values()),
        activeId: this.activeBrandKit,
      };
      localStorage.setItem('sparklio_brand_kits', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save brand kits to storage:', error);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: BrandKitManager | null = null;

export function getBrandKitManager(): BrandKitManager {
  if (!managerInstance) {
    managerInstance = new BrandKitManager();
  }
  return managerInstance;
}

// Export default instance
export const brandKitManager = getBrandKitManager();
