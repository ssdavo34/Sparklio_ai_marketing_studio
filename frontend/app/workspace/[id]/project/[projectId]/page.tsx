/**
 * Project Detail Page
 *
 * 프로젝트 상세 페이지 - 브리프 & 생성된 콘텐츠 관리
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 * @reference FRONTEND_MVP_TODO_2025-11-24.md Phase 1.4
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Palette,
  Edit3,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  useWorkspaceStore,
  useProjectStore,
  useBriefStore,
  useBrandStore,
} from '@/components/canvas-studio/stores';
import { getMockProjects } from '@/lib/api/project-api';
import { getMockBrief } from '@/lib/api/brief-api';
import { getMockBrandKit } from '@/lib/api/brand-api';
import type { Brief } from '@/types/brief';
import { CHANNEL_TYPE_LABELS, CHANNEL_TYPE_ICONS } from '@/types/brief';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/workspace';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const projectId = params.projectId as string;

  const { currentWorkspace } = useWorkspaceStore();
  const { currentProject, setCurrentProject } = useProjectStore();
  const { brief, setBrief } = useBriefStore();
  const { brandKit, setBrandKit } = useBrandStore();

  const [isLoading, setIsLoading] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  async function loadProjectData() {
    try {
      setIsLoading(true);

      // Mock 데이터 로드
      const projects = getMockProjects(workspaceId);
      const project = projects.find((p) => p.id === projectId);

      if (project) {
        setCurrentProject(project);
      }

      // 브리프 로드
      const briefData = getMockBrief(projectId);
      setBrief(briefData);

      // 브랜드 키트 로드
      const brandKitData = getMockBrandKit(workspaceId);
      setBrandKit(brandKitData);

      // TODO: 생성된 콘텐츠 로드
      setGeneratedContent([]);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateBrief() {
    router.push(`/workspace/${workspaceId}/project/${projectId}/brief`);
  }

  function handleEditBrief() {
    router.push(`/workspace/${workspaceId}/project/${projectId}/brief`);
  }

  function handleGenerateContent() {
    router.push(`/workspace/${workspaceId}/project/${projectId}/generate`);
  }

  function handleOpenInEditor(contentId: string) {
    router.push(`/studio/v3?projectId=${projectId}&contentId=${contentId}`);
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

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">프로젝트를 찾을 수 없습니다</p>
          <button
            onClick={() => router.push(`/workspace/${workspaceId}`)}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            대시보드로 돌아가기
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
                onClick={() => router.push(`/workspace/${workspaceId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentProject.name}
                  </h1>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      PROJECT_STATUS_COLORS[currentProject.status]
                    }`}
                  >
                    {PROJECT_STATUS_LABELS[currentProject.status]}
                  </span>
                </div>
                {currentProject.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {currentProject.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {brief ? (
                <>
                  <button
                    onClick={handleEditBrief}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm">브리프 수정</span>
                  </button>
                  <button
                    onClick={handleGenerateContent}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>콘텐츠 생성</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreateBrief}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span>브리프 작성</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Brief Section */}
        {brief ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">캠페인 브리프</h2>
            </div>
            <BriefCard brief={brief} onEdit={handleEditBrief} />
          </div>
        ) : (
          <div className="mb-8 bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              브리프가 없습니다
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              캠페인 목표와 전략을 정의하는 브리프를 작성하세요
            </p>
            <button
              onClick={handleCreateBrief}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              브리프 작성하기
            </button>
          </div>
        )}

        {/* Generated Content Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">생성된 콘텐츠</h2>
            {generatedContent.length > 0 && (
              <button
                onClick={handleGenerateContent}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                + 더 생성하기
              </button>
            )}
          </div>

          {generatedContent.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                생성된 콘텐츠가 없습니다
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {brief
                  ? '브리프를 기반으로 AI가 콘텐츠를 생성합니다'
                  : '먼저 브리프를 작성해주세요'}
              </p>
              {brief && (
                <button
                  onClick={handleGenerateContent}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  콘텐츠 생성 시작
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedContent.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onEdit={() => handleOpenInEditor(content.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Sub Components
// ============================================================================

interface BriefCardProps {
  brief: Brief;
  onEdit: () => void;
}

function BriefCard({ brief, onEdit }: BriefCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">캠페인 목표</h4>
          <p className="text-sm text-gray-900">{brief.goal}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">타겟 오디언스</h4>
          <p className="text-sm text-gray-900">{brief.target}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">핵심 인사이트</h4>
          <p className="text-sm text-gray-900">{brief.insight}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">주요 메시지</h4>
          <ul className="space-y-1">
            {brief.keyMessages.map((msg, idx) => (
              <li key={idx} className="text-sm text-gray-900 flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">타겟 채널</h4>
          <div className="flex flex-wrap gap-2">
            {brief.channels.map((channel) => (
              <span
                key={channel}
                className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium"
              >
                <span>{CHANNEL_TYPE_ICONS[channel]}</span>
                <span>{CHANNEL_TYPE_LABELS[channel]}</span>
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">KPI</h4>
          <ul className="space-y-1">
            {brief.kpis.map((kpi, idx) => (
              <li key={idx} className="text-sm text-gray-900 flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>{kpi}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          최종 수정: {new Date(brief.updatedAt).toLocaleString('ko-KR')}
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>수정</span>
        </button>
      </div>
    </div>
  );
}

interface ContentCardProps {
  content: any;
  onEdit: () => void;
}

function ContentCard({ content, onEdit }: ContentCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-purple-300 hover:shadow-md transition-all">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <Palette className="w-12 h-12 text-purple-400" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{content.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{content.type}</p>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>편집</span>
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
