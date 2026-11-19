import { create } from 'zustand';
import { User, AuthResponse } from '../types';
import { apiService } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initAuth: () => Promise<void>;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setAuth: (user: User, token: string) => void;
}

// Safe localStorage access for isomorphic / test environments
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: safeStorage.getItem('codesync_auth_token'),
  isAuthenticated: !!safeStorage.getItem('codesync_auth_token'),
  isLoading: true,
  error: null,

  initAuth: async () => {
    const token = safeStorage.getItem('codesync_auth_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await apiService.getMe();
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      console.warn('Failed to restore user session:', err);
      safeStorage.removeItem('codesync_auth_token');
      safeStorage.removeItem('codesync_auth_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (usernameOrEmail, password) => {
    set({ isLoading: true, error: null });
    try {
      const authData = await apiService.login({
        username_or_email: usernameOrEmail,
        password: password,
      });

      safeStorage.setItem('codesync_auth_token', authData.access_token);
      safeStorage.setItem('codesync_auth_user', JSON.stringify(authData.user));
      set({
        user: authData.user,
        token: authData.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Invalid username or password.';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  register: async (email, username, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const authData = await apiService.register({
        email,
        username,
        password,
        full_name: fullName,
      });

      safeStorage.setItem('codesync_auth_token', authData.access_token);
      safeStorage.setItem('codesync_auth_user', JSON.stringify(authData.user));
      set({
        user: authData.user,
        token: authData.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to register account.';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  logout: () => {
    safeStorage.removeItem('codesync_auth_token');
    safeStorage.removeItem('codesync_auth_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = '/login';
    }
  },

  clearError: () => set({ error: null }),

  setAuth: (user, token) => {
    safeStorage.setItem('codesync_auth_token', token);
    safeStorage.setItem('codesync_auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, error: null, isLoading: false });
  },
}));
