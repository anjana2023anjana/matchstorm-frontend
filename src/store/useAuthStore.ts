import { create } from 'zustand';
import type { UserProfile } from '../types/auth.types';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('matchstorm_token'),
  user: localStorage.getItem('matchstorm_user')
    ? JSON.parse(localStorage.getItem('matchstorm_user')!)
    : null,
  setAuth: (token, user) => {
    localStorage.setItem('matchstorm_token', token);
    localStorage.setItem('matchstorm_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('matchstorm_token');
    localStorage.removeItem('matchstorm_user');
    set({ token: null, user: null });
  },
}));