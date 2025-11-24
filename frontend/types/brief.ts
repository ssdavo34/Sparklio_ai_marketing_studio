/**
 * Brief Types
 *
 * 캠페인 브리프 관련 TypeScript 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.1.3
 */

// ============================================================================
// Brief Types
// ============================================================================

/**
 * 채널 타입
 */
export type ChannelType = 'product_detail' | 'sns' | 'banner' | 'deck' | 'video';

/**
 * 캠페인 브리프
 *
 * PRD의 BriefInput 스키마와 일치
 */
export interface Brief {
  /** 브리프 고유 ID */
  id: string;

  /** 소속 프로젝트 ID */
  projectId: string;

  /** 캠페인 목표 */
  goal: string;

  /** 타겟 오디언스 */
  target: string;

  /** 핵심 인사이트 */
  insight: string;

  /** 주요 메시지 (복수 가능) */
  keyMessages: string[];

  /** 타겟 채널 목록 */
  channels: ChannelType[];

  /** 예산 (선택) */
  budget?: number;

  /** 시작일 (선택) */
  startDate?: string;

  /** 종료일 (선택) */
  endDate?: string;

  /** KPI 목록 */
  kpis: string[];

  /** 추가 노트 (선택) */
  notes?: string;

  /** 생성일시 */
  createdAt: string;

  /** 수정일시 */
  updatedAt: string;
}

/**
 * 브리프 생성 요청
 */
export type CreateBriefRequest = Omit<Brief, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 브리프 수정 요청
 */
export type UpdateBriefRequest = Partial<
  Omit<Brief, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// Brief Validation Types
// ============================================================================

/**
 * 브리프 필드 상태
 */
export type BriefFieldStatus = 'empty' | 'partial' | 'complete';

/**
 * 브리프 유효성 검사 결과
 */
export interface BriefValidation {
  /** 전체 유효성 */
  isValid: boolean;

  /** 완성도 (0~100) */
  completeness: number;

  /** 필수 필드 누락 목록 */
  missingRequired: Array<keyof Brief>;

  /** 권장 필드 누락 목록 */
  missingRecommended: Array<keyof Brief>;

  /** 필드별 상태 */
  fieldStatus: Partial<Record<keyof Brief, BriefFieldStatus>>;
}

// ============================================================================
// Brief Optimization Types (Strategist 연동)
// ============================================================================

/**
 * 브리프 필드 최적화 요청
 */
export interface OptimizeBriefFieldRequest {
  /** 브리프 ID */
  briefId: string;

  /** 최적화할 필드명 */
  field: keyof Brief;

  /** 현재 값 */
  currentValue: any;

  /** 브랜드 컨텍스트 (선택) */
  brandContext?: {
    tone: string;
    key_messages: string[];
    target_audience: string;
  };
}

/**
 * 브리프 필드 최적화 응답
 */
export interface OptimizeBriefFieldResponse {
  /** 상태 */
  status: 'success' | 'failed';

  /** 제안된 값 */
  suggestedValue?: any;

  /** 제안 이유 */
  reason?: string;

  /** 대체 제안 (선택) */
  alternatives?: any[];

  /** 에러 정보 (실패 시) */
  error?: {
    message: string;
    details?: any;
  };
}

// ============================================================================
// Meeting to Brief Types
// ============================================================================

/**
 * Meeting에서 Brief 생성 요청
 */
export interface CreateBriefFromMeetingRequest {
  /** Meeting ID */
  meetingId: string;

  /** 프로젝트 ID */
  projectId: string;

  /** 추가 컨텍스트 (선택) */
  additionalContext?: string;
}

// ============================================================================
// Helper Constants
// ============================================================================

/**
 * 채널 타입 라벨 (한글)
 */
export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  product_detail: '상품상세',
  sns: 'SNS',
  banner: '배너/광고',
  deck: '프레젠테이션',
  video: '영상',
};

/**
 * 채널 타입 아이콘
 */
export const CHANNEL_TYPE_ICONS: Record<ChannelType, string> = {
  product_detail: '📦',
  sns: '📱',
  banner: '🎨',
  deck: '📊',
  video: '🎬',
};

/**
 * 채널 타입 색상
 */
export const CHANNEL_TYPE_COLORS: Record<ChannelType, string> = {
  product_detail: 'bg-blue-100 text-blue-700',
  sns: 'bg-pink-100 text-pink-700',
  banner: 'bg-purple-100 text-purple-700',
  deck: 'bg-indigo-100 text-indigo-700',
  video: 'bg-red-100 text-red-700',
};

/**
 * 필수 필드 목록
 */
export const REQUIRED_BRIEF_FIELDS: Array<keyof Brief> = [
  'goal',
  'target',
  'keyMessages',
  'channels',
];

/**
 * 권장 필드 목록
 */
export const RECOMMENDED_BRIEF_FIELDS: Array<keyof Brief> = [
  'insight',
  'budget',
  'startDate',
  'endDate',
  'kpis',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 브리프 유효성 검사
 */
export function validateBrief(brief: Partial<Brief>): BriefValidation {
  const missingRequired: Array<keyof Brief> = [];
  const missingRecommended: Array<keyof Brief> = [];
  const fieldStatus: Partial<Record<keyof Brief, BriefFieldStatus>> = {};

  // 필수 필드 체크
  REQUIRED_BRIEF_FIELDS.forEach((field) => {
    const value = brief[field];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      missingRequired.push(field);
      fieldStatus[field] = 'empty';
    } else {
      fieldStatus[field] = 'complete';
    }
  });

  // 권장 필드 체크
  RECOMMENDED_BRIEF_FIELDS.forEach((field) => {
    const value = brief[field];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      missingRecommended.push(field);
      fieldStatus[field] = 'empty';
    } else {
      fieldStatus[field] = 'complete';
    }
  });

  // 완성도 계산
  const totalFields = REQUIRED_BRIEF_FIELDS.length + RECOMMENDED_BRIEF_FIELDS.length;
  const completedFields =
    REQUIRED_BRIEF_FIELDS.length +
    RECOMMENDED_BRIEF_FIELDS.length -
    missingRequired.length -
    missingRecommended.length;
  const completeness = Math.round((completedFields / totalFields) * 100);

  return {
    isValid: missingRequired.length === 0,
    completeness,
    missingRequired,
    missingRecommended,
    fieldStatus,
  };
}

/**
 * 필드가 비어있는지 확인
 */
export function isBriefFieldEmpty(value: any): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
}

/**
 * 브리프를 Generator API 입력 형식으로 변환
 */
export function briefToGeneratorInput(brief: Brief): any {
  return {
    goal: brief.goal,
    target: brief.target,
    insight: brief.insight,
    key_messages: brief.keyMessages,
    channels: brief.channels,
    budget: brief.budget,
    start_date: brief.startDate,
    end_date: brief.endDate,
    kpis: brief.kpis,
  };
}
