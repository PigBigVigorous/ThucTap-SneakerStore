"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/user/purchase");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 animate-pulse">Đang chuyển hướng đến trang đơn hàng...</p>
    </div>
  );
}