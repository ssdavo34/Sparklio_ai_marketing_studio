/**
 * AdCopy Output Component
 *
 * AI가 생성한 광고 카피를 사용자 친화적으로 표시
 * - 필드 레이블 한글화
 * - 글자 수 표시 및 길이 초과 경고
 * - 미리보기 기능
 * - 편집 기능
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-23
 * @reference TEAM_TODOS_2025-11-23.md P0-1
 */

'use client';

import React, { useState } from 'react';
import { Check, AlertTriangle, Eye, Edit2, Copy, Download } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

/**
 * AdCopySimpleOutputV2 스키마
 * @reference TASK_SCHEMA_CATALOG_V2.md
 */
export interface AdCopySimpleOutputV2 {
  headline: string;
  subheadline: string;
  body: string;
  bullets: string[];
  cta: string;
  tone_used?: string;
  primary_benefit?: string;
}

/**
 * 필드 제약 조건
 */
interface FieldConstraints {
  maxLength: number;
  minLength?: number;
  label: string;
  description: string;
}

const FIELD_CONSTRAINTS: Record<string, FieldConstraints> = {
  headline: {
    maxLength: 20,
    minLength: 5,
    label: '헤드라인',
    description: '제품의 핵심 메시지',
  },
  subheadline: {
    maxLength: 30,
    minLength: 10,
    label: '서브헤드라인',
    description: '헤드라인을 보완하는 설명',
  },
  body: {
    maxLength: 80,
    minLength: 20,
    label: '본문',
    description: '상세 설명 및 부연',
  },
  cta: {
    maxLength: 20,
    minLength: 3,
    label: '행동 유도 문구',
    description: '사용자 행동을 유도하는 버튼 텍스트',
  },
};

// ============================================================================
// Component Props
// ============================================================================

export interface AdCopyOutputProps {
  /** 생성된 광고 카피 데이터 */
  adCopy: AdCopySimpleOutputV2;

  /** 편집 가능 여부 */
  editable?: boolean;

  /** 편집 완료 콜백 */
  onEdit?: (updatedAdCopy: AdCopySimpleOutputV2) => void;

  /** Canvas에 적용 콜백 */
  onApplyToCanvas?: (adCopy: AdCopySimpleOutputV2) => void;

  /** 복사 콜백 */
  onCopy?: (adCopy: AdCopySimpleOutputV2) => void;

