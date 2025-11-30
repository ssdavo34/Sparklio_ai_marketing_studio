/**
 * Brand API
 *
 * 브랜드 키트 CRUD API + Brand OS Module (B팀 통합)
 * - Brand Document 업로드/크롤링
 * - Brand DNA 분석
 *
 * @author C팀 (Frontend Team)
 * @version 2.1
 * @date 2025-11-30
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.3.2
 */

import type {
  BrandKit,
  CreateBrandKitRequest,
  UpdateBrandKitRequest,
} from '@/types/brand';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * 인증 헤더 생성
 */
function getAuthHeaders(contentType: string = 'application/json'): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': contentType,
  };

  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('access_token');

      // Debug logging
      if (!token) {
        console.warn('[BrandAPI] No token found in localStorage');
      } else if (token === 'undefined' || token === 'null') {
        console.error('[BrandAPI] Invalid token string found:', token);
      } else {
        // Basic JWT validation (header.payload.signature)
        const parts = token.split('.');
        if (parts.length === 3) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.error('[BrandAPI] Malformed JWT token:', token.substring(0, 10) + '...');
        }
      }
    } catch (error) {
      console.error('[BrandAPI] Failed to access localStorage:', error);
    }
  }

  return headers;
}

/**
 * 파일 업로드용 인증 헤더 생성 (Content-Type 제외)
 */
function getUploadHeaders(): HeadersInit {
  const headers: HeadersInit = {};

  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('access_token');
      if (token && token !== 'undefined' && token !== 'null') {
        const parts = token.split('.');
        if (parts.length === 3) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('[BrandAPI] Failed to access localStorage:', error);
    }
  }

  return headers;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 워크스페이스의 브랜드 키트 조회
 */
export async function getBrandKit(workspaceId: string): Promise<BrandKit | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${workspaceId}/brand-kit`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (response.status === 404) {
    return null; // 브랜드 키트가 없음
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch brand kit: ${response.statusText}`);
  }

  const data = await response.json();
  return data.brandKit || data;
}

/**
 * 브랜드 키트 생성
 */
export async function createBrandKit(
  request: CreateBrandKitRequest
): Promise<BrandKit> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${request.workspaceId}/brand-kit`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create brand kit');
  }

  const data = await response.json();
  return data.brandKit || data;
}

/**
 * 브랜드 키트 수정
 */
export async function updateBrandKit(
  id: string,
  request: UpdateBrandKitRequest
): Promise<BrandKit> {
  const response = await fetch(`${API_BASE_URL}/api/v1/brand-kits/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update brand kit');
  }

  const data = await response.json();
  return data.brandKit || data;
}

/**
 * 브랜드 키트 삭제
 */
export async function deleteBrandKit(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/brand-kits/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete brand kit');
  }
}

/**
 * 로고 업로드
 */
