import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      login: (user: User, token: string) => 
        set({ user, token, isAuthenticated: true, isInitialized: true }),
      logout: () => 
        set({ user: null, token: null, isAuthenticated: false, isInitialized: true }),
      updateUser: (user: User) => 
        set({ user }),
      setInitialized: () =>
        set({ isInitialized: true }),
    }),
    {
      name: 'auth-storage',
    }
  )
);