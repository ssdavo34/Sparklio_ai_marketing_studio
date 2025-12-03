/**
 * Empty State
 *
 * 이미지가 없을 때 표시되는 안내 컴포넌트
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-03
 */

'use client';

import { ImagePlus, MessageSquare, Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      {/* 아이콘 */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <ImagePlus className="w-10 h-10 text-green-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      {/* 제목 */}
      <h3 className="text-lg font-semibold text-neutral-800 mb-2">
        이미지를 생성해보세요
      </h3>

      {/* 설명 */}
      <p className="text-sm text-neutral-500 text-center mb-6 max-w-[200px]">
        오른쪽 채팅창에서 원하는 이미지를 설명하면 AI가 생성해드립니다.
      </p>

      {/* 사용 방법 */}
      <div className="space-y-3 text-xs text-neutral-600">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 font-medium">1</span>
          </div>
          <p>오른쪽 채팅창에 원하는 이미지 설명 입력</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 font-medium">2</span>
          </div>
          <p>AI가 프롬프트를 최적화하고 이미지 생성</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 font-medium">3</span>
          </div>
          <p>마음에 드는 이미지 선택 후 캔버스에 추가</p>
        </div>
      </div>

      {/* 예시 프롬프트 */}
      <div className="mt-6 p-3 bg-neutral-50 rounded-lg border border-neutral-200 w-full">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-medium text-neutral-500">예시 프롬프트</span>
        </div>
        <p className="text-xs text-neutral-600 italic">
          &quot;고급스러운 화장품 제품 사진, 대리석 배경, 스튜디오 조명&quot;
        </p>
      </div>
    </div>
  );
}
