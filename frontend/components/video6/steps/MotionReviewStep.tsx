/**
 * Step 3: 모션 프롬프트 확인/수정 UI
 *
 * 상태: motion_ready
 * - 각 씬의 모션 프롬프트 표시 (영문 + 한글)
 * - 직접 수정 가능
 * - "승인" 버튼 → POST /api/v1/video6/{id}/motion/approve
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Wand2, Edit2, Check, X, Play, Video, Loader2 } from 'lucide-react';
import type { SceneDraftV2, VideoPlanDraftV2 } from '@/types/video-pipeline-v2';

interface MotionReviewStepProps {
  plan: VideoPlanDraftV2;
  onUpdateScene: (sceneIndex: number, updates: Partial<SceneDraftV2>) => void;
  onApprove: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * 개별 모션 프롬프트 편집 카드
 */
function MotionPromptCard({
  scene,
  onUpdate,
  disabled,
}: {
  scene: SceneDraftV2;
  onUpdate: (updates: Partial<SceneDraftV2>) => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPromptEn, setEditedPromptEn] = useState(scene.motion_prompt || '');
  const [editedPromptKo, setEditedPromptKo] = useState(scene.motion_prompt_ko || '');
  const [useAiVideo, setUseAiVideo] = useState(scene.use_ai_video);

  const handleSave = () => {
    onUpdate({
      motion_prompt: editedPromptEn,
      motion_prompt_ko: editedPromptKo,
      use_ai_video: useAiVideo,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPromptEn(scene.motion_prompt || '');
    setEditedPromptKo(scene.motion_prompt_ko || '');
    setUseAiVideo(scene.use_ai_video);
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
      {/* 이미지 미리보기 */}
      <div className="flex gap-4 p-4">
        {/* 썸네일 */}
        <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {scene.thumb_url || scene.preview_url ? (
            <img
              src={scene.thumb_url || scene.preview_url}
              alt={`씬 ${scene.scene_index}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                {scene.scene_index}
              </span>
              <span className="font-medium text-gray-900">
                씬 {scene.scene_index}
              </span>
              <span className="text-xs text-gray-500">
                ({scene.duration_sec}초)
              </span>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                disabled={disabled}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                title="수정"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* 자막 */}
          <p className="text-sm text-gray-600 line-clamp-1 mb-2">
            {scene.caption}
          </p>

          {/* AI 영상 토글 */}
          {isEditing && (
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={useAiVideo}
                onChange={(e) => setUseAiVideo(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">AI 영상 생성 사용</span>
            </label>
          )}

          {/* 모션 프롬프트 */}
          {isEditing ? (
            <div className="space-y-3">
              {/* 영문 프롬프트 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Motion Prompt (EN)
                </label>
                <textarea
                  value={editedPromptEn}
                  onChange={(e) => setEditedPromptEn(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono"
                  placeholder="Gentle zoom in, slow pan left to right..."
                />
              </div>

              {/* 한글 프롬프트 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  모션 프롬프트 (한글 설명)
                </label>
                <textarea
                  value={editedPromptKo}
                  onChange={(e) => setEditedPromptKo(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="부드럽게 확대, 왼쪽에서 오른쪽으로 천천히 패닝..."
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* AI 영상 여부 */}
              <div className="flex items-center gap-1.5">
                {scene.use_ai_video ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs text-purple-600 font-medium">
                      AI 영상
                    </span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">정적 이미지</span>
                  </>
                )}
              </div>

              {/* 영문 프롬프트 */}
              {scene.motion_prompt && (
                <div className="bg-gray-50 px-3 py-2 rounded text-xs font-mono text-gray-600">
                  {scene.motion_prompt}
                </div>
              )}

              {/* 한글 설명 */}
              {scene.motion_prompt_ko && (
                <p className="text-xs text-gray-500">
                  {scene.motion_prompt_ko}
                </p>
              )}

              {/* 모션 프롬프트 없음 */}
              {!scene.motion_prompt && !scene.use_ai_video && (
                <p className="text-xs text-gray-400 italic">
                  모션 프롬프트 없음 (정적 이미지 사용)
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MotionReviewStep({
  plan,
  onUpdateScene,
  onApprove,
  isLoading,
  disabled,
}: MotionReviewStepProps) {
  const handleUpdateScene = useCallback(
    (sceneIndex: number, updates: Partial<SceneDraftV2>) => {
      onUpdateScene(sceneIndex, updates);
    },
    [onUpdateScene]
  );

  // AI 영상 사용 씬 수
  const aiVideoCount = plan.scenes.filter((s) => s.use_ai_video).length;

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
        <Wand2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-purple-900">모션 프롬프트 확인</h4>
          <p className="text-sm text-purple-700 mt-1">
            각 씬의 모션 효과를 확인하고 필요시 수정해주세요.
            AI 영상을 사용하면 더 역동적인 효과를 얻을 수 있지만 비용이 발생합니다.
          </p>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-xs text-gray-500">총 씬 수</span>
          <p className="text-lg font-semibold text-gray-900">
            {plan.scenes.length}개
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">AI 영상 사용</span>
          <p className="text-lg font-semibold text-purple-600">
            {aiVideoCount}개
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">정적 이미지</span>
          <p className="text-lg font-semibold text-gray-600">
            {plan.scenes.length - aiVideoCount}개
          </p>
        </div>
      </div>

      {/* 씬 목록 */}
      <div className="space-y-3">
        {plan.scenes.map((scene) => (
          <MotionPromptCard
            key={scene.scene_index}
            scene={scene}
            onUpdate={(updates) => handleUpdateScene(scene.scene_index, updates)}
            disabled={disabled || isLoading}
          />
        ))}
      </div>

      {/* 승인 버튼 */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onApprove}
          disabled={disabled || isLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              모션 승인
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default MotionReviewStep;
