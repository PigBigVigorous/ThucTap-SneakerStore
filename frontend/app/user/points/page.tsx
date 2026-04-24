"use client";

import React, { useState, useEffect } from "react";
import { Coins, History, TrendingUp, ArrowDownRight, ArrowUpRight, Calendar, ShoppingBag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { pointAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function PointsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await pointAPI.getHistory(token);
        if (res.success) {
          setTransactions(res.data.transactions);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử điểm:", error);
        toast.error("Không thể tải lịch sử giao dịch điểm");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="p-6 md:p-8">
      <div className="border-b border-gray-100 pb-5 mb-8">
        <h1 className="text-xl font-semibold text-gray-800">Điểm tích lũy</h1>
        <p className="text-sm text-gray-500 mt-1">Xem và sử dụng điểm tích lũy của bạn</p>
      </div>

      <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-8 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-orange-200 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-12 -mb-12"></div>
        
        <div className="bg-white/20 p-4 rounded-full backdrop-blur-md mb-4 border border-white/30">
          <Coins size={40} className="text-white" />
        </div>
        <span className="text-orange-100 text-sm font-medium mb-1 uppercase tracking-wider">Số điểm hiện có</span>
        <span className="text-5xl font-black">{user?.points?.toLocaleString() || 0}</span>
        <div className="mt-4 bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm text-xs font-bold border border-white/20">
          1 điểm = 1,000 ₫
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <History size={22} className="text-gray-400" /> Lịch sử giao dịch
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400 font-medium">Đang tải lịch sử...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${t.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.amount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{t.reason}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <Calendar size={12} /> {new Date(t.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      {t.order && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded-md">
                          <ShoppingBag size={10} /> {t.order.order_tracking_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-black ${t.amount > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <History size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Bạn chưa có giao dịch điểm nào.</p>
            <p className="text-xs text-gray-400 mt-1">Hãy mua sắm để tích lũy điểm ngay!</p>
          </div>
        )}
      </div>
    </div>
  );
}
