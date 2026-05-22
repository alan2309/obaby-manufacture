'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/batches', label: 'Batches' },
  { href: '/admin/payroll', label: 'Payroll' },
];

const workerNav: Record<string, { href: string; label: string }[]> = {
  CUTTING: [{ href: '/cutting', label: 'Cutting' }],
  STITCHING: [{ href: '/stitching', label: 'Stitching' }],
  IRON: [{ href: '/ironing', label: 'Ironing' }],
};

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const navItems = user?.role === 'ADMIN' ? adminNav : workerNav[user?.role ?? ''] ?? [];

  return (
    <aside className="w-64 border-r border-gray-200 bg-white min-h-screen p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
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
  );
}
