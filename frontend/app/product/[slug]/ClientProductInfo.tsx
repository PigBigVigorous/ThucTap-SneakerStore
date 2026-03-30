"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "../../store/useCartStore"; 
import { useFavoritesStore } from "../../store/useFavoritesStore"; 
// 🚨 THÊM useAuth ĐỂ CHECK ĐĂNG NHẬP
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Star, Heart, Ruler, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ClientProductInfo({ product }: { product: any }) {
  const { token, user } = useAuth(); // Lấy token để gửi Đánh giá
  const addToCart = useCartStore((state) => state.addToCart);
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [showFavModal, setShowFavModal] = useState(false);
  
  // 🚨 STATE CHO BÌNH LUẬN & ĐÁNH GIÁ
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isFav = favorites.some((f) => f.product_id === product?.id);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedColor(product.variants[0]?.color || null);
    }
    if (product?.slug) fetchReviews();
  }, [product]);

  // 🚨 HÀM LẤY ĐÁNH GIÁ TỪ API
  const fetchReviews = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/products/${product.slug}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        setAvgRating(data.average_rating);
        setTotalReviews(data.total_reviews);
      }
    } catch (e) {}
  };

  // 🚨 HÀM GỬI ĐÁNH GIÁ MỚI
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Vui lòng đăng nhập để đánh giá sản phẩm!");
    
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setReviewForm({ rating: 5, comment: "" });
        fetchReviews(); // Tải lại danh sách
      } else {
        toast.error(data.message);
      }
    } catch (e) { toast.error("Lỗi kết nối máy chủ!"); }
    setIsSubmittingReview(false);
  };

  const handleColorChange = (color: any) => { setSelectedColor(color); setSelectedSize(null); setMainImageIndex(0); };

  let currentGalleryImages = ['/placeholder.png'];
  if (product?.images && product.images.length > 0) {
    const filteredImages = product.images.filter((img: any) => selectedColor && img.color_id === selectedColor.id).map((img: any) => img.image_url);
    currentGalleryImages = filteredImages.length > 0 ? filteredImages : product.images.map((img: any) => img.image_url);
  } else if (product?.base_image_url) {
    currentGalleryImages = [product.base_image_url];
  }

  const uniqueColors = product?.variants?.reduce((acc: any[], current: any) => {
    if (current?.color && !acc.find((item: any) => item.id === current.color.id)) acc.push(current.color);
    return acc;
  }, []) || [];

  const availableVariants = product?.variants
    ?.filter((v: any) => v?.color?.id === selectedColor?.id)
    .sort((a: any, b: any) => parseFloat(a.size?.name?.replace(/[^\d.-]/g, '') || '0') - parseFloat(b.size?.name?.replace(/[^\d.-]/g, '') || '0')) || [];
    
  const selectedVariant = availableVariants.find((v: any) => v?.size?.id === selectedSize?.id);

  const nextImage = () => setMainImageIndex((prev) => (prev + 1) % currentGalleryImages.length);
  const prevImage = () => setMainImageIndex((prev) => (prev - 1 + currentGalleryImages.length) % currentGalleryImages.length);

  const handleAddToCart = () => {
    if (!selectedSize) return toast.error("Vui lòng chọn Kích cỡ!");
    if ((selectedVariant?.total_stock || 0) === 0) return toast.error("Phân loại này đã hết hàng trên toàn hệ thống.");
    
    addToCart({
      variant_id: selectedVariant.id, product_id: product?.id, name: product?.name || 'Sản phẩm', 
      price: selectedVariant.price, image: currentGalleryImages[0], color: selectedColor?.name || '', 
      size: selectedSize?.name || '', quantity: 1, stock: selectedVariant.total_stock
    });
  };

  const handleToggleFavorite = () => {
    const isAdded = toggleFavorite({
      product_id: product?.id, product_name: product?.name || 'Sản phẩm', category_name: "Giày Nam",
      price: selectedVariant ? selectedVariant.price : (product?.variants?.[0]?.price || 0),
      image: currentGalleryImages[0], slug: product?.slug,
    });
    isAdded ? toast.success("Đã thêm vào Yêu thích") : toast.success("Đã xóa khỏi Yêu thích");
  };

  if (!product) return <div className="min-h-[60vh] flex items-center justify-center font-medium">Đang tải dữ liệu...</div>;

  return (
    <div suppressHydrationWarning className="bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* CỘT TRÁI: GALLERY */}
        <div className="lg:col-span-7 lg:pr-10 pt-10 lg:pt-0">
          <div className="flex flex-row gap-4 sticky top-24">
            <div className="w-[60px] shrink-0 flex flex-col gap-2.5 h-[580px] overflow-y-auto [&::-webkit-scrollbar]:hidden pr-1 pb-4">
              {currentGalleryImages.map((img: string, idx: number) => (
                <button key={idx} onMouseEnter={() => setMainImageIndex(idx)} onClick={() => setMainImageIndex(idx)} className={`relative aspect-square rounded-md overflow-hidden bg-[#F6F6F6] transition-all duration-200 shrink-0 ${idx === mainImageIndex ? 'border-[1.5px] border-black' : 'border border-transparent hover:border-gray-300'}`}>
                  <img src={img || '/placeholder.png'} alt="Thumbnail" className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
            <div className="flex-1 bg-[#F6F6F6] rounded-xl relative h-[580px] flex items-center justify-center overflow-hidden group">
              <img src={currentGalleryImages[mainImageIndex] || '/placeholder.png'} alt={product?.name} className="w-full h-full object-contain mix-blend-multiply" />
              <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button onClick={prevImage} className="bg-white p-3.5 rounded-full shadow-md hover:bg-gray-100 flex items-center justify-center"><ChevronLeft size={20}/></button>
                <button onClick={nextImage} className="bg-white p-3.5 rounded-full shadow-md hover:bg-gray-100 flex items-center justify-center"><ChevronRight size={20}/></button>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: INFO */}
        <div className="lg:col-span-5 pt-10 lg:pt-0 lg:px-10 pb-10">
          <div className="sticky top-28 space-y-8">
            <div className="pb-4">
              <h1 className="text-[32px] font-medium text-gray-900 leading-tight">{product?.name}</h1>
              
              {/* Hiển thị Điểm số nhanh */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-yellow-400">
                  <Star size={18} fill="currentColor" stroke="none" />
                  <span className="text-gray-900 font-bold ml-1">{avgRating}</span>
                </div>
                <span className="text-gray-500 underline text-sm cursor-pointer" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({behavior: 'smooth'})}>({totalReviews} đánh giá)</span>
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-[24px] font-medium text-gray-900">
                  {selectedVariant ? Number(selectedVariant.price).toLocaleString('vi-VN') : Number(product?.variants?.[0]?.price || 0).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {/* Chọn Màu & Size (Giữ nguyên của ngài) */}
            {uniqueColors.length > 1 && (
              <div className="py-2 flex flex-wrap gap-2.5">
                {uniqueColors.map((color: any) => (
                  <button key={color.id} onClick={() => handleColorChange(color)} className={`w-[70px] h-[70px] rounded-lg overflow-hidden border-2 bg-[#F6F6F6] ${selectedColor?.id === color.id ? 'border-gray-900' : 'border-transparent hover:border-gray-300'}`} title={color.name}>
                    <img src={product.images?.find((img: any) => img.color_id === color.id)?.image_url || product?.base_image_url} alt={color.name} className="w-full h-full object-contain mix-blend-multiply p-1" />
                  </button>
                ))}
              </div>
            )}

            <div className="py-2">
              <div className="flex justify-between items-center mb-3">
                <p className="font-medium text-gray-900 text-base">Chọn Kích Cỡ</p>
                <Link href="/size-guide" target="_blank" className="text-gray-500 hover:text-black font-bold text-sm flex items-center gap-1.5 uppercase underline underline-offset-4">Size Guide <Ruler size={15}/></Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {availableVariants.map((v: any) => {
                  const isOutOfStock = (v.total_stock || 0) === 0;
                  return (
                    <button key={v.size.id} disabled={isOutOfStock} onClick={() => setSelectedSize(v.size)} className={`py-4 rounded-md font-medium text-base border text-center ${isOutOfStock ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-200' : selectedSize?.id === v.size.id ? 'border-gray-900 ring-1 ring-gray-900 text-gray-900' : 'border-gray-200 hover:border-gray-900'}`}>
                      {v?.size?.name?.replace(/[^\d.-]/g, '') || ''}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3.5 pt-4">
              <button onClick={handleAddToCart} className="w-full bg-black text-white hover:bg-gray-800 font-medium py-5 rounded-full text-lg active:scale-[0.98]">Thêm vào Giỏ hàng</button>
              <button onClick={handleToggleFavorite} className="w-full bg-white text-gray-900 border border-gray-300 hover:border-gray-900 font-medium py-5 rounded-full flex justify-center items-center gap-2.5 text-lg active:scale-[0.98]">
                {isFav ? 'Đã yêu thích' : 'Yêu thích'} <Heart size={20} className={isFav ? "fill-black text-black" : "text-gray-900"} />
              </button>
            </div>
            
            <div className="pt-10 pb-6 border-t border-gray-100 mt-10">
              <p className="text-gray-900 text-base leading-relaxed font-medium mb-6">{product?.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 KHU VỰC BÌNH LUẬN & ĐÁNH GIÁ (FULL WIDTH Ở DƯỚI CÙNG) */}
      <div id="reviews-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-200 mt-10">
        <h2 className="text-2xl font-black text-gray-900 uppercase mb-8">Đánh giá Sản phẩm ({totalReviews})</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Cột Viết đánh giá */}
          <div className="lg:col-span-4">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Bạn thấy sản phẩm này thế nào?</h3>
              {token ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chấm điểm:</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="focus:outline-none transition-transform hover:scale-110">
                          <Star size={28} className={star <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bình luận của bạn:</label>
                    <textarea required value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={3} placeholder="Sản phẩm đi êm chân, đúng size..." className="w-full p-3 border border-gray-300 rounded-xl focus:ring-black focus:border-black outline-none resize-none text-black font-bold"></textarea>
                  </div>
                  <button type="submit" disabled={isSubmittingReview} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition-colors ">
                    {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 bg-white rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">Vui lòng đăng nhập để đánh giá</p>
                  <Link href="/login" className="inline-block bg-black text-white px-6 py-2 rounded-full font-medium text-sm">Đăng nhập ngay</Link>
                </div>
              )}
            </div>
          </div>

          {/* Cột Danh sách đánh giá */}
          <div className="lg:col-span-8">
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <Star size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Chưa có đánh giá nào. Hãy trở thành người đầu tiên đánh giá!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{review.user?.name || "Khách hàng ẩn danh"}</span>
                      <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}