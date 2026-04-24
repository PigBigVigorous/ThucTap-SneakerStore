"use client";

import React, { useState } from "react";
import { Ticket, Clock, CheckCircle, Info } from "lucide-react";
import { Discount, discountAPI } from "../services/api";
import toast from "react-hot-toast";

interface VoucherCardProps {
  voucher: Discount;
  isAuthenticated: boolean;
  onSaved?: () => void;
}

export default function VoucherCard({ voucher, isAuthenticated, onSaved }: VoucherCardProps) {
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(voucher.is_saved || false);

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu voucher!");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await discountAPI.save(voucher.id, token);
      if (res.success) {
        setIsSaved(true);
        toast.success(res.message);
        if (onSaved) onSaved();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu voucher");
    } finally {
      setLoading(false);
    }
  };

  const isExpired = voucher.expiration_date ? new Date(voucher.expiration_date) < new Date() : false;

  return (
    <div className={`relative flex bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group ${isExpired ? 'opacity-60' : ''}`}>
      {/* Left side - Icon */}
      <div className={`w-24 sm:w-28 flex flex-col items-center justify-center gap-2 p-4 text-white shrink-0 relative ${isSaved ? 'bg-gray-400' : 'bg-red-500'}`}>
        <Ticket size={32} />
        <span className="text-[10px] font-black uppercase tracking-tighter">Sneaker Store</span>
        
        {/* Decorative circles */}
        <div className="absolute top-0 bottom-0 -right-2 flex flex-col justify-around py-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-white rounded-full -mr-2"></div>
          ))}
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-black text-gray-900 leading-tight">
              Giảm {voucher.type === 'percent' ? `${voucher.value}%` : `${(voucher.value / 1000).toLocaleString()}k`}
            </h3>
            {isSaved && (
              <span className="bg-green-100 text-green-600 p-1 rounded-full">
                <CheckCircle size={14} />
              </span>
            )}
          </div>
          
          <p className="text-[11px] text-gray-500 font-medium mb-2">
            Đơn tối thiểu {((voucher.min_order_value || 0) / 1000).toLocaleString()}k
          </p>

          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold mb-3 uppercase">
            <Clock size={12} />
            HSD: {voucher.expiration_date ? new Date(voucher.expiration_date).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isSaved ? 'bg-gray-300' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, (voucher.used_count / (voucher.usage_limit || 100)) * 100)}%` }}
                ></div>
             </div>
             <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">
               Đã dùng {Math.round((voucher.used_count / (voucher.usage_limit || 1)) * 100)}%
             </p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || isSaved || isExpired}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              isSaved 
                ? 'bg-gray-100 text-gray-400 cursor-default' 
                : isExpired
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600 active:scale-95 shadow-lg shadow-red-500/20'
            }`}
          >
            {loading ? '...' : isSaved ? 'Đã lưu' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Info Icon */}
      <div className="absolute top-2 right-2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
        <Info size={14} />
      </div>
    </div>
  );
}
