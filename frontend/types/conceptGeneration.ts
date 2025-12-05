/**
 * Concept Generation Workflow Types
 *
 * 컨셉보드 통합 워크플로우를 위한 타입 정의
 * - BrandKit, Meeting AI, Brief 데이터 통합
 * - 4단계 모달 워크플로우
 * - 이미지 프롬프트 생성/편집
 * - 채널별 산출물 생성
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

import type { BrandProfileData, BrandToneOfVoice, BrandAudience } from './brandKit';
import type { Brief, ChannelType } from './brief';
import type { MeetingAnalysisResult } from './meeting';
import type { ConceptV1, VisualWorld, ChannelStrategy, Guardrails } from './concept';

// =============================================================================
// Data Source Types
// =============================================================================

/**
 * 데이터 소스 타입
 */
export type DataSourceType = 'brandKit' | 'meeting' | 'brief' | 'chat' | 'manual';

/**
 * BrandKit에서 추출한 핵심 데이터
 */
export interface BrandKitSourceData {
  sourceType: 'brandKit';
  brandId: string;
  brandName: string;
  category?: string;
  oneLiner?: string;
  description?: string;
  tone?: BrandToneOfVoice;
  audience?: BrandAudience;
  colors?: { hex: string; role: string }[];
  keywords?: string[];
}

/**
 * Meeting AI에서 추출한 핵심 데이터
 */
export interface MeetingSourceData {
  sourceType: 'meeting';
  meetingId: string;
  meetingTitle: string;
  summary: string;
  agenda: string[];
  decisions: string[];
  actionItems: string[];
  campaignIdeas: string[];
  keywords: string[];
}

/**
 * Brief에서 추출한 핵심 데이터
 */
export interface BriefSourceData {
  sourceType: 'brief';
  briefId: string;
  goal: string;
  target: string;
  insight: string;
  keyMessages: string[];
  channels: ChannelType[];
  kpis: string[];
}

/**
 * Chat에서 추출한 핵심 데이터
 */
export interface ChatSourceData {
  sourceType: 'chat';
  userPrompt: string;
  context?: string;
  timestamp: Date;
}

/**
 * 수동 입력 데이터
 */
export interface ManualSourceData {
  sourceType: 'manual';
  title: string;
  description: string;
  keywords?: string[];
}

/**
 * 통합 소스 데이터 (Union Type)
 */
export type SourceData =
  | BrandKitSourceData
  | MeetingSourceData
  | BriefSourceData
  | ChatSourceData
  | ManualSourceData;

/**
 * 통합된 소스 데이터 (모든 소스 병합)
 */
export interface IntegratedSourceData {
  /** 활성화된 소스들 */
  activeSources: DataSourceType[];

  /** BrandKit 데이터 (선택) */
  brandKit?: BrandKitSourceData;

  /** Meeting AI 데이터 (선택) */
  meeting?: MeetingSourceData;

  /** Brief 데이터 (선택) */
  brief?: BriefSourceData;

  /** Chat 데이터 (선택) */
  chat?: ChatSourceData;

  /** 수동 입력 데이터 (선택) */
  manual?: ManualSourceData;

  /** 마지막 업데이트 */
  lastUpdated: Date;
}

// =============================================================================
// Output Target Types
// =============================================================================

/**
 * 산출물 채널 타입
 */
export type OutputChannelType =
  | 'presentation'    // 프레젠테이션 (슬라이드)
  | 'instagram'       // 인스타그램 광고
  | 'detail_page'     // 상세페이지
  | 'shorts'          // 쇼츠/릴스 스크립트
  | 'banner';         // 배너 광고

/**
 * 개별 채널 설정
 */
export interface ChannelConfig {
  enabled: boolean;
  pageCount?: number;       // 프레젠테이션: 슬라이드 수
  adCount?: number;         // 인스타그램: 광고 수
  sectionCount?: number;    // 상세페이지: 섹션 수
  duration?: number;        // 쇼츠: 영상 길이 (초)
  sizes?: string[];         // 배너: 사이즈 목록
}

/**
 * 산출물 대상 설정
 */
export interface OutputTargets {
  /** 프레젠테이션 설정 */
  presentation: ChannelConfig & {
    pageCount: number;      // 기본: 10
  };

  /** 인스타그램 광고 설정 */
  instagram: ChannelConfig & {
    adCount: number;        // 기본: 3
    format: 'feed' | 'story' | 'both';
  };

  /** 상세페이지 설정 */
  detailPage: ChannelConfig & {
    sectionCount: number;   // 기본: 6
  };

