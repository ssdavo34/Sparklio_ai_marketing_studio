/**
 * ConceptV1 Board View
 *
 * ConceptV1 스키마로 생성된 컨셉들을 표시하는 뷰
 *
 * 작성일: 2025-11-27
 * 작성팀: C팀 (Frontend)
 * 참조: Task 4 - ConceptBoardView UI 확장
 *
 * 사용 방법:
 * - Mock 모드: useConceptGenerate({ useMock: true })로 생성된 컨셉 표시
 * - Real API 모드: B팀 완료 후 useMock: false로 전환
 */

'use client';

import React, { useState } from 'react';
import type { ConceptV1 } from '@/types/concept';
import { ConceptV1Card, CompactConceptV1Card } from '../components/ConceptV1Card';

// =============================================================================
// Props Interface
// =============================================================================

export interface ConceptV1BoardViewProps {
  /**
   * ConceptV1 배열
   */
  concepts: ConceptV1[];

  /**
   * 캠페인 이름 (선택)
   */
  campaignName?: string;

  /**
   * 컨셉 도출 근거 (선택)
   */
  reasoning?: string;

  /**
   * 로딩 상태 (선택)
   */
  isLoading?: boolean;

  /**
   * 에러 메시지 (선택)
   */
  error?: string | null;
}

// =============================================================================
// ConceptV1 Board View Component
// =============================================================================

export function ConceptV1BoardView({
  concepts,
  campaignName = 'Concept Board',
  reasoning,
  isLoading = false,
  error = null,
}: ConceptV1BoardViewProps) {
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    concepts.length > 0 ? concepts[0].id : ''
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">ConceptV1 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-2">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (concepts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">생성된 ConceptV1이 없습니다.</p>
          <p className="text-sm text-gray-400">
            Chat에서 "컨셉 생성" 모드로 주제를 입력해보세요.
          </p>
        </div>
      </div>
    );
  }

  const selectedConcept = concepts.find(c => c.id === selectedConceptId) || concepts[0];
  const conceptIndex = concepts.findIndex(c => c.id === selectedConceptId);

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* ========== 헤더 ========== */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {/* 캠페인 타이틀 */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-gray-900">{campaignName}</h1>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
              ConceptV1
            </span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
              {concepts.length}개 컨셉
            </span>
          </div>

          {/* Reasoning (있으면 표시) */}
          {reasoning && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">💡 컨셉 도출 근거</p>
              <p className="text-sm text-gray-700">{reasoning}</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== 컨셉 선택 탭 (3개 이상일 때만 표시) ========== */}
      {concepts.length > 1 && (
        <div className="bg-white border-b px-6 py-3">
          <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto">
            {concepts.map((concept, idx) => (
              <button
                key={concept.id}
                onClick={() => setSelectedConceptId(concept.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all whitespace-nowrap
                  ${selectedConceptId === concept.id
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs
                    ${selectedConceptId === concept.id
                      ? 'bg-white text-purple-500'
                      : 'bg-white text-gray-600'
                    }
                  `}
                >
                  {idx + 1}
                </span>
                <span>{concept.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========== 선택된 컨셉 상세 뷰 ========== */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* 섹션 타이틀 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full text-white ${
                  conceptIndex === 0
                    ? 'bg-purple-500'
                    : conceptIndex === 1
                    ? 'bg-pink-500'
                    : 'bg-amber-500'
                }`}
              >
                컨셉 {conceptIndex + 1}
              </span>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedConcept.name}
              </h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {selectedConcept.mode}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {concepts.length > 1 && (
                <>상단 탭에서 다른 컨셉을 선택할 수 있습니다 ({concepts.length}개 중 {conceptIndex + 1}번째)</>
              )}
            </p>
          </div>

          {/* ConceptV1 카드 (확장형) */}
          <ConceptV1Card
            concept={selectedConcept}
            isSelected={true}
            expanded={true}
          />

          {/* 하단 안내 */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>💡 ConceptV1 스키마 기반 - 전략적 마케팅 컨셉</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConceptV1BoardView;
