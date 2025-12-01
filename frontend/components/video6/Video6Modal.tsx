/**
 * Video6 Modal - 전체 화면 오버레이 모달
 *
 * Canva 스타일의 전체 화면 모달로 비디오 생성 플로우를 제공
 * - ESC 키로 닫기
 * - 배경 클릭으로 닫기 (렌더링 중에는 비활성화)
 * - 애니메이션 트랜지션
 *
 * V2 업데이트 (2025-12-01):
 * - useV2Flow prop으로 4단계 확인 플로우 지원
 * - Video6PanelV2 컴포넌트 연결
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-12-01
 */

'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Video6Panel } from './Video6Panel';
import { Video6PanelV2 } from './Video6PanelV2';

interface Video6ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** V2 4단계 확인 플로우 사용 여부 (기본: true) */
  useV2Flow?: boolean;
  /** 초기 프로젝트 ID (V2 전용) */
  projectId?: string;
}

export function Video6Modal({
  isOpen,
  onClose,
  useV2Flow = true,
  projectId,
}: Video6ModalProps) {
  // V1/V2 모드 토글 (개발용)
  const [isV2Mode, setIsV2Mode] = useState(useV2Flow);

  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  console.log('[Video6Modal] Rendering, isOpen:', isOpen);

  if (!isOpen) {
    console.log('[Video6Modal] isOpen is false, returning null');
    return null;
  }

  console.log('[Video6Modal] Rendering modal content');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] m-4 transition-all duration-300">
        <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* 헤더 영역 */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* V1/V2 모드 토글 (개발용) */}
            <button
              onClick={() => setIsV2Mode(!isV2Mode)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 shadow-md
                ${
                  isV2Mode
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              title={isV2Mode ? 'V2 (4단계 확인 플로우)' : 'V1 (기존 플로우)'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isV2Mode ? 'V2' : 'V1'}
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 bg-white/90 hover:bg-gray-100 rounded-full shadow-md transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Video Panel (V1 or V2) */}
          {isV2Mode ? (
            <Video6PanelV2
              onClose={onClose}
              projectId={projectId}
              className="flex-1"
            />
          ) : (
            <Video6Panel onClose={onClose} className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
}

export default Video6Modal;
