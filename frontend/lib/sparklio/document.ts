/**
 * Sparklio Document Model - Enhanced Version
 *
 * Core document model for Sparklio Canvas Studio
 * Engine-agnostic format that can be adapted to any editor
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-21
 */

// ============================================================================
// Object Role System (for AI understanding)
// ============================================================================

export type ObjectRole =
  // Text Roles
  | 'headline'
  | 'subheadline'
  | 'body'
  | 'caption'
  | 'quote'
  | 'price'
  | 'discount'
  | 'cta-text'
  | 'label'
  | 'date'
  | 'author'

  // Image Roles
  | 'product-image'
  | 'hero-image'
  | 'background-image'
  | 'logo'
  | 'icon'
  | 'thumbnail'
  | 'avatar'
  | 'before-after'

  // Interactive Roles
  | 'cta-button'
  | 'link'
  | 'form-input'
  | 'social-icon'

  // Decorative Roles
  | 'badge'
  | 'divider'
  | 'decoration'
  | 'background-shape'

  // Structural Roles
  | 'container'
  | 'section'
  | 'card'
  | 'grid-item';

// ============================================================================
// Core Types
// ============================================================================

export type ObjectType =
  | 'text'
  | 'image'
  | 'shape'
  | 'video'
  | 'group'
  | 'chart'
  | 'table'
  | 'component'  // Added for reusable components
  | 'frame';     // Added for frames/artboards

export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'line'
  | 'polygon'
  | 'star'
  | 'arrow'      // Added
  | 'speech-bubble'; // Added

export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'donut'
  | 'area'
  | 'scatter'
  | 'radar'      // Added
  | 'heatmap';   // Added

// ============================================================================
// Style System
// ============================================================================

export interface Shadow {
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: string;
  inset?: boolean;
}

export interface Gradient {
  type: 'linear' | 'radial' | 'conic';
  stops: { offset: number; color: string }[];
  angle?: number; // For linear
  centerX?: number; // For radial
  centerY?: number; // For radial
}

export interface Border {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  color: string;
  radius?: number | [number, number, number, number]; // top-left, top-right, bottom-right, bottom-left
}

export interface Transform {
  translateX?: number;
  translateY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  skewX?: number;
  skewY?: number;
  originX?: 'left' | 'center' | 'right' | number;
  originY?: 'top' | 'center' | 'bottom' | number;
}

// ============================================================================
// Base Object with Enhanced Properties
// ============================================================================

export interface BaseObject {
  id: string;
  type: ObjectType;
  role?: ObjectRole;        // AI-understandable role
  name?: string;

  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;

  // Transform
  transform?: Transform;

  // Visual Properties
  opacity?: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
  visible?: boolean;

  // Interaction
  locked?: boolean;
  selectable?: boolean;
  draggable?: boolean;

  // Hierarchy
  zIndex?: number;
  parentId?: string;        // For nested objects

  // Effects
  shadow?: Shadow | Shadow[];
  blur?: number;

  // Animation (for future)
  animation?: {
    type: 'fade' | 'slide' | 'scale' | 'rotate' | 'custom';
    duration: number;
    delay?: number;
    easing?: string;
  };

  // Metadata
  metadata?: {
    source?: 'ai' | 'user' | 'template' | 'import';
    createdBy?: string;
    createdAt?: string;
    tags?: string[];
    custom?: Record<string, any>;
  };
}

// ============================================================================
// Text Object with Rich Text Support
// ============================================================================

export interface TextSpan {
  text: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    fontStyle?: 'normal' | 'italic';
    color?: string;
    backgroundColor?: string;
    underline?: boolean;
    strikethrough?: boolean;
  };
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  richText?: TextSpan[];    // For rich text support

  // Typography
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'light' | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

  // Colors
  color?: string;
  backgroundColor?: string;
  gradient?: Gradient;

  // Decorations
  underline?: boolean;
  strikethrough?: boolean;

  // Advanced
  textPath?: string;        // SVG path for text on path
  maxWidth?: number;        // For text wrapping
  ellipsis?: boolean;       // Text overflow handling
}

// ============================================================================
// Image Object with Advanced Filters
// ============================================================================

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;
  alt?: string;

  // Fitting
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  position?: string;        // CSS background-position style

  // Filters
  filters?: {
    brightness?: number;    // 0-200
    contrast?: number;      // 0-200
    saturation?: number;    // 0-200
    hue?: number;          // -180 to 180
    blur?: number;         // 0-100px
    grayscale?: number;    // 0-100
    sepia?: number;        // 0-100
    invert?: number;       // 0-100
  };

  // Cropping
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Masking
  mask?: {
    type: 'circle' | 'rectangle' | 'polygon' | 'path';
    data: any;
  };
}

// ============================================================================
// Shape Object with Enhanced Properties
// ============================================================================

export interface ShapeObject extends BaseObject {
  type: 'shape';
  shapeType: ShapeType;

  // Fill
  fill?: string | Gradient;

  // Stroke
  stroke?: string | Gradient;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  strokeDasharray?: number[];
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';

