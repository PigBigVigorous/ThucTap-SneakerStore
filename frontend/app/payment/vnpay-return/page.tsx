"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentAPI } from "../../services/api";
import { useCartStore } from "../../store/useCartStore";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

function VnpayReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      // Lấy toàn bộ query string (VD: ?vnp_Amount=100000&vnp_BankCode=NCB...)
      const queryString = window.location.search;
      if (!queryString) {
        setStatus("error");
        setMessage("Dữ liệu thanh toán không hợp lệ.");
        return;
      }

      try {
        const response = await paymentAPI.verifyVnpay(queryString);
        if (response.success) {
          setStatus("success");
          setMessage("Thanh toán thành công! Cảm ơn bạn đã mua hàng.");
          clearCart(); // CHỈ KHI THANH TOÁN THÀNH CÔNG MỚI XOÁ GIỎ HÀNG
        } else {
          setStatus("error");
          setMessage(response.message || "Thanh toán không thành công.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Lỗi kết nối khi xác thực thanh toán.");
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm text-center max-w-lg w-full">
        {status === "loading" && (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-medium">Đang xác thực thanh toán...</h2>
            <p className="text-gray-500 mt-2">Vui lòng không đóng trình duyệt.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle2 size={80} className="text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Giao dịch thành công</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="flex gap-4">
              <Link href="/my-orders" className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800">
                Xem đơn hàng
              </Link>
              <Link href="/" className="bg-gray-100 text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle size={80} className="text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Giao dịch thất bại</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="flex gap-4">
              <Link href="/checkout" className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800">
                Thử thanh toán lại
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <VnpayReturnContent />
    </Suspense>
  );
}