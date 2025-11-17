/**
 * API Type Definitions
 *
 * Backend API 스펙 기반 타입 정의 (B팀 실제 스키마에 정렬)
 * - POST /api/v1/generate
 * - GET/POST/PATCH /api/v1/documents
 *
 * @version 2.0 - Backend 스키마 정렬 완료 (2025-11-17)
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
 *
 * Backend 실제 스키마:
 * - brandId: string (필수, "brand_demo" 사용 가능)
 * - input: 구조화된 데이터 (kind에 따라 다름)
 * - options: 선택적 옵션 (tone, length 등)
 */
export interface GenerateRequest {
  kind: GenerateKind;
  brandId: string; // 필수 (null 불가)
  input: GenerateInput;
  options?: GenerateOptions;
}

/**
 * Generate 입력 데이터
 *
 * kind에 따라 필요한 필드가 다름:
 * - product_detail: product_name, features, target_audience
 * - sns: topic, platform, style
 * - brand_kit: brand_name, description
 */
export interface GenerateInput {
  // Product Detail 전용
  product_name?: string;
  features?: string[];
  target_audience?: string;

  // SNS 전용
  topic?: string;
  platform?: string; // instagram, facebook 등
  style?: string;

  // Brand Kit 전용
  brand_name?: string;
  description?: string;

  // 자유 프롬프트 (fallback)
  prompt?: string;

  // 기타 kind별 필드 확장 가능
  [key: string]: any;
}

/**
 * Generate 옵션
 */
export interface GenerateOptions {
  tone?: string; // professional, casual, friendly 등
  length?: string; // short, medium, long
  [key: string]: any;
}

/**
 * Generate 응답
 *
 * Backend 실제 스키마:
 * - kind: string
 * - document: { documentId, type, canvas_json }
 * - text: { headline, subheadline, body, bullets }
 * - meta: { workflow, agents_used, elapsed_seconds, tokens_used, ... }
 */
export interface GenerateResponse {
  kind: GenerateKind;
  document: {
    documentId: string;
    type: string;
    canvas_json: {
      version: string;
      objects: any[];
      background?: string;
    };
  };
  text: {
    headline?: string;
    subheadline?: string;
    body?: string;
    bullets?: string[];
    [key: string]: any; // kind별 추가 필드
  };
  meta: {
    workflow: string;
    agents_used: string[];
    elapsed_seconds: number;
    tokens_used: number;
    steps_completed: number;
    total_steps: number;
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
