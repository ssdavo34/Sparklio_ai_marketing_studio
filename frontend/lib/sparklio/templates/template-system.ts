/**
 * Template System
 *
 * Manages document templates for quick start
 * Provides pre-designed layouts and structures
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import type { SparklioDocument, SparklioPage, SparklioObject } from '../document';
import { getBrandKitManager } from '../brand';

// ============================================================================
// Types
// ============================================================================

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  mode: 'presentation' | 'document' | 'social' | 'print';
  thumbnail?: string;
  tags?: string[];

  // Template structure
  pages: TemplatePage[];

  // Metadata
  author?: string;
  featured?: boolean;
  premium?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory =
  | 'presentation'
  | 'social-media'
  | 'marketing'
  | 'report'
  | 'proposal'
  | 'education'
  | 'event'
  | 'custom';

export interface TemplatePage {
  name: string;
  description?: string;
  width: number;
  height: number;
  objects: Partial<SparklioObject>[];
  order: number;
}

// ============================================================================
// Built-in Templates
// ============================================================================

const PRESENTATION_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'pitch-deck-modern',
    name: 'Modern Pitch Deck',
    description: '깔끔한 디자인의 투자 유치 프레젠테이션',
    category: 'presentation',
    mode: 'presentation',
    thumbnail: '/templates/pitch-deck-modern.png',
    tags: ['startup', 'investment', 'business'],
    featured: true,
    pages: [
      {
        name: 'Title Slide',
        width: 1920,
        height: 1080,
        order: 0,
        objects: [
          {
            type: 'text',
            role: 'headline',
            x: 100,
            y: 400,
            width: 1720,
            height: 200,
            content: 'Your Company Name',
            style: {
              fontSize: 72,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              color: '#111827',
              textAlign: 'left',
            },
          },
          {
            type: 'text',
            role: 'subheadline',
            x: 100,
            y: 620,
            width: 1000,
            height: 60,
            content: 'Transforming the industry with innovation',
            style: {
              fontSize: 32,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              color: '#6B7280',
              textAlign: 'left',
            },
          },
        ],
      },
      {
        name: 'Problem',
        width: 1920,
        height: 1080,
        order: 1,
        objects: [
          {
            type: 'text',
            role: 'section-title',
            x: 100,
            y: 100,
            width: 800,
            height: 100,
            content: 'The Problem',
            style: {
              fontSize: 56,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              color: '#4F46E5',
            },
          },
          {
            type: 'text',
            role: 'body',
            x: 100,
            y: 250,
            width: 800,
            height: 600,
            content: 'Describe the problem your product solves...',
            style: {
              fontSize: 24,
              fontFamily: 'Inter, sans-serif',
              color: '#374151',
              lineHeight: 1.6,
            },
          },
        ],
      },
      {
        name: 'Solution',
        width: 1920,
        height: 1080,
        order: 2,
        objects: [
          {
            type: 'text',
            role: 'section-title',
            x: 100,
            y: 100,
            width: 800,
            height: 100,
            content: 'Our Solution',
            style: {
              fontSize: 56,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              color: '#10B981',
            },
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'presentation-simple',
    name: 'Simple Presentation',
    description: '간단하고 깔끔한 프레젠테이션 템플릿',
    category: 'presentation',
    mode: 'presentation',
    tags: ['simple', 'clean', 'minimal'],
    pages: [
      {
        name: 'Cover',
        width: 1920,
        height: 1080,
        order: 0,
        objects: [
          {
            type: 'shape',
            role: 'decoration',
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            style: {
              fill: '#F3F4F6',
            },
          },
          {
            type: 'text',
            role: 'headline',
            x: 200,
            y: 450,
            width: 1520,
            height: 180,
            content: 'Presentation Title',
            style: {
              fontSize: 64,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              color: '#111827',
              textAlign: 'center',
            },
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SOCIAL_MEDIA_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    description: 'Instagram 정사각형 포스트 (1080x1080)',
    category: 'social-media',
    mode: 'social',
    tags: ['instagram', 'social', 'square'],
    featured: true,
    pages: [
      {
        name: 'Post',
        width: 1080,
        height: 1080,
        order: 0,
        objects: [
          {
            type: 'shape',
            role: 'background',
            x: 0,
            y: 0,
            width: 1080,
            height: 1080,
            style: {
              fill: '#4F46E5',
            },
          },
          {
            type: 'text',
            role: 'headline',
            x: 60,
            y: 450,
            width: 960,
            height: 180,
            content: 'Your Message Here',
            style: {
              fontSize: 64,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              color: '#FFFFFF',
              textAlign: 'center',
            },
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    description: 'Instagram 스토리 (1080x1920)',
    category: 'social-media',
    mode: 'social',
    tags: ['instagram', 'story', 'vertical'],
    pages: [
      {
        name: 'Story',
        width: 1080,
        height: 1920,
        order: 0,
        objects: [
          {
            type: 'shape',
            role: 'background',
            x: 0,
            y: 0,
            width: 1080,
            height: 1920,
            style: {
              fill: '#10B981',
            },
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MARKETING_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'flyer-a4',
    name: 'A4 Flyer',
    description: '인쇄용 A4 전단지',
    category: 'marketing',
    mode: 'print',
    tags: ['flyer', 'print', 'a4'],
    pages: [
      {
        name: 'Front',
        width: 2480, // A4 @ 300 DPI
        height: 3508,
        order: 0,
        objects: [],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// Template Manager
// ============================================================================

export class TemplateManager {
  private templates: Map<string, DocumentTemplate> = new Map();

  constructor() {
    this.loadBuiltInTemplates();
  }

  /**
   * Load built-in templates
   */
  private loadBuiltInTemplates(): void {
    const allTemplates = [
      ...PRESENTATION_TEMPLATES,
      ...SOCIAL_MEDIA_TEMPLATES,
      ...MARKETING_TEMPLATES,
    ];

    for (const template of allTemplates) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Get all templates
   */
  getAll(): DocumentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getByCategory(category: TemplateCategory): DocumentTemplate[] {
    return this.getAll().filter(t => t.category === category);
  }

  /**
   * Get featured templates
   */
  getFeatured(): DocumentTemplate[] {
    return this.getAll().filter(t => t.featured);
  }

  /**
   * Get template by ID
   */
  get(id: string): DocumentTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Create document from template
   */
  createDocument(templateId: string, title?: string): SparklioDocument {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Get brand kit for default styling
    const brandKit = getBrandKitManager().getActive();

    // Convert template pages to document pages
    const pages: SparklioPage[] = template.pages.map((tPage, index) => {
      // Apply brand colors to objects
      const objects: SparklioObject[] = tPage.objects.map((tObj, objIndex) => {
        const obj: SparklioObject = {
          id: `obj_${Date.now()}_${objIndex}`,
          type: tObj.type || 'text',
          x: tObj.x || 0,
          y: tObj.y || 0,
          width: tObj.width,
          height: tObj.height,
          rotation: tObj.rotation || 0,
          opacity: tObj.opacity || 1,
          visible: tObj.visible !== false,
          locked: tObj.locked || false,
          name: tObj.name,
          role: tObj.role,
          style: tObj.style || {},
          content: tObj.content,
          children: tObj.children || [],
        };

        // Apply brand colors if not specified
        if (obj.type === 'text' && obj.style) {
          if (!obj.style.color) {
            obj.style.color = brandKit.colors.find(c => c.category === 'neutral')?.value || '#000000';
          }
          if (!obj.style.fontFamily) {
            obj.style.fontFamily = brandKit.fonts.find(f => f.category === 'body')?.family || 'Inter, sans-serif';
          }
        }

        return obj;
      });

      return {
        id: `page_${Date.now()}_${index}`,
        name: tPage.name,
        width: tPage.width,
        height: tPage.height,
        objects,
        order: index,
      };
    });

    const document: SparklioDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || template.name,
      type: 'sparklio-doc',
      version: '2.0',
      mode: template.mode,
      pages,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'template',
      },
    };

    return document;
  }

  /**
   * Search templates
   */
  search(query: string): DocumentTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Add custom template
   */
  addCustom(template: DocumentTemplate): void {
    this.templates.set(template.id, template);
    this.saveToStorage();
  }

  /**
   * Delete custom template
   */
  deleteCustom(id: string): void {
    const template = this.templates.get(id);
    if (template && template.category === 'custom') {
      this.templates.delete(id);
      this.saveToStorage();
    }
  }

  /**
   * Save custom templates to localStorage
   */
  private saveToStorage(): void {
    try {
      const customTemplates = this.getAll().filter(t => t.category === 'custom');
      localStorage.setItem('sparklio_custom_templates', JSON.stringify(customTemplates));
    } catch (error) {
      console.error('Failed to save templates to storage:', error);
    }
  }

  /**
   * Load custom templates from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('sparklio_custom_templates');
      if (stored) {
        const customTemplates: DocumentTemplate[] = JSON.parse(stored);
        for (const template of customTemplates) {
          this.templates.set(template.id, template);
        }
      }
    } catch (error) {
      console.error('Failed to load templates from storage:', error);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: TemplateManager | null = null;

export function getTemplateManager(): TemplateManager {
  if (!managerInstance) {
    managerInstance = new TemplateManager();
  }
  return managerInstance;
}

export const templateManager = getTemplateManager();
