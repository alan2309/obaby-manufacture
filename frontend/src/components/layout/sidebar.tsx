'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const adminNav = [
  { href: '/admin/dashboard', label: '📊 Dashboard' },
  { href: '/admin/inventory', label: '📦 Inventory' },
  { href: '/admin/products', label: '👕 Products' },
  { href: '/admin/batches', label: '🏭 Batches' },
  { href: '/admin/payroll', label: '💰 Payroll' },
];

const workerNav: Record<string, { href: string; label: string }[]> = {
  CUTTING: [{ href: '/cutting', label: '✂️ Cutting' }],
  STITCHING: [{ href: '/stitching', label: '🧵 Stitching' }],
  IRON: [{ href: '/ironing', label: '👔 Ironing' }],
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const navItems = user?.role === 'ADMIN' ? adminNav : workerNav[user?.role ?? ''] ?? [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed sm:static inset-y-0 left-0 z-50
          w-56 sm:w-52 lg:w-64
          border-r border-gray-200 bg-white min-h-screen p-4
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0
        `}
      >
        {/* Mobile close button */}
        <div className="flex justify-end sm:hidden mb-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
