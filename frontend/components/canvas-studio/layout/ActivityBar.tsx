/**
 * Activity Bar
 *
 * 좌측에 위치한 세로 아이콘 바 (VSCode 스타일)
 * - 너비: 56px (고정)
 * - 배경: 다크 (bg-neutral-950)
 * - 텍스트: 흰색
 *
 * 기능:
 * - 작업 모드 전환 (Planning, Editor, Video, Admin)
 * - 활성 모드는 배경색 변경으로 표시
 * - Hover 시 툴팁 표시
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 */

'use client';

import { useEditorStore } from '../stores';
import type { StudioMode } from '../stores';

// 아이콘 컴포넌트 정의
const PlanningIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const EditorIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// 활동 목록 (v3.1 PRD 기준)
const ACTIVITIES: Array<{
  id: StudioMode;
  label: string;
  Icon: () => JSX.Element;
  shortcut: string;
  internalOnly?: boolean;
}> = [
    { id: 'planning', label: 'Planning (Concept Board)', Icon: PlanningIcon, shortcut: 'Ctrl+1' },
    { id: 'editor', label: 'Editor (Canvas Studio)', Icon: EditorIcon, shortcut: 'Ctrl+2' },
    { id: 'video', label: 'Video (Timeline Studio)', Icon: VideoIcon, shortcut: 'Ctrl+3' },
    { id: 'admin', label: 'Admin Studio', Icon: AdminIcon, shortcut: 'Ctrl+4', internalOnly: true },
  ];

export function ActivityBar() {
  const currentMode = useEditorStore((state) => state.currentMode);
  const setCurrentMode = useEditorStore((state) => state.setCurrentMode);

  // TODO: Feature Flag (INTERNAL_MODE) 체크 로직 추가 필요
  const isInternalMode = true; // 임시 하드코딩

  return (
    <nav className="flex w-14 flex-col border-r border-neutral-800 bg-neutral-950 text-neutral-100">
      {/* 활동 버튼 리스트 */}
      {ACTIVITIES.map((activity) => {
        if (activity.internalOnly && !isInternalMode) return null;

        const isActive = currentMode === activity.id;
        const Icon = activity.Icon;

        return (
          <button
            key={activity.id}
            onClick={() => setCurrentMode(activity.id)}
            className={`
              flex h-12 items-center justify-center
              transition-colors duration-200
              ${isActive
                ? 'bg-neutral-800 text-white border-l-2 border-blue-500'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 border-l-2 border-transparent'
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

      {/* 하단 여백 */}
      <div className="flex-1" />

      {/* 설정 버튼 (하단 고정) */}
      <button
        className="flex h-12 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
        title="Settings"
        aria-label="Settings"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </nav>
  );
}

