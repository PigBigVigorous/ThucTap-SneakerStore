"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log lỗi ra màn hình console (chỉ client view)
    console.error("Hệ thống gặp sự cố:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h2 className="text-3xl font-black mb-4 tracking-tight uppercase">Đã có lỗi xảy ra!</h2>
      <p className="text-gray-500 mb-8 font-medium max-w-md">
        {error.message || "Rất tiếc, đã có sự cố trong hệ thống hoặc kết nối lỗi. Vui lòng thử lại sau giây lát."}
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
        >
          Thử Lại
        </button>
        <Link 
          href="/" 
          className="bg-gray-100 text-gray-900 border border-gray-200 px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
        >
          Trang Chủ
        </Link>
      </div>
    </div>
  );
}
