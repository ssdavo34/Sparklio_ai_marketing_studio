'use client'

import { Scene } from './VideoStudio'

interface VideoPreviewProps {
  scenes: Scene[]
  videoUrl?: string
}

export function VideoPreview({ scenes, videoUrl }: VideoPreviewProps) {
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration_seconds, 0)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">미리보기</h3>

      {/* Video Preview Area */}
      <div className="video-preview bg-gray-900 rounded-lg overflow-hidden mb-4">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm">영상 미리보기</p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>타임라인</span>
          <span>{totalDuration}초</span>
        </div>

        <div className="flex gap-1">
          {scenes.map((scene) => (
            <div
              key={scene.scene_number}
              className="h-8 bg-primary-100 rounded flex items-center justify-center text-xs text-primary-700 font-medium"
              style={{
                flex: scene.duration_seconds,
              }}
            >
              {scene.scene_number}
            </div>
          ))}
        </div>
      </div>

      {/* Scene Thumbnails */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {scenes.map((scene) => (
          <div
            key={scene.scene_number}
            className="aspect-[9/16] bg-gray-200 rounded overflow-hidden"
          >
            {scene.image_url ? (
              <img
                src={scene.image_url}
                alt={`Scene ${scene.scene_number}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                {scene.scene_number}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
