/**
 * Activity Bar
 *
 * Tool selection sidebar (Canva-style)
 * - Width: 56px (fixed)
 * - Background: Dark
 * - Tool icons for Left Panel switching
 *
 * @author C Team (Frontend Team)
 * @version 3.1
 */

'use client';

import { useLeftPanelStore, type LeftPanelTab } from '../stores/useLeftPanelStore';
import { FileText, Plus, Type, Upload, Image as ImageIcon, Palette, Settings, HelpCircle } from 'lucide-react';

interface Tool {
  id: LeftPanelTab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: Tool[] = [
  { id: 'pages', label: 'Pages', Icon: FileText },
  { id: 'elements', label: 'Elements', Icon: Plus },
  { id: 'text', label: 'Text', Icon: Type },
  { id: 'upload', label: 'Upload', Icon: Upload },
  { id: 'photos', label: 'Photos', Icon: ImageIcon },
  { id: 'brandkit', label: 'Brand Kit', Icon: Palette },
];

export function ActivityBar() {
  const activeTab = useLeftPanelStore((state) => state.activeTab);
  const setActiveTab = useLeftPanelStore((state) => state.setActiveTab);

  return (
    <nav className="flex w-14 flex-col border-r border-neutral-800 bg-neutral-950 text-neutral-100">
      {/* Tool Buttons */}
      <div className="flex flex-col">
        {TOOLS.map((tool) => {
          const isActive = activeTab === tool.id;
          const Icon = tool.Icon;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className={`
                flex h-14 items-center justify-center
                transition-colors duration-200
                ${isActive
                  ? 'bg-neutral-800 text-white border-l-2 border-purple-500'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100 border-l-2 border-transparent'
                }
              `}
              title={tool.label}
              aria-label={tool.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Buttons */}
      <div className="flex flex-col">
        <button
          className="flex h-14 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
          title="Help"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          className="flex h-14 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
