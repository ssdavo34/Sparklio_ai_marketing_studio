/**
 * Command Suggestions System
 *
 * Provides intelligent command suggestions based on context
 * Learns from user patterns and offers contextual hints
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import type { AICommand } from './ai-command';
import type { SparklioObject, SparklioPage, ObjectType } from '../document';
import { AICommandParser } from './ai-command';

// ============================================================================
// Suggestion Types
// ============================================================================

export interface CommandSuggestion {
  command: AICommand;
  label: string;
  description: string;
  category: SuggestionCategory;
  relevance: number;  // 0-1 score
  icon?: string;
  shortcut?: string;
}

export type SuggestionCategory =
  | 'quick-action'
  | 'contextual'
  | 'recent'
  | 'template'
  | 'smart'
  | 'help';

export interface SuggestionContext {
  currentPage?: SparklioPage;
  selectedObjects?: SparklioObject[];
  recentCommands?: AICommand[];
  documentType?: string;
  userPreferences?: UserPreferences;
}

export interface UserPreferences {
  favoriteCommands?: string[];
  frequentlyUsed?: Record<string, number>;
  colorScheme?: string[];
  defaultFonts?: string[];
}

// ============================================================================
// Suggestion Templates
// ============================================================================

const QUICK_ACTIONS: CommandSuggestion[] = [
  {
    command: AICommandParser.parse('Add a heading'),
    label: 'Add Heading',
    description: 'Insert a new heading text',
    category: 'quick-action',
    relevance: 0.9,
    icon: 'heading',
    shortcut: 'Ctrl+H',
  },
  {
    command: AICommandParser.parse('Add text'),
    label: 'Add Text',
    description: 'Insert a text block',
    category: 'quick-action',
    relevance: 0.9,
    icon: 'type',
    shortcut: 'T',
  },
  {
    command: AICommandParser.parse('Add an image'),
    label: 'Add Image',
    description: 'Insert an image',
    category: 'quick-action',
    relevance: 0.8,
    icon: 'image',
    shortcut: 'I',
  },
  {
    command: AICommandParser.parse('Create a button'),
    label: 'Add Button',
    description: 'Create a clickable button',
    category: 'quick-action',
    relevance: 0.7,
    icon: 'button',
  },
  {
    command: AICommandParser.parse('Add a shape'),
    label: 'Add Shape',
    description: 'Insert a geometric shape',
    category: 'quick-action',
    relevance: 0.6,
    icon: 'shape',
    shortcut: 'S',
  },
];

const STYLE_SUGGESTIONS: CommandSuggestion[] = [
  {
    command: AICommandParser.parse('Make it bigger'),
    label: 'Increase Size',
    description: 'Make selected objects larger',
    category: 'contextual',
    relevance: 0.7,
    icon: 'zoom-in',
    shortcut: 'Ctrl++',
  },
  {
    command: AICommandParser.parse('Make it smaller'),
    label: 'Decrease Size',
    description: 'Make selected objects smaller',
    category: 'contextual',
    relevance: 0.7,
    icon: 'zoom-out',
    shortcut: 'Ctrl+-',
  },
  {
    command: AICommandParser.parse('Color it blue'),
    label: 'Change Color',
    description: 'Apply color to selected objects',
    category: 'contextual',
    relevance: 0.6,
    icon: 'palette',
  },
  {
    command: AICommandParser.parse('Font size 24'),
    label: 'Change Font Size',
    description: 'Adjust text size',
    category: 'contextual',
    relevance: 0.6,
    icon: 'text-size',
  },
];

const ALIGNMENT_SUGGESTIONS: CommandSuggestion[] = [
  {
    command: AICommandParser.parse('Align left'),
    label: 'Align Left',
    description: 'Align objects to the left',
    category: 'contextual',
    relevance: 0.5,
    icon: 'align-left',
    shortcut: 'Ctrl+Shift+L',
  },
  {
    command: AICommandParser.parse('Align center'),
    label: 'Align Center',
    description: 'Center align objects',
    category: 'contextual',
    relevance: 0.5,
    icon: 'align-center',
    shortcut: 'Ctrl+Shift+C',
  },
  {
    command: AICommandParser.parse('Align right'),
    label: 'Align Right',
    description: 'Align objects to the right',
    category: 'contextual',
    relevance: 0.5,
    icon: 'align-right',
    shortcut: 'Ctrl+Shift+R',
  },
  {
    command: AICommandParser.parse('Move to top'),
    label: 'Move to Top',
    description: 'Position at the top of the page',
    category: 'contextual',
    relevance: 0.4,
    icon: 'arrow-up',
  },
  {
    command: AICommandParser.parse('Move to center'),
    label: 'Center on Page',
    description: 'Center object on the page',
    category: 'contextual',
    relevance: 0.4,
    icon: 'center',
  },
];

// ============================================================================
// Suggestion Engine
// ============================================================================

export class SuggestionEngine {
  private context: SuggestionContext;
  private userPreferences: UserPreferences;

  constructor(context: SuggestionContext = {}) {
    this.context = context;
    this.userPreferences = context.userPreferences || {};
  }

  /**
   * Get all relevant suggestions for the current context
   */
  getSuggestions(limit: number = 10): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];

    // Add contextual suggestions based on selection
    if (this.context.selectedObjects && this.context.selectedObjects.length > 0) {
      suggestions.push(...this.getSelectionSuggestions());
    } else {
      suggestions.push(...this.getCreationSuggestions());
    }

    // Add recent command variations
    if (this.context.recentCommands && this.context.recentCommands.length > 0) {
      suggestions.push(...this.getRecentVariations());
    }

    // Add smart suggestions based on page content
    if (this.context.currentPage) {
      suggestions.push(...this.getSmartSuggestions());
    }

    // Sort by relevance and limit
    return suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Get suggestions for selected objects
   */
  private getSelectionSuggestions(): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];
    const selected = this.context.selectedObjects!;

    // Basic actions for any selection
    suggestions.push({
      command: AICommandParser.parse('Delete'),
      label: 'Delete Selected',
      description: `Delete ${selected.length} selected object(s)`,
      category: 'contextual',
      relevance: 0.8,
      icon: 'trash',
      shortcut: 'Delete',
    });

    // Style suggestions
    suggestions.push(...STYLE_SUGGESTIONS.map(s => ({
      ...s,
      relevance: s.relevance * (this.hasTextSelection() ? 1.2 : 1),
    })));

    // Alignment suggestions for multiple objects
    if (selected.length > 1) {
      suggestions.push(...ALIGNMENT_SUGGESTIONS.map(s => ({
        ...s,
        relevance: s.relevance * 1.5,
      })));

      suggestions.push({
        command: AICommandParser.parse('Group them'),
        label: 'Group Objects',
        description: 'Group selected objects together',
        category: 'contextual',
        relevance: 0.7,
        icon: 'group',
        shortcut: 'Ctrl+G',
      });
    }

    // Type-specific suggestions
    if (this.hasTextSelection()) {
      suggestions.push(...this.getTextSuggestions());
    }

    if (this.hasImageSelection()) {
      suggestions.push(...this.getImageSuggestions());
    }

    return suggestions;
  }

  /**
   * Get creation suggestions when nothing is selected
   */
  private getCreationSuggestions(): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [...QUICK_ACTIONS];

    // Boost relevance based on page content
    const pageObjects = this.context.currentPage?.objects || [];
    const objectCounts = this.countObjectTypes(pageObjects);

    // Suggest what's missing
    if (!objectCounts.text || objectCounts.text === 0) {
      suggestions.find(s => s.label === 'Add Heading')!.relevance = 1.0;
    }

    if (!objectCounts.image || objectCounts.image === 0) {
      suggestions.find(s => s.label === 'Add Image')!.relevance = 0.95;
    }

    return suggestions;
  }

  /**
   * Get variations of recent commands
   */
  private getRecentVariations(): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];
    const recent = this.context.recentCommands![0];

    if (recent.type === 'create' && recent.parameters.objectType === 'text') {
      // Suggest different text types
      suggestions.push({
        command: AICommandParser.parse('Add a subheading'),
        label: 'Add Subheading',
        description: 'Add another text element',
        category: 'recent',
        relevance: 0.7,
        icon: 'heading',
      });
    }

    if (recent.type === 'style' && recent.parameters.style?.color) {
      // Suggest color variations
      const colors = ['red', 'blue', 'green', 'black'];
      for (const color of colors) {
        if (color !== recent.parameters.style.color) {
          suggestions.push({
            command: AICommandParser.parse(`Color it ${color}`),
            label: `Change to ${color}`,
            description: 'Apply different color',
            category: 'recent',
            relevance: 0.5,
            icon: 'palette',
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Get smart suggestions based on page analysis
   */
  private getSmartSuggestions(): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];
    const page = this.context.currentPage!;
    const objects = page.objects;

    // Check for common patterns
    if (objects.length === 0) {
      // Empty page - suggest templates
      suggestions.push({
        command: AICommandParser.parse('Apply presentation template'),
        label: 'Use Template',
        description: 'Start with a professional template',
        category: 'smart',
        relevance: 0.9,
        icon: 'template',
      });
    }

    // Check for missing elements
    const hasHeading = objects.some(obj =>
      obj.type === 'text' && (obj.role === 'headline' || obj.role === 'title')
    );

    if (!hasHeading && objects.length > 0) {
      suggestions.push({
        command: AICommandParser.parse('Add a title at the top'),
        label: 'Add Title',
        description: 'Your page needs a title',
        category: 'smart',
        relevance: 0.85,
        icon: 'heading',
      });
    }

    // Check for alignment issues
    if (this.hasAlignmentIssues(objects)) {
      suggestions.push({
        command: AICommandParser.parse('Auto align all objects'),
        label: 'Auto Align',
        description: 'Fix alignment issues automatically',
        category: 'smart',
        relevance: 0.75,
        icon: 'grid',
      });
    }

    return suggestions;
  }

  /**
   * Get text-specific suggestions
   */
  private getTextSuggestions(): CommandSuggestion[] {
    return [
      {
        command: AICommandParser.parse('Make text bold'),
        label: 'Bold',
        description: 'Make text bold',
        category: 'contextual',
        relevance: 0.7,
        icon: 'bold',
        shortcut: 'Ctrl+B',
      },
      {
        command: AICommandParser.parse('Make text italic'),
        label: 'Italic',
        description: 'Make text italic',
        category: 'contextual',
        relevance: 0.6,
        icon: 'italic',
        shortcut: 'Ctrl+I',
      },
      {
        command: AICommandParser.parse('Increase line spacing'),
        label: 'Line Spacing',
        description: 'Adjust line height',
        category: 'contextual',
        relevance: 0.5,
        icon: 'line-height',
      },
    ];
  }

  /**
   * Get image-specific suggestions
   */
  private getImageSuggestions(): CommandSuggestion[] {
    return [
      {
        command: AICommandParser.parse('Add filter'),
        label: 'Apply Filter',
        description: 'Add image filter effects',
        category: 'contextual',
        relevance: 0.6,
        icon: 'filter',
      },
      {
        command: AICommandParser.parse('Crop image'),
        label: 'Crop',
        description: 'Crop the image',
        category: 'contextual',
        relevance: 0.6,
        icon: 'crop',
      },
      {
        command: AICommandParser.parse('Replace image'),
        label: 'Replace',
        description: 'Replace with another image',
        category: 'contextual',
        relevance: 0.5,
        icon: 'replace',
      },
    ];
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private hasTextSelection(): boolean {
    return this.context.selectedObjects?.some(obj => obj.type === 'text') || false;
  }

  private hasImageSelection(): boolean {
    return this.context.selectedObjects?.some(obj => obj.type === 'image') || false;
  }

  private countObjectTypes(objects: SparklioObject[]): Record<ObjectType, number> {
    const counts = {} as Record<ObjectType, number>;
    for (const obj of objects) {
      counts[obj.type] = (counts[obj.type] || 0) + 1;
    }
    return counts;
  }

  private hasAlignmentIssues(objects: SparklioObject[]): boolean {
    if (objects.length < 2) return false;

    // Check for objects that are almost but not quite aligned
    const threshold = 5; // pixels

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i];
        const obj2 = objects[j];

        // Check horizontal alignment
        const xDiff = Math.abs(obj1.x - obj2.x);
        if (xDiff > 0 && xDiff < threshold) return true;

        // Check vertical alignment
        const yDiff = Math.abs(obj1.y - obj2.y);
        if (yDiff > 0 && yDiff < threshold) return true;
      }
    }

    return false;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Update context
   */
  updateContext(context: Partial<SuggestionContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get suggestions for auto-complete
   */
  getAutocompleteSuggestions(input: string): CommandSuggestion[] {
    const normalizedInput = input.toLowerCase();

    const allSuggestions = [
      ...QUICK_ACTIONS,
      ...STYLE_SUGGESTIONS,
      ...ALIGNMENT_SUGGESTIONS,
    ];

    return allSuggestions
      .filter(s =>
        s.label.toLowerCase().includes(normalizedInput) ||
        s.description.toLowerCase().includes(normalizedInput) ||
        s.command.originalText.toLowerCase().includes(normalizedInput)
      )
      .slice(0, 5);
  }

  /**
   * Learn from user action
   */
  recordUserAction(command: AICommand): void {
    const key = command.interpretedAction;
    this.userPreferences.frequentlyUsed = this.userPreferences.frequentlyUsed || {};
    this.userPreferences.frequentlyUsed[key] = (this.userPreferences.frequentlyUsed[key] || 0) + 1;
  }

  /**
   * Get frequently used commands
   */
  getFrequentCommands(limit: number = 5): CommandSuggestion[] {
    const frequent = this.userPreferences.frequentlyUsed || {};

    return Object.entries(frequent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([action, count]) => ({
        command: AICommandParser.parse(action),
        label: action,
        description: `Used ${count} times`,
        category: 'recent' as const,
        relevance: Math.min(count / 10, 1),
        icon: 'clock',
      }));
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

let engineInstance: SuggestionEngine | null = null;

export function getSuggestionEngine(context?: SuggestionContext): SuggestionEngine {
  if (!engineInstance) {
    engineInstance = new SuggestionEngine(context);
  } else if (context) {
    engineInstance.updateContext(context);
  }
  return engineInstance;
}