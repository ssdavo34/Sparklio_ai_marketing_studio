/**
 * Root Layout
 *
 * Main layout for Sparklio application
 * Navigation is included globally, but can be hidden on full-screen pages
 *
 * @author C팀 (Frontend Team)
 * @version 2.1
 * @date 2025-11-22
 */

import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// Noto Sans KR 폰트 로드 (한글 지원)
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "Sparklio AI Marketing Studio",
  description: "AI-powered marketing content creation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <head>
        {/* Google Fonts 추가 로드 (Polotno Canvas용) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
