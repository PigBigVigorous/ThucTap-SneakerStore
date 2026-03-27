"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useFavoritesStore } from "./store/useFavoritesStore";

export default function ClientHome({ initialProducts }: { initialProducts: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  //  Hút hàm xử lý Yêu thích từ Context
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  // Tự động lọc sản phẩm mỗi khi gõ phím
  const filteredProducts = initialProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //  HÀM XỬ LÝ KHI BẤM VÀO TRÁI TIM
  const handleToggleFavorite = (e: React.MouseEvent, product: any) => {
    e.preventDefault(); // Ngăn trình duyệt nhảy lên đầu trang
    e.stopPropagation(); // Ngăn thẻ Link bên dưới kích hoạt chuyển trang

    const price = product.variants?.[0]?.price || 0;
    
    // Gửi data sang Context
    const isAdded = toggleFavorite({
      product_id: product.id,
      product_name: product.name,
      category_name: product.brand?.name || "Giày Thể Thao",
      price: price,
      image: product.base_image_url,
      slug: product.slug,
    });

    // Thông báo cho User
    if (isAdded) {
      toast.success("Đã thêm vào Yêu thích!");
    } else {
      toast("Đã xóa khỏi Yêu thích", { icon: "🗑️" });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      
      {/* --- HERO BANNER (Khu vực quảng cáo) --- */}
      <div className="relative bg-black text-white py-24 px-8 mb-12 flex flex-col items-center justify-center text-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1552346154-21d32810baa3?q=80&w=2000&auto=format&fit=crop')" }}
        ></div>
        
        <div className="relative z-10 max-w-3xl mt-4">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic drop-shadow-lg">
            BƯỚC ĐI TỰ TIN <br/><span className="text-red-500">DẪN ĐẦU PHONG CÁCH</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 font-medium drop-shadow-md">
            Khám phá bộ sưu tập những đôi giày giới hạn, độc quyền và mới nhất từ các thương hiệu hàng đầu thế giới.
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <input 
              type="text" 
              placeholder="Bạn muốn tìm đôi giày nào? (VD: Nike, Air Force...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-8 py-4 rounded-full text-white text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-red-500 shadow-2xl transition-all"
            />
            <button className="absolute right-2 top-2 bg-red-600 hover:bg-red-700 text-white p-2 px-8 rounded-full font-bold text-lg transition-colors shadow-md">
              Tìm
            </button>
          </div>
        </div>
      </div>

      {/* --- DANH SÁCH SẢN PHẨM --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-end mb-8 border-b-2 border-gray-200 pb-4">
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-wide">
            {searchTerm ? `Kết quả cho: "${searchTerm}"` : "Sản Phẩm Mới Nhất"}
          </h2>
          <p className="text-gray-500 font-bold bg-gray-200 px-4 py-1 rounded-full">
            {filteredProducts.length} sản phẩm
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500 font-bold mb-4">Không tìm thấy sản phẩm nào phù hợp! 😢</p>
            <button onClick={() => setSearchTerm("")} className="text-blue-500 font-bold hover:underline">
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product: any) => {
              // Kiểm tra xem sản phẩm này đã được thả tim chưa
              const isFav = favorites.some((f) => f.product_id === product.id);
              
              return (
                <div
                  key={product.id}
                  className="relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 block overflow-hidden group border border-gray-100"
                >
                  <button 
                    onClick={(e) => handleToggleFavorite(e, product)}
                    className="absolute top-4 right-4 z-20 bg-white p-2.5 rounded-full shadow-md hover:scale-110 transition-transform"
                    title={isFav ? "Xóa khỏi Yêu thích" : "Thêm vào Yêu thích"}
                  >
                    <Heart size={20} className={isFav ? "fill-black text-black" : "text-gray-400"} strokeWidth={isFav ? 1 : 2} />
                  </button>

                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="relative h-72 w-full bg-gray-100 overflow-hidden">
                      <img
                        src={product.base_image_url}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Dời nhãn HOT sang trái */}
                      <span className="absolute top-4 left-4 bg-black text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md z-10">
                        HOT
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-xs text-gray-500 font-black mb-1 uppercase tracking-widest">
                        {product.brand?.name}
                      </p>
                      <h2 className="text-lg font-bold text-gray-900 mb-2 truncate group-hover:text-red-600 transition-colors">
                        {product.name}
                      </h2>
                      <p className="text-xl text-red-600 font-black">
                        {product.variants[0]?.price 
                          ? Number(product.variants[0].price).toLocaleString('vi-VN') + ' ₫'
                          : 'Liên hệ'}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}