/**
 * Image Tab (이미지)
 *
 * AI 이미지 생성 및 관리 탭
 * - 배너 이미지
 * - 제품 이미지
 * - 일러스트레이션
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-30
 */

'use client';

import { Image, Plus, Wand2, Palette } from 'lucide-react';

export function ImageTab() {
  return (
    <div className="flex flex-col h-full p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <Image className="w-5 h-5 text-green-500" />
        <h2 className="text-lg font-semibold text-neutral-800">이미지</h2>
      </div>

      {/* 설명 */}
      <p className="text-sm text-neutral-600 mb-6">
        AI 기반 이미지를 생성합니다. 브랜드 스타일에 맞춘 다양한 비주얼 에셋을 만들 수 있습니다.
      </p>

      {/* 이미지 타입 선택 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">이미지 타입</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-3 border border-neutral-200 rounded-lg hover:border-green-300 hover:bg-green-50 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium">AI 생성</span>
            </div>
            <p className="text-xs text-neutral-500">프롬프트 기반 생성</p>
          </button>
          <button className="p-3 border border-neutral-200 rounded-lg hover:border-green-300 hover:bg-green-50 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium">스타일 변환</span>
            </div>
            <p className="text-xs text-neutral-500">기존 이미지 스타일 적용</p>
          </button>
        </div>
      </div>

      {/* 사이즈 선택 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">사이즈</h3>
        <div className="flex gap-2">
          <button className="flex-1 py-2 px-3 text-xs border border-neutral-200 rounded hover:bg-neutral-50">
            1:1
          </button>
          <button className="flex-1 py-2 px-3 text-xs border border-neutral-200 rounded hover:bg-neutral-50">
            16:9
          </button>
          <button className="flex-1 py-2 px-3 text-xs border border-neutral-200 rounded hover:bg-neutral-50">
            9:16
          </button>
          <button className="flex-1 py-2 px-3 text-xs border border-neutral-200 rounded hover:bg-neutral-50">
            4:3
          </button>
        </div>
      </div>

      {/* 생성된 이미지 목록 */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">생성된 이미지</h3>
        <div className="p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50 text-center">
          <Plus className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
          <p className="text-xs text-neutral-500">아직 생성된 이미지가 없습니다</p>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="mt-auto pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500">
          💡 Brand Kit의 컬러와 스타일이 자동으로 적용됩니다.
        </p>
      </div>
    </div>
  );
}
