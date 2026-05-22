'use client';

import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-gray-800">OBaby Manufacture</h1>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-600">
              {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
