import { create } from 'zustand';
import { UserResponse } from '@/lib/api-client';

/**
 * AuthStore
 *
 * 사용자 인증 상태를 관리합니다.
 * - 로그인/로그아웃
 * - 사용자 정보
 * - 토큰 관리
 */

interface AuthState {
  // State
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: UserResponse | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  initAuth: () => {
    // Load user from localStorage on app start
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');

      if (userJson && token) {
        try {
          const user = JSON.parse(userJson);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to parse user from localStorage', error);
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    }
  },
}));
