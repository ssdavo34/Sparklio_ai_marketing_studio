/**
 * Vector DB API
 *
 * B팀 Vector DB 임베딩 API 연동
 * - 자동 임베딩 생성 (텍스트 → OpenAI Embeddings)
 * - 유사도 검색
 * - 브랜드 컨텍스트 검색
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// Types
// ============================================================================

export interface EmbeddingStoreRequest {
  text: string;
  metadata?: Record<string, any>;
  collection: 'brand_embeddings' | 'concept_embeddings' | 'document_chunks';
  brand_id?: string;
  concept_id?: string;
  document_id?: string;
}

export interface EmbeddingSearchRequest {
  query_text: string;
  collection: 'brand_embeddings' | 'concept_embeddings' | 'document_chunks';
  top_k?: number;
  brand_id?: string;
  threshold?: number;
}

export interface EmbeddingSearchResult {
  id: string;
  text: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface EmbeddingStatsResponse {
  total_embeddings: number;
  collections: {
    brand_embeddings: number;
    concept_embeddings: number;
    document_chunks: number;
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 자동 임베딩 생성 및 저장
 * - 텍스트를 받아서 OpenAI로 임베딩 생성 후 Vector DB에 저장
 */
export async function autoEmbed(request: EmbeddingStoreRequest): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/embeddings/auto-embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create embedding');
  }

  return response.json();
}

/**
 * 자동 검색
 * - 텍스트를 받아서 OpenAI로 임베딩 생성 후 유사도 검색
 */
export async function autoSearch(
  request: EmbeddingSearchRequest
): Promise<EmbeddingSearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/embeddings/auto-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to search embeddings');
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Vector DB 통계 조회
 */
export async function getEmbeddingStats(): Promise<EmbeddingStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/embeddings/stats`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch stats');
  }

  return response.json();
}

/**
 * 브랜드 임베딩 삭제
 */
export async function deleteBrandEmbeddings(brandId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/embeddings/brand/${brandId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete brand embeddings');
  }
}

/**
 * 브랜드 컨텍스트 검색
 * - 브랜드 관련 문서에서 유사한 내용 찾기
 */
export async function searchBrandContext(
  brandId: string,
  query: string,
  topK: number = 5
): Promise<EmbeddingSearchResult[]> {
  return autoSearch({
    query_text: query,
    collection: 'brand_embeddings',
    brand_id: brandId,
    top_k: topK,
    threshold: 0.7, // 70% 이상 유사도만 반환
  });
}

/**
 * 컨셉 검색
 * - 유사한 컨셉 찾기
 */
export async function searchSimilarConcepts(
  query: string,
  topK: number = 5
): Promise<EmbeddingSearchResult[]> {
  return autoSearch({
    query_text: query,
    collection: 'concept_embeddings',
    top_k: topK,
    threshold: 0.6,
  });
}
