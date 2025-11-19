/**
 * Top Toolbar
 *
 * 상단 툴바
 * - 높이: 48px (고정)
 * - 배경: 다크 (bg-neutral-900)
 *
 * 역할:
 * - 글로벌 액션 (Undo, Redo, Save)
 * - 파일 이름 변경
 * - 브랜드 스위처 (Brand Kit 선택)
 * - 줌/뷰 컨트롤
 *
 * @author C팀 (Frontend Team)
 * @version 3.1
 */

'use client';

import { useEditorStore } from '../stores';

export function TopToolbar() {
  const isSaved = useEditorStore((state) => state.isSaved);
  const isSaving = useEditorStore((state) => state.isSaving);
  const document = useEditorStore((state) => state.document);
  const addObject = useEditorStore((state) => state.addObject);
  const addPage = useEditorStore((state) => state.addPage);
  const setDocument = useEditorStore((state) => state.setDocument);

  // 문서가 없으면 초기화
  const ensureDocument = () => {
    if (!document) {
      const newDoc = {
        id: 'doc-' + Date.now(),
        title: 'Untitled Design',
        mode: 'editor' as const,
        currentPageId: 'page-1',
        pages: [
          {
            id: 'page-1',
            title: 'Page 1',
            order: 0,
            width: 800,
            height: 600,
            objects: [],
          },
        ],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'User',
        },
      };
      setDocument(newDoc);
      return newDoc.pages[0].id;
    }
    return document.pages[0]?.id;
  };

  // 텍스트 추가
  const handleAddText = () => {
    const pageId = ensureDocument();
    if (!pageId) return;

    addObject(pageId, {
      id: 'text-' + Date.now(),
      type: 'text' as const,
      x: 100,
      y: 100,
      width: 200,
      text: '텍스트를 입력하세요',
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      align: 'left' as const,
    });
  };

  // 사각형 추가
  const handleAddRect = () => {
    const pageId = ensureDocument();
    if (!pageId) return;

    addObject(pageId, {
      id: 'rect-' + Date.now(),
      type: 'shape' as const,
      shapeType: 'rect' as const,
      x: 150,
      y: 150,
      width: 150,
      height: 100,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      cornerRadius: 8,
    });
  };

  // 원 추가
  const handleAddCircle = () => {
    const pageId = ensureDocument();
    if (!pageId) return;

    addObject(pageId, {
      id: 'circle-' + Date.now(),
      type: 'shape' as const,
      shapeType: 'circle' as const,
      x: 200,
      y: 200,
      radius: 60,
      fill: '#10b981',
      stroke: '#059669',
      strokeWidth: 2,
    });
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4">
      {/* 좌측: 로고 및 파일 정보 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-500">Sparklio</span>
          <span className="text-neutral-600">/</span>
          <span className="text-sm font-medium text-white">Untitled Design</span>
          <span className="text-xs text-neutral-500 ml-2">
            {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Unsaved'}
          </span>
        </div>
      </div>

      {/* 중앙: 객체 추가 버튼 */}
      <div className="flex items-center gap-2 bg-neutral-800 rounded p-1">
        <button
          className="px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 rounded flex items-center gap-1"
          title="텍스트 추가"
          onClick={handleAddText}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
          Text
        </button>
        <button
          className="px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 rounded flex items-center gap-1"
          title="사각형 추가"
          onClick={handleAddRect}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /></svg>
          Rect
        </button>
        <button
          className="px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 rounded flex items-center gap-1"
          title="원 추가"
          onClick={handleAddCircle}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Circle
        </button>
      </div>

      {/* 우측: 브랜드 스위처 및 사용자 */}
      <div className="flex items-center gap-4">
        <select className="bg-neutral-800 text-xs text-white border border-neutral-700 rounded px-2 py-1 outline-none focus:border-blue-500">
          <option>Sparklio Brand Kit</option>
          <option>Client A</option>
          <option>Client B</option>
        </select>
        <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded">
          Export
        </button>
      </div>
    </header>
  );
}
