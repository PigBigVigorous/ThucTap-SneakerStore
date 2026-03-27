"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/useCartStore"; 

export default function CartBadge() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Lấy mảng 'items' từ Zustand store
  const items = useCartStore((state) => state.items);
  
  // Tự động tính toán lại mỗi khi mảng 'items' có biến động
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Link href="/cart" className="relative flex items-center gap-1.5 whitespace-nowrap text-gray-900 hover:text-red-600 font-black uppercase text-xs lg:text-sm tracking-wide transition-colors pr-2">
      <ShoppingCart size={18} />
      Giỏ hàng
      
      {isMounted && totalItems > 0 && (
        <span className="absolute -top-2.5 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-300">
          {totalItems}
        </span>
      )}
    </Link>
  );
}