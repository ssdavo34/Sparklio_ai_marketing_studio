/**
 * Chat Store
 *
 * AI Chat Assistant 상태 관리
 * - 메시지 히스토리
 * - 로딩 상태
 * - 에러 처리
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 * @date 2025-11-22
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  // State
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  sendMessage: (content: string) => Promise<void>;
}

// ============================================================================
// Store
// ============================================================================

export const useChatStore = create<ChatState>()(
  devtools(
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

      // ========================================
      // Actions
      // ========================================

      /**
       * 메시지 추가
       */
      addMessage: (role, content) => {
        const message: Message = {
          id: `${Date.now()}-${Math.random()}`,
          role,
          content,
          timestamp: new Date(),
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
       * 메시지 전송 (OpenAI API 호출)
       */
      sendMessage: async (content: string) => {
        const { addMessage, setLoading, setError } = get();

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
    }),
    {
      name: 'ChatStore',
    }
  )
);
