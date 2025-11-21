/**
 * Root Layout
 *
 * Main layout for Sparklio application
 * Navigation is included globally, but can be hidden on full-screen pages
 *
 * @author C팀 (Frontend Team)
 * @version 2.0
 * @date 2025-11-21
 */

import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
