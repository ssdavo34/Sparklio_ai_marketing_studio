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
// LLM Provider Types
// ============================================================================

/**
 * 텍스트 생성 LLM 제공자
 */
export type TextLLMProvider =
  | 'auto'          // 자동 선택 (기본)
  | 'gpt-4'         // OpenAI GPT-4
  | 'gpt-4o'        // OpenAI GPT-4 Optimized
  | 'gemini'        // Google Gemini
  | 'claude'        // Anthropic Claude
  | 'llama'         // Meta Llama (Ollama)
  | 'qwen'          // Alibaba Qwen (Ollama)
  | 'mistral';      // Mistral (Ollama)

/**
 * 이미지 생성 LLM 제공자
 */
export type ImageLLMProvider =
  | 'auto'          // 자동 선택 (기본)
  | 'comfyui'       // ComfyUI
  | 'nanobanana'    // NanoBanana
  | 'dalle'         // DALL-E
  | 'midjourney'    // Midjourney
  | 'stable-diffusion'; // Stable Diffusion

/**
 * 동영상 생성 LLM 제공자
 */
export type VideoLLMProvider =
  | 'auto'          // 자동 선택 (기본)
  | 'veo3'          // Google Veo 3
  | 'kling'         // Kling AI
  | 'sora2'         // OpenAI Sora 2
  | 'pika'          // Pika
  | 'runway';       // Runway

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
  textLLM?: TextLLMProvider;      // 텍스트 LLM 선택
  imageLLM?: ImageLLMProvider;    // 이미지 LLM 선택
  videoLLM?: VideoLLMProvider;    // 동영상 LLM 선택
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

export interface LLMProviderInfo {
  id: string;
  name: string;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 에이전트 정보 (한글)
 */
export const AGENT_INFO: Record<AgentRole, AgentInfo> = {
  brief: {
    id: 'brief',
    name: '브리프 생성기',
    description: '마케팅 브리프 작성',
    supportedTasks: ['marketing_brief', 'content_plan'],
  },
  strategist: {
    id: 'strategist',
    name: '전략가',
    description: '20년 경력 마케팅 컨설턴트',
    supportedTasks: ['marketing_brief', 'content_plan', 'brand_message'],
  },
  copywriter: {
    id: 'copywriter',
    name: '카피라이터',
    description: '10년 경력 카피라이팅 전문가',
    supportedTasks: ['product_detail', 'sns', 'brand_message', 'headline', 'ad_copy'],
  },
  reviewer: {
    id: 'reviewer',
    name: '검토자',
    description: '콘텐츠 품질 검토 및 피드백',
    supportedTasks: ['review'],
  },
  optimizer: {
    id: 'optimizer',
    name: '최적화 전문가',
    description: '전환율 최적화 CRO 전문가',
    supportedTasks: ['optimize'],
  },
  editor: {
    id: 'editor',
    name: '에디터',
    description: '전문 교정 및 편집',
    supportedTasks: ['proofread'],
  },
  vision: {
    id: 'vision',
    name: '비전 AI',
    description: '이미지 분석 및 생성',
    supportedTasks: ['image_generate', 'image_analyze'],
  },
  custom: {
    id: 'custom',
    name: '커스텀 에이전트',
    description: '사용자 정의 AI 에이전트',
    supportedTasks: ['custom'],
  },
};

/**
 * 작업 유형 정보 (한글)
 */
export const TASK_INFO: Record<TaskType, TaskInfo> = {
  marketing_brief: {
    id: 'marketing_brief',
    name: '마케팅 브리프',
    description: '종합 마케팅 브리프 생성',
  },
  product_detail: {
    id: 'product_detail',
    name: '상품 상세페이지',
    description: '상품 설명 및 상세 정보 작성',
  },
  sns: {
    id: 'sns',
    name: 'SNS 콘텐츠',
    description: '소셜 미디어 콘텐츠 생성',
  },
  brand_message: {
    id: 'brand_message',
    name: '브랜드 메시징',
    description: '브랜드 메시지 및 포지셔닝',
  },
  content_plan: {
    id: 'content_plan',
    name: '콘텐츠 기획',
    description: '콘텐츠 전략 기획',
  },
  headline: {
    id: 'headline',
    name: '헤드라인',
    description: '매력적인 헤드라인 생성',
  },
  ad_copy: {
    id: 'ad_copy',
    name: '광고 카피',
    description: '광고 문구 작성',
  },
  review: {
    id: 'review',
    name: '콘텐츠 검토',
    description: '콘텐츠 품질 검토 및 평가',
  },
  optimize: {
    id: 'optimize',
    name: '최적화',
    description: '전환율 최적화 콘텐츠',
  },
  proofread: {
    id: 'proofread',
    name: '교정',
    description: '맞춤법 및 문장 교정',
  },
  image_generate: {
    id: 'image_generate',
    name: '이미지 생성',
    description: '텍스트로 이미지 생성',
  },
  image_analyze: {
    id: 'image_analyze',
    name: '이미지 분석',
    description: '이미지 분석 및 설명',
  },
  custom: {
    id: 'custom',
    name: '사용자 정의',
    description: '사용자 정의 작업',
  },
};

/**
 * 텍스트 LLM 제공자 정보 (한글)
 */
export const TEXT_LLM_INFO: Record<TextLLMProvider, LLMProviderInfo> = {
  auto: {
    id: 'auto',
    name: '자동 선택',
    description: '최적의 모델 자동 선택',
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'OpenAI GPT-4',
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4 Optimized',
    description: 'OpenAI GPT-4 최적화 버전',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google Gemini',
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic Claude',
  },
  llama: {
    id: 'llama',
    name: 'Llama',
    description: 'Meta Llama (Ollama)',
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen',
    description: 'Alibaba Qwen (Ollama)',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral (Ollama)',
  },
};

/**
 * 이미지 LLM 제공자 정보 (한글)
 */
export const IMAGE_LLM_INFO: Record<ImageLLMProvider, LLMProviderInfo> = {
  auto: {
    id: 'auto',
    name: '자동 선택',
    description: '최적의 이미지 생성 모델 자동 선택',
  },
  comfyui: {
    id: 'comfyui',
    name: 'ComfyUI',
    description: 'ComfyUI 이미지 생성',
  },
  nanobanana: {
    id: 'nanobanana',
    name: 'NanoBanana',
    description: 'NanoBanana 이미지 생성',
  },
  dalle: {
    id: 'dalle',
    name: 'DALL-E',
    description: 'OpenAI DALL-E',
  },
  midjourney: {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'Midjourney 이미지 생성',
  },
  'stable-diffusion': {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    description: 'Stable Diffusion',
  },
};

/**
 * 동영상 LLM 제공자 정보 (한글)
 */
export const VIDEO_LLM_INFO: Record<VideoLLMProvider, LLMProviderInfo> = {
  auto: {
    id: 'auto',
    name: '자동 선택',
    description: '최적의 동영상 생성 모델 자동 선택',
  },
  veo3: {
    id: 'veo3',
    name: 'VEO 3',
    description: 'Google VEO 3',
  },
  kling: {
    id: 'kling',
    name: 'Kling AI',
    description: 'Kling AI 동영상 생성',
  },
  sora2: {
    id: 'sora2',
    name: 'Sora 2',
    description: 'OpenAI Sora 2',
  },
  pika: {
    id: 'pika',
    name: 'Pika',
    description: 'Pika 동영상 생성',
  },
  runway: {
    id: 'runway',
    name: 'Runway',
    description: 'Runway 동영상 생성',
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
  textLLM: 'auto',
  imageLLM: 'auto',
  videoLLM: 'auto',
};
