/**
 * Dashboard Page
 *
 * Main dashboard for Sparklio workspace
 * Shows projects, recent documents, and quick actions
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Layout/Navigation';
import Footer from '@/components/Layout/Footer';
import {
  Plus,
  Folder,
  FileText,
  Sparkles,
  Users,
  TrendingUp,
  Clock,
  Star,
  Search,
  Filter,
  Grid3x3,
  List,
  MoreVertical
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  thumbnail?: string;
  updatedAt: string;
  mode: string;
  pages: number;
  starred: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - will be replaced with actual data from backend
  const projects: Project[] = [
    {
      id: '1',
      title: 'Nike Air Max Campaign',
      thumbnail: undefined,
      updatedAt: '2 hours ago',
      mode: 'presentation',
      pages: 12,
      starred: true,
    },
    {
      id: '2',
      title: 'Summer Sale Social Posts',
      thumbnail: undefined,
      updatedAt: 'Yesterday',
      mode: 'social',
      pages: 8,
      starred: false,
    },
    {
      id: '3',
      title: 'Q4 Marketing Strategy',
      thumbnail: undefined,
      updatedAt: '3 days ago',
      mode: 'document',
      pages: 24,
      starred: true,
    },
  ];

  const recentDocuments = [
    { id: '1', title: 'Product Launch Slides', type: 'presentation', updatedAt: '1 hour ago' },
    { id: '2', title: 'Instagram Story Set', type: 'social', updatedAt: '2 hours ago' },
    { id: '3', title: 'Brand Guidelines', type: 'document', updatedAt: '5 hours ago' },
  ];

  const quickActions = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Spark Chat',
      description: 'Create with AI',
      color: 'from-blue-500 to-cyan-500',
      path: '/spark',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Meeting AI',
      description: 'Generate from meeting',
      color: 'from-purple-500 to-pink-500',
      path: '/meeting',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Studio',
      description: 'Design from scratch',
      color: 'from-green-500 to-emerald-500',
      path: '/studio',
    },
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back to Sparklio</p>
            </div>
            <button
              onClick={() => router.push('/studio')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => router.push(action.path)}
                className="group relative overflow-hidden bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 text-left"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.color} text-white mb-4`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded ${
                    view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded ${
                    view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Projects Grid/List */}
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/studio?project=${project.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                    <FileText className="w-12 h-12 text-gray-400" />
                    {project.starred && (
                      <div className="absolute top-3 right-3">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {project.pages} pages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {project.updatedAt}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer ${
                    index !== projects.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  onClick={() => router.push(`/studio?project=${project.id}`)}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                      {project.starred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-500">
                      {project.pages} pages · {project.updatedAt}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Documents */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {recentDocuments.map((doc, index) => (
              <div
                key={doc.id}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer ${
                  index !== recentDocuments.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => router.push(`/studio?doc=${doc.id}`)}
              >
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                  <p className="text-sm text-gray-500 capitalize">{doc.type}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                  {doc.updatedAt}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Overview */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Projects Created</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">48</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Documents Generated</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">AI Generations</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">+24%</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">Productivity</p>
            </div>
          </div>
        </section>
      </div>
    </div>
    <Footer />
    </>
  );
}
