"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, Package, LogIn, UserPlus, Heart } from 'lucide-react';

export default function AuthNav() {
  const { user, logout } = useAuth();

  // ==========================================
  // 1. TRẠNG THÁI ĐÃ ĐĂNG NHẬP
  // ==========================================
  if (user) {
    return (
      <div className="flex items-center gap-4 ml-2 lg:ml-4 border-l border-gray-200 pl-4">
        <span className="font-bold text-xs lg:text-sm text-gray-800 flex items-center gap-1.5 whitespace-nowrap">
          <User size={18} className="text-gray-400 shrink-0" />
          Chào, 
          {/* Cắt ngắn tên nếu quá dài (truncate) */}
          <span className="text-red-600 max-w-[100px] lg:max-w-[160px] truncate" title={user.name}>
            {user.name}
          </span>!
        </span>

        {/*  Nút YÊU THÍCH (Dành cho người đã đăng nhập) */}
        <Link href="/favorites" className="flex items-center gap-1.5 whitespace-nowrap text-gray-600 hover:text-red-600 font-bold text-xs uppercase tracking-wide transition-colors">
          <Heart size={16} /> 
        </Link>
        
        <Link href="/my-orders" className="flex items-center gap-1.5 whitespace-nowrap text-gray-600 hover:text-blue-600 font-bold text-xs uppercase tracking-wide transition-colors">
          <Package size={16} /> Đơn hàng
        </Link>

        <button 
          onClick={logout} 
          className="flex items-center gap-1.5 whitespace-nowrap text-gray-400 hover:text-red-600 font-bold text-xs uppercase tracking-wide transition-colors"
        >
          <LogOut size={16} /> Thoát
        </button>
      </div>
    );
  }

  // ==========================================
  // 2. TRẠNG THÁI CHƯA ĐĂNG NHẬP (KHÁCH VÃNG LAI)
  // ==========================================
  return (
    <div className="flex items-center gap-4 ml-4 border-l border-gray-200 pl-4">
      
      
      <Link href="/favorites" className="flex items-center gap-1.5 text-gray-600 hover:text-red-600 font-bold uppercase text-sm tracking-wider transition-colors border-r border-gray-200 pr-4">
        <Heart size={18} /> 
      </Link>

      <Link href="/login" className="flex items-center gap-1.5 text-gray-600 hover:text-black font-bold uppercase text-sm tracking-wider transition-colors">
        <LogIn size={18} />
        Đăng nhập
      </Link>
      
      <Link href="/register" className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-gray-800 transition shadow-md">
        <UserPlus size={16} />
        Đăng ký
      </Link>
    </div>
  );
}