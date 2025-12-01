/**
 * Step 2: 이미지 확인/수정/재생성 UI
 *
 * 상태: images_ready
 * - 각 이미지 승인/거부 토글
 * - 거부 시 재생성 사유 입력
 * - "재생성" 버튼 → POST /api/v1/video6/{id}/images/regenerate
 * - "승인" 버튼 → POST /api/v1/video6/{id}/images/approve
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Image as ImageIcon,
  Check,
  X,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Loader2,
  Save,
  Download,
} from 'lucide-react';
import type { SceneDraftV2, VideoPlanDraftV2, ImageApprovalStatus } from '@/types/video-pipeline-v2';

// Backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

interface ImageReviewStepProps {
  plan: VideoPlanDraftV2;
  onUpdateScene: (sceneIndex: number, updates: Partial<SceneDraftV2>) => void;
  onRegenerate: (sceneIndices: number[], reasons: Record<number, string>) => void;
  onApprove: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * 개별 이미지 카드 컴포넌트
 */
function ImageCard({
  scene,
  onApprove,
  onReject,
  onSave,
  disabled,
}: {
  scene: SceneDraftV2;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onSave: () => Promise<void>;
  disabled?: boolean;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  // 이미지 저장 핸들러
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
      setSavedUrl(scene.image_url || '');
    } catch (error) {
      console.error('[ImageCard] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 이미지 다운로드 핸들러
  const handleDownload = () => {
    const imageUrl = scene.preview_url || scene.thumb_url || scene.image_url;
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `scene_${scene.scene_index}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isApproved = scene.image_approval_status === 'approved';
  const isRejected = scene.image_approval_status === 'rejected';
  const isRegenerating = scene.image_approval_status === 'regenerating';

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  return (
    <div
      className={`relative border-2 rounded-lg overflow-hidden transition-all ${
        isApproved
          ? 'border-green-500 bg-green-50'
          : isRejected
          ? 'border-red-500 bg-red-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* 이미지 */}
      <div className="aspect-video bg-gray-100 relative">
        {scene.thumb_url || scene.preview_url || scene.image_url ? (
          <img
            src={scene.preview_url || scene.thumb_url || scene.image_url}
            alt={`씬 ${scene.scene_index}`}
            className={`w-full h-full object-cover ${
              isRegenerating ? 'opacity-50' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* 재생성 중 오버레이 */}
        {isRegenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <span className="text-sm font-medium">재생성 중...</span>
            </div>
          </div>
        )}

        {/* 씬 번호 뱃지 */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
          씬 {scene.scene_index}
        </div>

        {/* 상태 뱃지 */}
        {isApproved && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded flex items-center gap-1">
            <Check className="w-3 h-3" />
            승인됨
          </div>
        )}
        {isRejected && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded flex items-center gap-1">
            <X className="w-3 h-3" />
            재생성 요청
          </div>
        )}
      </div>

      {/* 정보 및 액션 */}
      <div className="p-3 space-y-3">
        {/* 자막 */}
        <p className="text-sm text-gray-700 line-clamp-2">
          {scene.caption || '(자막 없음)'}
        </p>

        {/* 재생성 시도 횟수 */}
        {scene.generation_attempts > 0 && (
          <p className="text-xs text-gray-500">
            재생성 시도: {scene.generation_attempts}회
          </p>
        )}

        {/* 거부 사유 표시 */}
        {isRejected && scene.regenerate_reason && (
          <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
            사유: {scene.regenerate_reason}
          </div>
        )}

        {/* 거부 사유 입력 */}
        {showRejectInput && (
          <div className="space-y-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="재생성 사유를 입력하세요..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                재생성 요청
              </button>
              <button
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason('');
                }}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 승인/거부 버튼 */}
        {!showRejectInput && !isRegenerating && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              disabled={disabled || isApproved}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                isApproved
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              {isApproved ? '승인됨' : '승인'}
            </button>
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={disabled || isRejected}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                isRejected
                  ? 'bg-red-100 text-red-700 cursor-default'
                  : 'border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              {isRejected ? '재생성 대기' : '재생성'}
            </button>
          </div>
        )}

        {/* 저장/다운로드 버튼 (이미지가 있을 때만 표시) */}
        {(scene.preview_url || scene.thumb_url || scene.image_url) && !isRegenerating && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={isSaving || !!savedUrl}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${
                savedUrl
                  ? 'bg-blue-100 text-blue-700 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  저장 중...
                </>
              ) : savedUrl ? (
                <>
                  <Check className="w-3 h-3" />
                  저장됨
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  저장
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3 h-3" />
              다운로드
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ImageReviewStep({
  plan,
  onUpdateScene,
  onRegenerate,
  onApprove,
  isLoading,
  disabled,
}: ImageReviewStepProps) {
  // 거부된 씬 목록
  const rejectedScenes = plan.scenes.filter(
    (s) => s.image_approval_status === 'rejected'
  );

  // 모든 씬이 승인되었는지 확인
  const allApproved = plan.scenes.every(
    (s) => s.image_approval_status === 'approved'
  );

  // 승인/거부 통계
  const approvedCount = plan.scenes.filter(
    (s) => s.image_approval_status === 'approved'
  ).length;

  const handleApproveScene = useCallback(
    (sceneIndex: number) => {
      onUpdateScene(sceneIndex, { image_approval_status: 'approved' });
    },
    [onUpdateScene]
  );

  const handleRejectScene = useCallback(
    (sceneIndex: number, reason: string) => {
      onUpdateScene(sceneIndex, {
        image_approval_status: 'rejected',
        regenerate_reason: reason,
      });
    },
    [onUpdateScene]
  );

  const handleRegenerateAll = () => {
    const reasons: Record<number, string> = {};
    rejectedScenes.forEach((scene) => {
      if (scene.regenerate_reason) {
        reasons[scene.scene_index] = scene.regenerate_reason;
      }
    });
    onRegenerate(
      rejectedScenes.map((s) => s.scene_index),
      reasons
    );
  };

  // 이미지 저장 핸들러 (MinIO에 업로드)
  const handleSaveImage = useCallback(async (scene: SceneDraftV2) => {
    const imageUrl = scene.preview_url || scene.thumb_url || scene.image_url;
    if (!imageUrl) {
      throw new Error('No image URL to save');
    }

    console.log('[ImageReviewStep] Saving image to MinIO:', imageUrl.substring(0, 80));

    try {
      // 이미지 fetch
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const blob = await imageResponse.blob();

      // FormData 생성
      const formData = new FormData();
      const fileName = `scene_${scene.scene_index}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: blob.type || 'image/png' });

      formData.append('file', file);
      formData.append('brand_id', '550e8400-e29b-41d4-a716-446655440000'); // 기본 brand_id
      formData.append('user_id', '550e8400-e29b-41d4-a716-446655440001'); // 기본 user_id
      formData.append('asset_type', 'image');
      formData.append('source', 'video6_scene_image');
      formData.append('tags', `scene_${scene.scene_index},video6,generated`);

      const uploadResponse = await fetch(`${BACKEND_API_URL}/api/v1/assets/`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('[ImageReviewStep] Image saved:', uploadResult);

      return uploadResult;
    } catch (error) {
      console.error('[ImageReviewStep] Save failed:', error);
      throw error;
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
        <ImageIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-purple-900">이미지 확인</h4>
          <p className="text-sm text-purple-700 mt-1">
            생성된 이미지를 확인하고 승인하거나 재생성을 요청해주세요.
            모든 이미지가 승인되면 다음 단계로 진행할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 진행 상황 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-sm text-gray-500">승인 현황</span>
          <p className="text-lg font-semibold text-gray-900">
            {approvedCount} / {plan.scenes.length} 이미지 승인됨
          </p>
        </div>
        {rejectedScenes.length > 0 && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              {rejectedScenes.length}개 재생성 대기
            </span>
          </div>
        )}
      </div>

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {plan.scenes.map((scene) => (
          <ImageCard
            key={scene.scene_index}
            scene={scene}
            onApprove={() => handleApproveScene(scene.scene_index)}
            onReject={(reason) => handleRejectScene(scene.scene_index, reason)}
            onSave={() => handleSaveImage(scene)}
            disabled={disabled || isLoading}
          />
        ))}
      </div>

      {/* 하단 액션 */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        {/* 재생성 버튼 */}
        {rejectedScenes.length > 0 && (
          <button
            onClick={handleRegenerateAll}
            disabled={disabled || isLoading}
            className="px-4 py-2.5 border border-purple-300 text-purple-600 rounded-lg font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {rejectedScenes.length}개 이미지 재생성
          </button>
        )}

        {/* 승인 버튼 */}
        <button
          onClick={onApprove}
          disabled={disabled || isLoading || !allApproved}
          className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              이미지 승인
            </>
          )}
        </button>
      </div>

      {/* 모든 이미지 승인 안내 */}
      {!allApproved && (
        <p className="text-center text-sm text-gray-500">
          모든 이미지를 승인해야 다음 단계로 진행할 수 있습니다.
        </p>
      )}
    </div>
  );
}

export default ImageReviewStep;
