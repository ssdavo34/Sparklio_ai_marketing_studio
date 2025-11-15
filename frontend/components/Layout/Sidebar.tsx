'use client';

/**
 * Sidebar 컴포넌트
 *
 * 좌측 상단의 네비게이션 메뉴를 담당합니다.
 * - 브랜드/로고
 * - 메뉴 항목 (새로 만들기, 에디터, 에셋 등)
 */

interface SidebarProps {
  currentMode?: 'chat' | 'editor' | 'assets';
  onModeChange?: (mode: 'chat' | 'editor' | 'assets') => void;
}

export default function Sidebar({ currentMode = 'chat', onModeChange }: SidebarProps) {
  const menuItems = [
    { id: 'chat' as const, icon: '💬', label: '새로 만들기' },
    { id: 'editor' as const, icon: '✏️', label: '에디터' },
    { id: 'assets' as const, icon: '🖼️', label: '에셋' },
  ];

  return (
    <div className="border-b border-gray-200">
      {/* 브랜드 헤더 */}
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900">Sparklio Studio</h1>
        <p className="text-xs text-gray-500 mt-1">Chat-First One-Page Editor</p>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onModeChange?.(item.id)}
            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
              currentMode === item.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
