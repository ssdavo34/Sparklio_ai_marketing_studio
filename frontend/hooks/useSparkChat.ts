/**
 * Spark Chat Hook - Enhanced Version
 *
 * Manages the integration between Spark Chat and the editor
 * Handles AI command processing, conversation state, and real-time updates
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-21
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLLMStore } from '@/store/llmStore';
import { useEditorStore } from '@/components/canvas-studio/stores';
import { AICommandParser, CommandExecutor, getSuggestionEngine } from '@/lib/sparklio/commands';
import type { AICommand, CommandSuggestion, ExecutionResult } from '@/lib/sparklio/commands';
import type { IEditorAdapter } from '@/lib/sparklio/adapters';
import type { SparklioDocument, SparklioPage, SparklioObject } from '@/lib/sparklio/document';
import { apiClient } from '@/lib/api/client';
import type { GenerateRequest } from '@/lib/api/types';

// ============================================================================
// Types
// ============================================================================

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    command?: AICommand;
    result?: ExecutionResult;
    suggestions?: CommandSuggestion[];
}

export interface Suggestion {
    id: string;
    type: string;
    label: string;
    description: string;
    preview_image?: string;
    payload?: any;
}

export interface ChatAnalysisResult {
    analysis: string;
    suggestions: Suggestion[];
}

export interface UseSparkChatOptions {
    adapter?: IEditorAdapter;
    document?: SparklioDocument;
    autoSuggest?: boolean;
}

export const useSparkChat = (options: UseSparkChatOptions = {}) => {
    const { adapter, document, autoSuggest = true } = options;

    const router = useRouter();
    const llmSelection = useLLMStore((state) => state.selection);
    const { addObject, selectedObjectIds, objects } = useEditorStore();

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '안녕하세요! Spark Editor입니다. 무엇을 도와드릴까요? (예: 배경을 파란색으로 바꿔줘)',
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ChatAnalysisResult | null>(null);
    const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);

    // Refs for command system
    const commandExecutorRef = useRef<CommandExecutor | null>(null);
    const suggestionEngineRef = useRef(getSuggestionEngine());

    // Initialize command executor when adapter is available
    useEffect(() => {
        if (adapter) {
            commandExecutorRef.current = new CommandExecutor(adapter);
        }
    }, [adapter]);

    // Update suggestions when context changes
    useEffect(() => {
        if (autoSuggest && document) {
            refreshSuggestions();
        }
    }, [selectedObjectIds, autoSuggest, document]);

    // Helper function to refresh suggestions
    const refreshSuggestions = useCallback(() => {
        if (!document) return;

        const selectedObjs = objects.filter(obj => selectedObjectIds.includes(obj.id)) as SparklioObject[];

        suggestionEngineRef.current.updateContext({
            currentPage: document.pages[0],
            selectedObjects: selectedObjs,
            documentType: document.mode,
        });

        const newSuggestions = suggestionEngineRef.current.getSuggestions(5);
        setSuggestions(newSuggestions);
    }, [document, objects, selectedObjectIds]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Try to parse as direct command first
            const command = AICommandParser.parse(content);

            if (command.confidence > 0.7 && commandExecutorRef.current && document) {
                // Execute directly as command
                const selectedObjs = objects.filter(obj => selectedObjectIds.includes(obj.id)) as SparklioObject[];

                const result = await commandExecutorRef.current.execute(command, {
                    document,
                    currentPage: document.pages[0],
                    selectedObjects: selectedObjs,
                });

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: result.success
                        ? `✓ ${result.message || '명령을 실행했습니다'}`
                        : `✗ ${result.error || '명령 실행에 실패했습니다'}`,
                    timestamp: new Date(),
                    command,
                    result,
                };

                setMessages((prev) => [...prev, assistantMessage]);
                setIsLoading(false);

                // Refresh suggestions after command execution
                refreshSuggestions();
                return;
            }

            // Fallback to API call with LLM selection
            const response = await fetch('/api/v1/chat/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    llm_selection: llmSelection
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze chat');
            }

            const data: ChatAnalysisResult = await response.json();
            setAnalysisResult(data);

            // Apply suggestions to the canvas
            if (data.suggestions && data.suggestions.length > 0) {
                for (const suggestion of data.suggestions) {
                    const payload = suggestion.payload;

                    // Handle different types of actions
                    if (suggestion.type === 'shape' && payload) {
                        // Add a new shape
                        if (payload.shapeType === 'rect') {
                            addObject({
                                type: 'shape',
                                shapeType: 'rect',
                                x: 100 + Math.random() * 200,
                                y: 100 + Math.random() * 200,
                                width: 100,
                                height: 100,
                                fill: payload.fill || '#3b82f6',
                            });
                        } else if (payload.shapeType === 'circle') {
                            addObject({
                                type: 'shape',
                                shapeType: 'circle',
                                x: 150 + Math.random() * 200,
                                y: 150 + Math.random() * 200,
                                radius: 50,
                                fill: payload.fill || '#3b82f6',
                            });
                        }
                    } else if (suggestion.type === 'element' && payload?.type === 'text') {
                        // Add text element
                        addObject({
                            type: 'text',
                            text: payload.content || '새 텍스트',
                            x: 100 + Math.random() * 200,
                            y: 100 + Math.random() * 200,
                            fontSize: 24,
                            fill: '#000000',
                        });
                    } else if (suggestion.type === 'style' && payload?.backgroundColor) {
                        // Change background color - this would need to be implemented in the canvas store
                        // For now, we'll add a background rectangle
                        addObject({
                            type: 'shape',
                            shapeType: 'rect',
                            x: 0,
                            y: 0,
                            width: 800,
                            height: 600,
                            fill: payload.backgroundColor,
                        });
                    }
                }
            }

            // Backend returns 'analysis' (text) and 'suggestions' (commands)
            // We display the 'analysis' text or the description from the first suggestion
            const responseText = data.analysis ||
                (data.suggestions.length > 0 ? data.suggestions[0].description : "처리를 완료했습니다.");

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [llmSelection]);

    // createDraft is likely not needed for Editor Chat, but keeping it as placeholder or for future use
    const createDraft = useCallback(async () => {
        console.log("Create Draft clicked - Not implemented for Editor Chat yet");
        // Logic to apply commands or create a new doc could go here
    }, []);

    // Execute a suggestion
    const applySuggestion = useCallback(async (suggestion: CommandSuggestion) => {
        if (!commandExecutorRef.current || !document) return;

        const selectedObjs = objects.filter(obj => selectedObjectIds.includes(obj.id)) as SparklioObject[];

        const result = await commandExecutorRef.current.execute(suggestion.command, {
            document,
            currentPage: document.pages[0],
            selectedObjects: selectedObjs,
        });

        // Add message about suggestion execution
        const message: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: result.success
                ? `✓ Applied: ${suggestion.label}`
                : `✗ Failed to apply: ${suggestion.label}`,
            timestamp: new Date(),
            command: suggestion.command,
            result,
        };

        setMessages((prev) => [...prev, message]);
        refreshSuggestions();
    }, [commandExecutorRef, document, objects, selectedObjectIds, refreshSuggestions]);

    // Undo last command
    const undoLastCommand = useCallback(async () => {
        if (!commandExecutorRef.current) return;

        const result = await commandExecutorRef.current.undo();

        const message: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: result.success ? '✓ 되돌리기 완료' : '✗ 되돌리기 실패',
            timestamp: new Date(),
            result,
        };

        setMessages((prev) => [...prev, message]);
    }, [commandExecutorRef]);

    return {
        messages,
        isLoading,
        analysisResult,
        suggestions,
        sendMessage,
        createDraft,
        applySuggestion,
        undoLastCommand,
        refreshSuggestions,
    };
};
