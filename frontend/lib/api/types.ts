/**
 * API Type Definitions
 *
 * Backend API 스펙 기반 타입 정의
 * - POST /api/v1/generate
 * - GET/POST/PATCH /api/v1/documents
 */

// ============================================================================
// Generate API Types
// ============================================================================

/**
 * Generator 타입
 *
 * P0: brand_kit, product_detail, sns
 * P1: presentation, meeting_ai, ad_script
 */
export type GenerateKind =
  | "brand_kit"
  | "product_detail"
  | "sns"
  | "presentation"
  | "meeting_ai"
  | "ad_script";

/**
 * Generate 요청
 *
 * POST /api/v1/generate
 */
export interface GenerateRequest {
  kind: GenerateKind;
  brandId?: string | null;
  locale?: string; // default: "ko-KR"
  channel?: string | null; // shop_detail, instagram, blog 등
  input: Record<string, any>;
  context?: Record<string, any>;
}

/**
 * Generate 응답
 *
 * Backend의 GenerationResult 스키마
 */
export interface GenerateResponse {
  taskId: string;
  kind: GenerateKind;
  textBlocks: Record<string, any>; // headline, description 등
  editorDocument: {
    documentId?: string;
    type: string;
    pages: any[]; // Fabric.js 페이지 배열
    // OR
    canvas_json?: any; // Fabric.Canvas.toJSON() 결과 (간소화 버전)
  };
  meta?: {
    templates_used?: string[];
    agents_trace?: any[];
    llm_cost?: Record<string, any>;
  };
}

// ============================================================================
// Document API Types
// ============================================================================

/**
 * Document DTO
 *
 * Backend의 DocumentResponse 스키마
 */
export interface DocumentDto {
  id: string; // UUID
  brand_id?: string | null;
  project_id?: string | null;
  user_id: string;
  document_json: Record<string, any>; // Fabric.js JSON 또는 Editor Document
  document_metadata?: Record<string, any>;
  version: number;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

/**
 * Document 저장 요청
 *
 * POST /api/v1/documents/{docId}/save
 */
export interface DocumentSaveRequest {
  documentJson: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Document 수정 요청
 *
 * PATCH /api/v1/documents/{docId}
 */
export interface DocumentUpdateRequest {
  documentJson?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Document 목록 응답
 *
 * GET /api/v1/documents
 */
export interface DocumentListResponse {
  documents: DocumentDto[];
  total: number;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * API Error Response
 */
export interface ApiError {
  detail: string;
  status?: number;
}
