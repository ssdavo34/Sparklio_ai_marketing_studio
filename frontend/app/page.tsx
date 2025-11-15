'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import ChatPanel from '@/components/Chat/ChatPanel';
import Inspector from '@/components/Editor/Inspector';
import EditorCanvas from '@/components/Editor/EditorCanvas';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';
import { useAuthStore } from '@/store/auth-store';
import { useEditorStore } from '@/store/editor-store';
import { saveDocument } from '@/lib/api-client';

/**
 * Sparklio V4.3 - Main Application (SPA)
 *
 * 중요: 이것은 단일 페이지 애플리케이션입니다!
 * - 모든 기능이 이 페이지에서 작동합니다
 * - Chat, Editor, Inspector가 동시에 표시됩니다
 * - 페이지 전환 없이 상태 기반 UI 전환
 *
 * 레이아웃:
 * - 좌측: Sidebar + Chat Panel
 * - 중앙: Editor Canvas (Fabric.js)
 * - 우측: Inspector Panel
 */
export default function SparklioCoreApp() {
  const [currentMode, setCurrentMode] = useState<'chat' | 'editor' | 'assets'>('chat');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated, isLoading, initAuth, user, logout } = useAuthStore();
  const { undo, redo, history, historyIndex, currentDocument } = useEditorStore();

  // 문서 저장 핸들러
  const handleSave = async () => {
    if (!currentDocument) {
      alert('저장할 문서가 없습니다.');
      return;
    }

    try {
      const result = await saveDocument(currentDocument.documentId, {
        documentJson: currentDocument,
        metadata: {
          saved_at: new Date().toISOString(),
          app_version: 'v2.0',
        },
      });

      alert(`문서가 저장되었습니다! (버전: ${result.version})`);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('문서 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 앱 시작 시 인증 상태 초기화
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 키보드 단축키 (Ctrl+Z, Ctrl+Y, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z: Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          undo();
        }
      }
      // Ctrl+Y or Ctrl+Shift+Z: Redo
      else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          redo();
        }
      }
      // Ctrl+S: Save
      else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (currentDocument) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, historyIndex, history.length, currentDocument, handleSave]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 - Auth 화면 표시
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        {authMode === 'login' ? (
          <LoginForm
            onSuccess={() => {
              // 로그인 성공 시 메인 앱으로 자동 전환
            }}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={() => {
              // 회원가입 성공 시 메인 앱으로 자동 전환
            }}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </div>
    );
  }

  // 로그인된 경우 - 메인 앱 표시
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 좌측: Sidebar + 패널 */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full">
        <Sidebar currentMode={currentMode} onModeChange={setCurrentMode} />

        {/* 모드별 패널 표시 */}
        {currentMode === 'chat' && <ChatPanel />}
        {currentMode === 'editor' && (
          <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
            <div className="text-center">
              <p className="text-sm font-medium">에디터 모드</p>
              <p className="text-xs mt-1">Chat에서 문서를 생성하면 중앙 캔버스에 표시됩니다</p>
            </div>
          </div>
        )}
        {currentMode === 'assets' && (
          <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
            <div className="text-center">
              <p className="text-sm font-medium">에셋 관리</p>
              <p className="text-xs mt-1">업로드한 이미지와 자산을 관리합니다</p>
            </div>
          </div>
        )}
      </div>

      {/* 중앙: Editor Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">새 문서</span>
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Undo
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Redo
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 사용자 정보 */}
            <div className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700">
              <span>👤</span>
              <span>{user?.username || user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              로그아웃
            </button>
            <button
              onClick={handleSave}
              disabled={!currentDocument}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              저장
            </button>
            <button
              onClick={() => {
                const canvas = useEditorStore.getState().canvas;
                if (canvas) {
                  const dataURL = canvas.toDataURL({
                    format: 'png',
                    quality: 1,
                    multiplier: 2,
                  });
                  const link = document.createElement('a');
                  link.download = `sparklio-design-${Date.now()}.png`;
                  link.href = dataURL;
                  link.click();
                }
              }}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <EditorCanvas />
      </div>

      {/* 우측: Inspector Panel */}
      <Inspector />
    </div>
  );
}