  /** 쇼츠 스크립트 설정 */
  shorts: ChannelConfig & {
    duration: number;       // 기본: 30
  };

  /** 배너 광고 설정 */
  banner: ChannelConfig & {
    sizes: string[];        // 예: ['300x250', '728x90', '160x600']
  };
}

/**
 * 기본 산출물 대상 설정
 */
export const DEFAULT_OUTPUT_TARGETS: OutputTargets = {
  presentation: {
    enabled: true,
    pageCount: 10,
  },
  instagram: {
    enabled: true,
    adCount: 3,
    format: 'feed',
  },
  detailPage: {
    enabled: true,
    sectionCount: 6,
  },
  shorts: {
    enabled: false,
    duration: 30,
  },
  banner: {
    enabled: false,
    sizes: ['300x250', '728x90'],
  },
};

// =============================================================================
// Generated Concept Types (확장)
// =============================================================================

/**
 * 이미지 프롬프트 설정
 */
export interface ImagePromptConfig {
  /** 메인 프롬프트 (SDXL용) */
  prompt: string;

  /** 네거티브 프롬프트 */
  negativePrompt: string;

  /** 스타일 프리셋 */
  style: 'photorealistic' | 'illustration' | 'minimal' | 'abstract' | 'product' | 'lifestyle';

  /** 종횡비 */
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

  /** 생성된 이미지 URL (생성 후) */
  generatedUrl?: string;

  /** 프리뷰 URL (저해상도) */
  previewUrl?: string;

  /** 사용자 수정 여부 */
  isEdited: boolean;
}

/**
 * 컨셉별 이미지 프롬프트 (채널별)
 */
export interface ConceptImagePrompts {
  /** 메인 이미지 (대표) */
  main: ImagePromptConfig;

  /** 슬라이드용 이미지들 */
  slides?: ImagePromptConfig[];

  /** 인스타그램용 이미지들 */
  instagram?: ImagePromptConfig[];

  /** 상세페이지용 이미지들 */
  detailPage?: ImagePromptConfig[];

  /** 쇼츠 썸네일 */
  shortsThumbnail?: ImagePromptConfig;
}

/**
 * 확장된 생성 컨셉 (이미지 프롬프트 포함)
 */
export interface GeneratedConceptExtended {
  /** 기본 컨셉 정보 */
  conceptId: string;
  conceptName: string;
  description: string;

  /** 카피라이팅 */
  headline: string;
  subheadline: string;
  cta: string;
  taglines: string[];

  /** 타겟 & 톤 */
  targetAudience: string;
  tone: string;

  /** 비주얼 월드 */
  visualWorld: VisualWorld;

  /** 채널 전략 */
  channelStrategy: ChannelStrategy;

  /** 가드레일 */
  guardrails: Guardrails;

  /** 이미지 프롬프트 (채널별) */
  imagePrompts: ConceptImagePrompts;

  /** 컨셉 선택 상태 */
  isSelected: boolean;

  /** 사용자 수정 여부 */
  isEdited: boolean;

  /** 원본 ConceptV1 (Backend 응답) */
  originalConcept?: ConceptV1;
}

// =============================================================================
// Generation Progress Types
// =============================================================================

/**
 * 생성 진행 상태
 */
export type GenerationStatus = 'idle' | 'pending' | 'generating' | 'completed' | 'failed';

/**
 * 개별 채널 생성 진행 상태
 */
export interface ChannelGenerationProgress {
  status: GenerationStatus;
  progress: number;       // 0-100
  currentStep?: string;   // 현재 단계 설명
  error?: string;         // 에러 메시지
  result?: any;           // 생성 결과
}

/**
 * 전체 생성 진행 상태
 */
export interface GenerationProgress {
  /** 전체 상태 */
  overallStatus: GenerationStatus;

  /** 전체 진행률 (0-100) */
  overallProgress: number;

  /** 현재 단계 (1-4) */
  currentStep: 1 | 2 | 3 | 4;

  /** 채널별 진행 상태 */
  channels: {
    concepts: ChannelGenerationProgress;
    imagePrompts: ChannelGenerationProgress;
    presentation: ChannelGenerationProgress;
    instagram: ChannelGenerationProgress;
    detailPage: ChannelGenerationProgress;
    shorts: ChannelGenerationProgress;
    banner: ChannelGenerationProgress;
  };

  /** 시작 시간 */
  startedAt?: Date;

  /** 완료 시간 */
  completedAt?: Date;
}

// =============================================================================
// Workflow Modal Types
// =============================================================================

