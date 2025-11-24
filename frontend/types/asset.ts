/**
 * Asset & Template Types
 *
 * 자산 라이브러리 및 템플릿 시스템 관련 TypeScript 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.1.4
 */

// ============================================================================
// Asset Types
// ============================================================================

/**
 * 자산 타입
 */
export type AssetType = 'image' | 'video' | 'document' | 'font' | 'audio' | 'other';

/**
 * 자산 (Asset)
 *
 * 워크스페이스에 업로드된 미디어 파일
 */
export interface Asset {
  /** 자산 고유 ID */
  id: string;

  /** 소속 워크스페이스 ID */
  workspaceId: string;

  /** 파일명 */
  name: string;

  /** 자산 타입 */
  type: AssetType;

  /** 파일 URL */
  url: string;

  /** 썸네일 URL (선택) */
  thumbnailUrl?: string;

  /** 파일 크기 (bytes) */
  fileSize: number;

  /** MIME 타입 */
  mimeType: string;

  /** 태그 목록 */
  tags: string[];

  /** 설명 (선택) */
  description?: string;

  /** 생성일시 */
  createdAt: string;

  /** 수정일시 */
  updatedAt: string;
}

/**
 * 자산 업로드 요청
 */
export interface UploadAssetRequest {
  /** 워크스페이스 ID */
  workspaceId: string;

  /** 업로드할 파일 */
  file: File;

  /** 태그 (선택) */
  tags?: string[];

  /** 설명 (선택) */
  description?: string;
}

/**
 * 자산 업로드 응답
 */
export interface UploadAssetResponse {
  /** 상태 */
  status: 'success' | 'failed';

  /** 업로드된 자산 */
  data?: Asset;

  /** 에러 정보 (실패 시) */
  error?: {
    message: string;
    details?: any;
  };
}

/**
 * 자산 검색 필터
 */
export interface AssetFilter {
  /** 자산 타입 필터 */
  type?: AssetType;

  /** 태그 필터 */
  tags?: string[];

  /** 검색 쿼리 (파일명) */
  query?: string;

  /** 정렬 기준 */
  sortBy?: 'createdAt' | 'name' | 'fileSize';

  /** 정렬 방향 */
  sortOrder?: 'asc' | 'desc';

  /** 페이지 번호 */
  page?: number;

  /** 페이지 크기 */
  pageSize?: number;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * 템플릿 카테고리
 */
export type TemplateCategory = 'banner' | 'detail' | 'sns' | 'deck' | 'element';

/**
 * 템플릿
 *
 * Canvas Studio에서 사용할 수 있는 미리 만들어진 레이아웃
 */
export interface Template {
  /** 템플릿 고유 ID */
  id: string;

  /** 템플릿 이름 */
  name: string;

  /** 카테고리 */
  category: TemplateCategory;

  /** 설명 */
  description?: string;

  /** 썸네일 URL */
  thumbnailUrl: string;

  /** Canvas JSON (Polotno 또는 Custom Format) */
  canvasJson: object;

  /** 태그 */
  tags: string[];

  /** 사이즈 (선택) */
  size?: {
    width: number;
    height: number;
  };

  /** 생성일시 */
  createdAt: string;

  /** 수정일시 */
  updatedAt: string;
}

/**
 * 템플릿 검색 필터
 */
export interface TemplateFilter {
  /** 카테고리 필터 */
  category?: TemplateCategory;

  /** 태그 필터 */
  tags?: string[];

  /** 검색 쿼리 */
  query?: string;

  /** 페이지 번호 */
  page?: number;

  /** 페이지 크기 */
  pageSize?: number;
}

/**
 * 템플릿 적용 옵션
 */
export interface ApplyTemplateOptions {
  /** 브랜드 컬러 자동 교체 */
  replaceBrandColors?: boolean;

  /** 브랜드 폰트 자동 교체 */
  replaceBrandFonts?: boolean;

  /** 브랜드 로고 자동 삽입 */
  insertBrandLogo?: boolean;

  /** 기존 페이지를 덮어쓸지 여부 */
  overwriteCurrentPage?: boolean;
}

// ============================================================================
// Helper Constants
// ============================================================================

/**
 * 자산 타입 라벨 (한글)
 */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  image: '이미지',
  video: '비디오',
  document: '문서',
  font: '폰트',
  audio: '오디오',
  other: '기타',
};

/**
 * 자산 타입 아이콘
 */
export const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  image: '🖼️',
  video: '🎬',
  document: '📄',
  font: '🔤',
  audio: '🎵',
  other: '📎',
};

/**
 * 템플릿 카테고리 라벨 (한글)
 */
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  banner: '배너',
  detail: '상품상세',
  sns: 'SNS',
  deck: '프레젠테이션',
  element: '요소',
};

/**
 * 템플릿 카테고리 아이콘
 */
export const TEMPLATE_CATEGORY_ICONS: Record<TemplateCategory, string> = {
  banner: '🎨',
  detail: '📦',
  sns: '📱',
  deck: '📊',
  element: '🧩',
};

/**
 * 지원되는 이미지 MIME 타입
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/**
 * 지원되는 비디오 MIME 타입
 */
export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];

/**
 * 지원되는 문서 MIME 타입
 */
export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

/**
 * 최대 파일 크기 (bytes)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 파일에서 자산 타입 추론
 */
export function getAssetTypeFromFile(file: File): AssetType {
  const { type } = file;

  if (SUPPORTED_IMAGE_TYPES.includes(type)) {
    return 'image';
  }
  if (SUPPORTED_VIDEO_TYPES.includes(type)) {
    return 'video';
  }
  if (SUPPORTED_DOCUMENT_TYPES.includes(type)) {
    return 'document';
  }
  if (type.startsWith('audio/')) {
    return 'audio';
  }
  if (type.startsWith('font/') || file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
    return 'font';
  }

  return 'other';
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * 파일이 유효한지 확인
 */
export function isValidFile(file: File): { valid: boolean; error?: string } {
  // 크기 체크
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${formatFileSize(MAX_FILE_SIZE)}까지 업로드할 수 있습니다.`,
    };
  }

  // 타입 체크
  const assetType = getAssetTypeFromFile(file);
  if (assetType === 'other') {
    // 'other' 타입도 허용하되 경고
    console.warn(`지원되지 않는 파일 타입입니다: ${file.type}`);
  }

  return { valid: true };
}

/**
 * 썸네일 URL 생성 (이미지용)
 */
export function generateThumbnailUrl(assetUrl: string, size: number = 200): string {
  // 실제로는 Backend에서 처리하거나 이미지 리사이징 서비스 사용
  // 여기서는 간단히 원본 URL 반환
  return assetUrl;
}
