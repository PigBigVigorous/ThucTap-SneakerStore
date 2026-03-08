"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, ClipboardList, ShoppingCart, Package, ArrowRightLeft, ChevronDown } from 'lucide-react';

export default function AdminLinks() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return null; 
  }

  return (
    <div className="relative group h-full flex items-center z-50">
      {/* Nút hiển thị chính trên thanh Nav */}
      <Link href="/admin" className="flex items-center gap-1 cursor-pointer h-full font-bold uppercase text-xs lg:text-sm tracking-wide transition-colors border-b-2 text-gray-600 border-transparent hover:text-black hover:border-gray-300">
        <LayoutDashboard size={18} /> Quản trị
        <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" />
      </Link>

      {/* Khối thả xuống khi hover */}
      <div className="absolute top-full left-0 mt-0 w-48 bg-white shadow-xl border-t border-gray-100 rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden">
        <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-green-600 font-bold uppercase transition-colors">
          <ClipboardList size={16} /> Đơn Hàng
        </Link>
        <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-orange-600 font-bold uppercase transition-colors">
          <Package size={16} /> Sản phẩm
        </Link>
        <Link href="/admin/inventory" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 font-bold uppercase transition-colors">
          <ArrowRightLeft size={16} /> Kho hàng
        </Link>
        <Link href="/admin/pos" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-purple-600 font-bold uppercase transition-colors">
          <ShoppingCart size={16} /> POS
        </Link>
      </div>
    </div>
  );
}