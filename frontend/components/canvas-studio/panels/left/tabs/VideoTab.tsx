/**
 * Video Tab (영상)
 *
 * 영상 콘텐츠 생성 및 관리 탭
 * - Video6 파이프라인 연동 (쇼츠/릴스 영상)
 * - 프로모션 영상
 *
 * @author C팀 (Frontend Team)
 * @version 1.1
 * @date 2025-11-30
 */

'use client';

import { Video, Plus, Play, Clock, Sparkles } from 'lucide-react';
import { useVideo6ModalStore } from '../../../stores/useVideo6ModalStore';

export function VideoTab() {
  const openVideo6Modal = useVideo6ModalStore((state) => state.openModal);

  return (
    <div className="flex flex-col h-full p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <Video className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-semibold text-neutral-800">영상</h2>
      </div>

      {/* 설명 */}
      <p className="text-sm text-neutral-600 mb-6">
        AI 기반 영상 콘텐츠를 생성합니다. 쇼츠, 릴스, 프로모션 영상 등 다양한 포맷을 지원합니다.
      </p>

      {/* 새 영상 만들기 버튼 */}
      <button
        onClick={openVideo6Modal}
        className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">새 영상 만들기</span>
      </button>

      {/* 영상 타입 선택 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">영상 타입</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={openVideo6Modal}
            className="p-3 border border-neutral-200 rounded-lg hover:border-red-300 hover:bg-red-50 text-left transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Play className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium">쇼츠/릴스</span>
            </div>
            <p className="text-xs text-neutral-500">15-60초 세로 영상</p>
          </button>
          <button className="p-3 border border-neutral-200 rounded-lg hover:border-red-300 hover:bg-red-50 text-left opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium">프로모션</span>
            </div>
            <p className="text-xs text-neutral-500">30초-2분 가로 영상 (준비중)</p>
          </button>
        </div>
      </div>

      {/* 생성된 영상 목록 */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">생성된 영상</h3>
        <div className="p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50 text-center">
          <Plus className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
          <p className="text-xs text-neutral-500">아직 생성된 영상이 없습니다</p>
          <button
            onClick={openVideo6Modal}
            className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium"
          >
            첫 영상 만들기 →
          </button>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="mt-auto pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500">
          💡 영상 생성은 백그라운드에서 진행되며, 완료 시 알림을 받을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
