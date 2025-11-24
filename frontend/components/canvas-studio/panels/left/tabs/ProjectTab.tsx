/**
 * Project Tab
 *
 * Displays current project context:
 * - Project info
 * - Brief summary
 * - Brand kit preview
 * - Quick actions
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-24
 */

'use client';

import { useWorkspaceStore, useProjectStore, useBriefStore, useBrandStore } from '../../../stores';
import { FolderOpen, FileText, Palette, Target, Calendar, CheckCircle2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CHANNEL_TYPE_LABELS, CHANNEL_TYPE_ICONS } from '@/types/brief';
import type { ProjectStatus } from '@/types/workspace';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/workspace';

export function ProjectTab() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const { currentProject } = useProjectStore();
  const { brief } = useBriefStore();
  const { brandKit } = useBrandStore();

  if (!currentProject || !currentWorkspace) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Project</h2>
          <p className="text-xs text-gray-500 mt-1">No project selected</p>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-2">No Project Selected</h3>
          <p className="text-xs text-gray-500 mb-4">
            Select a project from the workspace to start working
          </p>
          <button
            onClick={() => router.push('/workspace')}
            className="px-4 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Workspaces
          </button>
        </div>
      </div>
    );
  }

  const statusColor = PROJECT_STATUS_COLORS[currentProject.status as ProjectStatus];
  const statusLabel = PROJECT_STATUS_LABELS[currentProject.status as ProjectStatus];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Project Context</h2>
        <p className="text-xs text-gray-500 mt-1">{currentWorkspace.name}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Project Info */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">{currentProject.name}</h3>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          {currentProject.description && (
            <p className="text-xs text-gray-700 mb-3">{currentProject.description}</p>
          )}

          {currentProject.targetDate && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Due: {new Date(currentProject.targetDate).toLocaleDateString('ko-KR')}</span>
            </div>
          )}

          <button
            onClick={() => router.push(`/workspace/${currentWorkspace.id}/project/${currentProject.id}`)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-purple-600 text-xs font-medium rounded-lg border border-purple-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>View Full Project</span>
          </button>
        </div>

        {/* Brief Summary */}
        {brief ? (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-700">Campaign Brief</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Goal</p>
                <p className="text-xs text-gray-900 line-clamp-2">{brief.goal}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Target Audience</p>
                <p className="text-xs text-gray-900 line-clamp-2">{brief.target}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Key Messages</p>
                <ul className="space-y-1">
                  {brief.keyMessages.slice(0, 2).map((msg, idx) => (
                    <li key={idx} className="text-xs text-gray-900 flex items-start gap-1">
                      <span className="text-purple-600">•</span>
                      <span className="line-clamp-1">{msg}</span>
                    </li>
                  ))}
                  {brief.keyMessages.length > 2 && (
                    <li className="text-xs text-gray-500">+{brief.keyMessages.length - 2} more</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Channels</p>
                <div className="flex flex-wrap gap-1">
                  {brief.channels.map((channel) => (
                    <span
                      key={channel}
                      className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
                    >
                      <span>{CHANNEL_TYPE_ICONS[channel]}</span>
                      <span>{CHANNEL_TYPE_LABELS[channel]}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-600 mb-3">No brief created</p>
            <button
              onClick={() => router.push(`/workspace/${currentWorkspace.id}/project/${currentProject.id}/brief`)}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Brief
            </button>
          </div>
        )}

        {/* Brand Kit Preview */}
        {brandKit ? (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-700">Brand Kit</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Brand Colors</p>
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded border border-gray-200"
                    style={{ backgroundColor: brandKit.primaryColor }}
                    title={`Primary: ${brandKit.primaryColor}`}
                  />
                  {brandKit.secondaryColor && (
                    <div
                      className="w-8 h-8 rounded border border-gray-200"
                      style={{ backgroundColor: brandKit.secondaryColor }}
                      title={`Secondary: ${brandKit.secondaryColor}`}
                    />
                  )}
                  {brandKit.accentColor && (
                    <div
                      className="w-8 h-8 rounded border border-gray-200"
                      style={{ backgroundColor: brandKit.accentColor }}
                      title={`Accent: ${brandKit.accentColor}`}
                    />
                  )}
                </div>
              </div>

              {brandKit.toneKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Tone</p>
                  <div className="flex flex-wrap gap-1">
                    {brandKit.toneKeywords.slice(0, 3).map((tone, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tone}
                      </span>
                    ))}
                    {brandKit.toneKeywords.length > 3 && (
                      <span className="px-2 py-0.5 text-gray-500 text-xs">
                        +{brandKit.toneKeywords.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push(`/workspace/${currentWorkspace.id}/brand`)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 transition-colors"
            >
              <Palette className="w-3 h-3" />
              <span>Manage Brand Kit</span>
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 text-center">
            <Palette className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-600 mb-3">No brand kit</p>
            <button
              onClick={() => router.push(`/workspace/${currentWorkspace.id}/brand`)}
              className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
            >
              Create Brand Kit
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push(`/workspace/${currentWorkspace.id}/project/${currentProject.id}/generate`)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Target className="w-3 h-3" />
              <span>Generate Content</span>
            </button>
            <button
              onClick={() => router.push(`/workspace/${currentWorkspace.id}`)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>View All Projects</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
