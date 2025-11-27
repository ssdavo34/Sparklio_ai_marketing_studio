/**
 * ConceptV1 Card Component
 *
 * ConceptV1 스키마의 모든 필드를 표시하는 확장 카드 컴포넌트
 *
 * 작성일: 2025-11-27
 * 작성팀: C팀 (Frontend)
 * 참조: Task 4 - ConceptBoardView UI 확장
 *
 * 표시하는 필드:
 * - 기본: name, topic, mode
 * - 전략 핵심: audience_insight, core_promise, brand_role
 * - 근거: reason_to_believe
 * - 크리에이티브: creative_device, hook_patterns
 * - 비주얼: visual_world (색상 팔레트 + HEX)
 * - 채널 전략: channel_strategy (4채널)
 * - 가드레일: guardrails (피할/필수 표현)
 */

'use client';

import React from 'react';
import type { ConceptV1 } from '@/types/concept';

// =============================================================================
// ConceptV1 Card Props
// =============================================================================

export interface ConceptV1CardProps {
  /**
   * ConceptV1 데이터
   */
  concept: ConceptV1;

  /**
   * 선택 여부
   */
  isSelected?: boolean;

  /**
   * 선택 핸들러
   */
  onSelect?: () => void;

  /**
   * 확장형 표시 여부 (기본: false)
   */
  expanded?: boolean;
}

// =============================================================================
// ConceptV1 Card Component
// =============================================================================

