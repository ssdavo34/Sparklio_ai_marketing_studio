/**
 * Detail Tab (상세페이지)
 *
 * 상세페이지 생성 및 관리 탭
 * - 제품/서비스 상세페이지 생성
 * - 랜딩페이지 템플릿
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-30
 */

'use client';

import { FileText, Plus, Layout, Image } from 'lucide-react';

export function DetailTab() {
  return (
    <div className="flex flex-col h-full p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-neutral-800">상세페이지</h2>
      </div>

      {/* 설명 */}
      <p className="text-sm text-neutral-600 mb-6">
        제품/서비스 상세페이지를 AI로 생성합니다. 콘셉트 보드의 내용을 기반으로 구성됩니다.
      </p>

      {/* 템플릿 선택 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">템플릿 선택</h3>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-3 border border-neutral-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left">
            <Layout className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-xs font-medium">제품 소개</p>
          </button>
          <button className="p-3 border border-neutral-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left">
            <Image className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-xs font-medium">서비스 랜딩</p>
          </button>
        </div>
      </div>

      {/* 생성된 상세페이지 목록 */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">생성된 상세페이지</h3>
        <div className="p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50 text-center">
          <Plus className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
          <p className="text-xs text-neutral-500">아직 생성된 상세페이지가 없습니다</p>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="mt-auto pt-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-500">
          💡 ConceptBoard에서 &quot;상세페이지 생성&quot;을 클릭하거나 여기서 직접 생성할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
