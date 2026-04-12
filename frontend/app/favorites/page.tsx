"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "../store/useCartStore";
import { useFavoritesStore } from "../store/useFavoritesStore";
import { Heart, ShoppingBag, ArrowRight, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

const fmt = (n: number) => Number(n).toLocaleString("vi-VN") + " ₫";

export default function FavoritesPage() {
  const favorites     = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const clearFavorites = useFavoritesStore((s) => s.clearFavorites);

  const addToCart  = useCartStore((s) => s.addToCart);
  const cartItems  = useCartStore((s) => s.items);

  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = (item: typeof favorites[0]) => {
    setRemovingId(item.product_id);
    setTimeout(() => {
      toggleFavorite(item);
      setRemovingId(null);
    }, 260);
  };

  const handleMoveToCart = (item: typeof favorites[0]) => {
    // Chuyển sang trang sản phẩm để chọn size — không thể add trực tiếp vì chưa có variant
    toast("Chọn size để thêm vào giỏ hàng", { icon: "👟" });
    window.location.href = `/product/${item.slug}`;
  };

  // ── Empty state ────────────────────────────────────────────────────────────

  if (favorites.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4 py-20">
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-rose-50 flex items-center justify-center">
            <Heart size={44} className="text-rose-200" strokeWidth={1.2} />
          </div>
        </div>

        <h1 className="text-[26px] font-bold text-gray-900 mb-3 tracking-tight">
          Chưa có sản phẩm yêu thích
        </h1>
        <p className="text-gray-400 mb-10 text-center max-w-[340px] text-[15px] leading-relaxed">
          Nhấn vào biểu tượng ❤ trên sản phẩm bất kỳ để lưu lại những đôi giày bạn thích.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full
                     font-semibold text-[15px] hover:bg-gray-700 transition-colors"
        >
          Khám phá ngay <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 lg:pt-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-[28px] font-black text-gray-900 tracking-tight flex items-center gap-3">
              Yêu thích
              <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-900 text-white text-[13px] font-black rounded-full">
                {favorites.length}
              </span>
            </h1>
            <p className="text-[14px] text-gray-400 mt-1">
              {favorites.length} sản phẩm được lưu
            </p>
          </div>

          {favorites.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Xóa tất cả sản phẩm yêu thích?")) {
                  clearFavorites();
                  toast("Đã xóa tất cả yêu thích", { icon: "🗑️" });
                }
              }}
              className="flex items-center gap-2 text-[13px] font-semibold text-gray-400
                         hover:text-red-500 transition-colors px-4 py-2 rounded-full border border-gray-200
                         hover:border-red-200 hover:bg-red-50"
            >
              <Trash2 size={14} />
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {favorites.map((item) => {
            const isRemoving = removingId === item.product_id;
            const inCart = cartItems.some((c) => c.product_id === item.product_id);

            return (
              <div
                key={item.product_id}
                className={`group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm
                            flex flex-col transition-all duration-260
                            ${isRemoving ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
              >
                {/* Remove button (top-right) */}
                <button
                  onClick={() => handleRemove(item)}
                  title="Xóa khỏi Yêu thích"
                  className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center
                             bg-white/80 backdrop-blur-sm rounded-full shadow-sm
                             text-gray-400 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>

                {/* Heart badge (always visible) */}
                <span className="absolute top-3 left-3 z-10 w-7 h-7 flex items-center justify-center
                                 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                  <Heart size={14} className="fill-rose-500 text-rose-500" />
                </span>

                {/* Image */}
                <Link
                  href={`/product/${item.slug}`}
                  className="block bg-[#f5f5f5] aspect-square overflow-hidden"
                >
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.product_name}
                    className="w-full h-full object-contain mix-blend-multiply p-4
                               group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <Link href={`/product/${item.slug}`} className="block mb-0.5">
                    <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-2
                                   hover:text-gray-600 transition-colors leading-snug">
                      {item.product_name}
                    </h3>
                  </Link>
                  <p className="text-[12px] text-gray-400 mb-3">
                    {item.category_name || "Giày Thể Thao"}
                  </p>
                  <p className="text-[15px] font-black text-gray-900 mb-4">
                    {fmt(item.price)}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className={`mt-auto w-full py-2.5 rounded-xl text-[13px] font-bold transition-all
                      flex items-center justify-center gap-2
                      ${inCart
                        ? "bg-gray-100 text-gray-500 cursor-default"
                        : "bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98]"
                      }`}
                    disabled={inCart}
                  >
                    <ShoppingBag size={14} />
                    {inCart ? "Đã trong giỏ" : "Chọn size & Mua"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue shopping */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600
                       px-8 py-3 rounded-full text-[14px] font-semibold hover:border-gray-900
                       hover:text-gray-900 transition-all"
          >
            Tiếp tục khám phá <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </main>
  );
}