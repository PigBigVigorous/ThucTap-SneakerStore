'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Truck, User, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ShipperLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return; // Chờ cho đến khi load xong auth

    // Kiểm tra quyền: Nếu không phải shipper thì đá ra trang chủ
    if (token && user && user.role !== 'shipper') {
      router.push('/');
    }
    if (!token) {
      router.push('/login');
    }
  }, [token, user, router, isLoading]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!user || user.role !== 'shipper') return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <Link 
          href="/shipper/orders" 
          className={`flex flex-col items-center gap-1 transition-colors ${pathname.includes('/orders') ? 'text-orange-600' : 'text-gray-400'}`}
        >
          <Truck size={24} className={pathname.includes('/orders') ? 'fill-orange-50' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Nhiệm vụ</span>
        </Link>

        <Link 
          href="/shipper/profile" 
          className={`flex flex-col items-center gap-1 transition-colors ${pathname.includes('/profile') ? 'text-orange-600' : 'text-gray-400'}`}
        >
          <User size={24} className={pathname.includes('/profile') ? 'fill-orange-50' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Cá nhân</span>
        </Link>

        <button 
          onClick={() => { logout(); router.push('/login'); }}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Thoát</span>
        </button>
      </nav>
    </div>
  );
}
