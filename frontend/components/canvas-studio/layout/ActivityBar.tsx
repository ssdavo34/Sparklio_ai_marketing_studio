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

import { useEditorStore } from '../stores';
import type { StudioMode } from '../stores';

// 아이콘 컴포넌트 정의
const ConceptBoardIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const PitchDeckIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const ProductStoryIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

// 활동 목록 (P0에서 구현할 3가지만)
const ACTIVITIES: Array<{
  id: StudioMode;
  label: string;
  Icon: () => JSX.Element;
  shortcut: string;
}> = [
  { id: 'concept-board', label: 'Concept Board', Icon: ConceptBoardIcon, shortcut: 'Ctrl+1' },
  { id: 'pitch-deck', label: 'Pitch Deck', Icon: PitchDeckIcon, shortcut: 'Ctrl+2' },
  { id: 'product-story', label: 'Product Story', Icon: ProductStoryIcon, shortcut: 'Ctrl+3' },
  // P1에서 추가할 항목들
  // { id: 'brand-dna', label: 'Brand DNA', Icon: BrandDNAIcon, shortcut: 'Ctrl+4' },
  // { id: 'ad-studio', label: 'Ad Studio', Icon: AdStudioIcon, shortcut: 'Ctrl+5' },
];

export function ActivityBar() {
  // Zustand Store 사용 (Phase 2 완료!)
  const currentMode = useEditorStore((state) => state.currentMode);
  const setCurrentMode = useEditorStore((state) => state.setCurrentMode);

  return (
    <nav className="flex w-14 flex-col border-r border-neutral-800 bg-neutral-950 text-neutral-100">
      {/* 활동 버튼 리스트 */}
      {ACTIVITIES.map((activity) => {
        const isActive = currentMode === activity.id;
        const Icon = activity.Icon;

        return (
          <button
            key={activity.id}
            onClick={() => setCurrentMode(activity.id)}
            className={`
              flex h-12 items-center justify-center
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
            <Icon />
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
