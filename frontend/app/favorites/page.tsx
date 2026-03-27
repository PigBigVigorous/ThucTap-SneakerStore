"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFavoritesStore } from "../store/useFavoritesStore"; 
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const router = useRouter();

  // NẾU CHƯA CÓ SẢN PHẨM NÀO
  if (favorites.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4">
        <h1 className="text-[28px] font-medium text-gray-900 mb-4">Mục Yêu Thích Đang Trống</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md text-base">
          Có vẻ như bạn chưa lưu sản phẩm nào. Khám phá ngay và thêm những mẫu giày bạn yêu thích vào đây nhé!
        </p>
        <Link href="/" className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors">
          Khám phá ngay
        </Link>
      </div>
    );
  }

  // GIAO DIỆN CHUẨN NIKE.COM
  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-10">
        
        <header className="mb-8">
          <h1 className="text-[24px] font-medium text-gray-900 tracking-tight">
            Yêu thích (Favourites)
          </h1>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
          {favorites.map((item) => (
            <div key={item.product_id} className="group flex flex-col">
              
              <div className="relative aspect-square bg-[#F5F5F5] rounded-md overflow-hidden mb-3">
                <Link href={`/product/${item.slug}`} className="block w-full h-full">
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.product_name}
                    className="w-full h-full object-contain mix-blend-multiply p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                
                <button
                  onClick={() => toggleFavorite(item)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform"
                  title="Xóa khỏi Yêu thích"
                >
                  <Heart size={20} className="fill-black text-black" />
                </button>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <Link href={`/product/${item.slug}`} className="hover:text-gray-600 transition-colors pr-2">
                    <h3 className="text-base font-medium text-gray-900 line-clamp-1">{item.product_name}</h3>
                  </Link>
                  <span className="text-base font-medium text-gray-900 whitespace-nowrap">
                    {Number(item.price).toLocaleString('vi-VN')} ₫
                  </span>
                  
                </div>
                <p className="text-base text-gray-500 mb-6">{item.category_name || "Giày Thể Thao"}</p>

                <button 
                  onClick={() => router.push(`/product/${item.slug}`)}
                  className="mt-auto w-full py-4 rounded-full border border-gray-300 font-medium text-gray-900 hover:border-black transition-colors"
                >
                  Add to Bag
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </main>
  );
}