'use client';

import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 sm:h-16 border-b border-gray-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Hamburger for mobile */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="sm:hidden p-1.5 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="text-base sm:text-lg font-semibold text-gray-800">OBaby Manufacture</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {user && (
          <>
            <span className="text-xs sm:text-sm text-gray-600 hidden xs:inline">
              {user.name}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
              {user.role}
            </span>
            <button
              onClick={logout}
              className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
