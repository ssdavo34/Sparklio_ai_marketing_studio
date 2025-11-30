/**
 * Chat Router
 *
 * 사용자 메시지를 분석하여 적절한 Agent나 Canvas 조작으로 라우팅
 * - 명령어 패턴 감지
 * - Agent 선택 로직
 * - Canvas 직접 조작 판단
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

import { canvasOperations, type AddElementOptions, type UpdateElementOptions } from './canvasOperations';
import { useStudioContextStore } from '../stores/useStudioContextStore';

// ============================================================================
// Types
// ============================================================================

export type RouteType =
  | 'canvas_operation'   // Canvas 직접 조작 (요소 추가/수정/삭제)
  | 'image_generation'   // 이미지 생성 Agent
  | 'image_edit'         // 이미지 편집 (배경 제거 등)
  | 'concept_generation' // 컨셉 생성 Agent
  | 'copywriting'        // 카피라이팅 Agent
  | 'brand_analysis'     // 브랜드 분석 Agent
  | 'general_chat'       // 일반 대화
  | 'context_gathering'; // 소스 수집 (질문 필요)

export interface RouteResult {
  type: RouteType;
  action?: string;
  params?: Record<string, any>;
  message?: string;
  requiresConfirmation?: boolean;
}

// ============================================================================
// Pattern Definitions
// ============================================================================

interface PatternRule {
  patterns: RegExp[];
  type: RouteType;
  action?: string;
  extractParams?: (match: RegExpMatchArray, message: string) => Record<string, any>;
}

const PATTERNS: PatternRule[] = [
  // ============================================
  // Canvas 직접 조작 패턴
  // ============================================
  {
    patterns: [
      /텍스트\s*(추가|넣어|만들어)/,
      /헤드라인\s*(추가|넣어|만들어)/,
      /제목\s*(추가|넣어|만들어)/,
    ],
    type: 'canvas_operation',
    action: 'add_text',
    extractParams: (match, message) => {
      // "OOO 텍스트 추가해줘" → OOO 추출
      const textMatch = message.match(/["']([^"']+)["']/);
      return { text: textMatch?.[1] || '새 텍스트' };
    },
  },
  {
    patterns: [
      /이미지\s*(추가|넣어|업로드)/,
      /사진\s*(추가|넣어|업로드)/,
    ],
    type: 'canvas_operation',
    action: 'add_image',
  },
  {
    patterns: [
      /(선택된?|이)\s*(요소|텍스트|이미지)?\s*(삭제|지워|제거)/,
      /삭제해\s*줘/,
    ],
    type: 'canvas_operation',
    action: 'delete_selected',
  },
  {
    patterns: [
      /(선택된?|이)\s*(요소|텍스트|이미지)?\s*(복제|복사|듀플리케이트)/,
      /복제해\s*줘/,
    ],
    type: 'canvas_operation',
    action: 'duplicate_selected',
  },
  {
    patterns: [
      /폰트\s*크기\s*(\d+)/,
      /글자\s*크기\s*(\d+)/,
      /(\d+)(px|pt)?\s*(으로|로)\s*(변경|바꿔)/,
    ],
    type: 'canvas_operation',
    action: 'update_font_size',
    extractParams: (match) => ({ fontSize: parseInt(match[1]) }),
  },
  {
    patterns: [
      /색(상|깔)?\s*(변경|바꿔)/,
      /(#[0-9A-Fa-f]{6})\s*(으로|로)/,
    ],
    type: 'canvas_operation',
    action: 'update_color',
    extractParams: (match, message) => {
      const colorMatch = message.match(/#[0-9A-Fa-f]{6}/);
      return { fill: colorMatch?.[0] || '#000000' };
    },
  },
  {
    patterns: [
      /실행\s*취소/,
      /언두/i,
      /undo/i,
    ],
    type: 'canvas_operation',
    action: 'undo',
  },
  {
    patterns: [
      /다시\s*실행/,
      /리두/i,
      /redo/i,
    ],
    type: 'canvas_operation',
    action: 'redo',
  },
  {
    patterns: [
      /새\s*페이지/,
      /페이지\s*(추가|만들어)/,
    ],
    type: 'canvas_operation',
    action: 'add_page',
  },
  {
    patterns: [
      /(\d+)\s*번?\s*페이지\s*(로|으로)?\s*(이동|가)/,
      /페이지\s*(\d+)/,
    ],
    type: 'canvas_operation',
    action: 'select_page',
    extractParams: (match) => ({ pageIndex: parseInt(match[1]) - 1 }),
  },

  // ============================================
  // 이미지 생성/편집 패턴
  // ============================================
  {
    patterns: [
      /이미지\s*(생성|만들어)/,
      /그림\s*(그려|생성)/,
      /사진\s*생성/,
      /(.+)\s*이미지로\s*만들어/,
    ],
    type: 'image_generation',
    action: 'generate',
    extractParams: (match, message) => {
      // 프롬프트 추출
      const promptMatch = message.match(/["']([^"']+)["']/);
      return { prompt: promptMatch?.[1] || message };
    },
  },
  {
    patterns: [
      /배경\s*(제거|지워|투명)/,
      /누끼\s*(따|제거)/,
      /background\s*remov/i,
    ],
    type: 'image_edit',
    action: 'remove_background',
  },
  {
    patterns: [
      /이미지\s*(편집|수정|변경)/,
      /사진\s*(편집|수정)/,
    ],
    type: 'image_edit',
    action: 'edit',
  },

  // ============================================
  // 컨셉/전략 생성 패턴
  // ============================================
  {
    patterns: [
      /캠페인/,
      /홍보\s*전략/,
      /마케팅\s*(전략|컨셉|기획)/,
      /컨셉\s*(도출|생성|만들어)/,
      /브랜딩\s*전략/,
      /런칭\s*(전략|기획)/,
      /프로모션\s*(기획|전략)/,
    ],
    type: 'concept_generation',
    action: 'generate_concepts',
  },

  // ============================================
  // 카피라이팅 패턴
  // ============================================
  {
    patterns: [
      /카피\s*(작성|만들어)/,
      /광고\s*문구/,
      /헤드라인\s*(작성|만들어)/,
      /슬로건/,
      /태그라인/,
      /(상품|제품)\s*설명/,
      /SNS\s*(게시물|포스팅|콘텐츠)/,
      /인스타\s*(글|포스트)/,
    ],
    type: 'copywriting',
    action: 'generate_copy',
  },

  // ============================================
  // 브랜드 분석 패턴
  // ============================================
  {
    patterns: [
      /브랜드\s*분석/,
      /(웹사이트|사이트|URL)\s*분석/,
      /경쟁사\s*분석/,
      /https?:\/\/[^\s]+/,
    ],
    type: 'brand_analysis',
    action: 'analyze',
    extractParams: (match, message) => {
      const urlMatch = message.match(/https?:\/\/[^\s]+/);
      return { url: urlMatch?.[0] };
    },
  },

  // ============================================
  // 소스 수집 (정보 부족 시 질문)
  // ============================================
  {
    patterns: [
      /^(만들어|생성해|해줘)$/,
      /^뭔가\s*(만들어|생성)/,
    ],
    type: 'context_gathering',
    action: 'ask_details',
  },
];

// ============================================================================
// Router Logic
// ============================================================================

/**
 * 메시지 분석 및 라우팅
 */
