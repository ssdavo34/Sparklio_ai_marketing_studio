/**
 * Brand Types
 *
 * 브랜드 키트 및 브랜드 DNA 관련 TypeScript 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.1.2
 */

// ============================================================================
// Brand Kit Types
// ============================================================================

/**
 * 브랜드 키트
 *
 * 브랜드의 시각적/언어적 정체성 요소를 정의
 */
export interface BrandKit {
  /** 브랜드 키트 고유 ID */
  id: string;

  /** 소속 워크스페이스 ID */
  workspaceId: string;

  /** 로고 URL (선택) */
  logoUrl?: string;

  /** 주 컬러 (HEX) */
  primaryColor: string;

  /** 보조 컬러 (HEX, 선택) */
  secondaryColor?: string;

  /** 강조 컬러 (HEX, 선택) */
  accentColor?: string;

  /** 폰트 목록 */
  fonts: string[];

  /** 톤 & 매너 키워드 */
  toneKeywords: string[];

  /** 금지 표현 리스트 */
  forbiddenExpressions: string[];

  /** 핵심 메시지 */
  keyMessages: string[];

  /** 대표 카피 예시 (선택) */
  sampleCopies?: string[];

  /** 생성일시 */
  createdAt: string;

  /** 수정일시 */
  updatedAt: string;
}

/**
 * 브랜드 키트 생성 요청
 */
export type CreateBrandKitRequest = Omit<
  BrandKit,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 브랜드 키트 수정 요청
 */
export type UpdateBrandKitRequest = Partial<
  Omit<BrandKit, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// Brand DNA Types V1 (Legacy - BrandAnalyzer Output)
// ============================================================================

/**
 * 브랜드 DNA V1 (Legacy)
 *
 * BrandAnalyzer Agent가 생성하는 브랜드 분석 결과 - 기본 버전
 */
export interface BrandDNA {
  /** 스키마 버전 */
  schema_version: '1.0';

  /** 브랜드 톤 (예: "친근하고 전문적인") */
  tone: string;

  /** 핵심 메시지 (3~5개) */
  key_messages: string[];

  /** 타겟 오디언스 설명 */
  target_audience: string;

  /** 해야 할 것 (권장사항) */
  dos: string[];

  /** 하지 말아야 할 것 (금지사항) */
  donts: string[];

  /** 카피 예시 (3~5개) */
  sample_copies: string[];

  /** 메타 정보 (선택) */
  meta?: {
    /** 분석 일시 */
    analyzed_at?: string;
    /** 사용 모델 */
    model?: string;
    /** Agent 버전 */
    agent_version?: string;
  };
}

// ============================================================================
// Brand DNA Types V2 (Repomix 기준 풍부한 구조)
// ============================================================================

/**
 * 브랜드 핵심 정체성
 */
export interface BrandCore {
  /** 한줄정의 */
  one_liner: string;
  /** 존재 목적 (Why we exist) */
  purpose: string;
  /** 고객 약속 (What we promise) */
  promise: string;
  /** 성격 키워드 */
  personality: string[];
}

/**
 * 메시지 기둥
 */
export interface MessagePillar {
  title: string;
  description: string;
}

/**
 * 핵심 메시지 구조
 */
export interface MessageStructure {
  /** 메인 메시지 */
  main_message: string;
  /** 서브 메시지 기둥 */
  sub_pillars: MessagePillar[];
}

/**
 * 톤앤매너 상세
 */
export interface ToneAndManner {
  /** 요약 */
  summary: string;
  /** 키워드 */
  keywords: string[];
  /** 보이스 스타일 */
  voice_style: string;
}

/**
 * 타겟 오디언스 세그먼트
 */
export interface TargetAudienceSegment {
  segment_name: string;
  description: string;
  needs: string[];
}

/**
 * 타겟 오디언스 (다중 세그먼트)
 */
export interface TargetAudienceV2 {
  primary: TargetAudienceSegment;
  secondary?: TargetAudienceSegment;
}

/**
 * 베네핏 래더
 */
export interface BenefitLadder {
  /** 기능적 혜택 */
  functional: string[];
  /** 감성적 혜택 */
  emotional: string[];
}

/**
 * 비주얼 방향성
 */
export interface VisualDirection {
  /** 스타일 키워드 */
  style_keywords: string[];
  /** 무드 */
  mood: string;
  /** 피해야 할 요소 */
  avoid: string[];
}

/**
 * Brand Kit 제안
 */
