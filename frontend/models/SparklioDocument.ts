/**
 * SparklioDocument Model
 *
 * Engine-agnostic document format for Sparklio
 * This serves as an intermediate format between different editor engines
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

// ============================================================================
// Core Types
// ============================================================================

export type ObjectType = 'text' | 'image' | 'shape' | 'video' | 'group' | 'chart' | 'table';
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'polygon' | 'star';
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter';

// ============================================================================
// Base Interfaces
// ============================================================================

/**
 * Base properties for all objects
 */
export interface BaseObject {
    id: string;
    type: ObjectType;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    visible?: boolean;
    locked?: boolean;
    zIndex?: number;
    metadata?: Record<string, any>;
}

/**
 * Text object
 */
export interface TextObject extends BaseObject {
    type: 'text';
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | 'light' | number;
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number;
    letterSpacing?: number;
    color?: string;
    backgroundColor?: string;
    underline?: boolean;
    strikethrough?: boolean;
}

/**
 * Image object
 */
export interface ImageObject extends BaseObject {
    type: 'image';
    src: string;
    alt?: string;
    fit?: 'contain' | 'cover' | 'fill' | 'none';
    filters?: {
        brightness?: number;
        contrast?: number;
        saturation?: number;
        blur?: number;
    };
}

/**
 * Shape object
 */
export interface ShapeObject extends BaseObject {
    type: 'shape';
    shapeType: ShapeType;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    cornerRadius?: number;
    points?: { x: number; y: number }[]; // For polygon and custom shapes
}

/**
 * Video object
 */
export interface VideoObject extends BaseObject {
    type: 'video';
    src: string;
    thumbnail?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    startTime?: number;
    endTime?: number;
}

/**
 * Group object (container for other objects)
 */
export interface GroupObject extends BaseObject {
    type: 'group';
    children: string[]; // Array of object IDs
}

/**
 * Chart object
 */
export interface ChartObject extends BaseObject {
    type: 'chart';
    chartType: ChartType;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor?: string | string[];
            borderColor?: string | string[];
        }[];
    };
    options?: Record<string, any>;
}

/**
 * Table object
 */
export interface TableObject extends BaseObject {
    type: 'table';
    rows: number;
    columns: number;
    cells: {
        row: number;
        col: number;
        content: string;
        style?: Partial<TextObject>;
    }[];
    borderColor?: string;
    borderWidth?: number;
    cellPadding?: number;
}

// Union type for all objects
export type SparklioObject =
    | TextObject
    | ImageObject
    | ShapeObject
    | VideoObject
    | GroupObject
    | ChartObject
    | TableObject;

// ============================================================================
// Page and Document
// ============================================================================

/**
 * Page (slide/canvas)
 */
export interface SparklioPage {
    id: string;
    name: string;
    width: number;
    height: number;
    backgroundColor?: string;
    backgroundImage?: string;
    objects: SparklioObject[];
    transitions?: {
        type: 'none' | 'fade' | 'slide' | 'zoom';
        duration?: number;
    };
    notes?: string; // Speaker notes for presentations
    order: number;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
    createdAt: string;
    updatedAt: string;
    author?: string;
    version?: string;
    tags?: string[];
    description?: string;
    thumbnail?: string;
}

/**
 * Brand Kit reference
 */
export interface BrandKit {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
        custom: { name: string; value: string }[];
    };
    fonts: {
        heading: string;
        body: string;
        custom: { name: string; family: string; url?: string }[];
    };
    logos: {
        primary: string;
        secondary?: string;
        variations: { name: string; src: string }[];
    };
}

/**
 * Document type/mode
 */
export type DocumentMode =
    | 'presentation'    // Pitch Deck
    | 'social'          // Social Media Posts
    | 'marketing'       // Marketing Materials
    | 'document'        // Documents/Reports
    | 'video'           // Video/Animation
    | 'custom';         // Custom format

/**
 * Main Document structure
 */
export interface SparklioDocument {
    id: string;
    name: string;
    mode: DocumentMode;
    pages: SparklioPage[];
    currentPageId?: string;
    metadata: DocumentMetadata;
    brandKit?: BrandKit;
    settings?: {
        grid?: boolean;
        snap?: boolean;
        rulers?: boolean;
        guidelines?: boolean;
    };
}

// ============================================================================
// Helper Types for AI Integration
// ============================================================================

/**
 * AI Command for LLM integration
 */
export interface AICommand {
    type: 'create' | 'modify' | 'delete' | 'analyze';
    target?: 'object' | 'page' | 'document';
    action: string;
    parameters?: Record<string, any>;
    context?: {
        pageId?: string;
        objectId?: string;
        selection?: string[];
    };
}

/**
 * AI Response
 */
export interface AIResponse {
    success: boolean;
    command: AICommand;
    result?: {
        objects?: SparklioObject[];
        pages?: SparklioPage[];
        message?: string;
    };
    error?: string;
}

// ============================================================================
// Export/Import Formats
// ============================================================================

export type ExportFormat = 'json' | 'pdf' | 'png' | 'svg' | 'pptx' | 'video';
export type ImportFormat = 'json' | 'pdf' | 'pptx' | 'figma' | 'sketch';

export interface ExportOptions {
    format: ExportFormat;
    quality?: number; // For image exports
    pages?: string[]; // Specific pages to export
    scale?: number;   // Export scale
}

export interface ImportOptions {
    format: ImportFormat;
    merge?: boolean; // Merge with existing document
    pageMapping?: 'append' | 'replace' | 'insert';
}