/**
 * Workspace List Page
 *
 * 워크스페이스 목록 페이지
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.4.1
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, ExternalLink, Calendar } from 'lucide-react';
import { useWorkspaceStore } from '@/components/canvas-studio/stores';
import { getMockWorkspaces } from '@/lib/api/workspace-api';
import type { Workspace } from '@/types/workspace';

export default function WorkspaceListPage() {
  const router = useRouter();
  const {
    workspaces,
    setWorkspaces,
    setCurrentWorkspace,
    isLoading,
    setLoading,
  } = useWorkspaceStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // 워크스페이스 목록 로드
  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    try {
      setLoading(true);

      // TODO: Backend 준비되면 실제 API 호출로 교체
      // const data = await getWorkspaces();

      // Mock 데이터 사용
      const data = getMockWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleWorkspaceClick(workspace: Workspace) {
    setCurrentWorkspace(workspace);
    router.push(`/workspace/${workspace.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                SPARKLIO
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                AI 마케팅 스튜디오
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>새 워크스페이스</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            워크스페이스
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            브랜드별로 프로젝트를 관리하세요
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && workspaces.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Building2 className="w-16 h-16 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              워크스페이스가 없습니다
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              첫 워크스페이스를 만들어 시작하세요
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              워크스페이스 만들기
            </button>
          </div>
        )}

        {/* Workspace Grid */}
        {!isLoading && workspaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onClick={() => handleWorkspaceClick(workspace)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal (임시 - 다음 단계에서 구현) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              새 워크스페이스 만들기
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              워크스페이스 생성 폼은 다음 단계에서 구현됩니다.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub Components
// ============================================================================

interface WorkspaceCardProps {
  workspace: Workspace;
  onClick: () => void;
}

function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {workspace.name}
            </h3>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {workspace.industry}
          </p>

          {workspace.description && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {workspace.description}
            </p>
          )}

          {workspace.websiteUrl && (
            <a
              href={workspace.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{workspace.websiteUrl}</span>
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
        <Calendar className="w-3 h-3" />
        <span>
          생성일: {new Date(workspace.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </div>
  );
}