  // Shape-specific
  cornerRadius?: number | [number, number, number, number];
  points?: { x: number; y: number }[]; // For polygon/star
  sides?: number;          // For polygon/star
  innerRadius?: number;    // For star
}

// ============================================================================
// Component Object (Reusable instances)
// ============================================================================

export interface ComponentObject extends BaseObject {
  type: 'component';
  componentId: string;      // Reference to component definition
  overrides?: {
    [objectId: string]: Partial<SparklioObject>;
  };
}

// ============================================================================
// Frame Object (Artboard/Container)
// ============================================================================

export interface FrameObject extends BaseObject {
  type: 'frame';
  clipContent?: boolean;
  backgroundColor?: string | Gradient;
  border?: Border;
  padding?: number | [number, number, number, number];
  layout?: {
    type: 'none' | 'flex' | 'grid';
    direction?: 'row' | 'column';
    gap?: number;
    align?: string;
    justify?: string;
  };
}

// ============================================================================
// Video Object
// ============================================================================

export interface VideoObject extends BaseObject {
  type: 'video';
  src: string;
  thumbnail?: string;
  poster?: string;

  // Playback
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playbackRate?: number;

  // Trimming
  startTime?: number;
  endTime?: number;

  // Volume
  volume?: number;         // 0-1
}

// ============================================================================
// Union Types
// ============================================================================

export type SparklioObject =
  | TextObject
  | ImageObject
  | ShapeObject
  | VideoObject
  | GroupObject
  | ChartObject
  | TableObject
  | ComponentObject
  | FrameObject;

// ============================================================================
// Group Object
// ============================================================================

export interface GroupObject extends BaseObject {
  type: 'group';
  children: string[];      // Array of object IDs
  layout?: {
    type: 'none' | 'flex' | 'grid';
    direction?: 'row' | 'column';
    gap?: number;
  };
}

// ============================================================================
// Chart Object
// ============================================================================

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
      borderWidth?: number;
    }[];
  };
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    title?: { display: boolean; text: string };
    legend?: { display: boolean; position: string };
    scales?: Record<string, any>;
  };
  theme?: 'light' | 'dark' | 'custom';
}

// ============================================================================
// Table Object
// ============================================================================

export interface TableCell {
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
  content: string | TextSpan[];
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    padding?: number;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
  };
}

export interface TableObject extends BaseObject {
  type: 'table';
  rows: number;
  columns: number;
  cells: TableCell[];

  // Table styling
  borderColor?: string;
  borderWidth?: number;
  borderCollapse?: 'collapse' | 'separate';
  cellSpacing?: number;
  cellPadding?: number;

  // Header/Footer
  headerRows?: number;
  footerRows?: number;

  // Column widths
  columnWidths?: number[];
  rowHeights?: number[];
}

// ============================================================================
// Page with Enhanced Properties
// ============================================================================

export interface SparklioPage {
  id: string;
  name: string;

  // Dimensions
  width: number;
  height: number;

  // Background
  backgroundColor?: string | Gradient;
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';

  // Objects
  objects: SparklioObject[];

  // Grid & Guides
  grid?: {
    enabled: boolean;
    size: number;
    color?: string;
    snap?: boolean;
  };
  guides?: {
    horizontal: number[];
    vertical: number[];
    color?: string;
    snap?: boolean;
  };

  // Page metadata
  transitions?: {
    type: 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
    duration?: number;
    direction?: 'left' | 'right' | 'up' | 'down';
  };
  notes?: string;          // Speaker notes
  order: number;
  locked?: boolean;
  visible?: boolean;
}

// ============================================================================
// Document with Full Structure
// ============================================================================

export interface SparklioDocument {
  id: string;
  title: string;
  type: 'sparklio-doc';
  version: '2.0';

  // Pages
  pages: SparklioPage[];
  currentPageId?: string;

  // Document type
  mode: DocumentMode;

  // Metadata
  metadata: {
    createdAt: string;
    updatedAt: string;
    author?: string;
    collaborators?: string[];
    tags?: string[];
    description?: string;
    thumbnail?: string;
    source?: 'spark-chat' | 'meeting' | 'template' | 'manual' | 'import';
  };

  // Brand Kit
  brandKit?: BrandKit;

  // Component Library
  components?: {
    [id: string]: {
      name: string;
      description?: string;
      objects: SparklioObject[];
      thumbnail?: string;
    };
  };

  // Document Settings
  settings?: {
    grid?: boolean;
    snap?: boolean;
    rulers?: boolean;
    guidelines?: boolean;
    darkMode?: boolean;
    autoSave?: boolean;
    collaborationEnabled?: boolean;
  };

  // History (for undo/redo)
  history?: {
    maxSteps?: number;
    currentStep?: number;
  };
}

// ============================================================================
// Document Types
// ============================================================================

export type DocumentMode =
  | 'presentation'    // Pitch Deck, Slides
  | 'social'         // Social Media Posts
  | 'marketing'      // Marketing Materials
  | 'document'       // Documents, Reports
  | 'video'         // Video, Animation
  | 'print'         // Print Materials
  | 'web'           // Web Graphics
  | 'custom';       // Custom format

