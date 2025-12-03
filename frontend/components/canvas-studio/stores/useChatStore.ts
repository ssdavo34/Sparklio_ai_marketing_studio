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
import type { AgentRole, TaskType, ChatConfig, CostMode, TextLLMProvider, ImageLLMProvider, VideoLLMProvider, SmartRouterConfig } from './types/llm';
import { DEFAULT_CHAT_CONFIG, DEFAULT_SMART_ROUTER_CONFIG } from './types/llm';
import { sendChatMessage, generateImage, gatewayClient, generateConcepts } from '@/lib/llm-gateway-client';
import { useCanvasStore } from './useCanvasStore';
import { useBrandStore } from './useBrandStore';
import { getAdLayout, selectBestLayout, type AdLayoutType } from '../utils/ad-layouts';
import { detectErrorType, createUserFriendlyError, type ErrorType } from '../components/ErrorMessage';
import { useGeneratedAssetsStore } from './useGeneratedAssetsStore';
import { useCenterViewStore } from './useCenterViewStore';
import { getCanvasStore } from '../polotno/polotnoStoreSingleton';
import { createProductionPagesFromConcepts } from '@/lib/utils/conceptToPolotnoPage';
import { generateThumbnailForPage } from '@/lib/utils/thumbnail';

// ============================================================================
// Helper Functions - Canvas Store 접근
// ============================================================================

/**
 * 현재 활성 캔버스 타입의 Polotno Store를 가져옴
 * 싱글톤 store를 우선 사용하고, 없으면 Zustand store를 사용
 */
function getCurrentPolotnoStore() {
  const { activeCanvasType, polotnoStore } = useCanvasStore.getState();
  return getCanvasStore(activeCanvasType) || polotnoStore;
}

// ============================================================================
// Helper Functions - Canvas 요소 추가
// ============================================================================

/**
 * AI 응답에서 텍스트를 추출하여 Canvas에 추가
 * 싱글톤 Polotno Store를 우선 사용하고, 없으면 Zustand store를 사용
 */
