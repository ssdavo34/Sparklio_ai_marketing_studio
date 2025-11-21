/**
 * Command Executor
 *
 * Executes AI commands on the editor through the adapter system
 * Handles validation, error recovery, and undo/redo
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import type { AICommand, CommandParameters } from './ai-command';
import type { IEditorAdapter } from '../adapters/base-adapter';
import type { SparklioObject, SparklioPage } from '../document';
import { createTextObject } from '../document';

// ============================================================================
// Execution Result
// ============================================================================

export interface ExecutionResult {
  success: boolean;
  commandId: string;

  // Results
  createdObjects?: string[];
  modifiedObjects?: string[];
  deletedObjects?: string[];

  // Feedback
  message?: string;
  error?: string;
  warnings?: string[];

  // Undo information
  undoable: boolean;
  undoData?: any;

  // Performance
  executionTime: number;
}

export interface ExecutionContext {
  adapter: IEditorAdapter;
  page?: SparklioPage;
  selection?: string[];
  history?: CommandHistory;
}

// ============================================================================
// Command History
// ============================================================================

export interface CommandHistoryEntry {
  command: AICommand;
  result: ExecutionResult;
  timestamp: number;
  undoData?: any;
}

export class CommandHistory {
  private entries: CommandHistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxSize: number = 100;

  add(command: AICommand, result: ExecutionResult): void {
    // Remove any entries after current index (for redo)
    this.entries = this.entries.slice(0, this.currentIndex + 1);

    // Add new entry
    this.entries.push({
      command,
      result,
      timestamp: Date.now(),
      undoData: result.undoData,
    });

    // Limit history size
    if (this.entries.length > this.maxSize) {
      this.entries.shift();
    } else {
      this.currentIndex++;
    }
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  getUndoEntry(): CommandHistoryEntry | null {
    if (!this.canUndo()) return null;
    return this.entries[this.currentIndex];
  }

  getRedoEntry(): CommandHistoryEntry | null {
    if (!this.canRedo()) return null;
    return this.entries[this.currentIndex + 1];
  }

  undo(): void {
    if (this.canUndo()) {
      this.currentIndex--;
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.currentIndex++;
    }
  }

  clear(): void {
    this.entries = [];
    this.currentIndex = -1;
  }

  getRecent(count: number = 10): CommandHistoryEntry[] {
    return this.entries.slice(-count);
  }
}

// ============================================================================
// Command Executor
// ============================================================================

export class CommandExecutor {
  private adapter: IEditorAdapter;
  private history: CommandHistory;

  constructor(adapter: IEditorAdapter) {
    this.adapter = adapter;
    this.history = new CommandHistory();
  }

  /**
   * Execute an AI command
   */
  async execute(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Validate command
      const validation = this.validateCommand(command);
      if (!validation.isValid) {
        return this.createErrorResult(
          command.id,
          validation.error || 'Invalid command',
          startTime
        );
      }

      // Execute based on command type
      let result: ExecutionResult;

      switch (command.type) {
        case 'create':
          result = await this.executeCreate(command);
          break;
        case 'modify':
          result = await this.executeModify(command);
          break;
        case 'delete':
          result = await this.executeDelete(command);
          break;
        case 'arrange':
          result = await this.executeArrange(command);
          break;
        case 'style':
          result = await this.executeStyle(command);
          break;
        case 'navigate':
          result = await this.executeNavigate(command);
          break;
        case 'template':
          result = await this.executeTemplate(command);
          break;
        case 'analyze':
          result = await this.executeAnalyze(command);
          break;
        case 'suggest':
          result = await this.executeSuggest(command);
          break;
        default:
          result = this.createErrorResult(
            command.id,
            `Unknown command type: ${command.type}`,
            startTime
          );
      }

      // Add to history if successful and undoable
      if (result.success && result.undoable) {
        this.history.add(command, result);
      }

      return result;
    } catch (error) {
      return this.createErrorResult(
        command.id,
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    }
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeBatch(commands: AICommand[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const command of commands) {
      const result = await this.execute(command);
      results.push(result);

      // Stop on error if critical
      if (!result.success && command.priority === 'critical') {
        break;
      }
    }

    return results;
  }

  /**
   * Undo the last command
   */
  async undo(): Promise<ExecutionResult> {
    const entry = this.history.getUndoEntry();
    if (!entry) {
      return {
        success: false,
        commandId: 'undo',
        error: 'Nothing to undo',
        undoable: false,
        executionTime: 0,
      };
    }

    try {
      this.adapter.undo();
      this.history.undo();

      return {
        success: true,
        commandId: 'undo',
        message: `Undone: ${entry.command.interpretedAction}`,
        undoable: false,
        executionTime: 0,
      };
    } catch (error) {
      return {
        success: false,
        commandId: 'undo',
        error: error instanceof Error ? error.message : 'Undo failed',
        undoable: false,
        executionTime: 0,
      };
    }
  }

  /**
   * Redo the last undone command
   */
  async redo(): Promise<ExecutionResult> {
    const entry = this.history.getRedoEntry();
    if (!entry) {
      return {
        success: false,
        commandId: 'redo',
        error: 'Nothing to redo',
        undoable: false,
        executionTime: 0,
      };
    }

    try {
      this.adapter.redo();
      this.history.redo();

      return {
        success: true,
        commandId: 'redo',
        message: `Redone: ${entry.command.interpretedAction}`,
        undoable: false,
        executionTime: 0,
      };
    } catch (error) {
      return {
        success: false,
        commandId: 'redo',
        error: error instanceof Error ? error.message : 'Redo failed',
        undoable: false,
        executionTime: 0,
      };
    }
  }

  // ============================================================================
  // Command Type Executors
  // ============================================================================

  private async executeCreate(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { parameters } = command;

    try {
      // Create object based on type
      let objectId: string;

      if (parameters.objectType === 'text') {
        objectId = await this.adapter.addObject(
          createTextObject(parameters.content || 'New Text', {
            role: parameters.objectRole,
            x: parameters.position?.x || 100,
            y: parameters.position?.y || 100,
            ...parameters.style,
          })
        );
      } else {
        // For other types, create basic object
        objectId = await this.adapter.addObject({
          type: parameters.objectType || 'shape',
          x: parameters.position?.x || 100,
          y: parameters.position?.y || 100,
          width: parameters.size?.width || 200,
          height: parameters.size?.height || 100,
        });
      }

      return {
        success: true,
        commandId: command.id,
        createdObjects: [objectId],
        message: `Created ${parameters.objectType || 'object'}`,
        undoable: true,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(
        command.id,
        error instanceof Error ? error.message : 'Creation failed',
        startTime
      );
    }
  }

  private async executeModify(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { parameters, context } = command;

    try {
      // Get target objects
      const targetIds = context.objectIds || this.adapter.getSelectedObjects().map(obj => obj.id);

      if (targetIds.length === 0) {
        return this.createErrorResult(command.id, 'No objects selected', startTime);
      }

      // Apply modifications
      const modifiedObjects: string[] = [];

      for (const objectId of targetIds) {
        const updates: Partial<SparklioObject> = {};

        // Apply size changes
        if (parameters.size) {
          const obj = this.adapter.getObject(objectId);
          if (obj) {
            if (parameters.size.scale) {
              updates.width = obj.width * parameters.size.scale;
              updates.height = obj.height * parameters.size.scale;
            } else {
              if (parameters.size.width) updates.width = parameters.size.width;
              if (parameters.size.height) updates.height = parameters.size.height;
            }
          }
        }

        // Apply style changes
        if (parameters.style) {
          Object.assign(updates, parameters.style);
        }

        await this.adapter.updateObject(objectId, updates);
        modifiedObjects.push(objectId);
      }

      return {
        success: true,
        commandId: command.id,
        modifiedObjects,
        message: `Modified ${modifiedObjects.length} object(s)`,
        undoable: true,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(
        command.id,
        error instanceof Error ? error.message : 'Modification failed',
        startTime
      );
    }
  }

  private async executeDelete(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { parameters, context } = command;

    try {
      // Get target objects
      let targetIds: string[];

      if (parameters.objectType) {
        // Delete all objects of a specific type
        const allObjects = this.adapter.getObjects();
        targetIds = allObjects
          .filter(obj => obj.type === parameters.objectType)
          .map(obj => obj.id);
      } else {
        // Delete selected objects
        targetIds = context.objectIds || this.adapter.getSelectedObjects().map(obj => obj.id);
      }

      if (targetIds.length === 0) {
        return this.createErrorResult(command.id, 'No objects to delete', startTime);
      }

      // Delete objects
      for (const objectId of targetIds) {
        await this.adapter.removeObject(objectId);
      }

      return {
        success: true,
        commandId: command.id,
        deletedObjects: targetIds,
        message: `Deleted ${targetIds.length} object(s)`,
        undoable: true,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(
        command.id,
        error instanceof Error ? error.message : 'Deletion failed',
        startTime
      );
    }
  }

  private async executeArrange(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { parameters } = command;

    try {
      const selectedObjects = this.adapter.getSelectedObjects();
      if (selectedObjects.length === 0) {
        return this.createErrorResult(command.id, 'No objects selected', startTime);
      }

      const currentPage = this.adapter.getCurrentPage();
      if (!currentPage) {
        return this.createErrorResult(command.id, 'No active page', startTime);
      }

      const modifiedObjects: string[] = [];

      // Handle positioning
      if (parameters.position?.relative) {
        for (const obj of selectedObjects) {
          const updates: Partial<SparklioObject> = {};

          switch (parameters.position.relative) {
            case 'left':
              updates.x = 0;
              break;
            case 'center':
              updates.x = (currentPage.width - obj.width) / 2;
              break;
            case 'right':
              updates.x = currentPage.width - obj.width;
              break;
            case 'top':
              updates.y = 0;
              break;
            case 'middle':
              updates.y = (currentPage.height - obj.height) / 2;
              break;
            case 'bottom':
              updates.y = currentPage.height - obj.height;
              break;
          }

          await this.adapter.updateObject(obj.id, updates);
          modifiedObjects.push(obj.id);
        }
      }

      // Handle alignment
      if (parameters.alignment && selectedObjects.length > 1) {
        // Find bounds
        const bounds = this.calculateBounds(selectedObjects);

        for (const obj of selectedObjects) {
          const updates: Partial<SparklioObject> = {};

          switch (parameters.alignment) {
            case 'left':
              updates.x = bounds.minX;
              break;
            case 'center':
              updates.x = bounds.centerX - obj.width / 2;
              break;
            case 'right':
              updates.x = bounds.maxX - obj.width;
              break;
            case 'top':
              updates.y = bounds.minY;
              break;
            case 'middle':
              updates.y = bounds.centerY - obj.height / 2;
              break;
            case 'bottom':
              updates.y = bounds.maxY - obj.height;
              break;
          }

          await this.adapter.updateObject(obj.id, updates);
          modifiedObjects.push(obj.id);
        }
      }

      return {
        success: true,
        commandId: command.id,
        modifiedObjects,
        message: `Arranged ${modifiedObjects.length} object(s)`,
        undoable: true,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(
        command.id,
        error instanceof Error ? error.message : 'Arrangement failed',
        startTime
      );
    }
  }

  private async executeStyle(command: AICommand): Promise<ExecutionResult> {
    // Similar to modify but focused on visual properties
    return this.executeModify(command);
  }

  private async executeNavigate(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { parameters } = command;

    try {
      if (parameters.pageId) {
        await this.adapter.setCurrentPage(parameters.pageId);
      } else if (parameters.pageNumber !== undefined) {
        const document = this.adapter.getDocument();
        const page = document.pages[parameters.pageNumber];
        if (page) {
          await this.adapter.setCurrentPage(page.id);
        } else {
          return this.createErrorResult(command.id, 'Page not found', startTime);
        }
      }

      return {
        success: true,
        commandId: command.id,
        message: 'Navigated to page',
        undoable: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(
        command.id,
        error instanceof Error ? error.message : 'Navigation failed',
        startTime
      );
    }
  }

  private async executeTemplate(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();

    // TODO: Implement template application
    return {
      success: false,
      commandId: command.id,
      error: 'Template feature not yet implemented',
      undoable: false,
      executionTime: Date.now() - startTime,
    };
  }

  private async executeAnalyze(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const document = this.adapter.getDocument();
      const currentPage = this.adapter.getCurrentPage();
      const selectedObjects = this.adapter.getSelectedObjects();

      const analysis = {
        documentPages: document.pages.length,
        currentPageObjects: currentPage?.objects.length || 0,
        selectedObjects: selectedObjects.length,
        objectTypes: this.countObjectTypes(currentPage?.objects || []),
      };

      return {
        success: true,
        commandId: command.id,
        message: `Analysis: ${JSON.stringify(analysis, null, 2)}`,
        undoable: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(
        command.id,
        error instanceof Error ? error.message : 'Analysis failed',
        startTime
      );
    }
  }

  private async executeSuggest(command: AICommand): Promise<ExecutionResult> {
    const startTime = Date.now();

    const suggestions = this.adapter.getSuggestedCommands();

    return {
      success: true,
      commandId: command.id,
      message: `Suggestions: ${suggestions.map(s => s.interpretedAction).join(', ')}`,
      undoable: false,
      executionTime: Date.now() - startTime,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private validateCommand(command: AICommand): { isValid: boolean; error?: string } {
    if (!command.type) {
      return { isValid: false, error: 'Command type is required' };
    }

    if (!command.target) {
      return { isValid: false, error: 'Command target is required' };
    }

    // Type-specific validation
    switch (command.type) {
      case 'create':
        if (!command.parameters.objectType && !command.parameters.content) {
          return { isValid: false, error: 'Object type or content required for create command' };
        }
        break;

      case 'modify':
      case 'style':
        if (!command.parameters.style && !command.parameters.size) {
          return { isValid: false, error: 'Style or size changes required for modify command' };
        }
        break;
    }

    return { isValid: true };
  }

  private createErrorResult(
    commandId: string,
    error: string,
    startTime: number
  ): ExecutionResult {
    return {
      success: false,
      commandId,
      error,
      undoable: false,
      executionTime: Date.now() - startTime,
    };
  }

  private calculateBounds(objects: SparklioObject[]) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const obj of objects) {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  private countObjectTypes(objects: SparklioObject[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const obj of objects) {
      counts[obj.type] = (counts[obj.type] || 0) + 1;
    }

    return counts;
  }

  // ============================================================================
  // Public Getters
  // ============================================================================

  getHistory(): CommandHistory {
    return this.history;
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  getRecentCommands(count: number = 10): CommandHistoryEntry[] {
    return this.history.getRecent(count);
  }
}