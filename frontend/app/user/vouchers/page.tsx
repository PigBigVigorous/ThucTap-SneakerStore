"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { discountAPI, Discount } from "../../services/api";
import { Ticket, ShoppingBag, Info } from "lucide-react";
import toast from "react-hot-toast";
import VoucherCard from "../../components/VoucherCard";

type FilterType = 'all' | 'valid' | 'expired' | 'used_up';

export default function UserVoucherPage() {
  const { user, token, isAuthenticated } = useAuth();
  const [vouchers, setVouchers] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchVouchers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await discountAPI.getUserVouchers(token);
      if (res.success) {
        setVouchers(res.data || []);
      }
    } catch (error) {
      toast.error("Lỗi khi tải ví voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchVouchers();
  }, [isAuthenticated, token]);

  const now = new Date();

  const filteredVouchers = vouchers.filter(v => {
    const isExpired = v.expiration_date ? new Date(v.expiration_date) < now : false;
    const isUsedUp = v.usage_limit !== null && v.used_count >= v.usage_limit;
    if (filter === 'valid') return !isExpired && !isUsedUp;
    if (filter === 'expired') return isExpired;
    if (filter === 'used_up') return isUsedUp;
    return true;
  });

  // Đếm từng loại để hiển thị badge
  const counts = {
    all: vouchers.length,
    valid: vouchers.filter(v => {
      const isExpired = v.expiration_date ? new Date(v.expiration_date) < now : false;
      const isUsedUp = v.usage_limit !== null && v.used_count >= v.usage_limit;
      return !isExpired && !isUsedUp;
    }).length,
    expired: vouchers.filter(v => v.expiration_date ? new Date(v.expiration_date) < now : false).length,
    used_up: vouchers.filter(v => v.usage_limit !== null && v.used_count >= v.usage_limit).length,
  };

  const TABS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'valid', label: 'Còn hiệu lực' },
    { id: 'expired', label: 'Hết hạn' },
    { id: 'used_up', label: 'Hết lượt' },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="bg-white rounded-sm min-h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
          <Ticket className="text-red-500" /> Ví Voucher của tôi
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý và sử dụng các mã giảm giá bạn đã sưu tầm
        </p>
      </div>

      {/* Tabs / Filter */}
      <div className="flex border-b border-gray-100 bg-gray-50/30 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`flex-1 min-w-fit py-3.5 text-sm font-bold transition-all relative flex items-center justify-center gap-1.5 whitespace-nowrap px-4 ${
              filter === t.id ? "text-red-600 bg-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                filter === t.id ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {counts[t.id]}
              </span>
            )}
            {filter === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={40} className="text-gray-200" />
            </div>
            <p className="text-gray-600 font-bold">
              {filter === 'all' ? 'Bạn chưa có voucher nào' :
               filter === 'valid' ? 'Không có voucher đang có hiệu lực' :
               filter === 'expired' ? 'Không có voucher hết hạn' :
               'Không có voucher hết lượt dùng'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' ? 'Hãy quay lại trang chủ để sưu tầm thêm nhé!' : 'Thử xem ở tab khác!'}
            </p>
            <a
              href="/"
              className="mt-6 px-8 py-2.5 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-gray-900/10"
            >
              Khám phá ngay
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVouchers.map((v) => (
              <VoucherCard
                key={v.id}
                voucher={{ ...v, is_saved: true }}
                isAuthenticated={isAuthenticated}
                token={token || undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="p-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <Info size={12} /> Lưu ý sử dụng voucher
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Mỗi đơn hàng</p>
              <p className="text-xs text-gray-600">Chỉ áp dụng tối đa 1 mã giảm giá</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Cách dùng</p>
              <p className="text-xs text-gray-600">Click vào mã để copy, dán vào ô voucher khi thanh toán</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Thứ tự giảm</p>
              <p className="text-xs text-gray-600">Voucher được trừ trước, sau đó mới trừ điểm tích lũy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
