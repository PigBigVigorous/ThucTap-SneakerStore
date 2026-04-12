"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
// 🚨 THÊM useState và useEffect
import { useState, useEffect } from "react"; 
import { LayoutDashboard, ClipboardList, ShoppingCart, Package, ArrowRightLeft, ChevronDown, BarChart3, Store, Layers, Tag, Ticket } from 'lucide-react'; 

export default function AdminLinks() {
  const { user, hasPermission, hasRole } = useAuth();
  
  // 🚨 KỸ THUẬT MOUNTED ĐỂ CHỐNG LỖI HYDRATION
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Chỉ render sau khi Client đã sẵn sàng
  if (!mounted) return null;

  const canViewAdminPanel = user && (
    hasRole('super-admin') ||
    hasPermission('view-dashboard') ||
    hasPermission('manage-orders') ||
    hasPermission('manage-products') ||
    hasPermission('manage-inventory') ||
    hasPermission('pos-sale')
  );

  if (!canViewAdminPanel) {
    return null; 
  }

  return (
    <div className="relative group h-full flex items-center z-50">
      <Link href="/admin" className="flex items-center gap-1 cursor-pointer h-full font-bold uppercase text-xs lg:text-sm tracking-wide transition-colors border-b-2 text-gray-600 border-transparent hover:text-black hover:border-gray-300">
        <LayoutDashboard size={18} /> Quản trị
        <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" />
      </Link>

      <div className="absolute top-full left-0 mt-0 w-48 bg-white shadow-xl border-t border-gray-100 rounded-b-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden">
        
        {hasPermission('view-dashboard') && (
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-bold uppercase transition-colors">
            <BarChart3 size={16} /> Thống Kê
          </Link>
        )}

        {hasPermission('manage-orders') && (
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-green-600 font-bold uppercase transition-colors">
            <ClipboardList size={16} /> Đơn Hàng
          </Link>
        )}

        {hasRole('super-admin') && (
          <Link href="/admin/discounts" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 font-bold uppercase transition-colors">
            <Ticket size={16} /> Mã Giảm Giá
          </Link>
        )}

        {hasPermission('manage-products') && (
          <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-orange-600 font-bold uppercase transition-colors">
            <Package size={16} /> Sản phẩm
          </Link>
        )}

        {hasPermission('manage-products') && (
          <Link href="/admin/categories" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 font-bold uppercase transition-colors">
            <Layers size={16} /> Danh mục
          </Link>
        )}

        {hasPermission('manage-products') && (
          <Link href="/admin/brands" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-rose-600 font-bold uppercase transition-colors">
            <Tag size={16} /> Thương Hiệu
          </Link>
        )}

        {hasPermission('manage-inventory') && (
          <Link href="/admin/branches" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-teal-600 font-bold uppercase transition-colors">
            <Store size={16} /> Chi Nhánh
          </Link>
        )}

        {hasPermission('manage-inventory') && (
          <Link href="/admin/inventory" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 font-bold uppercase transition-colors">
            <ArrowRightLeft size={16} /> Kho hàng
          </Link>
        )}

        {hasPermission('pos-sale') && (
          <Link href="/admin/pos" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-purple-600 font-bold uppercase transition-colors">
            <ShoppingCart size={16} /> POS
          </Link>
        )}

      </div>
    </div>
  );
}