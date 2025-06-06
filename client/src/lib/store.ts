import { create } from 'zustand';
import type { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('auth-token') : false,
  login: (user: User, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));