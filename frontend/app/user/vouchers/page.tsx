"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { discountAPI, Discount } from "../../services/api";
import { Ticket, Search, Filter, Loader2, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import VoucherCard from "../../components/VoucherCard";

export default function UserVoucherPage() {
  const { user, token, isAuthenticated } = useAuth();
  const [vouchers, setVouchers] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'valid' | 'expired'>('all');

  const fetchVouchers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await discountAPI.getUserVouchers(token);
      if (res.success) {
        setVouchers(res.data);
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

  const filteredVouchers = vouchers.filter(v => {
    const isExpired = v.expiration_date ? new Date(v.expiration_date) < new Date() : false;
    if (filter === 'valid') return !isExpired;
    if (filter === 'expired') return isExpired;
    return true;
  });

  if (!isAuthenticated) return null;

  return (
    <div className="bg-white rounded-sm min-h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
          <Ticket className="text-red-500" /> Ví Voucher của tôi
        </h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý và sử dụng các mã giảm giá bạn đã sưu tầm</p>
      </div>

      {/* Tabs / Filter */}
      <div className="flex border-b border-gray-50 bg-gray-50/30">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'valid', label: 'Còn hiệu lực' },
          { id: 'expired', label: 'Hết hạn' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`flex-1 py-4 text-sm font-bold transition-all relative ${
              filter === t.id ? "text-red-600 bg-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
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
               <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>
             ))}
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={40} className="text-gray-200" />
             </div>
             <p className="text-gray-600 font-bold">Bạn chưa có voucher nào ở mục này</p>
             <p className="text-sm text-gray-400 mt-1">Hãy quay lại trang chủ để sưu tầm thêm nhé!</p>
             <a href="/" className="mt-6 px-8 py-2.5 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-gray-900/10">
               Khám phá ngay
             </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVouchers.map((v) => (
              <VoucherCard 
                key={v.id} 
                voucher={{...v, is_saved: true}} 
                isAuthenticated={isAuthenticated} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="p-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center space-y-4">
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Lưu ý sử dụng voucher</p>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Mỗi đơn hàng</p>
                 <p className="text-xs text-gray-600">Chỉ áp dụng tối đa 1 mã giảm giá</p>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Thời hạn</p>
                 <p className="text-xs text-gray-600">Voucher sẽ tự biến mất khi hết hạn</p>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Thứ tự</p>
                 <p className="text-xs text-gray-600">Voucher được trừ sau khi tính phí ship</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
