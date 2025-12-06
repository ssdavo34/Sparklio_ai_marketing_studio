'use client'

import { useState } from 'react'
import { ScriptEditor } from './ScriptEditor'
import { VideoPreview } from './VideoPreview'
import { GenerationPanel } from './GenerationPanel'

export type ProjectStatus =
  | 'idle'
  | 'generating_script'
  | 'script_ready'
  | 'generating_images'
  | 'images_ready'
  | 'rendering'
  | 'completed'
  | 'error'

export interface Scene {
  scene_number: number
  duration_seconds: number
  narration: string
  image_prompt: string
  motion_prompt: string
  text_overlay?: string
  image_url?: string
  video_url?: string
}

export interface Project {
  id: string
  title: string
  topic: string
  status: ProjectStatus
  scenes: Scene[]
  video_url?: string
}

export function VideoStudio() {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateProject = async (title: string, topic: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8001/api/v1/videos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          topic,
          duration_sec: 30,
          style: 'engaging',
          num_scenes: 5
        })
      })

      if (!response.ok) {
        throw new Error('프로젝트 생성 실패')
      }

      const data = await response.json()

      // 임시 프로젝트 데이터 (실제로는 서버에서 받아옴)
      setProject({
        id: data.id,
        title: title,
        topic: topic,
        status: 'script_ready',
        scenes: Array.from({ length: 5 }, (_, i) => ({
          scene_number: i + 1,
          duration_seconds: 6,
          narration: `씬 ${i + 1}의 나레이션입니다.`,
          image_prompt: `Scene ${i + 1}: Professional marketing visual`,
          motion_prompt: 'Gentle camera pan with subtle zoom',
          text_overlay: `포인트 ${i + 1}`
        }))
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateScene = (sceneIndex: number, updates: Partial<Scene>) => {
    if (!project) return

    setProject({
      ...project,
      scenes: project.scenes.map((scene, i) =>
        i === sceneIndex ? { ...scene, ...updates } : scene
      )
    })
  }

  const handleRender = async () => {
    if (!project) return

    setIsLoading(true)
    setProject({ ...project, status: 'rendering' })

    try {
      // TODO: 실제 렌더링 API 호출
      await new Promise(resolve => setTimeout(resolve, 3000))

      setProject({
        ...project,
        status: 'completed',
        video_url: 'https://example.com/video.mp4'
      })
    } catch (err) {
      setError('렌더링 실패')
      setProject({ ...project, status: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {!project ? (
        // 새 프로젝트 생성
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              새 영상 프로젝트 만들기
            </h2>

            <ProjectCreateForm
              onSubmit={handleCreateProject}
              isLoading={isLoading}
            />

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        // 프로젝트 에디터
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Script Editor */}
          <div className="col-span-2">
            <ScriptEditor
              scenes={project.scenes}
              onUpdateScene={handleUpdateScene}
              status={project.status}
            />
          </div>

          {/* Right: Preview & Controls */}
          <div className="space-y-6">
            <VideoPreview
              scenes={project.scenes}
              videoUrl={project.video_url}
            />

            <GenerationPanel
              project={project}
              onRender={handleRender}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 프로젝트 생성 폼
function ProjectCreateForm({
  onSubmit,
  isLoading
}: {
  onSubmit: (title: string, topic: string) => void
  isLoading: boolean
}) {
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title && topic) {
      onSubmit(title, topic)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          프로젝트 제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 신제품 소개 영상"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          영상 주제
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="어떤 내용의 영상을 만들고 싶으신가요?"
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !title || !topic}
        className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? '생성 중...' : '스크립트 생성하기'}
      </button>
    </form>
  )
}