export function ConceptV1Card({
  concept,
  isSelected = false,
  onSelect,
  expanded = false,
}: ConceptV1CardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        bg-white rounded-xl border-2 p-6
        transition-all duration-300
        ${onSelect ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
        ${isSelected
          ? 'border-purple-500 shadow-lg shadow-purple-100'
          : 'border-gray-200 hover:border-purple-300'
        }
      `}
    >
      {/* ========== 헤더 ========== */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            Concept v{concept.version}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
            {concept.mode}
          </span>
          {concept.meta.status === 'active' && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
              ✓ Active
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {concept.name}
        </h3>
        <p className="text-sm text-gray-500">{concept.topic}</p>
      </div>

      {/* ========== 고객 인사이트 ========== */}
      <div className="mb-5">
        <p className="text-xs text-gray-500 font-medium mb-2">💡 고객 인사이트</p>
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
          <p className="text-sm text-amber-900 italic">
            "{concept.audience_insight}"
          </p>
        </div>
      </div>

      {/* ========== 핵심 약속 ========== */}
      <div className="mb-5">
        <p className="text-xs text-gray-500 font-medium mb-2">🎯 핵심 약속 (Core Promise)</p>
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
          <p className="text-base font-semibold text-purple-900">
            {concept.core_promise}
          </p>
        </div>
      </div>

      {/* ========== 브랜드 역할 ========== */}
      <div className="mb-5">
        <p className="text-xs text-gray-500 font-medium mb-2">🏷️ 브랜드 역할</p>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
          {concept.brand_role}
        </p>
      </div>

      {/* ========== 믿을 수 있는 이유 ========== */}
      {concept.reason_to_believe.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-500 font-medium mb-2">
            ✅ 믿을 수 있는 이유 (Reason to Believe)
          </p>
          <ul className="space-y-2">
            {concept.reason_to_believe.map((rtb, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                <span>{rtb}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ========== 크리에이티브 장치 ========== */}
      <div className="mb-5">
        <p className="text-xs text-gray-500 font-medium mb-2">
          🎨 크리에이티브 장치 (Creative Device)
        </p>
        <div className="bg-pink-50 border border-pink-100 rounded-lg p-3">
          <p className="text-sm text-pink-900 font-medium">
            {concept.creative_device}
          </p>
        </div>
      </div>

      {/* ========== 훅 패턴 ========== */}
      {concept.hook_patterns.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-500 font-medium mb-2">
            🪝 훅 패턴 (Hook Patterns)
          </p>
          <div className="flex flex-wrap gap-2">
            {concept.hook_patterns.map((hook, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-100"
              >
                "{hook}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ========== 비주얼 세계관 ========== */}
      <div className="mb-5">
        <p className="text-xs text-gray-500 font-medium mb-2">
          🎨 비주얼 세계관 (Visual World)
        </p>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          {/* 색상 팔레트 설명 */}
          <div>
            <p className="text-xs text-gray-500 mb-1">색상 팔레트</p>
            <p className="text-sm text-gray-700">{concept.visual_world.color_palette}</p>
          </div>

          {/* HEX 색상 */}
          {concept.visual_world.hex_colors.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">HEX 코드</p>
              <div className="flex flex-wrap gap-2">
                {concept.visual_world.hex_colors.map((hex, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-200"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                    <span className="text-xs text-gray-600 font-mono">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 사진 스타일 */}
          <div>
            <p className="text-xs text-gray-500 mb-1">사진 스타일</p>
            <p className="text-sm text-gray-700">{concept.visual_world.photo_style}</p>
          </div>

          {/* 레이아웃 모티프 */}
          {concept.visual_world.layout_motifs.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">레이아웃 모티프</p>
              <div className="flex flex-wrap gap-1.5">
                {concept.visual_world.layout_motifs.map((motif, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600"
                  >
                    {motif}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== 채널 전략 ========== */}
      {expanded && (
        <div className="mb-5">
          <p className="text-xs text-gray-500 font-medium mb-2">
            📺 채널별 전략 (Channel Strategy)
          </p>
          <div className="space-y-3">
            {concept.channel_strategy.shorts && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs text-red-600 font-medium mb-1">🎬 Shorts</p>
                <p className="text-sm text-red-900">{concept.channel_strategy.shorts}</p>
              </div>
            )}
            {concept.channel_strategy.instagram_news && (
              <div className="bg-pink-50 border border-pink-100 rounded-lg p-3">
                <p className="text-xs text-pink-600 font-medium mb-1">📸 Instagram</p>
                <p className="text-sm text-pink-900">{concept.channel_strategy.instagram_news}</p>
              </div>
            )}
            {concept.channel_strategy.product_detail && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">📄 상세페이지</p>
                <p className="text-sm text-blue-900">{concept.channel_strategy.product_detail}</p>
              </div>
            )}
            {concept.channel_strategy.presentation && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <p className="text-xs text-purple-600 font-medium mb-1">📊 프레젠테이션</p>
                <p className="text-sm text-purple-900">{concept.channel_strategy.presentation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== 가드레일 ========== */}
      {expanded && (concept.guardrails.avoid_claims.length > 0 || concept.guardrails.must_include.length > 0) && (
        <div className="mb-5">
          <p className="text-xs text-gray-500 font-medium mb-2">
            🚨 가드레일 (Guardrails)
          </p>
          <div className="space-y-3">
            {/* 피해야 할 표현 */}
            {concept.guardrails.avoid_claims.length > 0 && (
              <div>
                <p className="text-xs text-red-600 font-medium mb-1.5">❌ 피해야 할 표현</p>
                <div className="flex flex-wrap gap-1.5">
                  {concept.guardrails.avoid_claims.map((claim, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                    >
                      {claim}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 반드시 포함할 메시지 */}
            {concept.guardrails.must_include.length > 0 && (
              <div>
                <p className="text-xs text-green-600 font-medium mb-1.5">✅ 반드시 포함</p>
                <div className="flex flex-wrap gap-1.5">
                  {concept.guardrails.must_include.map((msg, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200"
                    >
                      {msg}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== 기존 호환 필드 ========== */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500 w-20 shrink-0">타깃</span>
          <span className="text-sm text-gray-700">{concept.target_audience}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500 w-20 shrink-0">톤앤매너</span>
          <span className="text-sm text-gray-700">{concept.tone_and_manner}</span>
        </div>
        {concept.keywords.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0">키워드</span>
            <div className="flex flex-wrap gap-1">
              {concept.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Compact ConceptV1 Card (Pages 탭용)
// =============================================================================

export interface CompactConceptV1CardProps {
  concept: ConceptV1;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function CompactConceptV1Card({
  concept,
  isSelected = false,
  onSelect,
}: CompactConceptV1CardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        bg-white rounded-lg border p-3
        transition-all duration-200 cursor-pointer
        hover:shadow-md
        ${isSelected
          ? 'border-purple-500 shadow-md shadow-purple-100'
          : 'border-gray-200 hover:border-purple-300'
        }
      `}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
          v{concept.version}
        </span>
        {concept.meta.status === 'active' && (
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
            ✓
          </span>
        )}
      </div>

      {/* 컨셉명 */}
      <h4 className="text-sm font-bold text-gray-900 mb-1">
        {concept.name}
      </h4>

      {/* 핵심 약속 */}
      <p className="text-xs text-purple-700 mb-2 line-clamp-2">
        {concept.core_promise}
      </p>

      {/* 타깃 */}
      <p className="text-xs text-gray-500">
        {concept.target_audience}
      </p>
    </div>
  );
}

export default ConceptV1Card;