/**
 * 워크플로우 단계
 */
export type WorkflowStep = 1 | 2 | 3 | 4;

/**
 * 워크플로우 단계 정보
 */
export interface WorkflowStepInfo {
  step: WorkflowStep;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

/**
 * 워크플로우 단계 목록
 */
export const WORKFLOW_STEPS: WorkflowStepInfo[] = [
  {
    step: 1,
    title: '소스 데이터 확인',
    description: 'BrandKit, Meeting AI, Brief 데이터 통합',
    isCompleted: false,
    isActive: true,
  },
  {
    step: 2,
    title: '산출물 대상 설정',
    description: '프레젠테이션, 인스타그램, 상세페이지 등',
    isCompleted: false,
    isActive: false,
  },
  {
    step: 3,
    title: '컨셉 생성 및 편집',
    description: '카피, 이미지 프롬프트 수정',
    isCompleted: false,
    isActive: false,
  },
  {
    step: 4,
    title: '최종 확인 및 생성',
    description: '선택 컨셉으로 산출물 생성',
    isCompleted: false,
    isActive: false,
  },
];

/**
 * 컨셉 생성 모달 상태
 */
export interface ConceptGenerationModalState {
  /** 모달 열림 상태 */
  isOpen: boolean;

  /** 현재 단계 */
  currentStep: WorkflowStep;

  /** 통합 소스 데이터 */
  sourceData: IntegratedSourceData;

  /** 산출물 대상 설정 */
  outputTargets: OutputTargets;

  /** 생성된 컨셉들 */
  generatedConcepts: GeneratedConceptExtended[];

  /** 선택된 컨셉 ID */
  selectedConceptId: string | null;

  /** 생성 진행 상태 */
  progress: GenerationProgress;

  /** 에러 상태 */
  error: string | null;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * 컨셉 생성 요청
 */
export interface GenerateConceptsRequest {
  /** 통합 소스 데이터 */
  sourceData: IntegratedSourceData;

  /** 산출물 대상 설정 */
  outputTargets: OutputTargets;

  /** 생성할 컨셉 수 */
  conceptCount?: number;

  /** 브랜드 ID (선택) */
  brandId?: string;

  /** 언어 */
  language?: string;
}

/**
 * 컨셉 생성 응답
 */
export interface GenerateConceptsResponse {
  /** 상태 */
  status: 'success' | 'failed';

  /** 생성된 컨셉들 */
  concepts: GeneratedConceptExtended[];

  /** 추론 근거 */
  reasoning?: string;

  /** 에러 정보 */
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * 이미지 프롬프트 생성 요청
 */
export interface GenerateImagePromptsRequest {
  /** 컨셉 정보 */
  concept: GeneratedConceptExtended;

  /** 채널 타입 */
  channel: OutputChannelType;

  /** 이미지 수 */
  count: number;

  /** 스타일 프리셋 */
  style?: ImagePromptConfig['style'];
}

/**
 * 이미지 프롬프트 생성 응답
 */
export interface GenerateImagePromptsResponse {
  /** 상태 */
  status: 'success' | 'failed';

  /** 생성된 프롬프트들 */
  prompts: ImagePromptConfig[];

  /** 에러 정보 */
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * 이미지 생성 요청
 */
export interface GenerateImageRequest {
  /** 이미지 프롬프트 설정 */
  promptConfig: ImagePromptConfig;

  /** 품질 설정 */
  quality?: 'draft' | 'standard' | 'high';

  /** 프로바이더 지정 (선택) */
  provider?: 'zimage' | 'comfyui' | 'auto';
}

/**
 * 이미지 생성 응답
 */
export interface GenerateImageResponse {
  /** 상태 */
  status: 'success' | 'failed';

  /** 이미지 URL */
  imageUrl?: string;

  /** 프리뷰 URL */
  previewUrl?: string;

  /** 에셋 ID */
  assetId?: string;

  /** 에러 정보 */
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * 채널 산출물 생성 요청
 */
export interface GenerateChannelOutputRequest {
  /** 선택된 컨셉 */
  concept: GeneratedConceptExtended;

  /** 채널 타입 */
  channel: OutputChannelType;

  /** 채널 설정 */
  config: ChannelConfig;

  /** 생성된 이미지들 (선택) */
  images?: { url: string; position: string }[];
}

/**
 * 채널 산출물 생성 응답
 */
export interface GenerateChannelOutputResponse {
  /** 상태 */
  status: 'success' | 'failed';

  /** 채널 타입 */
  channel: OutputChannelType;

  /** 생성 결과 (채널별로 다름) */
  result?: any;

