'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';
import { CanvasStudioShell } from '@/components/canvas-studio/CanvasStudioShell';
import { useAuthStore } from '@/store/auth-store';

/**
 * Sparklio V5.0 - Main Application
 *
 * Canvas Studio 통합 완료 (2025-11-16)
 * - 로그인/회원가입 → Canvas Studio (VSCode 스타일 에디터)
 * - 모든 고급 기능 포함 (Layers, Inspector, Undo/Redo 등)
 *
 * @author C팀 (Frontend Team)
 * @version 5.0
 */
export default function SparklioCoreApp() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();

  // 🚧 임시: 백엔드 서버 없이 Canvas Studio 테스트
  // TODO: 백엔드 서버 준비되면 아래 주석 해제하고 return 문 제거
  const BYPASS_AUTH_FOR_TESTING = true;

  // 앱 시작 시 인증 상태 초기화
  useEffect(() => {
    if (!BYPASS_AUTH_FOR_TESTING) {
      initAuth();
    }
  }, [initAuth]);

  // 🚧 임시: 인증 우회 모드 - Canvas Studio 바로 표시
  if (BYPASS_AUTH_FOR_TESTING) {
    return <CanvasStudioShell />;
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 - Auth 화면 표시
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        {authMode === 'login' ? (
          <LoginForm
            onSuccess={() => {
              // 로그인 성공 시 Canvas Studio로 자동 전환
            }}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={() => {
              // 회원가입 성공 시 Canvas Studio로 자동 전환
            }}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </div>
    );
  }

  // 로그인 성공 - Canvas Studio 표시
  return <CanvasStudioShell />;
}
