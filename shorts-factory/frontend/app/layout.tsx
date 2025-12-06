import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shorts Factory - 숏폼 영상 생성 플랫폼',
  description: 'AI 기반 숏폼 영상 자동 생성 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