export async function uploadLogo(
  workspaceId: string,
  file: File
): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/workspaces/${workspaceId}/brand-kit/logo`,
    {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload logo');
  }

  const data = await response.json();
  return data;
}

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Mock 브랜드 키트 조회
 */
export function getMockBrandKit(workspaceId: string): BrandKit {
  return {
    id: `bk-${workspaceId}`,
    workspaceId,
    logoUrl: 'https://via.placeholder.com/200',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#ec4899',
    fonts: ['Pretendard', 'Inter'],
    toneKeywords: ['친근한', '전문적인', '혁신적인'],
    forbiddenExpressions: ['최고', '세계 최초', '업계 1위'],
    keyMessages: [
      '고객과 함께 성장합니다',
      '혁신적인 솔루션을 제공합니다',
      '믿을 수 있는 파트너입니다',
    ],
    sampleCopies: [
      '당신의 비즈니스를 한 단계 업그레이드하세요',
      '지금 바로 시작하세요',
    ],
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  };
}

/**
 * Mock 브랜드 키트 생성
 */
export function createMockBrandKit(request: CreateBrandKitRequest): BrandKit {
  return {
    id: `bk-${Date.now()}`,
    ...request,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Brand OS Module API (B팀 통합)
// ============================================================================

/**
 * Brand Document Types
 */
export interface BrandDocument {
  id: string;
  brand_id: string;
  title: string;
  document_type: 'pdf' | 'image' | 'brochure' | 'url';
  file_url?: string;
  source_url?: string;
  file_size?: number;
  mime_type?: string;
  extracted_text?: string;  // 원본 텍스트
  clean_text?: string;  // 정제된 텍스트 (Brand DNA 분석용)
  extracted_keywords?: string[];  // 추출된 키워드
  processed: 'pending' | 'completed' | 'failed';
  document_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BrandDocumentListResponse {
  documents: BrandDocument[];
  total: number;
}

/**
 * Brand DNA Types
 */
export interface BrandDNA {
  tone: {
    primary: string;
    secondary: string[];
    description: string;
  };
  key_messages: string[];
  target_audience: {
    demographics: string;
    psychographics: string;
    pain_points: string[];
  };
  dos: string[];
  donts: string[];
  sample_copies: Array<{
    type: string;
    text: string;
    explanation: string;
  }>;
  suggested_brand_kit: {
    primary_colors: string[];
    secondary_colors: string[];
    fonts: {
      headline: string;
      body: string;
    };
    tone_keywords: string[];
    forbidden_expressions: string[];
  };
  confidence_score: number;
  analysis_notes: string;
}

/**
 * 브랜드 문서 업로드 (PDF, 이미지 등)
 */
export async function uploadBrandDocument(
  brandId: string,
  file: File,
  title?: string,
  documentType: 'pdf' | 'image' | 'brochure' = 'pdf'
): Promise<BrandDocument> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }
  formData.append('document_type', documentType);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/brands/${brandId}/documents`,
    {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload document');
  }

  return response.json();
}

/**
 * URL 크롤링 옵션
 */
export interface CrawlOptions {
  /** 다중 페이지 크롤링 (회사 소개, 서비스 페이지 등 자동 탐색) */
  multiPage?: boolean;
  /** 최대 크롤링 페이지 수 (1-10, 기본 5) */
  maxPages?: number;
  /** 제품/서비스 카테고리 포함 여부 */
  includeCategories?: boolean;
}

/**
 * URL 크롤링하여 브랜드 문서 생성
 *
 * @param brandId - 브랜드 ID
 * @param url - 크롤링할 URL
 * @param title - 문서 제목 (선택)
 * @param options - 크롤링 옵션 (다중 페이지, 카테고리 등)
 */
export async function crawlBrandUrl(
  brandId: string,
  url: string,
  title?: string,
  options?: CrawlOptions
): Promise<BrandDocument> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/brands/${brandId}/documents/crawl`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        url,
        title,
        multi_page: options?.multiPage ?? false,
        max_pages: options?.maxPages ?? 5,
        include_categories: options?.includeCategories ?? true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to crawl URL');
  }

  return response.json();
}

/**
 * 브랜드 문서 목록 조회
 */
export async function listBrandDocuments(
  brandId: string,
  skip: number = 0,
  limit: number = 100
): Promise<BrandDocumentListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/brands/${brandId}/documents?skip=${skip}&limit=${limit}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch documents');
  }

  return response.json();
}

/**
 * 브랜드 문서 삭제
 */
export async function deleteBrandDocument(
  brandId: string,
  documentId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/brands/${brandId}/documents/${documentId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete document');
  }
}

/**
 * 브랜드 문서 수정 요청 타입
 */
export interface UpdateBrandDocumentRequest {
  /** 문서 제목 */
  title?: string;
  /** 원본 추출 텍스트 */
  extracted_text?: string;
  /** 정제된 텍스트 (Brand DNA 분석용) */
  clean_text?: string;
  /** 추출된 키워드 목록 */
  extracted_keywords?: string[];
}

/**
 * 브랜드 문서 수정 (크롤링된 텍스트 편집)
 *
 * 크롤링된 문서의 텍스트를 수동으로 편집하여 저장합니다.
 * 잘못 추출된 텍스트를 수정하거나 불필요한 내용을 삭제할 때 사용합니다.
 *
 * @param brandId - 브랜드 ID
 * @param documentId - 수정할 문서 ID
 * @param updateData - 수정할 필드들
 */
export async function updateBrandDocument(
  brandId: string,
  documentId: string,
  updateData: UpdateBrandDocumentRequest
): Promise<BrandDocument> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/brands/${brandId}/documents/${documentId}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update document');
  }

  return response.json();
}

/**
 * URL 문서 재크롤링 (DataCleanerAgent V2 적용)
 *
 * 기존에 크롤링된 URL 문서를 다시 크롤링하고 최신 정제 로직을 적용합니다.
 *
 * @param brandId - 브랜드 ID
 * @param documentId - 재크롤링할 문서 ID
 */
export async function recrawlBrandDocument(
  brandId: string,
  documentId: string
): Promise<BrandDocument> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/brands/${brandId}/documents/${documentId}/recrawl`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to recrawl document');
  }

  return response.json();
}

