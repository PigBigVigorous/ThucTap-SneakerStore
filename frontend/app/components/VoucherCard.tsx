"use client";

import React, { useState } from "react";
import { Ticket, Clock, CheckCircle, Copy, Check } from "lucide-react";
import { Discount, discountAPI } from "../services/api";
import toast from "react-hot-toast";

interface VoucherCardProps {
  voucher: Discount;
  isAuthenticated: boolean;
  token?: string;
  onSaved?: () => void;
}

export default function VoucherCard({ voucher, isAuthenticated, token, onSaved }: VoucherCardProps) {
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(voucher.is_saved || false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu voucher!");
      return;
    }
    setLoading(true);
    try {
      // Ưu tiên dùng token truyền vào, fallback localStorage
      const authToken = token || localStorage.getItem("token") || "";
      const res = await discountAPI.save(voucher.id, authToken);
      if (res.success) {
        setIsSaved(true);
        toast.success(res.message || "Đã lưu voucher vào ví!");
        if (onSaved) onSaved();
      } else {
        toast.error(res.message || "Không thể lưu voucher");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Không thể lưu voucher");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      toast.success(`Đã copy mã "${voucher.code}"!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể copy mã");
    }
  };

  const now = new Date();
  const isExpired = voucher.expiration_date ? new Date(voucher.expiration_date) < now : false;
  const isOutOfStock = voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit;
  const isDisabled = isExpired || isOutOfStock;

  // Chuẩn hóa type (backend trả về 'percent')
  const isPercent = voucher.type === 'percent';

  const discountLabel = isPercent
    ? `Giảm ${Number(voucher.value)}%`
    : `Giảm ${Math.round(voucher.value).toLocaleString('vi-VN')}₫`;

  const maxCap = voucher.max_discount_value || (voucher as any).max_discount_amount;
  const usagePercent = voucher.usage_limit
    ? Math.min(100, (voucher.used_count / voucher.usage_limit) * 100)
    : 0;

  return (
    <div className={`relative flex bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group ${isDisabled ? 'opacity-60 grayscale-[30%]' : ''}`}>
      {/* Left side - Icon */}
      <div className={`w-24 sm:w-28 flex flex-col items-center justify-center gap-2 p-4 text-white shrink-0 relative ${isSaved ? 'bg-gray-400' : isDisabled ? 'bg-gray-400' : 'bg-red-500'}`}>
        <Ticket size={30} />
        <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">Sneaker Store</span>

        {/* Decorative punch holes */}
        <div className="absolute top-0 bottom-0 -right-2 flex flex-col justify-around py-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-white rounded-full -mr-2" />
          ))}
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          {/* Tiêu đề & trạng thái */}
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-black text-gray-900 leading-tight text-sm">{discountLabel}</h3>
            {isSaved && (
              <span className="bg-green-100 text-green-600 p-1 rounded-full shrink-0">
                <CheckCircle size={14} />
              </span>
            )}
          </div>

          {/* Thông tin điều kiện */}
          <div className="text-[11px] text-gray-500 font-medium space-y-0.5 mb-2">
            {voucher.min_order_value && voucher.min_order_value > 0 ? (
              <p>Đơn tối thiểu {Math.round(voucher.min_order_value).toLocaleString('vi-VN')}₫</p>
            ) : (
              <p>Không giới hạn đơn tối thiểu</p>
            )}
            {isPercent && maxCap && maxCap > 0 && (
              <p className="text-orange-500 font-semibold">Giảm tối đa {Math.round(maxCap).toLocaleString('vi-VN')}₫</p>
            )}
            {voucher.category_ids && voucher.category_ids.length > 0 && (
              <p className="text-blue-500 font-semibold">Áp dụng cho sản phẩm nhất định</p>
            )}
          </div>

          {/* Mã voucher - có thể copy */}
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-lg px-2 py-1 text-xs font-black text-gray-600 transition-colors cursor-pointer mb-2 group/copy"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={11} className="group-hover/copy:text-red-500 transition-colors" />}
            <span className="font-mono tracking-wider">{voucher.code}</span>
          </button>

          {/* HSD */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
            <Clock size={11} />
            {isExpired ? (
              <span className="text-red-400">Đã hết hạn</span>
            ) : voucher.expiration_date ? (
              <span>HSD: {new Date(voucher.expiration_date).toLocaleDateString('vi-VN')}</span>
            ) : (
              <span>Vô thời hạn</span>
            )}
          </div>
        </div>

        {/* Bottom: progress + action */}
        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="flex-1">
            {voucher.usage_limit && (
              <>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${isDisabled ? 'bg-gray-300' : isSaved ? 'bg-gray-300' : 'bg-red-500'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase">
                  {isOutOfStock ? "Đã hết lượt" : `Đã dùng ${Math.round(usagePercent)}%`}
                </p>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={loading || isSaved || isDisabled}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${
              isSaved
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : isDisabled
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600 active:scale-95 shadow-lg shadow-red-500/20'
            }`}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSaved ? 'Đã lưu' : isDisabled ? 'Không khả dụng' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
