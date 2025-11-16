/**
 * Context Menu
 *
 * 캔버스에서 우클릭 시 나타나는 컨텍스트 메뉴
 *
 * 메뉴 항목:
 * - Copy (Ctrl+C)
 * - Paste (Ctrl+V)
 * - Duplicate (Ctrl+D)
 * - Delete (Delete)
 * - Group (Ctrl+G)
 * - Ungroup (Ctrl+Shift+G)
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 */

'use client';

import { useEffect, useRef } from 'react';

export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  hasSelection: boolean;
}

interface MenuItem {
  label: string;
  shortcut: string;
  onClick: (() => void) | undefined;
  disabled?: boolean;
  divider?: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  hasSelection,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 항목 정의
  const menuItems: MenuItem[] = [
    {
      label: 'Copy',
      shortcut: 'Ctrl+C',
      onClick: onCopy,
      disabled: !hasSelection,
    },
    {
      label: 'Paste',
      shortcut: 'Ctrl+V',
      onClick: onPaste,
    },
    {
      label: 'Duplicate',
      shortcut: 'Ctrl+D',
      onClick: onDuplicate,
      disabled: !hasSelection,
      divider: true,
    },
    {
      label: 'Delete',
      shortcut: 'Delete',
      onClick: onDelete,
      disabled: !hasSelection,
      divider: true,
    },
    {
      label: 'Group',
      shortcut: 'Ctrl+G',
      onClick: onGroup,
      disabled: !hasSelection,
    },
    {
      label: 'Ungroup',
      shortcut: 'Ctrl+Shift+G',
      onClick: onUngroup,
      disabled: !hasSelection,
    },
  ];

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleItemClick = (onClick: (() => void) | undefined, disabled?: boolean) => {
    if (disabled || !onClick) return;
    onClick();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] rounded-md border border-neutral-200 bg-white shadow-lg"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="py-1">
        {menuItems.map((item, index) => (
          <div key={index}>
            <button
              onClick={() => handleItemClick(item.onClick, item.disabled)}
              disabled={item.disabled}
              className={`
                flex w-full items-center justify-between px-4 py-2 text-left text-sm
                ${
                  item.disabled
                    ? 'cursor-not-allowed text-neutral-400'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }
              `}
            >
              <span>{item.label}</span>
              <span className="ml-8 text-xs text-neutral-400">{item.shortcut}</span>
            </button>
            {item.divider && <div className="my-1 h-px bg-neutral-200" />}
          </div>
        ))}
      </div>
    </div>
  );
}