/**
 * Brand DNA 분석 실행
 *
 * 브랜드에 업로드된 문서를 분석하여 Brand DNA Card를 자동 생성합니다.
 * 생성된 Brand DNA는 자동으로 DB에 저장됩니다.
 *
 * @param brandId - 브랜드 ID
 * @param documentIds - 분석할 문서 ID 배열 (없으면 모든 문서 분석)
 */
export async function analyzeBrand(
  brandId: string,
  documentIds?: string[]
): Promise<BrandDNA> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/brands/${brandId}/analyze`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        document_ids: documentIds && documentIds.length > 0 ? documentIds : null,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to analyze brand');
  }

  return response.json();
}

/**
 * Mock Brand Documents (개발용)
 */
export function getMockBrandDocuments(brandId: string): BrandDocumentListResponse {
  return {
    documents: [
      {
        id: 'doc-1',
        brand_id: brandId,
        title: '브랜드 가이드라인.pdf',
        document_type: 'pdf',
        file_url: '/uploads/brand-guideline.pdf',
        file_size: 2048000,
        mime_type: 'application/pdf',
        extracted_text: '브랜드 가이드라인 내용...',
        processed: 'completed',
        created_at: '2025-11-20T10:00:00Z',
        updated_at: '2025-11-20T10:00:00Z',
      },
      {
        id: 'doc-2',
        brand_id: brandId,
        title: '공식 홈페이지',
        document_type: 'url',
        source_url: 'https://example.com',
        extracted_text: '회사 소개 내용...',
        processed: 'completed',
        created_at: '2025-11-20T11:00:00Z',
        updated_at: '2025-11-20T11:00:00Z',
      },
    ],
    total: 2,
  };
}

/**
 * Mock Brand DNA (개발용)
 */
export function getMockBrandDNA(): BrandDNA {
  return {
    tone: {
      primary: '친근하고 전문적인',
      secondary: ['신뢰할 수 있는', '혁신적인'],
      description: '고객과의 친밀한 관계를 유지하면서도 전문성을 잃지 않는 톤',
    },
    key_messages: [
      '당신의 마케팅을 더 쉽게',
      'AI 기반 마케팅 솔루션',
      '시간과 비용 절감',
    ],
    target_audience: {
      demographics: '25-45세 마케팅 담당자, 스타트업 대표',
      psychographics: '효율적인 솔루션을 찾는 혁신 지향적 성향',
      pain_points: [
        '마케팅 콘텐츠 제작 시간 부족',
        '전문 디자이너 고용 비용 부담',
        '일관된 브랜드 메시지 유지 어려움',
      ],
    },
    dos: [
      '구체적인 수치와 사례 제시',
      '고객의 성공 스토리 강조',
      '간결하고 명확한 표현 사용',
    ],
    donts: [
      '과장된 표현 지양',
      '전문 용어 남발 금지',
      '경쟁사 직접 비교 언급 자제',
    ],
    sample_copies: [
      {
        type: 'headline',
        text: 'AI가 만드는 당신만의 마케팅 콘텐츠',
        explanation: '친근하면서도 AI의 전문성을 강조',
      },
      {
        type: 'cta',
        text: '지금 무료로 시작하기',
        explanation: '행동 유도 + 진입 장벽 제거',
      },
    ],
    suggested_brand_kit: {
      primary_colors: ['#6366F1', '#8B5CF6'],
      secondary_colors: ['#EC4899', '#F59E0B'],
      fonts: {
        headline: 'Pretendard Bold',
        body: 'Pretendard Regular',
      },
      tone_keywords: ['친근한', '전문적인', '혁신적인'],
      forbidden_expressions: ['싸게', '대박', '완전'],
    },
    confidence_score: 0.85,
    analysis_notes: '2개 문서 분석 완료. 추가 문서 업로드 시 정확도 향상',
  };
}

