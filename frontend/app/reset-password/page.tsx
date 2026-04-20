"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [formData, setFormData] = useState({
    password: "",
    password_confirmation: "",
  });

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // Đếm ngược 60s cho nút gửi lại mã
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Tự động focus ô tiếp theo
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData("text").trim();
    if (data.length === 6 && !isNaN(Number(data))) {
      setOtp(data.split(""));
      otpInputs.current[5]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const data = await authAPI.forgotPassword(email);
      if (data.success) {
        toast.success("Mã OTP mới đã được gửi!");
        setCountdown(60);
      } else {
        toast.error(data.message || "Lỗi gửi lại mã.");
      }
    } catch (error) {
      toast.error("Lỗi kết nối.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length < 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP 6 chữ số.");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.resetPassword({
        email,
        otp: otpCode,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      if (data.success) {
        toast.success("Mật khẩu đã được đổi thành công!");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        toast.error(data.message || "Lỗi cập nhật mật khẩu.");
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
          Thiết lập lại mật khẩu
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Nhập mã OTP đã được gửi đến <strong>{email}</strong>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* OTP Group */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center uppercase tracking-tighter">Mã xác thực OTP</label>
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-xl focus:ring-black focus:border-black outline-none transition-all"
                  />
                ))}
              </div>
              <div className="mt-4 text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-500 font-medium">Gửi lại mã sau <strong>{countdown}s</strong></p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-xs font-bold text-black hover:text-red-600 underline uppercase transition-colors"
                  >
                    {resending ? "Đang gửi..." : "Gửi lại mã OTP"}
                  </button>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors"
                placeholder="******"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
              <input
                required
                type="password"
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors"
                placeholder="******"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:bg-gray-400 uppercase"
            >
              {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="font-bold text-black hover:text-red-600 transition-colors">
              Hủy bỏ và quay lại
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