export function routeMessage(message: string): RouteResult {
  const normalizedMessage = message.trim().toLowerCase();

  // 패턴 매칭
  for (const rule of PATTERNS) {
    for (const pattern of rule.patterns) {
      const match = normalizedMessage.match(pattern);
      if (match) {
        const params = rule.extractParams?.(match, message) || {};
        return {
          type: rule.type,
          action: rule.action,
          params,
        };
      }
    }
  }

  // 컨텍스트 기반 판단
  const context = useStudioContextStore.getState();

  // 이미지가 선택되어 있고 이미지 관련 키워드가 있으면
  if (context.hasImageSelected()) {
    if (normalizedMessage.includes('수정') || normalizedMessage.includes('변경')) {
      return { type: 'image_edit', action: 'edit' };
    }
  }

  // 텍스트가 선택되어 있고 텍스트 관련 키워드가 있으면
  if (context.hasTextSelected()) {
    if (normalizedMessage.includes('수정') || normalizedMessage.includes('변경') ||
        normalizedMessage.includes('바꿔') || normalizedMessage.includes('다시')) {
      return { type: 'canvas_operation', action: 'update_text' };
    }
  }

  // 정보 수집 상태 확인
  if (context.conversationPhase === 'gathering') {
    return {
      type: 'context_gathering',
      action: 'continue_gathering',
      params: { currentContext: context.collectedContext },
    };
  }

  // 기본값: 일반 대화
  return { type: 'general_chat' };
}

