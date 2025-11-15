import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation";
import Footer from "@/components/Layout/Footer";

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
      <body className="antialiased flex flex-col min-h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
