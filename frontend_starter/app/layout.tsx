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
