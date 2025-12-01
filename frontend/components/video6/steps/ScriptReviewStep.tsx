/**
 * Step 1: 스크립트 확인/수정 UI
 *
 * 상태: script_ready
 * - 씬별 스크립트, 자막 편집 가능
 * - "승인" 버튼 → POST /api/v1/video6/{id}/script/approve
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-01
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { SceneDraftV2, VideoPlanDraftV2 } from '@/types/video-pipeline-v2';

interface ScriptReviewStepProps {
  plan: VideoPlanDraftV2;
  onUpdateScene: (sceneIndex: number, updates: Partial<SceneDraftV2>) => void;
  onApprove: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * 개별 씬 편집 컴포넌트
 */
function SceneScriptEditor({
  scene,
  onUpdate,
  disabled,
}: {
  scene: SceneDraftV2;
  onUpdate: (updates: Partial<SceneDraftV2>) => void;
  disabled?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState(scene.script || '');
  const [editedCaption, setEditedCaption] = useState(scene.caption);

  const handleSave = () => {
    onUpdate({
      script: editedScript,
      caption: editedCaption,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedScript(scene.script || '');
    setEditedCaption(scene.caption);
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
            {scene.scene_index}
          </span>
          <span className="font-medium text-gray-900">
            씬 {scene.scene_index}
          </span>
          <span className="text-sm text-gray-500">
            ({scene.duration_sec}초)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              disabled={disabled}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              title="수정"
            >
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 콘텐츠 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 이미지 미리보기 (있는 경우) */}
          {scene.thumb_url && (
            <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={scene.thumb_url}
                alt={`씬 ${scene.scene_index}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {isEditing ? (
            <>
              {/* 스크립트 편집 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  스크립트
                </label>
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="이 씬의 내레이션/스크립트를 입력하세요..."
                />
              </div>

              {/* 자막(캡션) 편집 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  자막
                </label>
                <input
                  type="text"
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="화면에 표시될 자막..."
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
            </>
          ) : (
            <>
              {/* 스크립트 표시 */}
              {scene.script && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    스크립트
                  </span>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {scene.script}
                  </p>
                </div>
              )}

              {/* 자막 표시 */}
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  자막
                </span>
                <p className="mt-1 text-sm text-gray-900">
                  {scene.caption || '(자막 없음)'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ScriptReviewStep({
  plan,
  onUpdateScene,
  onApprove,
  isLoading,
  disabled,
}: ScriptReviewStepProps) {
  const handleUpdateScene = useCallback(
    (sceneIndex: number, updates: Partial<SceneDraftV2>) => {
      onUpdateScene(sceneIndex, updates);
    },
    [onUpdateScene]
  );

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
        <FileText className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-purple-900">스크립트 확인</h4>
          <p className="text-sm text-purple-700 mt-1">
            각 씬의 스크립트와 자막을 확인하고 필요시 수정해주세요.
            수정이 완료되면 "승인" 버튼을 눌러 다음 단계로 진행합니다.
          </p>
        </div>
      </div>

      {/* 전체 정보 */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-xs text-gray-500">총 씬 수</span>
          <p className="text-lg font-semibold text-gray-900">
            {plan.scenes.length}개
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">총 길이</span>
          <p className="text-lg font-semibold text-gray-900">
            {plan.total_duration_sec}초
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">음악 분위기</span>
          <p className="text-lg font-semibold text-gray-900">
            {plan.music_mood || '-'}
          </p>
        </div>
      </div>

      {/* 씬 목록 */}
      <div className="space-y-3">
        {plan.scenes.map((scene) => (
          <SceneScriptEditor
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
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              스크립트 승인
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ScriptReviewStep;
