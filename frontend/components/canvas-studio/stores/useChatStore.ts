/**
 * Chat Store
 *
 * AI Chat Assistant 상태 관리
 * - 메시지 히스토리
 * - 로딩 상태
 * - 에러 처리
 * - 멀티 LLM 제공자 지원
 *
 * @author C팀 (Frontend Team)
 * @version 3.2
 * @date 2025-11-22
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { TextLLMProvider, ImageLLMProvider, TextLLMConfig, ImageLLMConfig } from './types/llm';
import { DEFAULT_TEXT_LLM_CONFIG, DEFAULT_IMAGE_LLM_CONFIG } from './types/llm';

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string; // For image generation responses
}

export interface ChatState {
  // State
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  textLLMConfig: TextLLMConfig;
  imageLLMConfig: ImageLLMConfig;

  // Actions
  addMessage: (role: 'user' | 'assistant', content: string, imageUrl?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  setTextLLMProvider: (provider: TextLLMProvider) => void;
  setImageLLMProvider: (provider: ImageLLMProvider) => void;
  sendMessage: (content: string) => Promise<void>;
  generateImage: (prompt: string) => Promise<void>;
}

// ============================================================================
// Store
// ============================================================================

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========================================
        // Initial State
        // ========================================

        messages: [
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant for Canvas Studio. How can I help you today?',
            timestamp: new Date(),
          },
        ],
        isLoading: false,
        error: null,
        textLLMConfig: DEFAULT_TEXT_LLM_CONFIG,
        imageLLMConfig: DEFAULT_IMAGE_LLM_CONFIG,

        // ========================================
        // Actions
        // ========================================

        /**
         * 메시지 추가
         */
        addMessage: (role, content, imageUrl) => {
          const message: Message = {
            id: `${Date.now()}-${Math.random()}`,
            role,
            content,
            timestamp: new Date(),
            imageUrl,
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
         * 텍스트 LLM 제공자 설정
         */
        setTextLLMProvider: (provider) => {
          set((state) => ({
            textLLMConfig: {
              ...state.textLLMConfig,
              provider,
            },
          }));
        },

        /**
         * 이미지 LLM 제공자 설정
         */
        setImageLLMProvider: (provider) => {
          set((state) => ({
            imageLLMConfig: {
              ...state.imageLLMConfig,
              provider,
            },
          }));
        },

        /**
         * 메시지 전송 (선택된 LLM 제공자로 API 호출)
         */
        sendMessage: async (content: string) => {
          const { addMessage, setLoading, setError, textLLMConfig } = get();

          // 사용자 메시지 추가
          addMessage('user', content);
          setLoading(true);
          setError(null);

          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: get().messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                })),
                provider: textLLMConfig.provider,
                config: textLLMConfig,
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // AI 응답 추가
            if (data.message) {
              addMessage('assistant', data.message);
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
         * 이미지 생성 (선택된 이미지 LLM 제공자로 API 호출)
         */
        generateImage: async (prompt: string) => {
          const { addMessage, setLoading, setError, imageLLMConfig } = get();

          // 사용자 메시지 추가
          addMessage('user', `Generate image: ${prompt}`);
          setLoading(true);
          setError(null);

          try {
            const response = await fetch('/api/chat/image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt,
                provider: imageLLMConfig.provider,
                config: imageLLMConfig,
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // 이미지 응답 추가
            if (data.imageUrl) {
              addMessage('assistant', data.message || 'Here\'s your generated image:', data.imageUrl);
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
          textLLMConfig: state.textLLMConfig,
          imageLLMConfig: state.imageLLMConfig,
        }),
      }
    ),
    {
      name: 'ChatStore',
    }
  )
);
