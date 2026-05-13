"use client";

import { useEffect } from "react";

export default function MyOrdersRedirect() {
  useEffect(() => {
    window.location.href = "/user/purchase";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Đang vào đơn hàng...</p>
      </div>
    </div>
  );
}