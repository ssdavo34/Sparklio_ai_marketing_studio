import { create } from 'zustand';

/**
 * Chat Store
 *
 * Chat 패널의 상태를 관리합니다.
 * - 메시지 히스토리
 * - 현재 입력 중인 텍스트
 * - 로딩 상태
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatState {
  // 상태
  messages: ChatMessage[];
  inputText: string;
  isGenerating: boolean;

  // 액션
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setInputText: (text: string) => void;
  setIsGenerating: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // 초기 상태
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 무엇을 만들어드릴까요?\n\n예시:\n- "스킨케어 제품 상세페이지 만들어줘"\n- "신제품 런칭 SNS 포스트 만들어줘"\n- "우리 브랜드 킷 만들어줘"',
      timestamp: new Date(),
    },
  ],
  inputText: '',
  isGenerating: false,

  // 액션 구현
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg_${Date.now()}`,
          timestamp: new Date(),
        },
      ],
    })),

  setInputText: (text) => set({ inputText: text }),

  setIsGenerating: (loading) => set({ isGenerating: loading }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '안녕하세요! 무엇을 만들어드릴까요?',
          timestamp: new Date(),
        },
      ],
    }),
}));
