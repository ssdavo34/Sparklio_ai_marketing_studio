/**
 * Chat Store
 *
 * AI Chat Assistant 상태 관리
 * - 메시지 히스토리
 * - 로딩 상태
 * - 에러 처리
 * - Backend Agent 시스템 통합
 *
 * @author C팀 (Frontend Team)
 * @version 4.1
 * @date 2025-11-22
 * @reference backend/docs/LLM_INTEGRATION_GUIDE.md
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AgentRole, TaskType, ChatConfig, CostMode } from './types/llm';
import { DEFAULT_CHAT_CONFIG } from './types/llm';
import { sendChatMessage, generateImage, gatewayClient } from '@/lib/llm-gateway-client';
import { useCanvasStore } from './useCanvasStore';

// ============================================================================
// Helper Functions - Canvas 요소 추가
// ============================================================================

/**
 * AI 응답에서 텍스트를 추출하여 Canvas에 추가
 */
function addTextToCanvas(text: string, yPosition: number = 100) {
  console.log(`[addTextToCanvas] Adding text at y=${yPosition}:`, text);

  const polotnoStore = useCanvasStore.getState().polotnoStore;
  if (!polotnoStore) {
    console.warn('[addTextToCanvas] Polotno store not available');
    return;
  }

  const activePage = polotnoStore.activePage;
  if (!activePage) {
    console.warn('[addTextToCanvas] No active page');
    return;
  }

  console.log('[addTextToCanvas] Adding element to page:', activePage.id);

  // 텍스트 요소 추가
  activePage.addElement({
    type: 'text',
    x: 100,
    y: yPosition,
    width: 800,
    height: 100,
    fontSize: 48,
    fontFamily: 'Noto Sans KR',
    text: text,
    fill: '#000000',
    align: 'left',
  });

  console.log('[addTextToCanvas] Element added successfully');
}

/**
 * Canvas에 배경 그라디언트 추가
 */
function addBackgroundToCanvas() {
  console.log('[addBackgroundToCanvas] Adding gradient background');

  const polotnoStore = useCanvasStore.getState().polotnoStore;
  if (!polotnoStore) return;

  const activePage = polotnoStore.activePage;
  if (!activePage) return;

  // 보라색 그라디언트 배경 추가 (브랜드 컬러)
  activePage.addElement({
    type: 'svg',
    x: 0,
    y: 0,
    width: activePage.width,
    height: activePage.height,
    src: `data:image/svg+xml;base64,${btoa(`
      <svg width="${activePage.width}" height="${activePage.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#6366F1;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)"/>
      </svg>
    `)}`,
    selectable: false,
  });

  console.log('[addBackgroundToCanvas] Background added successfully');
}

/**
 * Canvas에 AI 생성 이미지 추가
 */
async function addImageToCanvas(imageUrl: string, productName?: string) {
  console.log('[addImageToCanvas] Adding image to canvas:', imageUrl);

  const polotnoStore = useCanvasStore.getState().polotnoStore;
  if (!polotnoStore) return;

  const activePage = polotnoStore.activePage;
  if (!activePage) return;

  try {
    // 이미지를 Canvas 중앙 상단에 배치 (텍스트 위쪽)
    const imageWidth = 600;
    const imageHeight = 400;
    const imageX = (activePage.width - imageWidth) / 2;
    const imageY = 50;

    activePage.addElement({
      type: 'image',
      src: imageUrl,
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
    });

    console.log('[addImageToCanvas] ✅ Image added successfully at', imageX, imageY);
  } catch (error) {
    console.error('[addImageToCanvas] ❌ Error adding image:', error);
  }
}

/**
 * AI 응답 파싱: headline, subheadline, body 등을 구분하여 Canvas에 추가
 * + 이미지 자동 생성 (제품 이름이 있을 경우)
 */
