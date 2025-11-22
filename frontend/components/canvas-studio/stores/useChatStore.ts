/**
 * Chat Store
 *
 * AI Chat Assistant 상태 관리
 * - 메시지 히스토리
 * - 로딩 상태
 * - 에러 처리
 * - Backend Gateway 통합 (role/task 패턴)
 *
 * @author C팀 (Frontend Team)
 * @version 4.0
 * @date 2025-11-22
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AgentRole, TaskType, ChatConfig, CostMode } from './types/llm';
import { DEFAULT_CHAT_CONFIG } from './types/llm';
import { sendChatMessage, generateImage } from '@/lib/llm-gateway-client';

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  providerUsed?: string;  // Which provider was used by backend
  modelUsed?: string;      // Which model was used
}

export interface ChatState {
  // State
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  chatConfig: ChatConfig;

  // Actions
  addMessage: (role: 'user' | 'assistant', content: string, imageUrl?: string, providerUsed?: string, modelUsed?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;

  // Configuration
  setRole: (role: AgentRole) => void;
  setTask: (task: TaskType) => void;
  setCostMode: (mode: CostMode) => void;
  setLanguage: (language: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;

  // Gateway Actions
  sendMessage: (content: string) => Promise<void>;
  generateImageFromPrompt: (prompt: string) => Promise<void>;
}

// ============================================================================
// Store
// ============================================================================

export const useChatStore = create<ChatState>()( devtools(
    persist(
      (set, get) => ({
        // ========================================
        // Initial State
        // ========================================

        messages: [
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant for Canvas Studio. I can help you with:\n\n• Product descriptions\n• Social media content\n• Marketing briefs\n• Content review & optimization\n• Image generation\n\nSelect a role and task to get started!',
            timestamp: new Date(),
          },
        ],
        isLoading: false,
        error: null,
        chatConfig: DEFAULT_CHAT_CONFIG,

        // ========================================
        // Actions
        // ========================================

        /**
         * 메시지 추가
         */
        addMessage: (role, content, imageUrl, providerUsed, modelUsed) => {
          const message: Message = {
            id: `${Date.now()}-${Math.random()}`,
            role,
            content,
            timestamp: new Date(),
            imageUrl,
            providerUsed,
            modelUsed,
          };
          set((state) => ({
            messages: [...state.messages, message],
          }));
        },

        /**
         * 로딩 상태 설정
         */
        setLoading: (loading) => {
          set({ isLoading: loading });
        },

        /**
         * 에러 설정
         */
        setError: (error) => {
          set({ error });
        },

        /**
         * 메시지 전체 삭제
         */
        clearMessages: () => {
          set({ messages: [], error: null });
        },

        /**
         * Agent Role 설정
         */
        setRole: (role) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              role,
            },
          }));
        },

        /**
         * Task 설정
         */
        setTask: (task) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              task,
            },
          }));
        },

        /**
         * Cost Mode 설정
         */
        setCostMode: (mode) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              costMode: mode,
            },
          }));
        },

        /**
         * Language 설정
         */
        setLanguage: (language) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              language,
            },
          }));
        },

        /**
         * Temperature 설정
         */
        setTemperature: (temperature) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              temperature,
            },
          }));
        },

        /**
         * Max Tokens 설정
         */
        setMaxTokens: (maxTokens) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              maxTokens,
            },
          }));
        },

        /**
         * 메시지 전송 (Backend Gateway 사용)
         */
        sendMessage: async (content: string) => {
          const { addMessage, setLoading, setError, chatConfig, messages } = get();

          // 사용자 메시지 추가
          addMessage('user', content);
          setLoading(true);
          setError(null);

          try {
            // Prepare message history (last 10 messages for context)
            const messageHistory = messages
              .slice(-10)
              .map((m) => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
              }));

            // Call backend Gateway
            const response = await sendChatMessage({
              role: chatConfig.role,
              task: chatConfig.task,
              userInput: content,
              messageHistory,
              costMode: chatConfig.costMode,
              language: chatConfig.language,
              temperature: chatConfig.temperature,
              maxTokens: chatConfig.maxTokens,
            });

            // AI 응답 추가
            if (response.result) {
              const resultText = typeof response.result === 'string'
                ? response.result
                : JSON.stringify(response.result, null, 2);

              addMessage(
                'assistant',
                resultText,
                undefined,
                response.provider_used,
                response.model_used
              );
            } else {
              throw new Error('No response from AI');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setError(errorMessage);
            addMessage('assistant', `Sorry, I encountered an error: ${errorMessage}`);
          } finally {
            setLoading(false);
          }
        },

        /**
         * 이미지 생성 (Backend Gateway 사용)
         */
        generateImageFromPrompt: async (prompt: string) => {
          const { addMessage, setLoading, setError, chatConfig } = get();

          // 사용자 메시지 추가
          addMessage('user', `Generate image: ${prompt}`);
          setLoading(true);
          setError(null);

          try {
            // Call backend Gateway for image generation
            const response = await generateImage({
              prompt,
              costMode: chatConfig.costMode,
            });

            // 이미지 응답 추가
            if (response.result) {
              // Backend returns image URL or base64
              const imageUrl = typeof response.result === 'string'
                ? response.result
                : response.result.url || response.result.image_url;

              if (imageUrl) {
                addMessage(
                  'assistant',
                  'Here\'s your generated image:',
                  imageUrl,
                  response.provider_used,
                  response.model_used
                );
              } else {
                throw new Error('No image URL in response');
              }
            } else {
              throw new Error('No image generated');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setError(errorMessage);
            addMessage('assistant', `Sorry, I encountered an error generating the image: ${errorMessage}`);
          } finally {
            setLoading(false);
          }
        },
      }),
      {
        name: 'canvas-studio-chat',
        partialize: (state) => ({
          chatConfig: state.chatConfig,
        }),
      }
    ),
    {
      name: 'ChatStore',
    }
  )
);
