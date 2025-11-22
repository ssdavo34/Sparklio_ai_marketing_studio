/**
 * Generator API Types
 *
 * 백엔드 이미지 생성 API 응답 타입 정의
 * - Base64 및 URL 형식 모두 지원
 * - 나중에 Base64 → URL 전환 시에도 타입 변경 최소화
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-22
 */

// ============================================================================
// 이미지 관련 타입
// ============================================================================

/**
 * 생성된 이미지 데이터
 * - type: "base64" | "url"
 * - Base64: 초기 구현 (ComfyUI 직접 반환)
 * - URL: 향후 구현 (S3/CDN 업로드 후 URL 반환)
 */
export type GeneratedImage = {
  /** 이미지 데이터 타입 */
  type: 'base64' | 'url';

  /** 이미지 포맷 (png, jpg, jpeg 등) */
  format?: 'png' | 'jpg' | 'jpeg' | string;

  /** Base64 인코딩된 이미지 데이터 (type === "base64"일 때) */
  data?: string;

  /** 이미지 URL (type === "url"일 때) */
  url?: string;
};

// ============================================================================
// 생성 요청 타입
// ============================================================================

/**
 * 제품 콘텐츠 생성 요청
 */
export type ProductContentRequest = {
  /** Agent 역할 */
  role: 'copywriter' | 'designer' | 'reviewer';

  /** 작업 타입 */
  task: 'product_detail' | 'ad_campaign' | 'social_media';

  /** 요청 페이로드 */
  payload: {
    /** 제품 이름 */
    product_name: string;

    /** 제품 특징 */
    features?: string[];

    /** 타겟 고객 */
    target_audience?: string;

    /** 톤앤매너 */
    tone?: string;

    /** 이미지 생성 포함 여부 (기본값: false) */
    include_image?: boolean;

    /** 브랜드 ID */
    brand_id?: string;
  };
};

// ============================================================================
// 생성 응답 타입
// ============================================================================

/**
 * 제품 콘텐츠 생성 응답
 */
export type ProductContentResponse = {
  /** 헤드라인 */
  headline: string;

  /** 서브헤드라인 (선택적) */
  subheadline?: string;

  /** 본문 */
  body: string;

  /** 불릿 포인트 (선택적) */
  bullets?: string[];

  /** Call to Action */
  cta: string;

  /** 생성된 이미지 (include_image=true일 때만) */
  image?: GeneratedImage | null;

  /** 사용량 정보 */
  usage?: {
    tokens?: number;
    cost?: number;
  };

  /** 메타데이터 */
  meta?: {
    agent?: string;
    task?: string;
    timestamp?: string;
  };
};

/**
 * SNS 포스트 생성 응답
 */
export type SocialMediaPostResponse = {
  /** 메인 포스트 내용 */
  post: string;

  /** 해시태그 */
  hashtags: string[];

  /** Call to Action */
  cta: string;

  /** 생성된 이미지 (include_image=true일 때만) */
  image?: GeneratedImage | null;

  /** 사용량 정보 */
  usage?: {
    tokens?: number;
    cost?: number;
  };
};

// ============================================================================
// 유틸리티 타입
// ============================================================================

/**
 * 이미지 URL 생성 헬퍼
 * Base64 데이터를 Data URL로 변환
 */
export function getImageDataUrl(image: GeneratedImage | null | undefined): string | null {
  if (!image) return null;

  if (image.type === 'base64' && image.data) {
    const format = image.format || 'png';
    return `data:image/${format};base64,${image.data}`;
  }

  if (image.type === 'url' && image.url) {
    return image.url;
  }

  return null;
}

/**
 * 이미지 유효성 검증
 */
export function isValidGeneratedImage(image: GeneratedImage | null | undefined): boolean {
  if (!image) return false;

  if (image.type === 'base64') {
    return !!image.data && image.data.length > 0;
  }

  if (image.type === 'url') {
    return !!image.url && image.url.length > 0;
  }

  return false;
}
