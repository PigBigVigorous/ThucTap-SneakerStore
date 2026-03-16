"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/useCartStore"; // 🚨 Nhúng Zustand

export default function CartBadge() {
  // 🚨 Zustand: Chỉ re-render nút này khi Tổng số lượng thay đổi
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const totalItems = getTotalItems();

  return (
    <Link href="/cart" className="relative flex items-center gap-1.5 whitespace-nowrap text-gray-900 hover:text-red-600 font-black uppercase text-xs lg:text-sm tracking-wide transition-colors pr-2">
      <ShoppingCart size={18} />
      Giỏ hàng
      
      {/* Cục chấm đỏ hiển thị số lượng */}
      {totalItems > 0 && (
        <span className="absolute -top-2.5 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
          {totalItems}
        </span>
      )}
    </Link>
  );
}