"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import Link from "next/link";

export default function RegisterPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn form tự động reload trang

    if (formData.password !== formData.password_confirmation) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.register(formData);

      if (data.success && data.data) {
        toast.success("🎉 Đăng ký thành công!");
        // Gọi hàm login từ AuthContext để lưu Token và User vào máy
        login(data.data.user, data.data.token);
        
        // Đợi 1.5s rồi chuyển về trang chủ
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        // Nếu Laravel báo lỗi (ví dụ: Email đã tồn tại)
        toast.error(`❌ Lỗi: ${data.message}`);
      }
    } catch (error) {
      toast.error("Lỗi kết nối đến máy chủ Laravel!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 uppercase tracking-widest">
          Tạo tài khoản mới
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Họ và Tên</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors" placeholder="Nguyễn Văn A" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ Email</label>
              <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors" placeholder="email@example.com" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
              <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors" placeholder="Ít nhất 6 ký tự" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận Mật khẩu</label>
              <input required type="password" value={formData.password_confirmation} onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})} className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors" placeholder="Nhập lại mật khẩu" />
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:bg-gray-400">
              {loading ? "Đang xử lý..." : "ĐĂNG KÝ NGAY"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Đã có tài khoản? </span>
            <Link href="/login" className="font-bold text-black hover:text-red-600 transition-colors">Đăng nhập tại đây</Link>
          </div>
        </div>
      </div>
    </main>
  );
}