/**
 * LLM Gateway Types
 *
 * Type definitions for Sparklio Backend LLM Gateway integration
 * Uses role/task pattern with Smart Router for provider selection
 *
 * @author C Team (Frontend Team)
 * @version 4.0
 * @date 2025-11-22
 */

// ============================================================================
// Agent Roles
// ============================================================================

/**
 * AI Agent roles supported by backend Gateway
 */
export type AgentRole =
  | 'brief'         // Marketing brief generator
  | 'strategist'    // Strategy and planning
  | 'copywriter'    // Content creation
  | 'reviewer'      // Content review and feedback
  | 'optimizer'     // Content optimization
  | 'editor'        // Proofreading and editing
  | 'vision'        // Image analysis and generation
  | 'custom';       // Custom agent

// ============================================================================
// Task Types
// ============================================================================

/**
 * Task types that agents can perform
 */
export type TaskType =
  | 'marketing_brief'     // Generate marketing brief
  | 'product_detail'      // Product description
  | 'sns'                 // Social media content
  | 'brand_message'       // Brand messaging
  | 'content_plan'        // Content planning
  | 'headline'            // Headline generation
  | 'ad_copy'             // Advertisement copy
  | 'review'              // Content review
  | 'optimize'            // Content optimization
  | 'proofread'           // Proofreading
  | 'image_generate'      // Image generation
  | 'image_analyze'       // Image analysis
  | 'custom';             // Custom task

// ============================================================================
// Cost/Quality Modes
// ============================================================================

/**
 * Cost/quality mode for LLM selection
 */
export type CostMode = 'fast' | 'balanced' | 'quality';

// ============================================================================
// Gateway Request/Response
// ============================================================================

/**
 * Request to backend LLM Gateway
 */
export interface LLMGatewayRequest {
  role: AgentRole;
  task: TaskType;
  payload: {
    user_input?: string;
    messages?: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }>;
    image_url?: string;
    [key: string]: any;
  };
  channel?: string;
  language?: string;
  length?: string;
  cost_mode?: CostMode;
  latency?: string;
  requires_online?: boolean;
  requires_vision?: boolean;
  mode?: 'chat' | 'json';
  options?: {
    temperature?: number;
    max_tokens?: number;
    model?: string;  // Optional model override
  };
}

/**
 * Response from backend LLM Gateway
 */
export interface LLMGatewayResponse {
  result: string | any;
  provider_used?: string;
  model_used?: string;
  error?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ============================================================================
// UI Configuration
// ============================================================================

/**
 * Chat configuration for UI
 */
export interface ChatConfig {
  role: AgentRole;
  task: TaskType;
  costMode: CostMode;
  language: string;
  temperature?: number;
  maxTokens?: number;
}

// ============================================================================
// Agent/Task Metadata
// ============================================================================

export interface AgentInfo {
  id: AgentRole;
  name: string;
  description: string;
  icon?: string;
  supportedTasks: TaskType[];
}

export interface TaskInfo {
  id: TaskType;
  name: string;
  description: string;
  icon?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Agent information
 */
export const AGENT_INFO: Record<AgentRole, AgentInfo> = {
  brief: {
    id: 'brief',
    name: 'Brief Generator',
    description: 'Create comprehensive marketing briefs',
    supportedTasks: ['marketing_brief', 'content_plan'],
  },
  strategist: {
    id: 'strategist',
    name: 'Strategist',
    description: '20-year marketing consultant',
    supportedTasks: ['marketing_brief', 'content_plan', 'brand_message'],
  },
  copywriter: {
    id: 'copywriter',
    name: 'Copywriter',
    description: '10-year copywriting expert',
    supportedTasks: ['product_detail', 'sns', 'brand_message', 'headline', 'ad_copy'],
  },
  reviewer: {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Content review and quality assessment',
    supportedTasks: ['review'],
  },
  optimizer: {
    id: 'optimizer',
    name: 'Optimizer',
    description: 'CRO specialist for conversion optimization',
    supportedTasks: ['optimize'],
  },
  editor: {
    id: 'editor',
    name: 'Editor',
    description: 'Professional proofreading and editing',
    supportedTasks: ['proofread'],
  },
  vision: {
    id: 'vision',
    name: 'Vision',
    description: 'Image analysis and generation',
    supportedTasks: ['image_generate', 'image_analyze'],
  },
  custom: {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Custom AI agent configuration',
    supportedTasks: ['custom'],
  },
};

/**
 * Task information
 */
export const TASK_INFO: Record<TaskType, TaskInfo> = {
  marketing_brief: {
    id: 'marketing_brief',
    name: 'Marketing Brief',
    description: 'Generate comprehensive marketing brief',
  },
  product_detail: {
    id: 'product_detail',
    name: 'Product Description',
    description: 'Create detailed product descriptions',
  },
  sns: {
    id: 'sns',
    name: 'Social Media',
    description: 'Generate social media content',
  },
  brand_message: {
    id: 'brand_message',
    name: 'Brand Messaging',
    description: 'Create brand messaging and positioning',
  },
  content_plan: {
    id: 'content_plan',
    name: 'Content Plan',
    description: 'Plan content strategy',
  },
  headline: {
    id: 'headline',
    name: 'Headline',
    description: 'Generate compelling headlines',
  },
  ad_copy: {
    id: 'ad_copy',
    name: 'Ad Copy',
    description: 'Create advertisement copy',
  },
  review: {
    id: 'review',
    name: 'Content Review',
    description: 'Review and assess content quality',
  },
  optimize: {
    id: 'optimize',
    name: 'Optimize',
    description: 'Optimize content for conversion',
  },
  proofread: {
    id: 'proofread',
    name: 'Proofread',
    description: 'Proofread and edit content',
  },
  image_generate: {
    id: 'image_generate',
    name: 'Generate Image',
    description: 'Generate images from text prompts',
  },
  image_analyze: {
    id: 'image_analyze',
    name: 'Analyze Image',
    description: 'Analyze and describe images',
  },
  custom: {
    id: 'custom',
    name: 'Custom Task',
    description: 'Custom task configuration',
  },
};

/**
 * Default chat configuration
 */
export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  role: 'copywriter',
  task: 'product_detail',
  costMode: 'balanced',
  language: 'ko',
  temperature: 0.7,
  maxTokens: 1000,
};
