import type { Metadata } from 'next';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'OBaby Manufacture',
  description: 'Manufacturing Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
