'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';

export function WorkerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={['CUTTING', 'STITCHING', 'IRON', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-4 sm:p-6 w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
