import type { Metadata } from "next";
import { Montserrat } from "next/font/google"; // 👈 Import font mới
import "./globals.css";
import Link from "next/link";
import { CartProvider } from "./context/CartContext"; 
import { AuthProvider } from "./context/AuthContext";
import CartBadge from "./components/CartBadge";       
import AuthNav from "./components/AuthNav";
import { Toaster } from "react-hot-toast";
import AdminLinks from "./components/AdminLinks";
import { Store, Truck } from 'lucide-react';
import { Search } from 'lucide-react';
import MegaMenu from "./components/MegaMenu";
import { FavoritesProvider } from "./context/FavoritesContext";
import { X, CheckCircle } from "lucide-react";


// 👈 Cấu hình font Montserrat với bộ gõ tiếng Việt (Đã xóa sạch Geist)
const montserrat = Montserrat({ 
  subsets: ["latin", "vietnamese"],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Sneaker Store",
  description: "Cửa hàng bán giày Sneaker chính hãng",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      {/* 🚨 Áp dụng class của Montserrat vào thẻ body */}
      <body suppressHydrationWarning className={`${montserrat.className} antialiased bg-gray-50 text-gray-900 tracking-tight`}>
        <AuthProvider>
          <FavoritesProvider>
          <CartProvider>
            
            <Toaster position="top-center" reverseOrder={false} />
            
            <header className="bg-white shadow-sm sticky top-0 z-50 relative">
              <div className="w-full px-4 sm:px-6 lg:px-12">
                
                <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4 lg:gap-8 w-full">
                  
                  {/* Ô SỐ 1: LOGO */}
                  <div className="flex items-center">
                    <Link href="/" className="flex items-center">
                      <span className="font-black text-2xl tracking-tighter text-gray-900">
                        SNEAKER<span className="text-red-600">.</span>
                      </span>
                    </Link>
                  </div>

                  {/* Ô SỐ 2: MENU CHÍNH (ĐÃ THAY BẰNG MEGA MENU) */}
                  {/* Bỏ overflow-x-auto để Mega Menu được bung xuống */}
                  <nav className="flex h-full items-center justify-start lg:justify-center gap-4 lg:gap-6 pr-4">
                    
                    {/* 👇 ĐÂY CHÍNH LÀ LINH HỒN MEGA MENU 👇 */}
                    <div className="hidden lg:block h-full">
                      <MegaMenu />
                    </div>

                    {/* Nút Tra Cứu và Admin vẫn giữ nguyên ở đuôi */}
                    <Link href="/track-order" className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-bold uppercase text-xs lg:text-sm tracking-wide transition-colors">
                      <Truck size={18} /> Tra cứu
                    </Link>
                    <AdminLinks /> 
                  </nav>

                  {/* Ô SỐ 3: GIỎ HÀNG & USER */}
                  <div className="flex justify-self-end items-center gap-4 lg:gap-6 border-l border-gray-200 pl-4 lg:pl-6 relative z-50 bg-white h-full">
                    <CartBadge /> 
                    <AuthNav />
                  </div>

                </div>
              </div>
            </header>

            <div className="min-h-screen">
              {children}
            </div>

          </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}