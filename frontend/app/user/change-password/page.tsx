"use client";

import React from "react";
import { Lock } from "lucide-react";

export default function ChangePasswordPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="border-b border-gray-100 pb-5 mb-8">
        <h1 className="text-xl font-semibold text-gray-800">Đổi mật khẩu</h1>
        <p className="text-sm text-gray-500 mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      </div>

      <form className="max-w-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <label className="md:text-right text-gray-500 text-sm">Mật khẩu hiện tại</label>
          <input type="password" name="current_password" className="md:col-span-2 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <label className="md:text-right text-gray-500 text-sm">Mật khẩu mới</label>
          <input type="password" name="new_password" className="md:col-span-2 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <label className="md:text-right text-gray-500 text-sm">Xác nhận mật khẩu</label>
          <input type="password" name="confirm_password" className="md:col-span-2 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div></div>
          <button type="button" className="bg-orange-500 text-white px-8 py-2 rounded-sm shadow-sm hover:bg-orange-600 transition-colors">
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  );
}
