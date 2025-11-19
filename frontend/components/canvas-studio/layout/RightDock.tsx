/**
 * Right Dock
 *
 * 우측 Dock (VSCode의 우측 패널과 유사)
 * - 너비: 360px (기본값, 리사이즈 가능)
 * - 배경: 다크 (bg-neutral-900)
 *
 * 역할:
 * - 선택된 객체의 속성 편집 (Properties)
 * - Brand Kit 패널 (색상, 폰트)
 * - Spark Chat (AI Co-pilot) 인터페이스
 * - Export / Publish 설정
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 */

'use client';

import { useState } from 'react';
import { PropertiesPanel } from '../components/PropertiesPanel';

type RightDockTab = 'properties' | 'chat' | 'brand';

export function RightDock() {
  const [activeTab, setActiveTab] = useState<RightDockTab>('properties');

  return (
    <aside className="flex w-[360px] flex-col border-l border-neutral-800 bg-neutral-900">
      {/* 탭 헤더 (Properties / Chat / Brand) */}
      <div className="flex h-9 items-center border-b border-neutral-800 px-2">
        <button
          onClick={() => setActiveTab('properties')}
          className={`px-3 py-1 text-xs font-medium rounded-t-sm ${
            activeTab === 'properties'
              ? 'text-white bg-neutral-800'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1 text-xs font-medium rounded-t-sm ${
            activeTab === 'chat'
              ? 'text-white bg-neutral-800'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Spark Chat
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`px-3 py-1 text-xs font-medium rounded-t-sm ${
            activeTab === 'brand'
              ? 'text-white bg-neutral-800'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Brand Kit
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'properties' && <PropertiesPanel />}
        {activeTab === 'chat' && (
          <div className="flex h-full flex-col items-center justify-center text-neutral-500">
            <svg className="w-16 h-16 mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm font-medium">Spark Chat</p>
            <p className="text-xs mt-1 text-neutral-600">AI Co-pilot (Phase 3)</p>
          </div>
        )}
        {activeTab === 'brand' && (
          <div className="flex h-full flex-col items-center justify-center text-neutral-500">
            <svg className="w-16 h-16 mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <p className="text-sm font-medium">Brand Kit</p>
            <p className="text-xs mt-1 text-neutral-600">브랜드 컬러 & 폰트 (Phase 2.5)</p>
          </div>
        )}
      </div>
    </aside>
  );
}