  /** 에러 정보 */
  error?: {
    message: string;
    code?: string;
  };
}

// =============================================================================
// Store Action Types
// =============================================================================

/**
 * 워크플로우 스토어 액션
 */
export interface ConceptWorkflowActions {
  // Modal 제어
  openModal: (initialSource?: SourceData) => void;
  closeModal: () => void;

  // 단계 제어
  goToStep: (step: WorkflowStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // 소스 데이터 관리
  setSourceData: (data: Partial<IntegratedSourceData>) => void;
  addSource: (source: SourceData) => void;
  removeSource: (sourceType: DataSourceType) => void;
  clearSources: () => void;
  collectCurrentContext: () => IntegratedSourceData;

  // 산출물 대상 설정
  setOutputTargets: (targets: Partial<OutputTargets>) => void;
  toggleChannel: (channel: OutputChannelType, enabled: boolean) => void;
  updateChannelConfig: (channel: OutputChannelType, config: Partial<ChannelConfig>) => void;

  // 컨셉 관리
  setGeneratedConcepts: (concepts: GeneratedConceptExtended[]) => void;
  updateConcept: (conceptId: string, updates: Partial<GeneratedConceptExtended>) => void;
  selectConcept: (conceptId: string) => void;
  updateImagePrompt: (
    conceptId: string,
    channel: keyof ConceptImagePrompts,
    index: number,
    prompt: Partial<ImagePromptConfig>
  ) => void;

  // 생성 제어
  generateConcepts: () => Promise<void>;
  generateImagePrompts: (conceptId: string) => Promise<void>;
  generateImages: (conceptId: string) => Promise<void>;
  generateAllOutputs: () => Promise<void>;

  // 진행 상태
  setProgress: (progress: Partial<GenerationProgress>) => void;
  resetProgress: () => void;

  // 에러 처리
  setError: (error: string | null) => void;
  clearError: () => void;

  // 전체 초기화
  reset: () => void;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * 소스 데이터 요약 (UI 표시용)
 */
export interface SourceDataSummary {
  sourceType: DataSourceType;
  title: string;
  keyPoints: string[];
  isActive: boolean;
}

/**
 * 소스 데이터를 요약 형태로 변환
 */
export function summarizeSourceData(source: SourceData): SourceDataSummary {
  switch (source.sourceType) {
    case 'brandKit':
      return {
        sourceType: 'brandKit',
        title: source.brandName,
        keyPoints: [
          source.category || '',
          source.oneLiner || '',
          ...(source.keywords?.slice(0, 3) || []),
        ].filter(Boolean),
        isActive: true,
      };

    case 'meeting':
      return {
        sourceType: 'meeting',
        title: source.meetingTitle,
        keyPoints: [
          source.summary.substring(0, 100) + '...',
          ...source.campaignIdeas.slice(0, 2),
        ],
        isActive: true,
      };

    case 'brief':
      return {
        sourceType: 'brief',
        title: source.goal,
        keyPoints: [
          `타겟: ${source.target}`,
          ...source.keyMessages.slice(0, 2),
        ],
        isActive: true,
      };

    case 'chat':
      return {
        sourceType: 'chat',
        title: '채팅 입력',
        keyPoints: [source.userPrompt.substring(0, 100)],
        isActive: true,
      };

    case 'manual':
      return {
        sourceType: 'manual',
        title: source.title,
        keyPoints: [source.description.substring(0, 100)],
        isActive: true,
      };
  }
}

/**
 * 기본 이미지 프롬프트 생성
 */
export function createDefaultImagePrompt(
  style: ImagePromptConfig['style'] = 'photorealistic',
  aspectRatio: ImagePromptConfig['aspectRatio'] = '1:1'
): ImagePromptConfig {
  return {
    prompt: '',
    negativePrompt: 'blurry, low quality, distorted, text, watermark, logo',
    style,
    aspectRatio,
    isEdited: false,
  };
}

/**
 * 초기 생성 진행 상태
 */
export const INITIAL_GENERATION_PROGRESS: GenerationProgress = {
  overallStatus: 'idle',
  overallProgress: 0,
  currentStep: 1,
  channels: {
    concepts: { status: 'idle', progress: 0 },
    imagePrompts: { status: 'idle', progress: 0 },
    presentation: { status: 'idle', progress: 0 },
    instagram: { status: 'idle', progress: 0 },
    detailPage: { status: 'idle', progress: 0 },
    shorts: { status: 'idle', progress: 0 },
    banner: { status: 'idle', progress: 0 },
  },
};
