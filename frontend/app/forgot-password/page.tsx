"use client";

import { useState } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authAPI.forgotPassword(email);

      if (data.success) {
        toast.success("Mã OTP đã được gửi đến email của bạn!");
        // Chuyển hướng sang trang nhập OTP kèm theo email trên query string
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.message || "Không thể gửi OTP. Vui lòng kiểm tra lại email.");
      }
    } catch (error) {
      toast.error("Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 uppercase tracking-widest">
          Quên mật khẩu
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Nhập email của bạn để nhận mã OTP khôi phục mật khẩu.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ Email</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors" 
                placeholder="email@example.com" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:bg-gray-400 uppercase"
            >
              {loading ? "Đang gửi..." : "Gửi mã xác thực"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="font-bold text-black hover:text-red-600 transition-colors uppercase tracking-tight">
              &larr; Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
