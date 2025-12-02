/**
 * useConceptGenerate Hook
 *
 * ConceptV1 생성을 위한 React Hook
 *
 * Mock 모드와 Real API 모드를 지원합니다.
 * - useMock=true: Mock 데이터 사용 (Backend 불필요, 즉시 개발 가능)
 * - useMock=false: 실제 API 호출 (Backend 완성 후 사용)
 *
 * 작성일: 2025-11-27
 * 작성팀: C팀 (Frontend)
 * 참조: C_TEAM_PRIORITY_TODOS_WITH_CONFLICT_ANALYSIS.md (Task 3)
 *
 * 사용 방법:
 * ```typescript
 * // Mock 모드 (기본값)
 * const { generateConcepts, isLoading, error } = useConceptGenerate({ useMock: true });
 *
 * const handleGenerate = async () => {
 *   try {
 *     const result = await generateConcepts("단백질 스낵 홍보하고 싶어요", 3);
 *     console.log("생성된 컨셉:", result.concepts);
 *   } catch (e) {
 *     console.error("생성 실패:", e);
 *   }
 * };
 *
 * // Real API 모드 (B팀 완료 후)
 * const { generateConcepts } = useConceptGenerate({ useMock: false });
 * ```
 */

import { useState } from 'react';
import type {
  ConceptV1Response,
  ConceptGenerateOptions,
} from '@/types/concept';
import { generateDynamicMockConcepts } from '@/lib/mocks/conceptV1Mock';

// =============================================================================
// Hook Result Interface
// =============================================================================

export interface UseConceptGenerateResult {
  /**
   * ConceptV1 생성 함수
   *
   * @param prompt - 사용자 프롬프트 (예: "단백질 스낵 홍보")
   * @param conceptCount - 생성할 컨셉 수 (1-5, 기본 3)
   * @param brandContext - 브랜드 컨텍스트 (선택)
   * @returns ConceptV1Response (concepts 배열 + reasoning)
   */
  generateConcepts: (
    prompt: string,
    conceptCount?: number,
    brandContext?: string
  ) => Promise<ConceptV1Response>;

  /**
   * 로딩 상태
   */
  isLoading: boolean;

  /**
   * 마지막 생성 응답
   */
  lastResponse: ConceptV1Response | null;

  /**
   * 에러 메시지
   */
  error: string | null;

  /**
   * 에러 초기화
   */
  clearError: () => void;

  /**
   * Mock 모드 여부 (디버깅용)
   */
  isMockMode: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useConceptGenerate Hook
 *
 * @param options - Hook 옵션
 * @param options.useMock - Mock 모드 사용 여부 (기본: true)
 * @param options.timeout - API 타임아웃 (ms, 기본: 30000)
 * @returns UseConceptGenerateResult
 */
export function useConceptGenerate(
  options: ConceptGenerateOptions = {}
): UseConceptGenerateResult {
  const { useMock = true, timeout = 30000 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ConceptV1Response | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  /**
   * ConceptV1 생성 함수
   */
  async function generateConcepts(
    prompt: string,
    conceptCount: number = 3,
    brandContext?: string
  ): Promise<ConceptV1Response> {
    // 입력 검증
    if (!prompt || prompt.trim().length < 5) {
      throw new Error('프롬프트는 최소 5자 이상이어야 합니다.');
    }

    if (conceptCount < 1 || conceptCount > 5) {
      throw new Error('컨셉 수는 1-5 사이여야 합니다.');
    }

    setIsLoading(true);
    setError(null);

    try {
      if (useMock) {
        // =======================================================================
        // 🟢 Mock 모드 - Backend 불필요
        // =======================================================================
        console.log('[useConceptGenerate] 🟢 Mock 모드 사용');
        console.log('[useConceptGenerate] 프롬프트:', prompt);
        console.log('[useConceptGenerate] 컨셉 수:', conceptCount);
        console.log('[useConceptGenerate] 브랜드 컨텍스트:', brandContext);

        // 1초 대기 (로딩 시뮬레이션)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 동적 Mock 응답 생성 (프롬프트 기반)
        const response = generateDynamicMockConcepts(prompt, conceptCount);

        console.log('[useConceptGenerate] ✅ 동적 Mock 응답 생성 완료');
        console.log(
          '[useConceptGenerate] 컨셉 수:',
          response.concepts.length
        );

        setLastResponse(response);
        return response;
      } else {
        // =======================================================================
        // 🔴 Real API 모드 - Backend 필요 (B팀 완료 후)
        // =======================================================================
        console.log('[useConceptGenerate] 🔴 Real API 모드 사용');
        console.log('[useConceptGenerate] API URL: http://100.123.51.5:8000/api/v1/concepts/from-prompt');
        console.log('[useConceptGenerate] 프롬프트:', prompt);

        // Timeout 처리
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const res = await fetch(
            'http://100.123.51.5:8000/api/v1/concepts/from-prompt',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt,
                concept_count: conceptCount,
                brand_context: brandContext,
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(
              `HTTP ${res.status}: ${errorBody || 'Unknown error'}`
            );
          }

          const response: ConceptV1Response = await res.json();

          console.log('[useConceptGenerate] ✅ Real API 응답 수신');
          console.log('[useConceptGenerate] 컨셉 수:', response.concepts.length);

          setLastResponse(response);
          return response;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);

          if (fetchError.name === 'AbortError') {
            throw new Error(`API 타임아웃 (${timeout}ms 초과)`);
          }

          throw fetchError;
        }
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Unknown error occurred';
      console.error('[useConceptGenerate] ❌ 에러:', errorMsg);
      setError(errorMsg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * 에러 초기화
   */
  function clearError() {
    setError(null);
  }

  return {
    generateConcepts,
    isLoading,
    lastResponse,
    error,
    clearError,
    isMockMode: useMock,
  };
}
