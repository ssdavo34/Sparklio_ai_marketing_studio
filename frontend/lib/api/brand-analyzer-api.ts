/**
 * Brand Analyzer API
 *
 * BrandAnalyzer Agent 연동 API
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 2.4
 */

import type {
  AnalyzeBrandRequest,
  AnalyzeBrandResponse,
  BrandDNA,
} from '@/types/brand';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// API Functions
// ============================================================================

/**
 * 브랜드 분석 (BrandAnalyzer Agent)
 */
export async function analyzeBrand(
  request: AnalyzeBrandRequest
): Promise<AnalyzeBrandResponse> {
  const formData = new FormData();

  // 워크스페이스 ID
  formData.append('workspaceId', request.workspaceId);

  // URL (선택)
  if (request.url) {
    formData.append('url', request.url);
  }

  // 텍스트 (선택)
  if (request.text) {
    formData.append('text', request.text);
  }

  // 파일들 (선택)
  if (request.files && request.files.length > 0) {
    request.files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/agents/brand-analyzer/execute`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    return {
      status: 'failed',
      error: {
        message: error.message || 'Brand analysis failed',
        details: error,
      },
    };
  }

  const data = await response.json();

  return {
    status: data.status || 'success',
    data: data.data,
    error: data.error,
  };
}

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Mock 브랜드 분석
 */
export async function analyzeMockBrand(
  request: AnalyzeBrandRequest
): Promise<AnalyzeBrandResponse> {
  // 간단한 딜레이
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const mockDNA: BrandDNA = {
    schema_version: '1.0',
    tone: '친근하면서도 전문적인, 혁신적이고 신뢰할 수 있는',
    key_messages: [
      '고객과 함께 성장하는 파트너',
      '혁신적인 기술로 비즈니스를 변화시킵니다',
      '믿을 수 있는 솔루션 제공자',
    ],
    target_audience: '20-40대 스타트업 대표 및 마케팅 담당자, 혁신적인 솔루션을 찾는 기업',
    dos: [
      '구체적인 수치와 사례를 활용하세요',
      '고객의 성공 사례를 강조하세요',
      '혁신과 신뢰를 동시에 전달하세요',
      '친근한 톤으로 복잡한 기술을 쉽게 설명하세요',
    ],
    donts: [
      '과도한 기술 용어 사용을 피하세요',
      '경쟁사를 직접적으로 비하하지 마세요',
      '"최고", "최대" 같은 과장된 표현을 자제하세요',
      '너무 격식을 차린 딱딱한 톤을 피하세요',
    ],
    sample_copies: [
      '당신의 비즈니스를 한 단계 업그레이드할 준비가 되셨나요?',
      '지금까지 없던 새로운 경험, 지금 시작하세요',
      '복잡한 마케팅, 이제 간단하게 해결하세요',
    ],
    meta: {
      analyzed_at: new Date().toISOString(),
      model: 'gpt-4-turbo',
      agent_version: '1.0',
    },
  };

  return {
    status: 'success',
    data: mockDNA,
  };
}
