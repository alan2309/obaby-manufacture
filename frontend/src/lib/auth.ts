import { useAuthStore } from '@/store/auth-store';

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function isAuthenticated(): boolean {
  return !!useAuthStore.getState().accessToken;
}

export function getUserRole(): string | null {
  return useAuthStore.getState().user?.role ?? null;
}
