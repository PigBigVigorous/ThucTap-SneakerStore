"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "../store/useCartStore";
import { useFavoritesStore } from "../store/useFavoritesStore";
import {
  Trash2, Heart, Minus, Plus, ShoppingBag,
  ArrowRight, Tag, Truck, Shield, ChevronRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Format tiền tệ ──────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("vi-VN") + " ₫";

// ─── Ngưỡng freeship ─────────────────────────────────────────────────────────
const FREESHIP = 5_000_000;
const SHIP_FEE = 30_000;

// ─── CartPage ─────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const items        = useCartStore((s) => s.items);
  const removeFromCart  = useCartStore((s) => s.removeFromCart);
  const updateQuantity  = useCartStore((s) => s.updateQuantity);
  const getTotalPrice   = useCartStore((s) => s.getTotalPrice);
  const toggleSelect    = useCartStore((s) => s.toggleSelect);
  const toggleSelectAll = useCartStore((s) => s.toggleSelectAll);

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const favorites      = useFavoritesStore((s) => s.favorites);

  const [promoCode, setPromoCode]     = useState("");
  const [promoOpen, setPromoOpen]     = useState(false);
  const [removingId, setRemovingId]   = useState<number | null>(null);

  const selectedCount = items.filter((i) => i.selected !== false).length;
  const isAllSelected = selectedCount === items.length && items.length > 0;

  const subtotal  = getTotalPrice();
  const shipping  = (subtotal >= FREESHIP || selectedCount === 0) ? 0 : SHIP_FEE;
  const total     = subtotal + shipping;
  const progress  = Math.min((subtotal / FREESHIP) * 100, 100);
  const remaining = FREESHIP - subtotal;

  const handleRemove = (variantId: number) => {
    setRemovingId(variantId);
    setTimeout(() => {
      removeFromCart(variantId);
      setRemovingId(null);
    }, 280);
  };

  // Chỉ toggle Yêu thích, KHÔNG xóa khỏi giỏ hàng
  const handleToggleFav = (item: typeof items[0]) => {
    const added = toggleFavorite({
      product_id: item.product_id,
      product_name: item.name,
      category_name: "",
      price: item.price,
      image: item.image,
      slug: item.slug,
    });
    toast(added ? "Đã thêm vào Yêu thích ❤" : "Đã xóa khỏi Yêu thích", {
      icon: added ? "❤️" : "🗑️",
    });
  };


  // ── Empty state ───────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4 py-20">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-gray-50 flex items-center justify-center">
            <ShoppingBag size={44} className="text-gray-300" strokeWidth={1.2} />
          </div>
          <span className="absolute -top-1 -right-1 w-7 h-7 bg-gray-900 text-white text-xs font-black rounded-full flex items-center justify-center">
            0
          </span>
        </div>

        <h1 className="text-[26px] font-bold text-gray-900 mb-3 tracking-tight">
          Giỏ hàng trống
        </h1>
        <p className="text-gray-400 mb-10 text-center max-w-[340px] text-[15px] leading-relaxed">
          Có vẻ như bạn chưa thêm sản phẩm nào. Khám phá ngay những đôi giày mới nhất!
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full
                     font-semibold text-[15px] hover:bg-gray-700 transition-colors"
        >
          Mua sắm ngay <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 lg:pt-12">

        {/* Page title */}
        <h1 className="text-[28px] font-black text-gray-900 tracking-tight mb-8">
          Giỏ hàng
          <span className="ml-3 text-[18px] font-semibold text-gray-400">
            ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ══════════════════════════════════════════
              CỘT TRÁI: SẢN PHẨM
          ══════════════════════════════════════════ */}
          <div className="w-full lg:flex-1 min-w-0">

            {/* Freeship banner */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <Truck size={16} className={remaining > 0 ? "text-gray-400" : "text-green-500"} />
                  {remaining > 0
                    ? <span>Mua thêm <strong className="text-gray-900">{fmt(remaining)}</strong> để được <strong className="text-green-600">Miễn phí vận chuyển</strong></span>
                    : <span className="text-green-600 font-bold">🎉 Bạn đã được miễn phí vận chuyển!</span>}
                </div>
                <span className="text-[12px] text-gray-400 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Select All Bar */}
            {items.length > 0 && (
              <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-900 text-[15px]">Chọn tất cả ({items.length} sản phẩm)</span>
                </label>
              </div>
            )}

            {/* Items list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {items.map((item, idx) => {
                const isFav = favorites.some((f) => f.product_id === item.product_id);
                const isRemoving = removingId === item.variant_id;

                return (
                  <div
                    key={item.variant_id}
                    className={`relative flex gap-4 sm:gap-5 px-5 py-5 transition-all duration-300
                      ${idx !== 0 ? "border-t border-gray-50" : ""}
                      ${isRemoving ? "opacity-0 scale-95 -translate-x-2" : "opacity-100 scale-100 translate-x-0"}`}
                  >
                    {/* Item Checkbox */}
                    <div className="flex flex-col justify-center pt-1 sm:pt-2">
                       <input
                         type="checkbox"
                         checked={item.selected !== false}
                         onChange={() => toggleSelect(item.variant_id)}
                         className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                       />
                    </div>

                    {/* Image */}
                    <Link
                      href={`/product/${item.slug}`}
                      className="shrink-0 w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] relative
                                 bg-[#f5f5f5] rounded-xl overflow-hidden block hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        fill
                        sizes="130px"
                        className="w-full h-full object-contain mix-blend-multiply p-2"
                      />
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        {/* Name + attrs */}
                        <div className="min-w-0">
                          <Link
                            href={`/product/${item.slug}`}
                            className="font-semibold text-gray-900 text-[15px] hover:underline line-clamp-2 block"
                          >
                            {item.name}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                            <span className="text-[13px] text-gray-400">
                              Màu: <span className="text-gray-600">{item.color}</span>
                            </span>
                            <span className="text-[13px] text-gray-400">
                              Size: <span className="text-gray-600">{item.size.replace(/eu-?/i, "")}</span>
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900 text-[16px]">
                            {fmt(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[12px] text-gray-400 mt-0.5">
                              {fmt(item.price)} / chiếc
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity + actions */}
                      <div className="mt-auto pt-3 flex items-center justify-between flex-wrap gap-3">
                        {/* Quantity stepper */}
                        <div className="flex items-center gap-0 border border-gray-200 rounded-full overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-50
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-9 text-center text-[14px] font-semibold text-gray-900 select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-50
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleFav(item)}
                            title={isFav ? "Xóa khỏi Yêu thích" : "Thêm vào Yêu thích"}
                            className="w-9 h-9 flex items-center justify-center rounded-full
                                       hover:bg-gray-50 text-gray-400 hover:text-rose-500 transition-colors"
                          >
                            <Heart
                              size={18}
                              strokeWidth={isFav ? 0 : 1.5}
                              className={isFav ? "fill-rose-500 text-rose-500" : ""}
                            />
                          </button>
                          <button
                            onClick={() => handleRemove(item.variant_id)}
                            title="Xóa"
                            className="w-9 h-9 flex items-center justify-center rounded-full
                                       hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      {/* Stock warning */}
                      {item.quantity >= item.stock && (
                        <p className="mt-1.5 text-[11px] text-red-500 font-medium">
                          ⚠ Đã đạt tối đa tồn kho ({item.stock} sản phẩm)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: Truck,  label: "Freeship từ 5tr" },
                { icon: Shield, label: "Hàng chính hãng" },
                { icon: Tag,    label: "Giá tốt nhất" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-white rounded-xl p-3 flex flex-col items-center gap-1.5 border border-gray-100 shadow-sm text-center">
                  <Icon size={18} className="text-gray-400" strokeWidth={1.5} />
                  <span className="text-[11px] text-gray-500 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              CỘT PHẢI: ORDER SUMMARY
          ══════════════════════════════════════════ */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="sticky top-[76px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-[18px] font-black text-gray-900 tracking-tight">
                  Tóm tắt đơn hàng
                </h2>
              </div>

              <div className="px-6 py-5 space-y-4">

                {/* Promo code */}
                <div>
                  <button
                    onClick={() => setPromoOpen((v) => !v)}
                    className="w-full flex items-center justify-between text-[14px] font-semibold text-gray-700
                               py-2 hover:text-gray-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={15} className="text-gray-400" />
                      Mã khuyến mãi
                    </span>
                    <ChevronRight
                      size={16}
                      className={`text-gray-400 transition-transform duration-200 ${promoOpen ? "rotate-90" : ""}`}
                    />
                  </button>
                  {promoOpen && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã..."
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium
                                   outline-none focus:border-gray-900 transition-colors tracking-widest"
                      />
                      <button className="bg-gray-900 text-white px-5 rounded-xl text-[14px] font-semibold
                                         hover:bg-gray-700 transition-colors whitespace-nowrap">
                        Áp dụng
                      </button>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-50" />

                {/* Price breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[14px] text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-semibold text-gray-900">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[14px] text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Truck size={14} className="text-gray-400" />
                      Vận chuyển
                    </span>
                    <span className={`font-semibold ${shipping === 0 ? "text-green-600" : "text-gray-900"}`}>
                      {shipping === 0 ? "Miễn phí" : fmt(shipping)}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-black text-gray-900 text-[16px]">Tổng cộng</span>
                  <span className="font-black text-gray-900 text-[20px]">{fmt(total)}</span>
                </div>

                {/* VAT note */}
                <p className="text-[11px] text-gray-400 text-center -mt-1">
                  Đã bao gồm VAT (nếu có)
                </p>

                {/* CTA */}
                <Link
                  href={selectedCount > 0 ? "/checkout" : "#"}
                  onClick={(e) => {
                    if (selectedCount === 0) {
                      e.preventDefault();
                      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
                    }
                  }}
                  className={`w-full ${selectedCount === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-700 active:scale-[0.98]"} text-white font-bold py-4 rounded-2xl transition-colors text-[15px] flex items-center justify-center gap-2 shadow-sm`}
                >
                  Thanh toán ngay {selectedCount > 0 ? `(${selectedCount})` : ""}
                  <ArrowRight size={17} />
                </Link>

                {/* Continue shopping */}
                <Link
                  href="/"
                  className="w-full border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900
                             font-semibold py-3 rounded-2xl transition-all text-[14px] flex items-center justify-center gap-1.5"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>

              {/* Security note */}
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-center gap-2">
                <Shield size={13} className="text-gray-400" />
                <span className="text-[11px] text-gray-400 font-medium">
                  Thanh toán bảo mật 100% — SSL Encrypted
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}