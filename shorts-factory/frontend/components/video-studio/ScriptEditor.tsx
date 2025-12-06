'use client'

import { Scene, ProjectStatus } from './VideoStudio'

interface ScriptEditorProps {
  scenes: Scene[]
  onUpdateScene: (index: number, updates: Partial<Scene>) => void
  status: ProjectStatus
}

export function ScriptEditor({ scenes, onUpdateScene, status }: ScriptEditorProps) {
  const isEditable = status === 'script_ready' || status === 'images_ready'

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">스크립트 편집</h2>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-4">
        {scenes.map((scene, index) => (
          <SceneCard
            key={scene.scene_number}
            scene={scene}
            index={index}
            onUpdate={(updates) => onUpdateScene(index, updates)}
            isEditable={isEditable}
          />
        ))}
      </div>
    </div>
  )
}

function SceneCard({
  scene,
  index,
  onUpdate,
  isEditable
}: {
  scene: Scene
  index: number
  onUpdate: (updates: Partial<Scene>) => void
  isEditable: boolean
}) {
  return (
    <div className="border rounded-lg p-4 hover:border-primary-500 transition-colors">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
          {scene.scene_number}
        </div>
        <div className="flex-1">
          <span className="text-sm text-gray-500">
            {scene.duration_seconds}초
          </span>
        </div>
        {scene.image_url && (
          <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
            <img
              src={scene.image_url}
              alt={`Scene ${scene.scene_number}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* 나레이션 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            나레이션
          </label>
          <textarea
            value={scene.narration}
            onChange={(e) => onUpdate({ narration: e.target.value })}
            disabled={!isEditable}
            rows={2}
            className="w-full px-3 py-2 text-sm border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* 이미지 프롬프트 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            이미지 프롬프트
          </label>
          <input
            type="text"
            value={scene.image_prompt}
            onChange={(e) => onUpdate({ image_prompt: e.target.value })}
            disabled={!isEditable}
            className="w-full px-3 py-2 text-sm border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* 텍스트 오버레이 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            화면 텍스트
          </label>
          <input
            type="text"
            value={scene.text_overlay || ''}
            onChange={(e) => onUpdate({ text_overlay: e.target.value })}
            disabled={!isEditable}
            className="w-full px-3 py-2 text-sm border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const statusConfig = {
    idle: { label: '대기', color: 'bg-gray-100 text-gray-700' },
    generating_script: { label: '스크립트 생성 중', color: 'bg-yellow-100 text-yellow-700' },
    script_ready: { label: '스크립트 완료', color: 'bg-green-100 text-green-700' },
    generating_images: { label: '이미지 생성 중', color: 'bg-yellow-100 text-yellow-700' },
    images_ready: { label: '이미지 완료', color: 'bg-green-100 text-green-700' },
    rendering: { label: '렌더링 중', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '완료', color: 'bg-green-100 text-green-700' },
    error: { label: '오류', color: 'bg-red-100 text-red-700' },
  }

  const config = statusConfig[status]

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
