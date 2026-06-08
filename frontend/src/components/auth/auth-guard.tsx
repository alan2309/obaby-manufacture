'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!accessToken || !user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [mounted, accessToken, user, allowedRoles, router]);

  // Don't render anything during SSR or before hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!accessToken || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Not logged in</p>
          <p className="text-sm text-gray-500 mt-1">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">🚫</div>
          <p className="text-lg font-semibold text-gray-700">Access Denied</p>
          <p className="text-sm text-gray-500 mt-1">
            You don't have permission to access this page.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Your role: <span className="font-medium">{user.role}</span>
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 min-h-[44px] min-w-[44px]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
