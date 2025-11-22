/**
 * Sparklio Backend LLM Gateway Client
 *
 * Communicates with backend Gateway at /api/v1/llm/generate
 * Follows role/task pattern - Router automatically selects providers
 *
 * @author C Team (Frontend Team)
 * @version 4.0
 * @date 2025-11-22
 */

import type {
  LLMGatewayRequest,
  LLMGatewayResponse,
  AgentRole,
  TaskType,
  CostMode,
} from '@/components/canvas-studio/stores/types/llm';

// ============================================================================
// Configuration
// ============================================================================

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

// ============================================================================
// Gateway Client
// ============================================================================

/**
 * Call backend LLM Gateway
 *
 * @param request - Gateway request with role/task
 * @returns Gateway response with result and provider info
 */
export async function callLLMGateway(
  request: LLMGatewayRequest
): Promise<LLMGatewayResponse> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('LLM Gateway Error:', error);
    throw error;
  }
}

/**
 * Check LLM Gateway health status
 *
 * @returns Health status for all providers
 */
export async function checkGatewayHealth(): Promise<{
  providers: Record<string, { status: string; model?: string; error?: string }>;
}> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/llm/health`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Gateway Health Check Error:', error);
    throw error;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Send a chat message with specified role and task
 */
export async function sendChatMessage(params: {
  role: AgentRole;
  task: TaskType;
  userInput: string;
  messageHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  costMode?: CostMode;
  language?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<LLMGatewayResponse> {
  const request: LLMGatewayRequest = {
    role: params.role,
    task: params.task,
    payload: {
      user_input: params.userInput,
      messages: params.messageHistory,
    },
    mode: 'chat',
    cost_mode: params.costMode || 'balanced',
    language: params.language || 'ko',
    options: {
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    },
  };

  return callLLMGateway(request);
}

/**
 * Generate image with vision agent
 */
export async function generateImage(params: {
  prompt: string;
  costMode?: CostMode;
  size?: string;
  quality?: 'standard' | 'hd';
}): Promise<LLMGatewayResponse> {
  const request: LLMGatewayRequest = {
    role: 'vision',
    task: 'image_generate',
    payload: {
      user_input: params.prompt,
    },
    cost_mode: params.costMode || 'balanced',
    requires_vision: true,
    options: {
      // Image generation options can be passed here
    },
  };

  return callLLMGateway(request);
}

/**
 * Analyze image with vision agent
 */
export async function analyzeImage(params: {
  imageUrl: string;
  question?: string;
  costMode?: CostMode;
}): Promise<LLMGatewayResponse> {
  const request: LLMGatewayRequest = {
    role: 'vision',
    task: 'image_analyze',
    payload: {
      image_url: params.imageUrl,
      user_input: params.question || 'Describe this image in detail',
    },
    cost_mode: params.costMode || 'balanced',
    requires_vision: true,
  };

  return callLLMGateway(request);
}

/**
 * Get marketing brief
 */
export async function getMarketingBrief(params: {
  productInfo: string;
  costMode?: CostMode;
  language?: string;
}): Promise<LLMGatewayResponse> {
  const request: LLMGatewayRequest = {
    role: 'brief',
    task: 'marketing_brief',
    payload: {
      user_input: params.productInfo,
    },
    cost_mode: params.costMode || 'balanced',
    language: params.language || 'ko',
    mode: 'json',
  };

  return callLLMGateway(request);
}

/**
 * Generate product description
 */
export async function generateProductDescription(params: {
  productInfo: string;
  costMode?: CostMode;
  language?: string;
}): Promise<LLMGatewayResponse> {
  const request: LLMGatewayRequest = {
    role: 'copywriter',
    task: 'product_detail',
    payload: {
      user_input: params.productInfo,
    },
    cost_mode: params.costMode || 'balanced',
    language: params.language || 'ko',
  };

  return callLLMGateway(request);
}

/**
 * Generate social media content
 */
export async function generateSNSContent(params: {
  topic: string;
  platform?: string;
  costMode?: CostMode;
  language?: string;
}): Promise<LLMGatewayResponse> {
  const request: LLMGatewayRequest = {
    role: 'copywriter',
    task: 'sns',
    payload: {
      user_input: params.topic,
      platform: params.platform,
    },
    cost_mode: params.costMode || 'balanced',
    language: params.language || 'ko',
  };

  return callLLMGateway(request);
}

/**
 * Review content
 */
export async function reviewContent(params: {
  content: string;
  costMode?: CostMode;
  language?: string;
}): Promise<LLMGatewayResponse> {
  const request: LLMGatewayRequest = {
    role: 'reviewer',
    task: 'review',
    payload: {
      user_input: params.content,
    },
    cost_mode: params.costMode || 'balanced',
    language: params.language || 'ko',
  };

  return callLLMGateway(request);
}

/**
 * Optimize content for conversion
 */
export async function optimizeContent(params: {
  content: string;
  costMode?: CostMode;
  language?: string;
}): Promise<LLMGatewayResponse> {
  const request: LLMGatewayRequest = {
    role: 'optimizer',
    task: 'optimize',
    payload: {
      user_input: params.content,
    },
    cost_mode: params.costMode || 'balanced',
    language: params.language || 'ko',
  };

  return callLLMGateway(request);
}
