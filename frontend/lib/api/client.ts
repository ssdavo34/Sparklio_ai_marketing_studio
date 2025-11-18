/**
 * API Client
 *
 * 통합 API 클라이언트 - Backend와의 모든 통신은 이 클라이언트를 통해 이루어집니다.
 *
 * 사용 방법:
 * ```typescript
 * const res = await apiClient.generate(request);
 * const docs = await apiClient.listDocuments();
 * ```
 */

import type {
  GenerateRequest,
  GenerateResponse,
  DocumentDto,
  DocumentSaveRequest,
  DocumentUpdateRequest,
  DocumentListResponse,
  ApiError,
} from "./types";

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// 👉 실제로 어떤 값이 들어오는지 확인
console.log("[API Client] API_BASE_URL =", API_BASE_URL);

if (!API_BASE_URL) {
  console.error(
    "[API Client] NEXT_PUBLIC_API_BASE_URL is not defined in .env.local"
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 공통 fetch wrapper
 *
 * @param path - API 경로 (예: "/api/v1/generate")
 * @param options - fetch options
 * @returns Promise<T>
 * @throws ApiError
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    // 에러 응답 파싱
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errorData: ApiError = await res.json();
      errorDetail = errorData.detail || errorDetail;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }

    const error: ApiError = {
      detail: errorDetail,
      status: res.status,
    };

    console.error(`[API Client] ${options?.method || "GET"} ${path}:`, error);
    throw error;
  }

  return res.json() as Promise<T>;
}

// ============================================================================
// API Client
// ============================================================================

export const apiClient = {
  // ==========================================================================
  // Generate API
  // ==========================================================================

  /**
   * 콘텐츠 생성
   *
   * POST /api/v1/generate
   *
   * @param body - Generate 요청 데이터
   * @returns GenerateResponse
   */
  async generate(body: GenerateRequest): Promise<GenerateResponse> {
    return request<GenerateResponse>("/api/v1/generate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // ==========================================================================
  // Document API
  // ==========================================================================

  /**
   * Document 목록 조회
   *
   * GET /api/v1/documents
   *
   * @param params - Query parameters (brand_id, project_id, skip, limit)
   * @returns DocumentListResponse
   */
  async listDocuments(params?: {
    brand_id?: string;
    project_id?: string;
    skip?: number;
    limit?: number;
  }): Promise<DocumentListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.brand_id) searchParams.set("brand_id", params.brand_id);
    if (params?.project_id) searchParams.set("project_id", params.project_id);
    if (params?.skip !== undefined)
      searchParams.set("skip", params.skip.toString());
    if (params?.limit !== undefined)
      searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    const path = query ? `/api/v1/documents?${query}` : "/api/v1/documents";

    return request<DocumentListResponse>(path);
  },

  /**
   * Document 조회
   *
   * GET /api/v1/documents/{docId}
   *
   * @param id - Document ID
   * @returns DocumentDto
   */
  async getDocument(id: string): Promise<DocumentDto> {
    return request<DocumentDto>(`/api/v1/documents/${id}`);
  },

  /**
   * Document 저장 (신규 생성 또는 업데이트)
   *
   * POST /api/v1/documents/{docId}/save
   *
   * @param id - Document ID
   * @param doc - Document 저장 데이터
   * @returns 저장 결과
   */
  async saveDocument(
    id: string,
    doc: DocumentSaveRequest
  ): Promise<{
    status: "created" | "updated";
    documentId: string;
    version: number;
    created_at?: string;
    updated_at?: string;
  }> {
    return request(`/api/v1/documents/${id}/save`, {
      method: "POST",
      body: JSON.stringify(doc),
    });
  },

  /**
   * Document 부분 수정
   *
   * PATCH /api/v1/documents/{docId}
   *
   * @param id - Document ID
   * @param doc - Document 수정 데이터
   * @returns DocumentDto
   */
  async updateDocument(
    id: string,
    doc: DocumentUpdateRequest
  ): Promise<DocumentDto> {
    return request<DocumentDto>(`/api/v1/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(doc),
    });
  },

  /**
   * Document 삭제
   *
   * DELETE /api/v1/documents/{docId}
   *
   * @param id - Document ID
   * @returns void
   */
  async deleteDocument(id: string): Promise<void> {
    return request<void>(`/api/v1/documents/${id}`, {
      method: "DELETE",
    });
  },
};
