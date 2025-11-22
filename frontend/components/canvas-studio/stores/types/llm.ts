/**
 * LLM Provider Types
 *
 * Type definitions for multi-LLM support in Canvas Studio AI Assistant
 *
 * @author C Team (Frontend Team)
 * @version 3.2
 * @date 2025-11-22
 */

// ============================================================================
// LLM Provider Types
// ============================================================================

/**
 * Text generation LLM providers
 */
export type TextLLMProvider = 'openai' | 'anthropic' | 'gemini' | 'mock';

/**
 * Image generation LLM providers
 */
export type ImageLLMProvider = 'dalle' | 'stability' | 'comfyui' | 'mock';

/**
 * All LLM providers
 */
export type LLMProvider = TextLLMProvider | ImageLLMProvider;

// ============================================================================
// LLM Configuration
// ============================================================================

/**
 * Text LLM configuration
 */
export interface TextLLMConfig {
  provider: TextLLMProvider;
  model?: string; // Optional model specification (e.g., 'gpt-4', 'claude-3-opus')
  temperature?: number;
  maxTokens?: number;
}

/**
 * Image LLM configuration
 */
export interface ImageLLMConfig {
  provider: ImageLLMProvider;
  model?: string;
  size?: string; // e.g., '1024x1024'
  quality?: 'standard' | 'hd';
  style?: string;
}

// ============================================================================
// LLM Provider Metadata
// ============================================================================

export interface LLMProviderInfo {
  id: TextLLMProvider | ImageLLMProvider;
  name: string;
  description: string;
  type: 'text' | 'image';
  available: boolean; // Whether API key is configured
  models?: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Text LLM provider information
 */
export const TEXT_LLM_PROVIDERS: Record<TextLLMProvider, Omit<LLMProviderInfo, 'available'>> = {
  openai: {
    id: 'openai',
    name: 'OpenAI GPT',
    description: 'GPT-4 and GPT-3.5 models',
    type: 'text',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3 models',
    type: 'text',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro and Ultra models',
    type: 'text',
    models: ['gemini-pro', 'gemini-ultra'],
  },
  mock: {
    id: 'mock',
    name: 'Mock (Testing)',
    description: 'Mock responses for testing',
    type: 'text',
  },
};

/**
 * Image LLM provider information
 */
export const IMAGE_LLM_PROVIDERS: Record<ImageLLMProvider, Omit<LLMProviderInfo, 'available'>> = {
  dalle: {
    id: 'dalle',
    name: 'DALL-E',
    description: 'OpenAI image generation',
    type: 'image',
    models: ['dall-e-3', 'dall-e-2'],
  },
  stability: {
    id: 'stability',
    name: 'Stable Diffusion',
    description: 'Stability AI image generation',
    type: 'image',
    models: ['stable-diffusion-xl', 'stable-diffusion-v1-6'],
  },
  comfyui: {
    id: 'comfyui',
    name: 'ComfyUI',
    description: 'Custom workflow-based image generation',
    type: 'image',
  },
  mock: {
    id: 'mock',
    name: 'Mock (Testing)',
    description: 'Mock image generation for testing',
    type: 'image',
  },
};

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_TEXT_LLM_CONFIG: TextLLMConfig = {
  provider: 'mock',
  temperature: 0.7,
  maxTokens: 500,
};

export const DEFAULT_IMAGE_LLM_CONFIG: ImageLLMConfig = {
  provider: 'mock',
  size: '1024x1024',
  quality: 'standard',
};
