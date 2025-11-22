/**
 * Sparklio Backend LLM Gateway Client
 *
 * Communicates with backend Gateway at /api/v1/llm and /api/v1/agents
 * Follows Agent-based pattern recommended by B팀
 *
 * @author C Team (Frontend Team)
 * @version 4.1
 * @date 2025-11-22
 * @reference backend/docs/LLM_INTEGRATION_GUIDE.md
 */

// ============================================================================
// Configuration
// ============================================================================

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';
const API_BASE = `${BACKEND_API_URL}/api/v1`;

// ============================================================================
// Types (based on B팀 integration guide)
// ============================================================================

export interface AgentOutput {
  type: 'text' | 'json' | 'image' | 'video' | 'audio';
  name: string;       // 출력물 이름 (예: 'headline', 'body')
  value: any;         // 실제 데이터
  meta?: any;         // 메타데이터
}

export interface AgentResponse {
  agent: string;           // 실행된 Agent 이름
  task: string;            // 수행된 작업
  outputs: AgentOutput[];  // 생성된 결과물 목록
  usage?: {                // 리소스 사용량
    tokens?: number;
    cost?: number;
  };
  meta?: any;              // 메타데이터
  timestamp?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
  timestamp?: string;
}

// ============================================================================
// LLM Client Class (B팀 SDK 권장 패턴)
// ============================================================================

export class LLMClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string = API_BASE, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(endpoint: string, data: any): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication if token is available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json().catch(() => ({
        detail: `HTTP error! status: ${response.status}`,
      }));

      // Handle rate limiting
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.request<T>(endpoint, data); // Retry
      }

      throw new Error(error.detail || 'Request failed');
    }

    return await response.json();
  }

  /**
   * Execute Agent (B팀 권장 방식)
   * Uses /agents/{agent_name}/execute endpoint
   */
  async executeAgent(agentName: string, task: string, payload: any): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/agents/${agentName}/execute`, {
      task,
      payload,
    });
  }

  /**
   * Direct LLM text generation
   */
  async generateText(prompt: string, options?: any): Promise<string> {
    const result = await this.request<any>('/llm/generate', {
      prompt,
      ...options,
    });
    return result.content;
  }

  /**
   * Chat with conversation history
   */
  async chat(messages: Message[], options?: any): Promise<string> {
    const result = await this.request<any>('/llm/chat', {
      messages,
      ...options,
    });
    return result.content;
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
  }
}

// ============================================================================
// Convenience Functions for Common Tasks
// ============================================================================

const defaultClient = new LLMClient();

/**
 * Generate headline using Copywriter Agent
 */
export async function generateHeadline(params: {
  productName: string;
  targetAudience?: string;
  tone?: string;
  count?: number;
  brandId?: string;
}): Promise<string[]> {
  const response = await defaultClient.executeAgent(
    'copywriter',
    'generate_headline',
    {
      product_name: params.productName,
      target_audience: params.targetAudience,
      tone: params.tone,
      count: params.count || 3,
      brand_id: params.brandId,
    }
  );

  return response.outputs
    .filter((output) => output.type === 'text')
    .map((output) => output.value);
}

/**
 * Generate body copy using Copywriter Agent
 */
export async function generateBodyCopy(params: {
  headline: string;
  productDescription: string;
  maxLength?: number;
  brandId?: string;
}): Promise<string> {
  const response = await defaultClient.executeAgent(
    'copywriter',
    'generate_body',
    {
      headline: params.headline,
      product_description: params.productDescription,
      max_length: params.maxLength || 200,
      brand_id: params.brandId,
    }
  );

  return response.outputs[0]?.value || '';
}

/**
 * Review content using Reviewer Agent
 */
export async function reviewContent(params: {
  content: any;
  brandId?: string;
  criteria?: string[];
}): Promise<any> {
  const response = await defaultClient.executeAgent(
    'reviewer',
    'review_content',
    {
      content: params.content,
      brand_id: params.brandId,
      criteria: params.criteria || ['brand_consistency', 'grammar', 'tone'],
    }
  );

  return response.outputs[0]?.value;
}

/**
 * Generate with RAG (brand context)
 */
export async function generateWithContext(params: {
  prompt: string;
  contextQuery: string;
  brandId: string;
  maxContextLength?: number;
}): Promise<string> {
  const response = await defaultClient.executeAgent(
    'rag',
    'generate_with_context',
    {
      prompt: params.prompt,
      context_query: params.contextQuery,
      brand_id: params.brandId,
      max_context_length: params.maxContextLength || 500,
    }
  );

  return response.outputs[0]?.value || '';
}

/**
 * Simple chat interface (for general conversation)
 */
export async function sendChatMessage(params: {
  userInput: string;
  messageHistory?: Message[];
  agent?: string;
  task?: string;
  language?: string;
}): Promise<{ content: string; usage?: any }> {
  const agent = params.agent || 'copywriter';
  const task = params.task || 'chat';
  const language = params.language || 'ko'; // 기본값: 한국어

  const response = await defaultClient.executeAgent(
    agent,
    task,
    {
      user_input: params.userInput,
      messages: params.messageHistory,
      language: language, // 응답 언어 명시
    }
  );

  // Handle both text and json output types
  const output = response.outputs[0];
  let content = '';

  if (output?.type === 'json') {
    // Extract text from JSON response
    const value = output.value;
    content = value.ad_copy || value.content || value.response || JSON.stringify(value);
  } else if (output?.type === 'text') {
    content = output.value;
  } else {
    content = output?.value || '';
  }

  return {
    content,
    usage: response.usage,
  };
}

/**
 * Generate image using Designer Agent
 */
export async function generateImage(params: {
  prompt: string;
  brandId?: string;
}): Promise<string> {
  const response = await defaultClient.executeAgent(
    'designer',
    'generate_image',
    {
      prompt: params.prompt,
      brand_id: params.brandId,
    }
  );

  const imageOutput = response.outputs.find(
    (output) => output.type === 'image'
  );
  return imageOutput?.value || '';
}

// Export client class and default instance
export { defaultClient as gatewayClient };
export default LLMClient;
