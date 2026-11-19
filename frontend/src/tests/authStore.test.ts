import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';

describe('authStore state management', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets authentication state correctly on setAuth', () => {
    const mockUser = {
      id: 'usr-123',
      email: 'test@codesync.ai',
      username: 'dev_user',
      full_name: 'Developer User',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    const mockToken = 'mock-jwt-token-xyz';

    useAuthStore.getState().setAuth(mockUser, mockToken);

    const updated = useAuthStore.getState();
    expect(updated.user?.id).toBe('usr-123');
    expect(updated.user?.username).toBe('dev_user');
    expect(updated.token).toBe('mock-jwt-token-xyz');
    expect(updated.isAuthenticated).toBe(true);
  });

  it('clears authentication state completely on logout', () => {
    const mockUser = {
      id: 'usr-456',
      email: 'user2@codesync.ai',
      username: 'user2',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    useAuthStore.getState().setAuth(mockUser, 'token-abc');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();

    const loggedOut = useAuthStore.getState();
    expect(loggedOut.user).toBeNull();
    expect(loggedOut.token).toBeNull();
    expect(loggedOut.isAuthenticated).toBe(false);
  });
});