  /** 다운로드 콜백 */
  onDownload?: (adCopy: AdCopySimpleOutputV2) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function AdCopyOutput({
  adCopy,
  editable = false,
  onEdit,
  onApplyToCanvas,
  onCopy,
  onDownload,
}: AdCopyOutputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [editedCopy, setEditedCopy] = useState(adCopy);

  const handleSaveEdit = () => {
    onEdit?.(editedCopy);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedCopy(adCopy);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">생성된 광고 카피</h3>
          {adCopy.tone_used && (
            <p className="text-xs text-gray-500 mt-0.5">
              톤: <span className="font-medium">{adCopy.tone_used}</span>
              {adCopy.primary_benefit && ` · 주요 혜택: ${adCopy.primary_benefit}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`p-2 rounded-md transition-colors ${
              isPreview
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={isPreview ? '편집 모드' : '미리보기'}
          >
            {isPreview ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Copy */}
          {onCopy && (
            <button
              onClick={() => onCopy(adCopy)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              title="복사"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {/* Download */}
          {onDownload && (
            <button
              onClick={() => onDownload(adCopy)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              title="다운로드"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isPreview ? (
          <PreviewMode adCopy={editedCopy} />
        ) : (
          <>
            {/* Headline */}
            <FieldCard
              field="headline"
              value={isEditing ? editedCopy.headline : adCopy.headline}
              isEditing={isEditing}
              onChange={(value) => setEditedCopy({ ...editedCopy, headline: value })}
            />

            {/* Subheadline */}
            <FieldCard
              field="subheadline"
              value={isEditing ? editedCopy.subheadline : adCopy.subheadline}
              isEditing={isEditing}
              onChange={(value) => setEditedCopy({ ...editedCopy, subheadline: value })}
            />

            {/* Body */}
            <FieldCard
              field="body"
              value={isEditing ? editedCopy.body : adCopy.body}
              isEditing={isEditing}
              onChange={(value) => setEditedCopy({ ...editedCopy, body: value })}
              multiline
            />

            {/* Bullets */}
            <BulletsCard
              bullets={isEditing ? editedCopy.bullets : adCopy.bullets}
              isEditing={isEditing}
              onChange={(bullets) => setEditedCopy({ ...editedCopy, bullets })}
            />

            {/* CTA */}
            <FieldCard
              field="cta"
              value={isEditing ? editedCopy.cta : adCopy.cta}
              isEditing={isEditing}
              onChange={(value) => setEditedCopy({ ...editedCopy, cta: value })}
            />
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleCancelEdit}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              저장
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            {editable && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                수정
              </button>
            )}
            {onApplyToCanvas && (
              <button
                onClick={() => onApplyToCanvas(adCopy)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Canvas에 적용
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FieldCard Component
// ============================================================================

interface FieldCardProps {
  field: keyof typeof FIELD_CONSTRAINTS;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
}

function FieldCard({ field, value, isEditing, onChange, multiline = false }: FieldCardProps) {
  const constraints = FIELD_CONSTRAINTS[field];
  const currentLength = value.length;
  const isOverLength = currentLength > constraints.maxLength;
  const isUnderLength = constraints.minLength && currentLength < constraints.minLength;

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-700 uppercase">
          {constraints.label}
        </label>
        <div className="flex items-center gap-2">
          {/* Length indicator */}
          <span
            className={`text-xs font-medium ${
              isOverLength
                ? 'text-red-600'
                : isUnderLength
                  ? 'text-yellow-600'
                  : 'text-gray-500'
            }`}
          >
            {currentLength}/{constraints.maxLength}자
          </span>

          {/* Status icon */}
          {isOverLength ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <Check className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 mb-2">{constraints.description}</p>

      {/* Input/Display */}
      {isEditing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${
              isOverLength
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
            }`}
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${
              isOverLength
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
            }`}
          />
        )
      ) : (
        <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-900">
          {value}
        </div>
      )}

      {/* Warning */}
      {isOverLength && (
        <p className="text-xs text-red-600 mt-1">
          ⚠️ 길이 초과! 텍스트를 {currentLength - constraints.maxLength}자 줄여주세요.
        </p>
      )}
      {isUnderLength && (
        <p className="text-xs text-yellow-600 mt-1">
          ⚠️ 최소 {constraints.minLength}자 이상 입력해주세요.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// BulletsCard Component
// ============================================================================

interface BulletsCardProps {
  bullets: string[];
  isEditing: boolean;
  onChange: (bullets: string[]) => void;
}

function BulletsCard({ bullets, isEditing, onChange }: BulletsCardProps) {
  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = value;
    onChange(newBullets);
  };

  const handleAddBullet = () => {
    onChange([...bullets, '']);
  };

  const handleRemoveBullet = (index: number) => {
    const newBullets = bullets.filter((_, i) => i !== index);
    onChange(newBullets);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-700 uppercase">
          주요 특징
        </label>
        <span className="text-xs text-gray-500">{bullets.length}개 항목</span>
      </div>

      <p className="text-xs text-gray-500 mb-2">제품의 주요 특징 및 장점</p>

      {/* Bullets list */}
      <ul className="space-y-2">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-purple-600 mt-1">•</span>
            {isEditing ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => handleBulletChange(index, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={`특징 ${index + 1}`}
                />
                <button
                  onClick={() => handleRemoveBullet(index)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  삭제
                </button>
              </div>
            ) : (
              <span className="flex-1 text-sm text-gray-900">{bullet}</span>
            )}
          </li>
        ))}
      </ul>

      {/* Add button */}
      {isEditing && (
        <button
          onClick={handleAddBullet}
          className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          + 특징 추가
        </button>
      )}
    </div>
  );
}

// ============================================================================
// PreviewMode Component
// ============================================================================

function PreviewMode({ adCopy }: { adCopy: AdCopySimpleOutputV2 }) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setViewMode('desktop')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'desktop'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          데스크톱
        </button>
        <button
          onClick={() => setViewMode('mobile')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'mobile'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          모바일
        </button>
      </div>

      {/* Preview Container */}
      <div
        className={`mx-auto border border-gray-300 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white shadow-inner ${
          viewMode === 'desktop' ? 'max-w-2xl' : 'max-w-sm'
        }`}
      >
        {/* Headline */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{adCopy.headline}</h1>

        {/* Subheadline */}
        <p className="text-lg text-gray-600 mb-4">{adCopy.subheadline}</p>

        {/* Body */}
        <p className="text-gray-700 mb-6">{adCopy.body}</p>

        {/* Bullets */}
        {adCopy.bullets.length > 0 && (
          <ul className="space-y-2 mb-6">
            {adCopy.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span className="text-gray-700">{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA Button */}
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg">
          {adCopy.cta}
        </button>
      </div>
    </div>
  );
}