export interface SuggestedBrandKit {
  primary_colors: string[];
  secondary_colors: string[];
  fonts: {
    primary: string;
    secondary: string;
  };
  tone_keywords: string[];
  forbidden_expressions: string[];
}

/**
 * 브랜드 DNA V2 (Repomix 기준 풍부한 구조)
 *
 * GPT의 Repomix 브랜드 분석 품질을 기준으로 설계된 확장 버전
 */
export interface BrandDNAV2 {
  /** 스키마 버전 */
  schema_version: '2.0';

  /** 브랜드 핵심 정체성 */
  brand_core: BrandCore;

  /** 핵심 메시지 구조 */
  message_structure: MessageStructure;

  /** 톤앤매너 상세 */
  tone_and_manner: ToneAndManner;

  /** 타겟 오디언스 */
  target_audience: TargetAudienceV2;

  /** 베네핏 래더 */
  benefit_ladder: BenefitLadder;

  /** Do's */
  dos: string[];

  /** Don'ts */
  donts: string[];

  /** 샘플 카피 */
  sample_copies: string[];

  /** 비주얼 방향성 */
  visual_direction: VisualDirection;

  /** Brand Kit 제안 */
  suggested_brand_kit: SuggestedBrandKit;

  /** 분석 신뢰도 (0-10) */
  confidence_score: number;

  /** 분석 노트 */
  analysis_notes?: string;

  /** 메타 정보 */
  meta?: {
    analyzed_at?: string;
    model?: string;
    agent_version?: string;
  };
}

/**
 * Brand DNA 통합 타입 (V1 또는 V2)
 */
export type BrandDNAUnion = BrandDNA | BrandDNAV2;

/**
 * Brand DNA 버전 확인
 */
export function isBrandDNAV2(dna: BrandDNAUnion): dna is BrandDNAV2 {
  return 'brand_core' in dna && 'message_structure' in dna;
}

/**
 * 브랜드 분석 요청
 */
export interface AnalyzeBrandRequest {
  /** 워크스페이스 ID */
  workspaceId: string;

  /** 웹사이트 URL (선택) */
  url?: string;

  /** 텍스트 입력 (선택) */
  text?: string;

  /** 업로드된 파일들 (선택) */
  files?: File[];
}

/**
 * 브랜드 분석 응답
 */
export interface AnalyzeBrandResponse {
  /** 상태 */
  status: 'success' | 'failed';

  /** 브랜드 DNA */
  data?: BrandDNA;

  /** 에러 정보 (실패 시) */
  error?: {
    message: string;
    details?: any;
  };
}

// ============================================================================
// Brand Intake Types
// ============================================================================

/**
 * 브랜드 인테이크 소스 타입
 */
export type BrandIntakeSource = 'url' | 'text' | 'file';

/**
 * 브랜드 인테이크 데이터
 */
export interface BrandIntakeData {
  /** 소스 타입 */
  source: BrandIntakeSource;

  /** URL (source가 'url'일 때) */
  url?: string;

  /** 텍스트 (source가 'text'일 때) */
  text?: string;

  /** 파일 목록 (source가 'file'일 때) */
  files?: File[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * BrandDNA가 유효한지 확인
 */
export function isValidBrandDNA(obj: any): obj is BrandDNA {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj.schema_version === '1.0' &&
    typeof obj.tone === 'string' &&
    Array.isArray(obj.key_messages) &&
    typeof obj.target_audience === 'string' &&
    Array.isArray(obj.dos) &&
    Array.isArray(obj.donts) &&
    Array.isArray(obj.sample_copies)
  );
}

/**
 * BrandKit을 BrandDNA로 변환
 */
export function brandKitToDNA(kit: BrandKit): Partial<BrandDNA> {
  return {
    schema_version: '1.0',
    tone: kit.toneKeywords.join(', '),
    key_messages: kit.keyMessages,
    donts: kit.forbiddenExpressions,
    sample_copies: kit.sampleCopies || [],
  };
}

/**
 * BrandDNA를 BrandKit으로 변환 (부분)
 */
export function dnaToBrandKit(
  dna: BrandDNA,
  workspaceId: string
): Partial<CreateBrandKitRequest> {
  return {
    workspaceId,
    primaryColor: '#000000', // 기본값, 사용자가 수정 필요
    fonts: ['Arial'], // 기본값, 사용자가 수정 필요
    toneKeywords: dna.tone.split(',').map((t) => t.trim()),
    keyMessages: dna.key_messages,
    forbiddenExpressions: dna.donts,
    sampleCopies: dna.sample_copies,
  };
}
