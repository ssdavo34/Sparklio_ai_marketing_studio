/**
 * useGenerate Hook
 *
 * Generate API 호출을 위한 React Hook
 *
 * 사용 방법:
 * ```typescript
 * const { generate, isLoading, lastResponse, error } = useGenerate();
 *
 * const handleGenerate = async () => {
 *   try {
 *     const result = await generate("product_detail", "고급 스킨케어 제품 상세 페이지 만들어줘", "brand_001");
 *     console.log("Generated:", result);
 *   } catch (e) {
 *     console.error("Generation failed:", e);
 *   }
 * };
 * ```
 */

import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { GenerateKind, GenerateResponse, ApiError } from "@/lib/api/types";

export interface UseGenerateResult {
  /**
   * Generate API 호출
   *
   * @param kind - Generator 타입 (product_detail, sns, brand_kit 등)
   * @param prompt - 사용자 프롬프트
   * @param brandId - 브랜드 ID (선택)
   * @param locale - 언어 (기본: "ko-KR")
   * @returns GenerateResponse
   */
  generate: (
    kind: GenerateKind,
    prompt: string,
    brandId?: string,
    locale?: string
  ) => Promise<GenerateResponse>;

  /**
   * 로딩 상태
   */
  isLoading: boolean;

  /**
   * 마지막 Generate 응답
   */
  lastResponse: GenerateResponse | null;

  /**
   * 에러 메시지
   */
  error: string | null;

  /**
   * 에러 초기화
   */
  clearError: () => void;
}

export function useGenerate(): UseGenerateResult {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<GenerateResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function generate(
    kind: GenerateKind,
    prompt: string,
    brandId?: string
  ): Promise<GenerateResponse> {
    setIsLoading(true);
    setError(null);

    try {
      // Backend 서버가 없을 경우 Mock 데이터 사용
      // .env.local에 NEXT_PUBLIC_API_BASE_URL이 설정되어 있으면 실제 Backend 사용
      const USE_MOCK = !process.env.NEXT_PUBLIC_API_BASE_URL;

      let res: GenerateResponse;

      if (USE_MOCK) {
        // Mock 응답 (Backend 없이 테스트용)
        console.warn('[useGenerate] Backend 서버 없음 - Mock 데이터 사용');

        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기 (로딩 시뮬레이션)

        res = createMockResponse(kind, prompt);
      } else {
        // 실제 Backend API 호출
        res = await apiClient.generate({
          kind,
          brandId: brandId || "brand_demo", // Backend는 null 불가, 기본값 사용
          input: { prompt }, // 프롬프트를 input에 포함
          options: {
            tone: "professional",
            length: "medium",
          },
        });

        // 👉 실제 응답 데이터 확인 (디버깅용)
        console.log('[useGenerate] 🔍 Full API Response:', JSON.stringify(res, null, 2));
      }

      setLastResponse(res);
      return res;
    } catch (e: any) {
      const errorMsg =
        (e as ApiError).detail || e.message || "Unknown error occurred";
      setError(errorMsg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return {
    generate,
    isLoading,
    lastResponse,
    error,
    clearError,
  };
}

/**
 * Mock 응답 생성 (Backend 서버 없이 테스트용)
 */
function createMockResponse(kind: GenerateKind, prompt: string): GenerateResponse {
  // Fabric.js Canvas JSON 형식의 Mock 데이터 (간단한 도형만)
  const mockCanvasJson = {
    version: "5.3.0",
    objects: [
      {
        type: "rect",
        version: "5.3.0",
        originX: "left",
        originY: "top",
        left: 150,
        top: 150,
        width: 200,
        height: 150,
        fill: "#3b82f6",
        stroke: "#1e40af",
        strokeWidth: 3,
        rx: 10,
        ry: 10,
      },
      {
        type: "circle",
        version: "5.3.0",
        originX: "left",
        originY: "top",
        left: 450,
        top: 200,
        radius: 60,
        fill: "#10b981",
        stroke: "#059669",
        strokeWidth: 3,
      },
      {
        type: "rect",
        version: "5.3.0",
        originX: "left",
        originY: "top",
        left: 200,
        top: 350,
        width: 300,
        height: 80,
        fill: "#f59e0b",
        stroke: "#d97706",
        strokeWidth: 3,
        rx: 5,
        ry: 5,
      },
    ],
    background: "#f3f4f6",
  };

  // Backend 실제 스키마 형식으로 반환
  return {
    kind,
    document: {
      documentId: `mock_doc_${Date.now()}`,
      type: kind,
      canvas_json: mockCanvasJson,
    },
    text: {
      headline: `${kind} - Mock 헤드라인`,
      subheadline: "Mock 서브헤드라인",
      body: `프롬프트: ${prompt}`,
      bullets: ["Mock 포인트 1", "Mock 포인트 2", "Mock 포인트 3"],
    },
    meta: {
      workflow: "mock_workflow",
      agents_used: ["mock_agent_1", "mock_agent_2"],
      elapsed_seconds: 1.0,
      tokens_used: 100,
      steps_completed: 1,
      total_steps: 1,
    },
  };
}
