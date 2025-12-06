'use client'

import { useState } from 'react'
import { VideoStudio } from '@/components/video-studio/VideoStudio'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h1 className="text-xl font-bold text-gray-900">Shorts Factory</h1>
          </div>
          <div className="text-sm text-gray-500">
            AI 숏폼 영상 생성 플랫폼
          </div>
        </div>
      </header>

      {/* Main Content */}
      <VideoStudio />
    </main>
  )
}
