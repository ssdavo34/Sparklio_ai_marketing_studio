/**
 * useBrandToCanvas Hook
 *
 * Brand DNA 데이터를 Canvas에 추가하는 기능 제공
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-30
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCanvasStore } from '@/components/canvas-studio/stores/useCanvasStore';
import { getPolotnoStore } from '@/components/canvas-studio/polotno/polotnoStoreSingleton';
import {
  addBrandIdentityToCanvas,
  addBrandIdentityToCanvasV2,
} from '@/lib/canvas/brandIdentityTemplate';
import type { BrandDNA, BrandDNAV2, BrandDNAUnion, isBrandDNAV2 } from '@/types/brand';

// ============================================================================
// Types
// ============================================================================

interface UseBrandToCanvasResult {
  /** Canvas에 Brand Identity 추가 */
  addToCanvas: (dna: BrandDNAUnion) => Promise<boolean>;

  /** Canvas로 이동하며 Brand Identity 추가 */
  addToCanvasAndNavigate: (dna: BrandDNAUnion) => Promise<boolean>;

  /** 로딩 상태 */
  isLoading: boolean;

  /** 에러 메시지 */
  error: string | null;

  /** 에러 초기화 */
  clearError: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Brand DNA 버전 확인 (V2인지)
 */
function checkIsBrandDNAV2(dna: BrandDNAUnion): dna is BrandDNAV2 {
  return 'brand_core' in dna && 'message_structure' in dna;
}

// ============================================================================
// Hook
// ============================================================================

export function useBrandToCanvas(): UseBrandToCanvasResult {
  const router = useRouter();
  const { polotnoStore } = useCanvasStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Canvas에 Brand Identity 추가
   */
  const addToCanvas = useCallback(
    async (dna: BrandDNAUnion): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Polotno Store 가져오기 (Zustand 또는 싱글톤)
        const store = polotnoStore || getPolotnoStore();

        if (!store) {
          throw new Error('Canvas가 초기화되지 않았습니다. 먼저 Canvas Studio를 열어주세요.');
        }

        // V2 or V1 분기
        if (checkIsBrandDNAV2(dna)) {
          console.log('[useBrandToCanvas] Adding Brand DNA V2 to canvas...');
          addBrandIdentityToCanvasV2(store, dna);
        } else {
          console.log('[useBrandToCanvas] Adding Brand DNA V1 to canvas...');
          // V1은 API 타입으로 변환 필요
          const dnaForApi = {
            tone: { primary: dna.tone, description: '' },
            key_messages: dna.key_messages,
            target_audience: { demographics: dna.target_audience, psychographics: '' },
            dos: dna.dos,
            donts: dna.donts,
            suggested_brand_kit: {
              primary_colors: ['#6366F1'],
              secondary_colors: ['#8B5CF6'],
            },
            confidence_score: 0.8,
            analysis_notes: '',
          };
          addBrandIdentityToCanvas(store, dnaForApi);
        }

        console.log('[useBrandToCanvas] Brand Identity added to canvas successfully');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        console.error('[useBrandToCanvas] Error:', errorMessage);
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [polotnoStore]
  );

  /**
   * Canvas로 이동하며 Brand Identity 추가
   */
  const addToCanvasAndNavigate = useCallback(
    async (dna: BrandDNAUnion): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // 먼저 Canvas Store에 Brand DNA를 임시 저장
        // (Canvas가 초기화되면 자동으로 추가)
        const pendingBrandDNA = {
          dna,
          timestamp: Date.now(),
        };

        // localStorage에 임시 저장 (Canvas 초기화 후 사용)
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingBrandDNA', JSON.stringify(pendingBrandDNA));
        }

        // Canvas Studio로 이동
        router.push('/studio/v3');

        console.log('[useBrandToCanvas] Navigating to Canvas Studio with pending Brand DNA...');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        console.error('[useBrandToCanvas] Error:', errorMessage);
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    addToCanvas,
    addToCanvasAndNavigate,
    isLoading,
    error,
    clearError,
  };
}

/**
 * Pending Brand DNA 처리 (Canvas 초기화 후 호출)
 */
export function processPendingBrandDNA(polotnoStore: any): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const pendingData = localStorage.getItem('pendingBrandDNA');
    if (!pendingData) return false;

    const { dna, timestamp } = JSON.parse(pendingData);

    // 5분 이상 된 데이터는 무시
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      localStorage.removeItem('pendingBrandDNA');
      return false;
    }

    // Brand DNA 추가
    if (checkIsBrandDNAV2(dna)) {
      addBrandIdentityToCanvasV2(polotnoStore, dna);
    } else {
      const dnaForApi = {
        tone: { primary: dna.tone, description: '' },
        key_messages: dna.key_messages,
        target_audience: { demographics: dna.target_audience, psychographics: '' },
        dos: dna.dos,
        donts: dna.donts,
        suggested_brand_kit: {
          primary_colors: ['#6366F1'],
          secondary_colors: ['#8B5CF6'],
        },
        confidence_score: 0.8,
        analysis_notes: '',
      };
      addBrandIdentityToCanvas(polotnoStore, dnaForApi);
    }

    // 처리 완료 후 삭제
    localStorage.removeItem('pendingBrandDNA');
    console.log('[processPendingBrandDNA] Pending Brand DNA processed successfully');
    return true;
  } catch (err) {
    console.error('[processPendingBrandDNA] Error:', err);
    localStorage.removeItem('pendingBrandDNA');
    return false;
  }
}
