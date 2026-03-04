"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
// 🚨 Nhúng Icon cho Admin
import { LayoutDashboard, ClipboardList, ShoppingCart } from 'lucide-react';

export default function AdminLinks() {
  const { user } = useAuth();

  // Nếu chưa đăng nhập HOẶC không phải là admin -> Tàng hình luôn!
  if (!user || user.role !== 'admin') {
    return null; 
  }

  // Nếu là Admin thì mới hiển thị
  return (
    <>
      <Link href="/admin" className="flex items-center gap-1.5 whitespace-nowrap text-gray-600 hover:text-blue-600 font-bold uppercase text-xs lg:text-sm tracking-wide transition-colors">
        <LayoutDashboard size={18} /> Quản trị
      </Link>
      <Link href="/admin/orders" className="flex items-center gap-1.5 whitespace-nowrap text-gray-600 hover:text-green-600 font-bold uppercase text-xs lg:text-sm tracking-wide transition-colors">
        <ClipboardList size={18} /> Đơn Hàng
      </Link>
      <Link href="/admin/pos" className="flex items-center gap-1.5 whitespace-nowrap text-gray-600 hover:text-purple-600 font-bold uppercase text-xs lg:text-sm tracking-wide transition-colors">
        <ShoppingCart size={18} /> POS
      </Link>
    </>
  );
}