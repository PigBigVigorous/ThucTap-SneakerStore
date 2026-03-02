"use client";

import Link from "next/link";
import { useFavorites } from "../context/FavoritesContext";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavorites();

  const handleRemove = (item: any) => {
    toggleFavorite(item);
    toast("Đã xóa khỏi danh sách Yêu thích", { icon: "🗑️" });
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header Trang */}
      <div className="max-w-[1400px] mx-auto px-6 py-10 sticky top-[64px] bg-white z-10">
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">Danh sách Yêu thích</h1>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pb-20">
        {favorites.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-gray-500 text-lg font-medium">
              Các sản phẩm bạn yêu thích sẽ được lưu tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-12">
            {favorites.map((item) => (
              <div key={item.product_id} className="group relative flex flex-col">
                {/* Khu vực ảnh */}
                <div className="relative aspect-square bg-[#F5F5F5] overflow-hidden mb-4">
                  <Link href={`/product/${item.slug}`} className="block w-full h-full">
                    <img 
                      src={item.image} 
                      alt={item.product_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </Link>
                  {/* Nút tim nổi trên ảnh */}
                  <button 
                    onClick={() => handleRemove(item)}
                    className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-sm hover:scale-110 transition-transform"
                    title="Xóa khỏi Yêu thích"
                  >
                    <Heart size={20} className="fill-black text-black" />
                  </button>
                </div>

                {/* Khu vực thông tin */}
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 text-base line-clamp-1">{item.product_name}</h3>
                      <p className="text-gray-500 text-base mt-1">{item.category_name}</p>
                    </div>
                    <p className="font-medium text-gray-900 text-base whitespace-nowrap">
                      {Number(item.price).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  {/* Nút Add to Bag nhanh */}
                  <div className="mt-6">
                    <Link 
                      href={`/product/${item.slug}`}
                      className="inline-block w-full text-center bg-white text-gray-900 border border-gray-300 hover:border-black font-medium py-3.5 rounded-full transition-colors"
                    >
                      Tùy chọn Mua hàng
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}