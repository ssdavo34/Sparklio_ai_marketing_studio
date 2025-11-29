/**
 * Video6 Modal - 전체 화면 오버레이 모달
 *
 * Canva 스타일의 전체 화면 모달로 비디오 생성 플로우를 제공
 * - ESC 키로 닫기
 * - 배경 클릭으로 닫기 (렌더링 중에는 비활성화)
 * - 애니메이션 트랜지션
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-29
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Video6Panel } from './Video6Panel';

interface Video6ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Video6Modal({ isOpen, onClose }: Video6ModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] m-4 animate-slideUp">
        <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* 닫기 버튼 (고정 위치) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-gray-100 rounded-full shadow-md transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Video6Panel */}
          <Video6Panel onClose={onClose} className="flex-1" />
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Video6Modal;
