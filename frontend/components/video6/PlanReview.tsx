'use client';

import React from 'react';
import { Play, Clock, Music, Film, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { VideoPlanDraftV1, SceneDraft, VideoGenerationMode } from '@/types/video-pipeline';
import { SceneEditor } from './SceneEditor';

interface PlanReviewProps {
  plan: VideoPlanDraftV1;
  onUpdateScene: (sceneIndex: number, updates: Partial<SceneDraft>) => void;
  onDeleteScene?: (sceneIndex: number) => void;
  onReorderScene?: (fromIndex: number, toIndex: number) => void;
  onApprove: () => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const MODE_LABELS: Record<VideoGenerationMode, string> = {
  reuse: '기존 이미지 활용',
  hybrid: '하이브리드',
  creative: '새로 제작',
};

const MUSIC_MOOD_LABELS: Record<string, string> = {
  warm_lofi: '따뜻한 로파이',
  upbeat: '신나는',
  calm: '차분한',
  dramatic: '드라마틱',
  corporate: '비즈니스',
};

/**
 * Plan Review
 *
 * PLAN 단계 결과물을 검토하고 수정하는 컴포넌트
 * - 전체 플랜 요약
 * - 씬별 편집
 * - 렌더링 승인
 */
export function PlanReview({
  plan,
  onUpdateScene,
  onDeleteScene,
  onReorderScene,
  onApprove,
  onRegenerate,
  isLoading = false,
  disabled = false,
}: PlanReviewProps) {
  const totalDuration = plan.scenes.reduce((sum, s) => sum + s.duration_sec, 0);
  const aiGeneratedCount = plan.scenes.filter((s) => s.generate_new_image).length;
  const existingImageCount = plan.scenes.length - aiGeneratedCount;

  const handleMoveUp = (index: number) => {
    if (index > 0 && onReorderScene) {
      onReorderScene(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < plan.scenes.length - 1 && onReorderScene) {
      onReorderScene(index, index + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* 플랜 요약 카드 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">영상 플랜 요약</h3>
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-medium
            ${plan.script_status === 'approved'
              ? 'bg-green-100 text-green-700'
              : plan.script_status === 'user_edited'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {plan.script_status === 'approved' ? '승인됨' :
             plan.script_status === 'user_edited' ? '수정됨' : '초안'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 모드 */}
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">생성 모드</p>
              <p className="text-sm font-medium text-gray-900">
                {MODE_LABELS[plan.mode]}
              </p>
            </div>
          </div>

          {/* 총 재생 시간 */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">총 재생 시간</p>
              <p className="text-sm font-medium text-gray-900">
                {totalDuration}초 ({plan.scenes.length}개 씬)
              </p>
            </div>
          </div>

          {/* 음악 */}
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">배경 음악</p>
              <p className="text-sm font-medium text-gray-900">
                {MUSIC_MOOD_LABELS[plan.music_mood] || plan.music_mood}
              </p>
            </div>
          </div>

          {/* 이미지 현황 */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">이미지 현황</p>
              <p className="text-sm font-medium text-gray-900">
                기존 {existingImageCount}개 / AI생성 {aiGeneratedCount}개
              </p>
            </div>
          </div>
        </div>

        {/* AI 생성 비용 경고 */}
        {aiGeneratedCount > 0 && (
          <div className="mt-3 flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">
              AI 이미지 {aiGeneratedCount}개가 새로 생성됩니다.
              추가 비용이 발생할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* 씬 목록 */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">씬 편집</h4>

        {plan.scenes.map((scene, index) => (
          <SceneEditor
            key={scene.scene_index}
            scene={scene}
            onUpdate={(updates) => onUpdateScene(scene.scene_index, updates)}
            onDelete={onDeleteScene ? () => onDeleteScene(scene.scene_index) : undefined}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            isFirst={index === 0}
            isLast={index === plan.scenes.length - 1}
            disabled={disabled || isLoading}
          />
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={disabled || isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            플랜 다시 생성
          </button>
        )}

        <button
          onClick={onApprove}
          disabled={disabled || isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Play className="w-4 h-4" />
          {isLoading ? '처리 중...' : '렌더링 시작'}
        </button>
      </div>
    </div>
  );
}

export default PlanReview;
