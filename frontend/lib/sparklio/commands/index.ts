/**
 * Commands Module Export
 *
 * Central export point for the AI command system
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

// Core exports
export * from './ai-command';
export * from './executor';
export * from './suggestions';

// Convenience exports
export { AICommandParser, COMMAND_PATTERNS, COMMON_COMMANDS } from './ai-command';
export { CommandExecutor, CommandHistory } from './executor';
export { SuggestionEngine, getSuggestionEngine } from './suggestions';

// Re-export types for convenience
export type {
  AICommand,
  CommandType,
  CommandTarget,
  CommandPriority,
  CommandParameters,
  CommandPattern,
} from './ai-command';

export type {
  ExecutionResult,
  ExecutionContext,
  CommandHistoryEntry,
} from './executor';

export type {
  CommandSuggestion,
  SuggestionCategory,
  SuggestionContext,
  UserPreferences,
} from './suggestions';