async function parseAndAddToCanvas(responseText: string, userMessage?: string) {
  console.log('[parseAndAddToCanvas] ========== START ==========');
  console.log('[parseAndAddToCanvas] Received response:', responseText);
  console.log('[parseAndAddToCanvas] Response length:', responseText?.length);
  console.log('[parseAndAddToCanvas] User message:', userMessage);

  // Check Polotno Store availability first
  const polotnoStore = useCanvasStore.getState().polotnoStore;
  console.log('[parseAndAddToCanvas] Polotno Store available:', !!polotnoStore);

  if (!polotnoStore) {
    console.error('[parseAndAddToCanvas] ❌ Polotno store not available!');
    return false;
  }

  const activePage = polotnoStore.activePage;
  console.log('[parseAndAddToCanvas] Active Page available:', !!activePage);

  if (!activePage) {
    console.error('[parseAndAddToCanvas] ❌ No active page!');
    return false;
  }

  console.log('[parseAndAddToCanvas] Active Page ID:', activePage.id);

  // 배경 추가
  addBackgroundToCanvas();

  try {
    // JSON 형태 파싱 시도
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    console.log('[parseAndAddToCanvas] JSON match found:', !!jsonMatch);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[parseAndAddToCanvas] ✅ Parsed JSON successfully:', parsed);

      // ========================================
      // AI 이미지 생성 (제품 이름이 있을 경우)
      // ========================================
      let productName = '';
      let hasImage = false;

      // 제품 이름 추출 (userMessage 또는 headline에서)
      if (userMessage) {
        // "유아용 카시트 광고 만들어줘" 같은 패턴에서 제품 추출
        const productMatch = userMessage.match(/(.+?)(?:\s*광고|를|을|에|의)/);
        if (productMatch) {
          productName = productMatch[1].trim();
        }
      }

      // headline에서도 제품 이름 추출 시도
      if (!productName && parsed.headline) {
        productName = parsed.headline.split(' ')[0]; // 첫 단어를 제품으로 간주
      }

      console.log('[parseAndAddToCanvas] Extracted product name:', productName);

      // 제품 이름이 있으면 이미지 생성
      if (productName) {
        try {
          console.log('[parseAndAddToCanvas] 🎨 Generating product image for:', productName);
          const imageUrl = await generateImage({
            prompt: `Professional product photography of ${productName}, high quality, studio lighting, white background`,
            brandId: undefined, // TODO: 브랜드 ID 연동
          });

          if (imageUrl) {
            console.log('[parseAndAddToCanvas] ✅ Image generated:', imageUrl);
            await addImageToCanvas(imageUrl, productName);
            hasImage = true;
          }
        } catch (imageError) {
          console.error('[parseAndAddToCanvas] ⚠️ Image generation failed:', imageError);
          // 이미지 생성 실패해도 텍스트는 계속 추가
        }
      }

      // 텍스트 시작 위치 조정 (이미지가 있으면 아래쪽부터 시작)
      let yPos = hasImage ? 480 : 120;
      const textWidth = 880; // Canvas 너비에 맞게 조정 (1080px - 좌우 여백 100px씩)
      const textX = (activePage.width - textWidth) / 2; // 중앙 정렬

      // ========================================
      // Format 1: {headline, subheadline, body, bullets, cta}
      // ========================================

      // headline
      if (parsed.headline) {
        console.log('[parseAndAddToCanvas] Adding headline:', parsed.headline);
        activePage.addElement({
          type: 'text',
          x: textX,
          y: yPos,
          width: textWidth,
          height: 80,
          fontSize: 48,
          fontFamily: 'Noto Sans KR',
          fontWeight: 'bold',
          text: parsed.headline,
          fill: '#FFFFFF',
          align: 'center',
        });
        yPos += 90;
      }

      // subheadline
      if (parsed.subheadline) {
        console.log('[parseAndAddToCanvas] Adding subheadline:', parsed.subheadline);
        activePage.addElement({
          type: 'text',
          x: textX,
          y: yPos,
          width: textWidth,
          height: 60,
          fontSize: 24,
          fontFamily: 'Noto Sans KR',
          text: parsed.subheadline,
          fill: '#F3F4F6',
          align: 'center',
        });
        yPos += 70;
      }

      // body
      if (parsed.body) {
        console.log('[parseAndAddToCanvas] Adding body:', parsed.body.substring(0, 50) + '...');
        activePage.addElement({
          type: 'text',
          x: textX,
          y: yPos,
          width: textWidth,
          height: 150,
          fontSize: 18,
          fontFamily: 'Noto Sans KR',
          text: parsed.body,
          fill: '#FFFFFF',
          align: 'center',
        });
        yPos += 160;
      }

      // bullets
      if (parsed.bullets && Array.isArray(parsed.bullets)) {
        console.log('[parseAndAddToCanvas] Adding bullets:', parsed.bullets.length, 'items');
        const bulletText = parsed.bullets.map((b: string) => `• ${b}`).join('\n');
        activePage.addElement({
          type: 'text',
          x: textX,
          y: yPos,
          width: textWidth,
          height: 120,
          fontSize: 16,
          fontFamily: 'Noto Sans KR',
          text: bulletText,
          fill: '#F9FAFB',
          align: 'center',
        });
        yPos += 130;
      }

      // ========================================
      // Format 2: {post, hashtags, cta} (SNS 포맷)
      // ========================================

      // post - 메인 콘텐츠 (headline으로 처리)
      if (parsed.post) {
        console.log('[parseAndAddToCanvas] Adding post (SNS format):', parsed.post.substring(0, 50) + '...');
        activePage.addElement({
          type: 'text',
          x: 100,
          y: yPos,
          width: 800,
          height: 150,
          fontSize: 42,
          fontFamily: 'Noto Sans KR',
          fontWeight: 'bold',
          text: parsed.post,
          fill: '#FFFFFF',
          align: 'center',
        });
        yPos += 200;
      }

      // hashtags - 해시태그
      if (parsed.hashtags) {
        console.log('[parseAndAddToCanvas] Adding hashtags:', parsed.hashtags);
        activePage.addElement({
          type: 'text',
          x: 100,
          y: yPos,
          width: 800,
          height: 60,
          fontSize: 22,
          fontFamily: 'Noto Sans KR',
          text: parsed.hashtags,
          fill: '#C7D2FE', // light purple
          fontWeight: 'normal',
          align: 'center',
        });
        yPos += 100;
      }

      // cta - Call to Action (양쪽 포맷 공통) - 둥근 모서리 버튼
      if (parsed.cta) {
        console.log('[parseAndAddToCanvas] Adding CTA:', parsed.cta);

        // CTA 배경 (둥근 사각형)
        const ctaX = (activePage.width - 500) / 2;
        activePage.addElement({
          type: 'svg',
          x: ctaX,
          y: yPos,
          width: 500,
          height: 70,
          src: `data:image/svg+xml;base64,${btoa(`
            <svg width="500" height="70" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" rx="35" ry="35" fill="#FFFFFF" />
            </svg>
          `)}`,
          selectable: false,
        });

        // CTA 텍스트
        activePage.addElement({
          type: 'text',
          x: ctaX,
          y: yPos + 10,
          width: 500,
          height: 50,
          fontSize: 28,
          fontFamily: 'Noto Sans KR',
          text: parsed.cta,
          fill: '#6366F1',
          fontWeight: 'bold',
          align: 'center',
        });
      }

      console.log('[parseAndAddToCanvas] ✅ JSON parsing complete');
      return true;
    }

    // JSON이 아니면 단순 텍스트로 추가
    console.log('[parseAndAddToCanvas] No JSON found, adding as plain text');
    addTextToCanvas(responseText, 100);
    console.log('[parseAndAddToCanvas] ✅ Plain text added');
    return true;
  } catch (error) {
    console.error('[parseAndAddToCanvas] ❌ Error occurred:', error);
    console.error('[parseAndAddToCanvas] Error stack:', error instanceof Error ? error.stack : 'No stack');
    // 에러 발생 시에도 원본 텍스트 추가 시도
    try {
      addTextToCanvas(responseText, 100);
      console.log('[parseAndAddToCanvas] ✅ Fallback text added after error');
    } catch (fallbackError) {
      console.error('[parseAndAddToCanvas] ❌ Fallback also failed:', fallbackError);
    }
    return false;
  } finally {
    console.log('[parseAndAddToCanvas] ========== END ==========');
  }
}

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  agentUsed?: string;    // Which agent was used (copywriter, designer, etc.)
  taskUsed?: string;      // Which task was executed
  usage?: {               // Token usage info
    tokens?: number;
    cost?: number;
  };
}