function addTextToCanvas(text: string, yPosition: number = 100) {
  console.log(`[addTextToCanvas] Adding text at y=${yPosition}:`, text);

  // 현재 활성 캔버스 타입의 store 사용
  const polotnoStore = getCurrentPolotnoStore();
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
 * Canvas에 배경 테마 추가
 * - useCanvasStore의 현재 테마를 사용
 */
function addBackgroundToCanvas() {
  console.log('[addBackgroundToCanvas] Adding background with current theme');

  // useCanvasStore의 applyThemeToCanvas 사용
  const canvasStore = useCanvasStore.getState();
  const currentTheme = canvasStore.currentTheme;

  if (canvasStore.applyThemeToCanvas) {
    canvasStore.applyThemeToCanvas(currentTheme);
    console.log('[addBackgroundToCanvas] Background added successfully using theme:', currentTheme.name);
  }
}

/**
 * Canvas에 AI 생성 이미지 추가
 * 싱글톤 Polotno Store를 우선 사용
 */
async function addImageToCanvas(imageUrl: string, productName?: string) {
  console.log('[addImageToCanvas] Adding image to canvas:', imageUrl);

  // 현재 활성 캔버스 타입의 store 사용
  const polotnoStore = getCurrentPolotnoStore();
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
 * 장식 도형 추가 (원, 사각형, 선)
 */
function addDecorativeShape(
  page: any,
  shape: {
    type: 'circle' | 'square' | 'line';
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    opacity: number;
  }
) {
  try {
    if (shape.type === 'circle') {
      const svgCircle = `
        <svg width="${shape.width}" height="${shape.height}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${shape.width / 2}" cy="${shape.height / 2}" r="${shape.width / 2}" fill="${shape.color}" opacity="${shape.opacity}" />
        </svg>
      `;
      page.addElement({
        type: 'svg',
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        src: `data:image/svg+xml;base64,${btoa(svgCircle)}`,
        selectable: false,
      });
    } else if (shape.type === 'square') {
      const svgSquare = `
        <svg width="${shape.width}" height="${shape.height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${shape.color}" opacity="${shape.opacity}" />
        </svg>
      `;
      page.addElement({
        type: 'svg',
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        src: `data:image/svg+xml;base64,${btoa(svgSquare)}`,
        selectable: false,
      });
    } else if (shape.type === 'line') {
      const svgLine = `
        <svg width="${shape.width}" height="${shape.height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${shape.color}" opacity="${shape.opacity}" />
        </svg>
      `;
      page.addElement({
        type: 'svg',
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        src: `data:image/svg+xml;base64,${btoa(svgLine)}`,
        selectable: false,
      });
    }
  } catch (error) {
    console.error('[addDecorativeShape] Error:', error);
  }
}

/**
 * AI 응답 파싱: headline, subheadline, body 등을 구분하여 Canvas에 추가
 * + 프로페셔널한 레이아웃 시스템 적용
 * + 이미지 자동 생성 (제품 이름이 있을 경우)
 */
async function parseAndAddToCanvas(responseText: string, userMessage?: string) {
  console.log('[parseAndAddToCanvas] ========== START ==========');
  console.log('[parseAndAddToCanvas] Received response:', responseText);
  console.log('[parseAndAddToCanvas] Response length:', responseText?.length);
  console.log('[parseAndAddToCanvas] User message:', userMessage);

  // 현재 활성 캔버스 타입의 store 사용
  const polotnoStore = getCurrentPolotnoStore();
  console.log('[parseAndAddToCanvas] Polotno Store available:', !!polotnoStore);
  console.log('[parseAndAddToCanvas] Active canvas type:', useCanvasStore.getState().activeCanvasType);

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
  console.log('[parseAndAddToCanvas] Canvas size:', activePage.width, 'x', activePage.height);

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
      // 콘텐츠 분석 및 최적 레이아웃 선택
      // ========================================
      const contentAnalysis = {
        hasImage: false,
        hasBullets: !!(parsed.bullets && Array.isArray(parsed.bullets) && parsed.bullets.length > 0),
        textLength: (parsed.headline || '').length + (parsed.subheadline || '').length + (parsed.body || '').length,
      };

      // ========================================
      // AI 이미지 생성 (제품 이름이 있을 경우)
      // ========================================
      let productName = '';
      let generatedImageUrl = '';

      // 제품 이름 추출 (userMessage에서 정확하게)
      if (userMessage) {
        // "핸드크림 광고 만들어줘" → "핸드크림"
        // "갤럭시 S25 광고" → "갤럭시 S25"
        const productMatch = userMessage.match(/^(.+?)\s*(?:광고|을|를|의|에|만들|생성)/);
        if (productMatch) {
          productName = productMatch[1].trim();
        }
      }

      console.log('[parseAndAddToCanvas] 📝 Extracted product name:', productName);

      // 제품 이름이 있으면 이미지 생성
      if (productName) {
        try {
          console.log('[parseAndAddToCanvas] 🎨 Generating product image for:', productName);

          // 이미지 프롬프트를 한국어 제품명으로 더 정확하게
          // 브랜드 스토어에서 현재 브랜드 ID 가져오기
          const { brandKit } = useBrandStore.getState();
          const currentBrandId = brandKit?.brand_id || undefined;

          const imageUrl = await generateImage({
            prompt: `${productName} 제품 사진, 전문 상업 광고용, 고품질, 스튜디오 조명, 깨끗한 배경, 상품 디테일 강조`,
            brandId: currentBrandId,
          });

          if (imageUrl) {
            console.log('[parseAndAddToCanvas] ✅ Image generated:', imageUrl.substring(0, 100) + '...');

            // Check if imageUrl is already Base64 data
            if (imageUrl.startsWith('data:image/') || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
              // Already Base64 data - convert raw Base64 to data URL if needed
              if (imageUrl.startsWith('data:image/')) {
                generatedImageUrl = imageUrl;
              } else {
                // Raw Base64 string - add data URL prefix
                generatedImageUrl = `data:image/png;base64,${imageUrl}`;
              }
              contentAnalysis.hasImage = true;
              console.log('[parseAndAddToCanvas] ✅ Using Base64 image data');
            } else {
              // HTTP/HTTPS URL - fetch and convert to Base64 to avoid CORS
              try {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
                generatedImageUrl = base64;
                contentAnalysis.hasImage = true;
                console.log('[parseAndAddToCanvas] ✅ Image converted to Base64');
              } catch (fetchError) {
                console.error('[parseAndAddToCanvas] ⚠️ Failed to convert image to Base64:', fetchError);
                // Base64 변환 실패해도 원본 URL 사용
                generatedImageUrl = imageUrl;
                contentAnalysis.hasImage = true;
              }
            }
          }
        } catch (imageError) {
          console.error('[parseAndAddToCanvas] ⚠️ Image generation failed:', imageError);
          // 이미지 생성 실패해도 텍스트는 계속 추가
        }
      }

      // ========================================
      // 최적 레이아웃 선택 및 적용
      // ========================================
      const layoutType = selectBestLayout(contentAnalysis);
      console.log('[parseAndAddToCanvas] 📐 Selected layout:', layoutType);

      const layout = getAdLayout({
        canvasWidth: activePage.width,
        canvasHeight: activePage.height,
        layoutType,
      });

      // ========================================
      // 장식 도형 추가
      // ========================================
      if (layout.decorativeShapes && layout.decorativeShapes.length > 0) {
        console.log('[parseAndAddToCanvas] 🎨 Adding decorative shapes:', layout.decorativeShapes.length);
        layout.decorativeShapes.forEach((shape) => {
          addDecorativeShape(activePage, shape);
        });
      }

      // ========================================
      // 이미지 추가 (레이아웃 기반 위치)
      // ========================================
      if (generatedImageUrl && layout.image) {
        console.log('[parseAndAddToCanvas] 🖼️ Adding image at:', layout.image);
        activePage.addElement({
          type: 'image',
          src: generatedImageUrl,
          x: layout.image.x,
          y: layout.image.y,
          width: layout.image.width,
          height: layout.image.height,
        });
      }

      // ========================================
      // 텍스트 요소 추가 (레이아웃 기반 위치 및 스타일)
      // ========================================

      // optimized_product_info 구조 지원 (B팀 API 응답 형식)
      let headline = parsed.headline || parsed.post;
      let subheadline = parsed.subheadline;
      let body = parsed.body;
      let cta = parsed.cta;
      let hashtags = parsed.hashtags;

      // 다양한 AI 응답 구조 지원
      // 구조 1: optimized_product_info 객체
      if (parsed.optimized_product_info) {
        const info = parsed.optimized_product_info;
        console.log('[parseAndAddToCanvas] 📦 Found optimized_product_info structure');

        if (info.headline_tagline_options && info.headline_tagline_options.length > 0) {
          headline = info.headline_tagline_options[0];
        }
        if (info.product_name) {
          subheadline = info.product_name;
        }
        if (info.marketing_brief?.summary) {
          body = info.marketing_brief.summary;
        }
        cta = cta || '자세히 보기';
        if (info.social_media_content?.instagram_post) {
          const hashtagMatch = info.social_media_content.instagram_post.match(/#\S+/g);
          if (hashtagMatch) {
            hashtags = hashtagMatch.slice(0, 5);
          }
        }
      }

      // 구조 2: optimized_product_title 직접 속성 (실제 API 응답)
      if (parsed.optimized_product_title) {
        console.log('[parseAndAddToCanvas] 📦 Found optimized_product_title structure');
        headline = parsed.optimized_product_title;
      }

      if (parsed.product_description && !body) {
        body = parsed.product_description;
      }

      // social_media_content 배열에서 해시태그 추출
      if (parsed.social_media_content && Array.isArray(parsed.social_media_content)) {
        console.log('[parseAndAddToCanvas] 📦 Found social_media_content array:', parsed.social_media_content.length);
        const instagramPost = parsed.social_media_content.find((item: any) => item.platform === '인스타그램');
        if (instagramPost?.content) {
          const hashtagMatch = instagramPost.content.match(/#\S+/g);
          if (hashtagMatch) {
            hashtags = hashtagMatch.slice(0, 5);
          }
        }
      }

      // marketing_brief에서 추가 정보 추출
      if (parsed.marketing_brief) {
        if (parsed.marketing_brief.summary && !body) {
          body = parsed.marketing_brief.summary;
        }
        if (parsed.marketing_brief.target_audience && !subheadline) {
          subheadline = `타깃: ${parsed.marketing_brief.target_audience}`;
        }
      }

      // unique_selling_points에서 서브헤드라인
      if (parsed.unique_selling_points && Array.isArray(parsed.unique_selling_points) && parsed.unique_selling_points.length > 0) {
        if (!subheadline) {
          subheadline = parsed.unique_selling_points[0];
        }
      }

      // 기본값 설정
      cta = cta || '자세히 보기';

      console.log('[parseAndAddToCanvas] 📝 Final extracted data:', {
        headline: headline?.substring(0, 30),
        subheadline: subheadline?.substring(0, 30),
        body: body?.substring(0, 30),
        hasHashtags: !!hashtags
      });

      // Headline
      if (headline) {
        const headlineText = headline;
        console.log('[parseAndAddToCanvas] 📝 Adding headline:', headlineText);
        activePage.addElement({
          type: 'text',
          x: layout.headline.x,
          y: layout.headline.y,
          width: layout.headline.width,
          height: layout.headline.height,
          fontSize: layout.headline.fontSize,
          fontFamily: 'Noto Sans KR',
          fontWeight: layout.headline.fontWeight,
          text: headlineText,
          fill: '#FFFFFF',
          align: layout.headline.align,
        });
      }

      // Subheadline
      if (subheadline) {
        console.log('[parseAndAddToCanvas] 📝 Adding subheadline:', subheadline);
        activePage.addElement({
          type: 'text',
          x: layout.subheadline.x,
          y: layout.subheadline.y,
          width: layout.subheadline.width,
          height: layout.subheadline.height,
          fontSize: layout.subheadline.fontSize,
          fontFamily: 'Noto Sans KR',
          text: subheadline,
          fill: '#F3F4F6',
          align: layout.subheadline.align,
        });
      }

      // Body
      if (body && layout.body) {
        console.log('[parseAndAddToCanvas] 📝 Adding body:', body.substring(0, 50) + '...');
        activePage.addElement({
          type: 'text',
          x: layout.body.x,
          y: layout.body.y,
          width: layout.body.width,
          height: layout.body.height,
          fontSize: layout.body.fontSize,
          fontFamily: 'Noto Sans KR',
          text: body,
          fill: '#FFFFFF',
          align: layout.body.align,
        });
      }

      // Bullets
      if (parsed.bullets && Array.isArray(parsed.bullets) && layout.bullets) {
        console.log('[parseAndAddToCanvas] 📝 Adding bullets:', parsed.bullets.length, 'items');
        const bulletText = parsed.bullets.map((b: string) => `• ${b}`).join('\n');
        activePage.addElement({
          type: 'text',
          x: layout.bullets.x,
          y: layout.bullets.y,
          width: layout.bullets.width,
          height: layout.bullets.height,
          fontSize: layout.bullets.fontSize,
          fontFamily: 'Noto Sans KR',
          text: bulletText,
          fill: '#F9FAFB',
          align: layout.bullets.align,
        });
      }

      // Hashtags (SNS 포맷)
      if (hashtags && layout.subheadline) {
        console.log('[parseAndAddToCanvas] #️⃣ Adding hashtags:', hashtags);
        const hashtagText = Array.isArray(hashtags)
          ? hashtags.join(' ')
          : hashtags;
        activePage.addElement({
          type: 'text',
          x: layout.subheadline.x,
          y: layout.subheadline.y + layout.subheadline.height + 20,
          width: layout.subheadline.width,
          height: 60,
          fontSize: Math.min(layout.subheadline.fontSize * 0.8, 22),
          fontFamily: 'Noto Sans KR',
          text: hashtagText,
          fill: '#C7D2FE', // light purple
          fontWeight: 'normal',
          align: layout.subheadline.align,
        });
      }

      // ========================================
      // CTA Button (프로페셔널한 스타일)
      // ========================================
      if (cta) {
        console.log('[parseAndAddToCanvas] 🎯 Adding CTA:', cta);

        const ctaStyle = layout.cta.buttonStyle;
        let borderRadius = 0;
        if (ctaStyle === 'pill') borderRadius = layout.cta.height / 2;
        else if (ctaStyle === 'rounded') borderRadius = 12;

        // CTA 배경 (그림자 효과 포함)
        const ctaSvg = `
          <svg width="${layout.cta.width}" height="${layout.cta.height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="4" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" rx="${borderRadius}" ry="${borderRadius}" fill="#FFFFFF" filter="url(#shadow)" />
          </svg>
        `;

        activePage.addElement({
          type: 'svg',
          x: layout.cta.x,
          y: layout.cta.y,
          width: layout.cta.width,
          height: layout.cta.height,
          src: `data:image/svg+xml;base64,${btoa(ctaSvg)}`,
          selectable: false,
        });

        // CTA 텍스트
        activePage.addElement({
          type: 'text',
          x: layout.cta.x,
          y: layout.cta.y + (layout.cta.height - layout.cta.fontSize) / 2,
          width: layout.cta.width,
          height: layout.cta.fontSize + 10,
          fontSize: layout.cta.fontSize,
          fontFamily: 'Noto Sans KR',
          text: cta,
          fill: '#6366F1',
          fontWeight: 'bold',
          align: 'center',
        });
      }

      console.log('[parseAndAddToCanvas] ✅ Professional layout applied successfully');
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

/**
 * 메시지에 첨부된 이미지 정보
 *
 * 2025-11-30 업데이트: B팀 3종 URL 지원
 * @see docs/FRONTEND_API_CHANGE_2025-11-30.md
 */
export interface MessageImage {
  // 3종 URL (신규 - 권장)
  asset_id?: string;       // DB 에셋 ID
  original_url?: string;   // 원본 (다운로드, 편집)
  preview_url?: string;    // 프리뷰 (캔버스, 상세뷰) - 1080px
  thumb_url?: string;      // 썸네일 (목록, 챗) - 200px

  // Legacy (Deprecated)
  image_url?: string;      // original_url 사용 권장
  image_base64?: string;   // 저장된 경우 null

  // 메타데이터
  prompt?: string;
  width?: number;
  height?: number;
}

/**
 * 채팅에서 이미지 표시용 URL 가져오기
 * 용도에 따라 적절한 URL 반환 (fallback 포함)
 */
export function getMessageImageUrl(
  image: MessageImage | string | undefined,
  usage: 'thumb' | 'preview' | 'original' = 'thumb'
): string {
  if (!image) return '';

  // Legacy: string인 경우 그대로 반환
  if (typeof image === 'string') return image;

  switch (usage) {
    case 'thumb':
      return image.thumb_url || image.preview_url || image.image_url || image.original_url || '';
    case 'original':
      return image.original_url || image.image_url || '';
    case 'preview':
    default:
      return image.preview_url || image.original_url || image.image_url || '';
  }
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageUrl?: string;       // Legacy (Deprecated) - imageData 사용 권장
  imageData?: MessageImage; // 3종 URL 지원 (2025-11-30)
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
  errorType: ErrorType | null;
  errorDetails: Record<string, any> | null;
  chatConfig: ChatConfig;

  // Actions
  addMessage: (
    role: 'user' | 'assistant',
    content: string,
    imageUrl?: string,
    agentUsed?: string,
    taskUsed?: string,
    usage?: any,
    imageData?: MessageImage
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null, type?: ErrorType, details?: Record<string, any>) => void;
  clearError: () => void;
  retryLastMessage: () => Promise<void>;
  clearMessages: () => void;

  // Configuration
  setRole: (role: AgentRole) => void;
  setTask: (task: TaskType) => void;
  setCostMode: (mode: CostMode) => void;
  setLanguage: (language: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setTextLLM: (provider: TextLLMProvider) => void;
  setImageLLM: (provider: ImageLLMProvider) => void;
  setVideoLLM: (provider: VideoLLMProvider) => void;

  // Smart Router Configuration
  setSmartRouterEnabled: (enabled: boolean) => void;
  setTextPriority: (priority: TextLLMProvider[]) => void;
  setImagePriority: (priority: ImageLLMProvider[]) => void;
  setVideoPriority: (priority: VideoLLMProvider[]) => void;

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
        errorType: null,
        errorDetails: null,
        chatConfig: DEFAULT_CHAT_CONFIG,

        // ========================================
        // Actions
        // ========================================

        /**
         * 메시지 추가
         * 2025-11-30 업데이트: imageData 파라미터 추가 (3종 URL 지원)
         */
        addMessage: (role, content, imageUrl, agentUsed, taskUsed, usage, imageData) => {
          const message: Message = {
            id: `${Date.now()}-${Math.random()}`,
            role,
            content,
            timestamp: new Date(),
            imageUrl,
            imageData,
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
        setError: (error: string | null, type?: ErrorType, details?: Record<string, any>) => {
          // 에러 타입 자동 감지 (타입이 제공되지 않은 경우)
          const errorType = type || (error ? detectErrorType(error) : null);
          set({
            error,
            errorType,
            errorDetails: details || null
          });
        },

        clearError: () => {
          set({
            error: null,
            errorType: null,
            errorDetails: null
          });
        },

        retryLastMessage: async () => {
          const { messages, sendMessage, generateImageFromPrompt } = get();

          // 마지막 사용자 메시지 찾기
          const lastUserMessage = [...messages]
            .reverse()
            .find(m => m.role === 'user');

          if (!lastUserMessage) {
            console.warn('[retryLastMessage] No user message to retry');
            return;
          }

          // 이미지 생성 요청인지 확인
          if (lastUserMessage.content.toLowerCase().startsWith('generate image:')) {
            const prompt = lastUserMessage.content.replace(/^generate image:\s*/i, '');
            await generateImageFromPrompt(prompt);
          } else {
            await sendMessage(lastUserMessage.content);
          }
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
         * Text LLM 제공자 설정
         */
        setTextLLM: (provider) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              textLLM: provider,
            },
          }));
        },

        /**
         * Image LLM 제공자 설정
         */
        setImageLLM: (provider) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              imageLLM: provider,
            },
          }));
        },

        /**
         * Video LLM 제공자 설정
         */
        setVideoLLM: (provider) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              videoLLM: provider,
            },
          }));
        },

        /**
         * 스마트 라우터 ON/OFF 설정
         */
        setSmartRouterEnabled: (enabled) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              smartRouter: {
                ...(state.chatConfig.smartRouter || DEFAULT_SMART_ROUTER_CONFIG),
                enabled,
              },
            },
          }));
        },

        /**
         * 텍스트 LLM 우선순위 설정
         */
        setTextPriority: (priority) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              smartRouter: {
                ...(state.chatConfig.smartRouter || DEFAULT_SMART_ROUTER_CONFIG),
                textPriority: priority,
              },
            },
          }));
        },

        /**
         * 이미지 LLM 우선순위 설정
         */
        setImagePriority: (priority) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              smartRouter: {
                ...(state.chatConfig.smartRouter || DEFAULT_SMART_ROUTER_CONFIG),
                imagePriority: priority,
              },
            },
          }));
        },

        /**
         * 동영상 LLM 우선순위 설정
         */
        setVideoPriority: (priority) => {
          set((state) => ({
            chatConfig: {
              ...state.chatConfig,
              smartRouter: {
                ...(state.chatConfig.smartRouter || DEFAULT_SMART_ROUTER_CONFIG),
                videoPriority: priority,
              },
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
            // 🆕 전략적 키워드 감지 → ConceptAgent v2.0 호출
            const conceptKeywords = ['캠페인', '홍보', '컨셉', '마케팅', '광고', '전략', '런칭', '프로모션', '브랜딩', '기획'];
            const shouldUseConceptAgent = conceptKeywords.some(keyword => content.includes(keyword));

            // 전략적 키워드 감지 시 role에 상관없이 ConceptAgent 호출
            if (shouldUseConceptAgent) {
              console.log('[sendMessage] 🎯 ConceptAgent v2.0 호출 (전략적 키워드 감지)');

              // ConceptAgent 호출
              const conceptResponse = await generateConcepts({
                prompt: content,
                conceptCount: 3,
              });

              console.log('[sendMessage] ✅ ConceptAgent 응답:', conceptResponse);

              // ConceptV1 데이터를 ConceptBoardData 형식으로 변환
              const conceptBoardData = {
                campaign_id: `campaign-${Date.now()}`,
                campaign_name: content.substring(0, 50),
                status: 'completed' as const,
                created_at: new Date().toISOString(),
                meeting_summary: {
                  title: content,
                  duration_minutes: 0,
                  participants: [],
                  key_points: [],
                  core_message: conceptResponse.reasoning || '',
                },
                concepts: conceptResponse.concepts.map((c: any, idx: number) => ({
                  concept_id: c.id || `concept-${Date.now()}-${idx}`,
                  concept_name: c.name,
                  concept_description: c.topic || '',
                  target_audience: c.target_audience || '',
                  key_message: c.core_promise || c.key_message || '',
                  tone_and_manner: c.tone_and_manner || '',
                  visual_style: c.visual_world?.photo_style || '',
                  thumbnail_url: undefined,
                  // 🆕 ConceptV1 고도화 필드
                  audience_insight: c.audience_insight,
                  core_promise: c.core_promise,
                  brand_role: c.brand_role,
                  reason_to_believe: c.reason_to_believe,
                  creative_device: c.creative_device,
                  hook_patterns: c.hook_patterns,
                  visual_world: c.visual_world,
                  channel_strategy: c.channel_strategy,
                  guardrails: c.guardrails,
                  assets: {
                    presentation: { id: `pres-${c.id}`, status: 'pending' as const },
                    product_detail: { id: `detail-${c.id}`, status: 'pending' as const },
                    instagram_ads: { id: `insta-${c.id}`, status: 'pending' as const, count: 0 },
                    shorts_script: { id: `shorts-${c.id}`, status: 'pending' as const, duration_seconds: 0 },
                  },
                })),
              };

              // CenterView에 ConceptBoard 데이터 설정 및 뷰 전환
              useCenterViewStore.getState().setConceptBoardData(conceptBoardData);
              useCenterViewStore.getState().setView('concept_board');

              // 🔥 FIX: PagesTab이 읽는 useGeneratedAssetsStore에도 동기화
              const generatedConceptData = {
                id: conceptBoardData.campaign_id,
                campaign_name: conceptBoardData.campaign_name,
                concepts: conceptBoardData.concepts.map(c => ({
                  concept_id: c.concept_id,
                  concept_name: c.key_message || c.concept_description || `컨셉 ${c.concept_id}`,
                  description: c.concept_description || '',
                  headline: c.key_message || '',
                  subheadline: c.target_audience || '',
                  cta: '자세히 보기',
                  target_audience: c.target_audience || '',
                  tone: c.brand_role || '',
                })),
                createdAt: new Date(),
                sourceMessage: content,
              };
              useGeneratedAssetsStore.getState().setConceptBoardData(generatedConceptData);
              console.log('[sendMessage] ✅ ConceptBoard 데이터 동기화 완료 (CenterView + GeneratedAssets)');

              // 🖼️ Polotno 페이지 생성 + 썸네일 자동 생성
              const polotnoStore = getCurrentPolotnoStore();
              if (polotnoStore) {
                console.log('[sendMessage] 📄 Polotno 페이지 생성 시작...');

                try {
                  // 각 컨셉을 실제 생산물 페이지로 변환 (슬라이드 포맷)
                  // ✅ 신규: 실제 1920×1080 슬라이드 페이지
                  // ❌ 기존: 1080×1080 가상 컨셉 요약 페이지
                  const createdPages = createProductionPagesFromConcepts(
                    polotnoStore,
                    conceptBoardData.concepts,
                    'slide_16_9'  // 실제 슬라이드 포맷
                  );

                  console.log(`[sendMessage] ✅ ${createdPages.length}개 Polotno 페이지 생성 완료`);

                  // 각 페이지에 대해 썸네일 생성 (비동기로 순차 처리)
                  for (const page of createdPages) {
                    try {
                      await generateThumbnailForPage(polotnoStore, page.id, {
                        pixelRatio: 0.2,
                        quality: 0.7,
                        mimeType: 'image/jpeg'
                      });
                      console.log(`[sendMessage] 🖼️ 썸네일 생성 완료: ${page.id}`);
                    } catch (thumbErr) {
                      console.error(`[sendMessage] ❌ 썸네일 생성 실패 (${page.id}):`, thumbErr);
                    }
                  }

                  console.log('[sendMessage] ✅ 모든 썸네일 생성 완료');
                } catch (pageErr) {
                  console.error('[sendMessage] ❌ Polotno 페이지 생성 실패:', pageErr);
                }
              } else {
                console.warn('[sendMessage] ⚠️ Polotno store를 찾을 수 없어 페이지 생성을 건너뜁니다');
              }

              // AI 응답 메시지 추가
              const responseMessage = `✅ **${conceptResponse.concepts.length}개의 전략적 마케팅 컨셉을 생성했습니다!**\n\n${conceptResponse.reasoning || ''}\n\n중앙 화면의 Concept Board에서 각 컨셉의 상세 내용을 확인하세요.`;
              addMessage('assistant', responseMessage, undefined, 'concept', 'generate_concepts');

              setLoading(false);
              return;
            }

            // 기존 플로우: 일반 Chat Agent 호출
            // Prepare message history (last 10 messages for context)
            const messageHistory = messages
              .slice(-10)
              .map((m) => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
              }));

            // Map role to agent name (connect to actual backend agents)
            const agentMap: Record<AgentRole, string> = {
              brief: 'strategist',       // Brief Generator → strategist agent (마케팅 전략 및 브리프 수립)
              strategist: 'strategist',  // Strategist → strategist agent (마케팅 전략 수립)
              copywriter: 'copywriter',  // Copywriter → copywriter agent (텍스트 콘텐츠 생성)
              reviewer: 'reviewer',      // Reviewer → reviewer agent (콘텐츠 품질 검토)
              optimizer: 'optimizer',    // Optimizer (CRO) → optimizer agent (콘텐츠 최적화)
              editor: 'editor',          // Editor → editor agent (콘텐츠 편집/교정)
              vision: 'designer',        // Vision → designer agent (비주얼 콘텐츠 생성)
              custom: 'copywriter',      // Custom → copywriter agent (default)
            };

            const agent = agentMap[chatConfig.role] || 'copywriter';

            // Call backend Agent API with Korean language
            const response = await sendChatMessage({
              userInput: content,
              messageHistory,
              agent,
              task: chatConfig.task,
              language: 'ko', // 한국어로 응답 받기
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

              // AI 응답을 GeneratedAssetsStore에 저장 (좌측 패널 프리뷰용)
              console.log('[sendMessage] Storing generated assets...');
              try {
                useGeneratedAssetsStore.getState().parseAndStoreFromAIResponse(response.content, content);

                // CenterViewStore에도 동기화 (Preview 뷰에서 사용)
                // GeneratedConceptBoardData → ConceptBoardData 변환
                const generatedAssets = useGeneratedAssetsStore.getState();
                if (generatedAssets.conceptBoardData) {
                  const converted = {
                    campaign_id: generatedAssets.conceptBoardData.id,
                    campaign_name: generatedAssets.conceptBoardData.campaign_name,
                    status: 'completed' as const,
                    created_at: generatedAssets.conceptBoardData.createdAt.toISOString(),
                    meeting_summary: {
                      title: generatedAssets.conceptBoardData.campaign_name,
                      duration_minutes: 0,
                      participants: [],
                      key_points: [],
                      core_message: generatedAssets.conceptBoardData.sourceMessage || '',
                    },
                    concepts: generatedAssets.conceptBoardData.concepts.map((c) => ({
                      concept_id: c.concept_id,
                      concept_name: c.concept_name,
                      concept_description: c.description,
                      target_audience: c.target_audience || '',
                      key_message: c.headline,
                      tone_and_manner: c.tone || '',
                      visual_style: '',
                      thumbnail_url: undefined,
                      assets: {
                        presentation: { id: `pres-${c.concept_id}`, status: 'pending' as const },
                        product_detail: { id: `detail-${c.concept_id}`, status: 'pending' as const },
                        instagram_ads: { id: `insta-${c.concept_id}`, status: 'pending' as const, count: 0 },
                        shorts_script: { id: `shorts-${c.concept_id}`, status: 'pending' as const, duration_seconds: 0 },
                      },
                    })),
                  };
                  useCenterViewStore.getState().setConceptBoardData(converted);
                  console.log('[sendMessage] ✅ CenterViewStore synced with conceptBoardData');
                }
              } catch (err) {
                console.error('[sendMessage] Failed to store generated assets:', err);
              }
            } else {
              throw new Error('No response from AI');
            }
          } catch (error) {
            console.error('[sendMessage] Error:', error);

            // 사용자 친화적 에러 메시지 생성
            const errorObj = error instanceof Error ? error : new Error(String(error));
            const friendlyError = createUserFriendlyError(errorObj);

            setError(friendlyError.message, friendlyError.type, friendlyError.details);

            // 에러 메시지를 채팅에 표시하지 않음 (ErrorMessage 컴포넌트가 처리)
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
            console.error('[generateImageFromPrompt] Error:', error);

            // 사용자 친화적 에러 메시지 생성
            const errorObj = error instanceof Error ? error : new Error(String(error));
            const friendlyError = createUserFriendlyError(errorObj);

            setError(friendlyError.message, friendlyError.type, friendlyError.details);
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
