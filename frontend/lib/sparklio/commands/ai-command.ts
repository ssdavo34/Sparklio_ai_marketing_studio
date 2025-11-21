/**
 * AI Command System
 *
 * Handles natural language commands and converts them to editor operations
 * This is the bridge between user intent and actual editor actions
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import type { SparklioObject, ObjectRole, ObjectType } from '../document';

// ============================================================================
// Command Types
// ============================================================================

export type CommandType =
  | 'create'     // Create new elements
  | 'modify'     // Modify existing elements
  | 'delete'     // Remove elements
  | 'arrange'    // Position/align elements
  | 'style'      // Change visual properties
  | 'navigate'   // Page navigation
  | 'template'   // Apply templates
  | 'analyze'    // Analyze content
  | 'suggest';   // Provide suggestions

export type CommandTarget =
  | 'object'     // Single object
  | 'selection'  // Selected objects
  | 'page'       // Current page
  | 'document'   // Entire document
  | 'all';       // Everything

export type CommandPriority = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// Command Parameters
// ============================================================================

export interface Position {
  x?: number;
  y?: number;
  relative?: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
}

export interface Size {
  width?: number;
  height?: number;
  scale?: number;
}

export interface StyleProperties {
  // Text styles
  fontSize?: number | string;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

  // Colors
  color?: string;
  backgroundColor?: string;
  borderColor?: string;

  // Effects
  opacity?: number;
  blur?: number;
  shadow?: string;

  // Layout
  padding?: number | string;
  margin?: number | string;
  borderWidth?: number;
  borderRadius?: number;
}

export interface CommandParameters {
  // Object creation
  objectType?: ObjectType;
  objectRole?: ObjectRole;
  content?: string;

  // Positioning
  position?: Position;
  size?: Size;

  // Styling
  style?: StyleProperties;

  // Arrangement
  alignment?: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
  distribution?: 'horizontal' | 'vertical';
  spacing?: number;

  // Grouping
  groupName?: string;

  // Navigation
  pageNumber?: number;
  pageId?: string;

  // Template
  templateId?: string;
  templateCategory?: string;

  // Custom data
  custom?: Record<string, any>;
}

// ============================================================================
// Main AICommand Interface
// ============================================================================

export interface AICommand {
  id: string;
  type: CommandType;
  target: CommandTarget;

  // Natural language
  originalText: string;           // Original user input
  interpretedAction: string;      // What we understood

  // Parameters
  parameters: CommandParameters;

  // Context
  context: {
    pageId?: string;
    objectIds?: string[];
    selection?: string[];
    previousCommands?: string[];
    timestamp: number;
  };

  // Metadata
  confidence: number;              // 0-1 confidence score
  priority: CommandPriority;
  source: 'user' | 'system' | 'suggestion';

  // Validation
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ============================================================================
// Command Patterns (for NLP matching)
// ============================================================================

export interface CommandPattern {
  pattern: RegExp;
  type: CommandType;
  extractor: (match: RegExpMatchArray) => CommandParameters;
  examples: string[];
}

export const COMMAND_PATTERNS: CommandPattern[] = [
  // Create commands
  {
    pattern: /(?:add|create|insert|place)\s+(?:a\s+)?(\w+)(?:\s+(?:with|containing|saying)\s+"([^"]+)")?/i,
    type: 'create',
    extractor: (match) => ({
      objectType: parseObjectType(match[1]),
      content: match[2],
    }),
    examples: [
      'Add a heading',
      'Create a button with "Click here"',
      'Insert an image',
      'Place a text saying "Hello World"',
    ],
  },

  // Modify commands
  {
    pattern: /(?:make|change|set|update)\s+(?:the\s+)?(\w+)\s+(?:to|into)\s+(.+)/i,
    type: 'modify',
    extractor: (match) => ({
      style: parseStyleChange(match[1], match[2]),
    }),
    examples: [
      'Make the text bigger',
      'Change the color to blue',
      'Set the font to Arial',
      'Update the background to red',
    ],
  },

  // Size commands
  {
    pattern: /(?:make|resize|scale)\s+(?:it\s+)?(\d+)?\s*(?:percent|%|times|x)?\s*(bigger|larger|smaller)/i,
    type: 'modify',
    extractor: (match) => {
      const factor = match[1] ? parseInt(match[1]) : 150;
      const increase = match[2].includes('bigger') || match[2].includes('larger');
      return {
        size: {
          scale: increase ? factor / 100 : 100 / factor,
        },
      };
    },
    examples: [
      'Make it bigger',
      'Resize 50% smaller',
      'Scale 2 times larger',
    ],
  },

  // Position commands
  {
    pattern: /(?:move|place|position)\s+(?:it\s+)?(?:to\s+)?(?:the\s+)?(left|right|center|top|bottom|middle)/i,
    type: 'arrange',
    extractor: (match) => ({
      position: {
        relative: match[1] as any,
      },
    }),
    examples: [
      'Move to the right',
      'Place it center',
      'Position at the top',
    ],
  },

  // Alignment commands
  {
    pattern: /align\s+(?:them\s+)?(?:to\s+)?(?:the\s+)?(left|right|center|top|bottom|middle)/i,
    type: 'arrange',
    extractor: (match) => ({
      alignment: match[1] as any,
    }),
    examples: [
      'Align left',
      'Align them to the center',
      'Align to the right',
    ],
  },

  // Delete commands
  {
    pattern: /(?:delete|remove|clear|erase)(?:\s+(?:the|this|that|all))?\s*(\w+)?/i,
    type: 'delete',
    extractor: (match) => ({
      objectType: match[1] ? parseObjectType(match[1]) : undefined,
    }),
    examples: [
      'Delete',
      'Remove the text',
      'Clear all images',
      'Erase this',
    ],
  },

  // Color commands
  {
    pattern: /(?:color|paint|fill)\s+(?:it\s+)?(\w+)/i,
    type: 'style',
    extractor: (match) => ({
      style: {
        color: parseColor(match[1]),
      },
    }),
    examples: [
      'Color it blue',
      'Paint red',
      'Fill green',
    ],
  },

  // Font size commands
  {
    pattern: /(?:font\s+)?size\s+(\d+)(?:px|pt)?/i,
    type: 'style',
    extractor: (match) => ({
      style: {
        fontSize: parseInt(match[1]),
      },
    }),
    examples: [
      'Size 24',
      'Font size 18px',
      'Size 36pt',
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function parseObjectType(text: string): ObjectType {
  const normalized = text.toLowerCase();

  const typeMap: Record<string, ObjectType> = {
    'text': 'text',
    'heading': 'text',
    'title': 'text',
    'paragraph': 'text',
    'button': 'text',
    'label': 'text',

    'image': 'image',
    'photo': 'image',
    'picture': 'image',

    'shape': 'shape',
    'rectangle': 'shape',
    'circle': 'shape',
    'square': 'shape',
    'triangle': 'shape',

    'video': 'video',
    'movie': 'video',

    'chart': 'chart',
    'graph': 'chart',

    'table': 'table',
    'grid': 'table',
  };

  return typeMap[normalized] || 'shape';
}

function parseStyleChange(property: string, value: string): StyleProperties {
  const prop = property.toLowerCase();
  const val = value.toLowerCase().trim();

  const style: StyleProperties = {};

  if (prop.includes('color') || prop.includes('colour')) {
    style.color = parseColor(val);
  } else if (prop.includes('size')) {
    if (val.includes('big') || val.includes('large')) {
      style.fontSize = '24px';
    } else if (val.includes('small')) {
      style.fontSize = '12px';
    } else {
      style.fontSize = val;
    }
  } else if (prop.includes('font') || prop.includes('typeface')) {
    style.fontFamily = val;
  } else if (prop.includes('weight') || prop.includes('bold')) {
    style.fontWeight = val.includes('bold') ? 'bold' : 'normal';
  } else if (prop.includes('align')) {
    style.textAlign = val as any;
  }

  return style;
}

function parseColor(text: string): string {
  const colorMap: Record<string, string> = {
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#00FF00',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#808080',
    'grey': '#808080',
  };

  return colorMap[text.toLowerCase()] || text;
}

// ============================================================================
// Command Parser
// ============================================================================

export class AICommandParser {
  /**
   * Parse natural language input into an AICommand
   */
  static parse(input: string, context?: Partial<AICommand['context']>): AICommand {
    const normalizedInput = input.trim().toLowerCase();

    // Try to match against patterns
    for (const pattern of COMMAND_PATTERNS) {
      const match = normalizedInput.match(pattern.pattern);
      if (match) {
        return this.createCommand(
          pattern.type,
          input,
          pattern.extractor(match),
          context
        );
      }
    }

    // Fallback to suggestion if no pattern matches
    return this.createSuggestionCommand(input, context);
  }

  /**
   * Create a command object
   */
  private static createCommand(
    type: CommandType,
    originalText: string,
    parameters: CommandParameters,
    context?: Partial<AICommand['context']>
  ): AICommand {
    return {
      id: generateId(),
      type,
      target: this.inferTarget(type, parameters),
      originalText,
      interpretedAction: this.describeAction(type, parameters),
      parameters,
      context: {
        timestamp: Date.now(),
        ...context,
      },
      confidence: 0.8,
      priority: 'medium',
      source: 'user',
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Create a suggestion command when parsing fails
   */
  private static createSuggestionCommand(
    input: string,
    context?: Partial<AICommand['context']>
  ): AICommand {
    return {
      id: generateId(),
      type: 'suggest',
      target: 'document',
      originalText: input,
      interpretedAction: `Suggest action for: "${input}"`,
      parameters: {},
      context: {
        timestamp: Date.now(),
        ...context,
      },
      confidence: 0.3,
      priority: 'low',
      source: 'user',
      isValid: false,
      errors: [`Could not understand: "${input}"`],
      warnings: ['Consider using clearer commands like "Add text" or "Change color to blue"'],
    };
  }

  /**
   * Infer the target based on command type and parameters
   */
  private static inferTarget(type: CommandType, parameters: CommandParameters): CommandTarget {
    if (type === 'create') return 'page';
    if (type === 'delete' && !parameters.objectType) return 'selection';
    if (type === 'modify' || type === 'style') return 'selection';
    if (type === 'arrange') return 'selection';
    if (type === 'navigate') return 'document';
    if (type === 'template') return 'page';
    return 'object';
  }

  /**
   * Generate human-readable description of the action
   */
  private static describeAction(type: CommandType, parameters: CommandParameters): string {
    const parts: string[] = [];

    switch (type) {
      case 'create':
        parts.push('Create');
        if (parameters.objectType) parts.push(`a ${parameters.objectType}`);
        if (parameters.content) parts.push(`with "${parameters.content}"`);
        break;

      case 'modify':
        parts.push('Modify');
        if (parameters.style?.fontSize) parts.push(`font size to ${parameters.style.fontSize}`);
        if (parameters.style?.color) parts.push(`color to ${parameters.style.color}`);
        if (parameters.size?.scale) parts.push(`scale by ${parameters.size.scale}x`);
        break;

      case 'delete':
        parts.push('Delete');
        if (parameters.objectType) parts.push(`all ${parameters.objectType}s`);
        else parts.push('selected objects');
        break;

      case 'arrange':
        if (parameters.alignment) parts.push(`Align ${parameters.alignment}`);
        if (parameters.position?.relative) parts.push(`Move to ${parameters.position.relative}`);
        break;

      case 'style':
        parts.push('Apply style');
        if (parameters.style) {
          const styles = Object.entries(parameters.style)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          parts.push(`(${styles})`);
        }
        break;

      default:
        parts.push(`${type} operation`);
    }

    return parts.join(' ');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Export Presets
// ============================================================================

export const COMMON_COMMANDS = {
  // Headings
  addHeading: (text: string): AICommand => AICommandParser.parse(`Add a heading with "${text}"`),
  addSubheading: (text: string): AICommand => AICommandParser.parse(`Add a subheading with "${text}"`),

  // Text
  addParagraph: (text: string): AICommand => AICommandParser.parse(`Add text with "${text}"`),
  addButton: (text: string): AICommand => AICommandParser.parse(`Create a button with "${text}"`),

  // Images
  addImage: (): AICommand => AICommandParser.parse('Add an image'),
  addLogo: (): AICommand => AICommandParser.parse('Add a logo'),

  // Styling
  makeBigger: (): AICommand => AICommandParser.parse('Make it bigger'),
  makeSmaller: (): AICommand => AICommandParser.parse('Make it smaller'),
  changeColor: (color: string): AICommand => AICommandParser.parse(`Color it ${color}`),

  // Positioning
  alignLeft: (): AICommand => AICommandParser.parse('Align left'),
  alignCenter: (): AICommand => AICommandParser.parse('Align center'),
  alignRight: (): AICommand => AICommandParser.parse('Align right'),

  // Actions
  deleteSelected: (): AICommand => AICommandParser.parse('Delete'),
  clearAll: (): AICommand => AICommandParser.parse('Clear all'),
};