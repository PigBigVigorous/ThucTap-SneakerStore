"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";
import { ShoppingCart } from "lucide-react"; // 👈 Nhúng Icon Giỏ hàng

export default function CartBadge() {
  const { cart } = useCart();
  
  // Tính tổng số lượng sản phẩm
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

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