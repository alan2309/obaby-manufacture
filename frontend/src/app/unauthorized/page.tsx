'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-gray-800">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-2">
          You don't have permission to view this page. Please log in with the correct account.
        </p>
        <Link
          href="/login"
          className="inline-block mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
