'use client'

import { Project, ProjectStatus } from './VideoStudio'

interface GenerationPanelProps {
  project: Project
  onRender: () => void
  isLoading: boolean
}

export function GenerationPanel({ project, onRender, isLoading }: GenerationPanelProps) {
  const canGenerateImages = project.status === 'script_ready'
  const canRender = project.status === 'images_ready' || project.status === 'script_ready'
  const isCompleted = project.status === 'completed'

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">영상 생성</h3>

      <div className="space-y-4">
        {/* Step 1: Script */}
        <StepItem
          number={1}
          title="스크립트"
          description="AI가 영상 스크립트를 생성합니다"
          isCompleted={project.status !== 'idle' && project.status !== 'generating_script'}
          isActive={project.status === 'generating_script'}
        />

        {/* Step 2: Images */}
        <StepItem
          number={2}
          title="이미지 생성"
          description="각 씬에 맞는 이미지를 생성합니다"
          isCompleted={project.status === 'images_ready' || project.status === 'rendering' || isCompleted}
          isActive={project.status === 'generating_images'}
        />

        {/* Step 3: Video */}
        <StepItem
          number={3}
          title="영상 렌더링"
          description="TTS와 이미지로 최종 영상을 만듭니다"
          isCompleted={isCompleted}
          isActive={project.status === 'rendering'}
        />

        {/* Action Buttons */}
        <div className="pt-4 space-y-3">
          {canGenerateImages && (
            <button
              onClick={() => {}}
              disabled={isLoading}
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              이미지 생성하기
            </button>
          )}

          {canRender && (
            <button
              onClick={onRender}
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '렌더링 중...' : '영상 렌더링 시작'}
            </button>
          )}

          {isCompleted && project.video_url && (
            <a
              href={project.video_url}
              download
              className="block w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 text-center transition-colors"
            >
              영상 다운로드
            </a>
          )}
        </div>

        {/* Generation Options */}
        {canRender && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">생성 옵션</h4>

            <label className="flex items-center gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300"
              />
              <span>AI 영상 생성 사용 (Image-to-Video)</span>
            </label>

            <p className="mt-2 text-xs text-gray-400">
              * AI 영상 생성은 추가 시간이 소요됩니다
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StepItem({
  number,
  title,
  description,
  isCompleted,
  isActive
}: {
  number: number
  title: string
  description: string
  isCompleted: boolean
  isActive: boolean
}) {
  return (
    <div className="flex gap-4">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${isCompleted ? 'bg-green-500 text-white' : ''}
          ${isActive ? 'bg-primary-500 text-white animate-pulse' : ''}
          ${!isCompleted && !isActive ? 'bg-gray-200 text-gray-500' : ''}
        `}
      >
        {isCompleted ? '✓' : number}
      </div>
      <div className="flex-1">
        <h4 className={`font-medium ${isActive ? 'text-primary-600' : 'text-gray-900'}`}>
          {title}
        </h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}
