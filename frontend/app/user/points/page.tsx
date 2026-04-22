"use client";

import React from "react";
import { Coins, History, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function PointsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8">
      <div className="border-b border-gray-100 pb-5 mb-8">
        <h1 className="text-xl font-semibold text-gray-800">Điểm tích lũy</h1>
        <p className="text-sm text-gray-500 mt-1">Xem và sử dụng điểm tích lũy của bạn</p>
      </div>

      <div className="bg-orange-50 p-8 rounded-sm flex flex-col items-center justify-center border border-orange-100 mb-8">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <Coins size={48} className="text-orange-500" />
        </div>
        <span className="text-gray-500 text-sm mb-1">Số điểm hiện có</span>
        <span className="text-4xl font-bold text-orange-600">{user?.points?.toLocaleString() || 0}</span>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <History size={20} /> Lịch sử giao dịch
        </h2>
        <div className="border border-gray-100 rounded-sm divide-y divide-gray-100">
           <div className="p-4 text-center text-gray-400 text-sm">
              Bạn chưa có giao dịch điểm nào.
           </div>
        </div>
      </div>
    </div>
  );
}