export interface ChatState {
  // State
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  chatConfig: ChatConfig;

  // Actions
  addMessage: (
    role: 'user' | 'assistant',
    content: string,
    imageUrl?: string,
    agentUsed?: string,
    taskUsed?: string,
    usage?: any
  ) => void;
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

  // Agent Actions
  sendMessage: (content: string) => Promise<void>;
  generateImageFromPrompt: (prompt: string) => Promise<void>;
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
            content:
              '안녕하세요! Sparklio LLM Gateway 기반 AI 어시스턴트입니다.\n\n' +
              '✨ 제가 도와드릴 수 있는 것들:\n' +
              '• 제품 설명 & 헤드라인 작성\n' +
              '• 소셜 미디어 콘텐츠 생성\n' +
              '• 마케팅 브리프 작성\n' +
              '• 콘텐츠 검수 & 최적화\n' +
              '• 이미지 생성\n\n' +
              'Agent Role과 Task를 선택해서 시작하세요!',
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
        addMessage: (role, content, imageUrl, agentUsed, taskUsed, usage) => {
          const message: Message = {
            id: `${Date.now()}-${Math.random()}`,
            role,
            content,
            timestamp: new Date(),
            imageUrl,
            agentUsed,
            taskUsed,
            usage,
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
         * 메시지 전송 (Backend Agent 사용)
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

            // Map role to agent name (frontend uses different names)
            const agentMap: Record<AgentRole, string> = {
              copywriter: 'copywriter',
              strategist: 'copywriter', // Use copywriter agent for strategist
              brief: 'copywriter',
              reviewer: 'reviewer',
              optimizer: 'copywriter',
              editor: 'copywriter',
              vision: 'designer',
              custom: 'copywriter',
            };

            const agent = agentMap[chatConfig.role] || 'copywriter';

            // Call backend Agent API
            const response = await sendChatMessage({
              userInput: content,
              messageHistory,
              agent,
              task: chatConfig.task,
            });

            // AI 응답 추가
            if (response.content) {
              addMessage(
                'assistant',
                response.content,
                undefined,
                agent,
                chatConfig.task,
                response.usage
              );

              // AI 응답을 Canvas에 자동 추가 (headline, body 등 파싱 + 이미지 생성)
              console.log('[sendMessage] About to parse and add to canvas');
              try {
                await parseAndAddToCanvas(response.content, content);
              } catch (err) {
                console.error('[sendMessage] Failed to add to canvas:', err);
              }
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
         * 이미지 생성 (Backend Designer Agent 사용)
         */
        generateImageFromPrompt: async (prompt: string) => {
          const { addMessage, setLoading, setError } = get();

          // 사용자 메시지 추가
          addMessage('user', `Generate image: ${prompt}`);
          setLoading(true);
          setError(null);

          try {
            // Call backend Designer Agent for image generation
            const imageUrl = await generateImage({
              prompt,
            });

            if (imageUrl) {
              addMessage(
                'assistant',
                'Here\'s your generated image:',
                imageUrl,
                'designer',
                'generate_image'
              );
            } else {
              throw new Error('No image URL in response');
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
