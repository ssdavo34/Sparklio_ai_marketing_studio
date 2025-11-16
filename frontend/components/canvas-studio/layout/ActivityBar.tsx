/**
 * Activity Bar
 *
 * 좌측에 위치한 세로 아이콘 바 (VSCode 스타일)
 * - 너비: 56px (고정)
 * - 배경: 다크 (bg-neutral-950)
 * - 텍스트: 흰색
 *
 * 기능:
 * - 작업 모드 전환 (Concept Board, Pitch Deck, Product Story 등)
 * - 활성 모드는 배경색 변경으로 표시
 * - Hover 시 툴팁 표시 (나중에 추가)
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

'use client';

import { useState } from 'react';

// 활동 목록 (P0에서 구현할 3가지만)
const ACTIVITIES = [
  { id: 'concept-board', label: 'Concept Board', icon: 'C', shortcut: 'Ctrl+1' },
  { id: 'pitch-deck', label: 'Pitch Deck', icon: 'D', shortcut: 'Ctrl+2' },
  { id: 'product-story', label: 'Product Story', icon: 'P', shortcut: 'Ctrl+3' },
  // P1에서 추가할 항목들
  // { id: 'brand-dna', label: 'Brand DNA', icon: 'B', shortcut: 'Ctrl+4' },
  // { id: 'ad-studio', label: 'Ad Studio', icon: 'A', shortcut: 'Ctrl+5' },
] as const;

export function ActivityBar() {
  // TODO: Phase 2에서 useEditorStore로 변경
  const [activeActivity, setActiveActivity] = useState<string>('concept-board');

  return (
    <nav className="flex w-14 flex-col border-r border-neutral-800 bg-neutral-950 text-neutral-100">
      {/* 활동 버튼 리스트 */}
      {ACTIVITIES.map((activity) => {
        const isActive = activeActivity === activity.id;

        return (
          <button
            key={activity.id}
            onClick={() => setActiveActivity(activity.id)}
            className={`
              flex h-12 items-center justify-center
              text-xl font-bold
              transition-colors duration-200
              ${
                isActive
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100'
              }
            `}
            title={`${activity.label} (${activity.shortcut})`}
            aria-label={activity.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {activity.icon}
          </button>
        );
      })}

      {/* 하단 여백 (flex-1로 빈 공간 채움) */}
      <div className="flex-1" />

      {/* 설정 버튼 (하단 고정) */}
      <button
        className="flex h-12 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
        title="Settings"
        aria-label="Settings"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </nav>
  );
}