// ============================================================================
// Canvas Operation Executor
// ============================================================================

/**
 * Canvas 조작 실행
 */
export function executeCanvasOperation(action: string, params: Record<string, any> = {}): string {
  switch (action) {
    case 'add_text':
      const textResult = canvasOperations.addHeadline(params.text || '새 텍스트');
      return textResult.message;

    case 'add_image':
      if (params.src) {
        const imgResult = canvasOperations.addImage(params.src);
        return imgResult.message;
      }
      return '이미지 URL이 필요합니다. 파일을 업로드하거나 URL을 알려주세요.';

    case 'delete_selected':
      const delResult = canvasOperations.deleteSelectedElements();
      return delResult.message;

    case 'duplicate_selected':
      const dupResult = canvasOperations.duplicateSelectedElements();
      return dupResult.message;

    case 'update_font_size':
      const sizeResult = canvasOperations.updateSelectedElements({ fontSize: params.fontSize });
      return sizeResult.message;

    case 'update_color':
      const colorResult = canvasOperations.updateSelectedElements({ fill: params.fill });
      return colorResult.message;

    case 'undo':
      const undoResult = canvasOperations.undo();
      return undoResult.message;

    case 'redo':
      const redoResult = canvasOperations.redo();
      return redoResult.message;

    case 'add_page':
      const pageResult = canvasOperations.addPage();
      return pageResult.message;

    case 'select_page':
      const selectResult = canvasOperations.selectPage(params.pageIndex || 0);
      return selectResult.message;

    default:
      return `알 수 없는 Canvas 작업: ${action}`;
  }
}

// ============================================================================
// Context Gathering
// ============================================================================

/**
 * 정보 수집 질문 생성
 */
export function generateGatheringQuestion(): string {
  const context = useStudioContextStore.getState();
  const missing = context.missingInfo;

  if (missing.includes('brand')) {
    return '브랜드 정보가 필요합니다. 브랜드 이름이나 웹사이트 URL을 알려주세요.';
  }

  if (missing.includes('target')) {
    return '타깃 고객층은 누구인가요? (예: 20-30대 여성, 중소기업 대표 등)';
  }

  if (missing.includes('purpose')) {
    return '어떤 목적으로 콘텐츠를 만드시나요? (예: 신제품 런칭, 브랜드 인지도 향상 등)';
  }

  if (missing.includes('tone')) {
    return '원하시는 톤앤매너가 있으신가요? (예: 전문적, 친근한, 고급스러운 등)';
  }

  if (missing.includes('files')) {
    return '참고할 이미지나 문서가 있으시면 업로드해주세요.';
  }

  return '어떤 콘텐츠를 만들어 드릴까요? 구체적으로 알려주세요.';
}

// ============================================================================
// Export
// ============================================================================

export const chatRouter = {
  routeMessage,
  executeCanvasOperation,
  generateGatheringQuestion,
};

export default chatRouter;
