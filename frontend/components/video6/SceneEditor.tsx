'use client';

import React from 'react';
import { GripVertical, Trash2, Image as ImageIcon, Sparkles, Clock } from 'lucide-react';
import type { SceneDraft } from '@/types/video-pipeline';
import { getSceneThumbUrl } from '@/types/video-pipeline';

interface SceneEditorProps {
  scene: SceneDraft;
  onUpdate: (updates: Partial<SceneDraft>) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  disabled?: boolean;
}

/**
 * Scene Editor
 *
 * 개별 씬을 편집하는 컴포넌트
 * - 이미지 표시/변경
 * - 캡션 편집
 * - 재생 시간 조절
 * - AI 이미지 생성 토글
 */
export function SceneEditor({
  scene,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  disabled = false,
}: SceneEditorProps) {
  return (
    <div className={`
      bg-white rounded-lg border border-gray-200 p-3 shadow-sm
      ${disabled ? 'opacity-60' : ''}
    `}>
      <div className="flex gap-3">
        {/* 드래그 핸들 & 순서 */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
            {scene.scene_index}
          </div>
          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          <div className="flex flex-col gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={disabled || isFirst}
              className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              ▲
            </button>
            <button
              onClick={onMoveDown}
              disabled={disabled || isLast}
              className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              ▼
            </button>
          </div>
        </div>

        {/* 썸네일 */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {getSceneThumbUrl(scene) ? (
            <img
              src={getSceneThumbUrl(scene)}
              alt={`Scene ${scene.scene_index}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : scene.generate_new_image ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-purple-500">
              <Sparkles className="w-6 h-6 mb-1" />
              <span className="text-[10px]">AI 생성</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* 편집 영역 */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* 캡션 */}
          <textarea
            value={scene.caption}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="이 씬의 자막을 입력하세요..."
            disabled={disabled}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
            rows={2}
          />

          {/* 하단 컨트롤 */}
          <div className="flex items-center gap-3">
            {/* 재생 시간 */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={scene.duration_sec}
                onChange={(e) => onUpdate({ duration_sec: Number(e.target.value) })}
                disabled={disabled}
                className="w-14 px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50"
              />
              <span className="text-xs text-gray-500">초</span>
            </div>

            {/* AI 생성 토글 */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scene.generate_new_image}
                onChange={(e) => onUpdate({ generate_new_image: e.target.checked })}
                disabled={disabled}
                className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-xs text-gray-600">AI 이미지 생성</span>
            </label>

            {/* 삭제 버튼 */}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={disabled}
                className="ml-auto p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
                title="씬 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* AI 생성 프롬프트 (토글 시 표시) */}
          {scene.generate_new_image && (
            <input
              type="text"
              value={scene.image_prompt || ''}
              onChange={(e) => onUpdate({ image_prompt: e.target.value })}
              placeholder="이미지 생성 프롬프트 (선택사항)"
              disabled={disabled}
              className="w-full px-2 py-1.5 text-xs border border-purple-200 bg-purple-50 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SceneEditor;