// ============================================================================
// Brand Kit
// ============================================================================

export interface BrandKit {
  id?: string;
  name?: string;

  // Colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    error?: string;
    warning?: string;
    success?: string;
    info?: string;
    custom: {
      id: string;
      name: string;
      value: string;
      usage?: string;
    }[];
  };

  // Typography
  fonts: {
    heading: string;
    subheading?: string;
    body: string;
    caption?: string;
    custom: {
      id: string;
      name: string;
      family: string;
      url?: string;
      weights?: number[];
    }[];
  };

  // Logos
  logos: {
    primary: string;
    secondary?: string;
    icon?: string;
    wordmark?: string;
    variations: {
      id: string;
      name: string;
      src: string;
      usage?: string;
    }[];
  };

  // Templates
  templates?: {
    [key: string]: SparklioPage;
  };
}

// ============================================================================
// AI Integration Types
// ============================================================================

export interface AICommand {
  id?: string;
  type: 'create' | 'modify' | 'delete' | 'analyze' | 'suggest';
  target: 'object' | 'page' | 'document' | 'selection';
  action: string;

  // Natural language description
  description?: string;

  // Structured parameters
  parameters?: {
    objectType?: ObjectType;
    objectRole?: ObjectRole;
    properties?: Partial<SparklioObject>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    style?: Record<string, any>;
    content?: string;
    [key: string]: any;
  };

  // Context
  context?: {
    pageId?: string;
    objectId?: string;
    selection?: string[];
    previousCommands?: string[];
  };

  // Confidence score (from AI)
  confidence?: number;
}

export interface AIResponse {
  commandId?: string;
  success: boolean;
  command: AICommand;

  // Results
  result?: {
    objects?: SparklioObject[];
    pages?: SparklioPage[];
    document?: Partial<SparklioDocument>;
    message?: string;
    suggestions?: AICommand[];
  };

  // Error handling
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  // Performance metrics
  metrics?: {
    processingTime?: number;
    modelUsed?: string;
    tokensUsed?: number;
  };
}

// ============================================================================
// Export/Import
// ============================================================================

export type ExportFormat =
  | 'json'          // Native format
  | 'pdf'           // PDF document
  | 'png'           // PNG image
  | 'jpg'           // JPEG image
  | 'svg'           // SVG vector
  | 'pptx'          // PowerPoint
  | 'mp4'           // Video
  | 'gif'           // Animated GIF
  | 'html';         // HTML/CSS

export type ImportFormat =
  | 'json'          // Native format
  | 'pdf'           // PDF import
  | 'pptx'          // PowerPoint
  | 'figma'         // Figma
  | 'sketch'        // Sketch
  | 'psd'           // Photoshop
  | 'ai';           // Illustrator

export interface ExportOptions {
  format: ExportFormat;
  quality?: number;         // 0-100 for images
  pages?: string[];        // Specific pages
  scale?: number;          // Export scale
  transparent?: boolean;   // For PNG
  compression?: boolean;   // For PDF
  animations?: boolean;    // Include animations
  watermark?: boolean;     // Add watermark
}

export interface ImportOptions {
  format: ImportFormat;
  merge?: boolean;         // Merge with existing
  pageMapping?: 'append' | 'replace' | 'insert';
  insertAt?: number;       // For insert mode
  convertText?: boolean;   // Convert text to editable
  preserveStyles?: boolean; // Keep original styles
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function isTextObject(obj: SparklioObject): obj is TextObject {
  return obj.type === 'text';
}

export function isImageObject(obj: SparklioObject): obj is ImageObject {
  return obj.type === 'image';
}

export function isShapeObject(obj: SparklioObject): obj is ShapeObject {
  return obj.type === 'shape';
}

export function isGroupObject(obj: SparklioObject): obj is GroupObject {
  return obj.type === 'group';
}

export function isComponentObject(obj: SparklioObject): obj is ComponentObject {
  return obj.type === 'component';
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createDocument(options?: Partial<SparklioDocument>): SparklioDocument {
  return {
    id: generateId(),
    title: 'Untitled Document',
    type: 'sparklio-doc',
    version: '2.0',
    pages: [],
    mode: 'presentation',
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    settings: {
      grid: true,
      snap: true,
      rulers: true,
      guidelines: true,
      autoSave: true,
    },
    ...options,
  };
}

export function createPage(options?: Partial<SparklioPage>): SparklioPage {
  return {
    id: generateId(),
    name: 'Untitled Page',
    width: 1920,
    height: 1080,
    objects: [],
    order: 0,
    backgroundColor: '#ffffff',
    ...options,
  };
}

export function createTextObject(text: string, options?: Partial<TextObject>): TextObject {
  return {
    id: generateId(),
    type: 'text',
    text,
    x: 0,
    y: 0,
    width: 200,
    height: 50,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    ...options,
  };
}

// Helper to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}