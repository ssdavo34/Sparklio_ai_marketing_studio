/**
 * Workspace Dashboard Page
 *
 * 워크스페이스 대시보드 - 프로젝트 관리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.4.2
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Folder,
  Settings,
  Palette,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Lightbulb,
  Archive,
} from 'lucide-react';
import { useWorkspaceStore, useProjectStore, useBrandStore } from '@/components/canvas-studio/stores';
import { getMockWorkspaces } from '@/lib/api/workspace-api';
import { getMockProjects } from '@/lib/api/project-api';
import { getMockBrandKit } from '@/lib/api/brand-api';
import type { Project, ProjectStatus } from '@/types/workspace';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/workspace';

const STATUS_ICONS: Record<ProjectStatus, any> = {
  idea: Lightbulb,
  planning: Clock,
  in_progress: TrendingUp,
  completed: CheckCircle2,
  archived: Archive,
};

export default function WorkspaceDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { projects, setProjects } = useProjectStore();
  const { brandKit, setBrandKit } = useBrandStore();

  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    loadDashboardData();
  }, [workspaceId]);

  async function loadDashboardData() {
    try {
      setIsLoading(true);

      // Mock 데이터 로드
      const workspaces = getMockWorkspaces();
      const workspace = workspaces.find((w) => w.id === workspaceId);

      if (workspace) {
        setCurrentWorkspace(workspace);
      }

      const projectsData = getMockProjects(workspaceId);
      setProjects(projectsData);

      const brandKitData = getMockBrandKit(workspaceId);
      setBrandKit(brandKitData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateProject() {
    // TODO: 프로젝트 생성 모달 열기
    alert('프로젝트 생성 기능은 다음 단계에서 구현됩니다');
  }

  function handleProjectClick(project: Project) {
    router.push(`/workspace/${workspaceId}/project/${project.id}`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">워크스페이스를 찾을 수 없습니다</p>
          <button
            onClick={() => router.push('/workspace')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            워크스페이스 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/workspace')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentWorkspace.name}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {currentWorkspace.industry}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/workspace/${workspaceId}/brand`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span className="text-sm">브랜드 키트</span>
              </button>
              <button
                onClick={handleCreateProject}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>새 프로젝트</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Folder}
            label="전체 프로젝트"
            value={projects.length}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={TrendingUp}
            label="진행 중"
            value={projects.filter((p) => p.status === 'in_progress').length}
            color="bg-yellow-50 text-yellow-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="완료"
            value={projects.filter((p) => p.status === 'completed').length}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            icon={Palette}
            label="브랜드 키트"
            value={brandKit ? '설정됨' : '미설정'}
            color="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Projects Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">프로젝트</h2>

          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Folder className="w-16 h-16 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                프로젝트가 없습니다
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                첫 프로젝트를 만들어 시작하세요
              </p>
              <button
                onClick={handleCreateProject}
                className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                프로젝트 만들기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 작업</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              icon={Palette}
              title="브랜드 키트 설정"
              description="로고, 컬러, 폰트 등 브랜드 정체성 정의"
              onClick={() => router.push(`/workspace/${workspaceId}/brand`)}
            />
            <QuickActionCard
              icon={Target}
              title="캠페인 브리프 작성"
              description="새로운 마케팅 캠페인 기획"
              onClick={handleCreateProject}
            />
            <QuickActionCard
              icon={Settings}
              title="워크스페이스 설정"
              description="워크스페이스 정보 수정"
              onClick={() => alert('설정 페이지는 다음 단계에서 구현됩니다')}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Sub Components
// ============================================================================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  const StatusIcon = STATUS_ICONS[project.status];
  const statusLabel = PROJECT_STATUS_LABELS[project.status];
  const statusColor = PROJECT_STATUS_COLORS[project.status];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>

        {project.targetDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{new Date(project.targetDate).toLocaleDateString('ko-KR')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickActionCard({ icon: Icon, title, description, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all text-left"
    >
      <Icon className="w-8 h-8 text-purple-600 mb-3" />
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
