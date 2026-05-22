'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';

export function useAuth() {
  const router = useRouter();
  const { user, login, logout: storeLogout } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    login(data.accessToken, data.refreshToken, data.user);

    // Redirect based on role
    switch (data.user.role) {
      case 'ADMIN':
        router.push('/admin/dashboard');
        break;
      case 'CUTTING':
        router.push('/cutting');
        break;
      case 'STITCHING':
        router.push('/stitching');
        break;
      case 'IRON':
        router.push('/ironing');
        break;
      default:
        router.push('/login');
    }
  };

  const handleLogout = () => {
    storeLogout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
  };
}
