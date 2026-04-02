"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "../../store/useCartStore";
import { useFavoritesStore } from "../../store/useFavoritesStore";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Star, Heart, ChevronLeft, ChevronRight, Ruler, ChevronDown, X, ZoomIn } from "lucide-react";
import Link from "next/link";

export default function ClientProductInfo({ product }: { product: any }) {
  const { token } = useAuth();
  const addToCart = useCartStore((state) => state.addToCart);
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const isFav = favorites.some((f) => f.product_id === product?.id);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedColor(product.variants[0]?.color || null);
    }
    if (product?.slug) {
      fetchReviews();
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/products/${product.slug}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        setAvgRating(data.average_rating);
        setTotalReviews(data.total_reviews);
      }
    } catch (e) {}
  };

  const fetchRelatedProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/products`);
      const data = await res.json();
      if (data.data) {
        setRelatedProducts(data.data.filter((p: any) => p.id !== product?.id).slice(0, 4));
      }
    } catch (e) {}
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Vui lòng đăng nhập để đánh giá!");
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/products/${product.slug}/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message); setReviewForm({ rating: 5, comment: "" }); fetchReviews();
      } else { toast.error(data.message); }
    } catch (e) { toast.error("Lỗi kết nối máy chủ!"); }
    setIsSubmittingReview(false);
  };

  const handleColorChange = (color: any) => {
    setSelectedColor(color); setSelectedSize(null); setMainImageIndex(0);
  };

  // LOGIC LẤY ẢNH CHUẨN: Gom ảnh chính và ảnh phụ theo màu, lọc trùng lặp
  // ==========================================
  // 🚀 LOGIC LẤY ẢNH CHUẨN (CÁCH LY TUYỆT ĐỐI MÀU SẮC)
  // ==========================================
  let currentGalleryImages: string[] = [];

  // 1. Lọc lấy ảnh ĐỘC QUYỀN của màu đang chọn
  const colorSpecificImages = product?.images
    ?.filter((img: any) => selectedColor && Number(img.color_id) === Number(selectedColor.id))
    .map((img: any) => img.image_url) || [];

  if (colorSpecificImages.length > 0) {
    // Tình huống A: Màu Đỏ có ảnh -> CHỈ HIỆN ẢNH ĐỎ
    currentGalleryImages = [...colorSpecificImages];
  } else {
    // Tình huống B: Màu Đỏ KHÔNG có ảnh -> CHỈ DÙNG ẢNH ĐẠI DIỆN CHUNG, cấm lôi ảnh Gallery màu khác sang!
    if (product?.base_image_url) {
      currentGalleryImages = [product.base_image_url];
    }
  }

  // Lọc trùng lặp URL (Phòng hờ)
  currentGalleryImages = Array.from(new Set(currentGalleryImages));

  if (currentGalleryImages.length === 0) {
    currentGalleryImages = ["/placeholder.png"];
  }
  const uniqueColors = product?.variants?.reduce((acc: any[], current: any) => {
    if (current?.color && !acc.find((item: any) => item.id === current.color.id)) acc.push(current.color);
    return acc;
  }, []) || [];

  const availableVariants = product?.variants?.filter((v: any) => v?.color?.id === selectedColor?.id).sort(
    (a: any, b: any) => parseFloat(a.size?.name?.replace(/[^\d.-]/g, "") || "0") - parseFloat(b.size?.name?.replace(/[^\d.-]/g, "") || "0")
  ) || [];

  const selectedVariant = availableVariants.find((v: any) => v?.size?.id === selectedSize?.id);
  const currentStock = selectedVariant?.total_stock || 0;
  const displayPrice = selectedVariant ? selectedVariant.price : product?.variants?.[0]?.price || 0;

  const nextImage = () => setMainImageIndex((prev) => (prev + 1) % currentGalleryImages.length);
  const prevImage = () => setMainImageIndex((prev) => (prev - 1 + currentGalleryImages.length) % currentGalleryImages.length);

  const handleAddToCart = () => {
    if (!selectedSize) return toast.error("Vui lòng chọn Kích cỡ!");
    if (currentStock === 0) return toast.error("Phân loại này đã hết hàng.");
    addToCart({ variant_id: selectedVariant.id, product_id: product?.id, name: product?.name || 'Sản phẩm', price: selectedVariant.price, image: currentGalleryImages[0], color: selectedColor?.name || '', size: selectedSize?.name || '', quantity: 1, stock: currentStock, slug: product?.slug });
  };

  const handleToggleFavorite = () => {
    const isAdded = toggleFavorite({ product_id: product?.id, product_name: product?.name || "Sản phẩm", category_name: product?.category_name || "Giày Nam", price: displayPrice, image: currentGalleryImages[0], slug: product?.slug });
    isAdded ? toast.success("Đã thêm vào Yêu thích") : toast.success("Đã xóa khỏi Yêu thích");
  };

  const toggleAccordion = (key: string) => setOpenAccordion((prev) => (prev === key ? null : key));

  if (!product) return <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div suppressHydrationWarning className="bg-white font-sans text-gray-900">

      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 p-3 bg-gray-100 hover:bg-gray-200 rounded-full z-50">
            <X size={24} />
          </button>
          <img src={currentGalleryImages[mainImageIndex] || "/placeholder.png"} alt="Zoom" className="max-w-full max-h-[90vh] object-contain cursor-zoom-out" onClick={() => setIsLightboxOpen(false)} />
        </div>
      )}
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        
        {/* KHUNG ẢNH GIAO DIỆN NIKE UX */}
        <div className="lg:col-span-8 lg:sticky lg:top-24" aria-roledescription="carousel">
          <span className="sr-only" aria-live="polite" aria-atomic="true">Image {mainImageIndex + 1} of {currentGalleryImages.length}</span>
          <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-4 relative">
            <div className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto md:h-[680px] w-full md:w-[72px] shrink-0 scrollbar-hide z-10">
              {currentGalleryImages.map((img: string, idx: number) => {
                const isActive = idx === mainImageIndex;
                return (
                  <button
                    key={idx} onMouseEnter={() => setMainImageIndex(idx)} onClick={() => setMainImageIndex(idx)} aria-label={`View image ${idx + 1}`} aria-current={isActive}
                    className={`relative shrink-0 w-[60px] h-[60px] md:w-[72px] md:h-[72px] rounded-lg overflow-hidden bg-[#f5f5f5] transition-all duration-200 group ${isActive ? "ring-2 ring-black ring-offset-2" : "hover:ring-1 hover:ring-gray-300 ring-offset-1"}`}
                  >
                    <img src={img || "/placeholder.png"} alt="" className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100" />
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black"></div>}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 bg-[#f5f5f5] rounded-xl relative h-[400px] md:h-[680px] flex items-center justify-center overflow-hidden group">
              <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm pointer-events-none">
                <Star size={14} className="fill-[#111] text-[#111]" />
                <span className="text-[12px] font-bold tracking-wide text-[#111] uppercase">Highly Rated</span>
              </div>

              <button onClick={() => setIsLightboxOpen(true)} className="absolute top-4 right-4 md:top-6 md:left-auto md:right-6 z-20 bg-white/90 backdrop-blur-sm p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm hover:scale-110" aria-label="Phóng to">
                <ZoomIn size={20} className="text-[#111]"/>
              </button>

              {currentGalleryImages.map((img: string, idx: number) => (
                <div key={idx} onClick={() => setIsLightboxOpen(true)} className={`absolute inset-0 flex items-center justify-center w-full h-full cursor-zoom-in transition-opacity duration-500 ease-in-out ${idx === mainImageIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
                  <img src={img || "/placeholder.png"} alt="Product" className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ${idx === mainImageIndex ? "scale-100 group-hover:scale-105" : "scale-95"}`} />
                </div>
              ))}

              {currentGalleryImages.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 md:-translate-x-4 md:group-hover:translate-x-0 transition-all duration-300">
                    <ChevronLeft size={20} className="text-[#111] pr-0.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 md:translate-x-4 md:group-hover:translate-x-0 transition-all duration-300">
                    <ChevronRight size={20} className="text-[#111] pl-0.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col pt-4 md:pt-0">
          <nav className="flex text-[13px] text-gray-500 mb-4 whitespace-nowrap overflow-x-auto scrollbar-hide">
            <Link href="/" className="hover:text-black">Trang chủ</Link><span className="mx-2">/</span>
            <Link href={`/`} className="hover:text-black">{product?.category_name || "Danh mục"}</Link><span className="mx-2">/</span>
            <span className="text-black font-medium truncate">{product?.name}</span>
          </nav>

          <div className="mb-4">
            <h1 className="text-[24px] md:text-[28px] font-medium leading-tight text-[#111] m-0">{product?.name}</h1>
            <h2 className="text-[16px] text-[#757575] mt-1">{product?.category_name || "Giày Nam"}</h2>
          </div>

          <div className="mb-6"><span className="text-[16px] md:text-[18px] font-medium text-[#111]">{Number(displayPrice).toLocaleString("vi-VN")}₫</span></div>

          {uniqueColors.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {uniqueColors.map((color: any) => (
                <button key={color.id} onClick={() => handleColorChange(color)} title={color.name} className={`w-[60px] h-[60px] rounded-md bg-[#f5f5f5] p-1 transition-colors ${selectedColor?.id === color.id ? "border-[2px] border-[#111]" : "border-[2px] border-transparent hover:border-gray-300"}`}>
                  <img src={product.images?.find((img: any) => img.color_id === color.id)?.image_url || product?.base_image_url} alt={color.name} className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}

          <div className="mb-8">
            <div className="flex justify-between items-end mb-4 gap-4">
              <p className="text-base font-medium text-gray-900 leading-none m-0">Chọn Kích Cỡ</p>
              <Link href="/size-guide" target="_blank" className="group flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 uppercase">
                <span className="underline underline-offset-4">Size Guide</span><Ruler size={16} className="mb-[2px]" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {availableVariants.map((v: any) => {
                const isOutOfStock = (v.total_stock || 0) === 0;
                const isSelected = selectedSize?.id === v.size.id;
                return (
                  <button key={v.size.id} disabled={isOutOfStock} onClick={() => setSelectedSize(v.size)} className={`relative py-3.5 rounded-md text-[14px] text-center transition-all ${isSelected ? "border border-[#111] bg-white text-[#111] ring-1 ring-[#111]" : isOutOfStock ? "border border-[#e5e5e5] bg-[#fafafa] text-[#ccc] cursor-not-allowed" : "border border-[#e5e5e5] bg-white text-[#111] hover:border-[#111]"}`}>
                    {isOutOfStock && <span className="absolute inset-0 flex items-center justify-center opacity-40"><svg width="100%" height="100%" className="absolute"><line x1="0" y1="100%" x2="100%" y2="0" stroke="#111" strokeWidth="1" /></svg></span>}
                    {v?.size?.name || ""}
                  </button>
                );
              })}
            </div>

            {selectedSize && currentStock > 0 && currentStock <= 3 && <p className="mt-3 text-[14px] font-medium text-red-600 animate-pulse flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>Sắp hết hàng! Chỉ còn đúng {currentStock} đôi.</p>}
            {selectedSize && currentStock === 0 && <p className="mt-3 text-[14px] font-medium text-gray-500">Size này hiện đã hết hàng.</p>}
          </div>

          <div className="flex flex-col gap-3 mb-8">
            <button onClick={handleAddToCart} className="w-full py-4 md:py-5 rounded-full bg-[#111] text-white text-[16px] font-medium hover:bg-[#333] active:scale-[0.98] transition-all">Thêm vào Giỏ hàng</button>
            <button onClick={handleToggleFavorite} className="w-full py-4 md:py-5 rounded-full bg-white text-[#111] border border-[#e5e5e5] text-[16px] font-medium hover:border-[#111] flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              {isFav ? "Đã yêu thích" : "Yêu thích"} <Heart size={20} className={isFav ? "fill-[#111] text-[#111]" : "text-[#111]"} />
            </button>
          </div>

          <p className="text-[15px] text-[#111] leading-relaxed mb-8">{product?.description || "Chưa có mô tả cho sản phẩm này."}</p>

          <div className="border-t border-[#e5e5e5]">
            {[
              { key: "size-fit", label: "Kích Cỡ & Độ Vừa Vặn", content: <ul className="pl-5 text-[14px] text-[#444] list-disc"><li>Vừa nhỏ; chúng tôi khuyên bạn nên đặt nửa size lớn hơn</li><li><Link href="/size-guide" target="_blank" className="text-[#111] underline">Hướng dẫn chọn size</Link></li></ul> },
              { key: "delivery", label: "Miễn Phí Giao Hàng", content: <div className="text-[14px] text-[#444]"><p>Đơn hàng từ 5.000.000₫ được miễn phí giao hàng.</p></div> },
              { key: "reviews", label: `Đánh Giá (${totalReviews})`, content: (
                <div className="pt-2">
                  {token ? (
                    <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3 mb-6">
                      <p className="text-[14px] font-medium text-[#111]">Viết đánh giá của bạn:</p>
                      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => (<button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}><Star size={24} className={star <= reviewForm.rating ? "fill-[#111] text-[#111]" : "text-[#111]"} /></button>))}</div>
                      <textarea required value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={3} placeholder="Cảm nhận..." className="p-3 border border-[#e5e5e5] rounded-lg text-[14px]" />
                      <button type="submit" disabled={isSubmittingReview} className="self-start px-6 py-3 rounded-full bg-[#111] text-white text-[14px]">{isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}</button>
                    </form>
                  ) : <div className="mb-5"><Link href="/login" className="px-5 py-2.5 rounded-full bg-[#111] text-white text-[14px]">Đăng nhập để đánh giá</Link></div>}
                  {reviews.length > 0 && reviews.map((review) => (
                    <div key={review.id} className="border-t border-[#f5f5f5] pt-4 mb-4">
                      <div className="flex justify-between mb-1.5"><span className="text-[14px] font-medium text-[#111]">{review.user?.name}</span></div>
                      <p className="text-[14px] text-[#444]">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )},
            ].map(({ key, label, content }) => (
              <div key={key} className="border-b border-[#e5e5e5]">
                <button onClick={() => toggleAccordion(key)} className="w-full flex justify-between items-center py-5 text-[15px] font-medium text-[#111] hover:text-gray-600 transition-colors">
                  {label}<ChevronDown size={20} className={`transition-transform duration-300 ${openAccordion === key ? "rotate-180" : "rotate-0"}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openAccordion === key ? "max-h-[1500px] opacity-100 pb-5" : "max-h-0 opacity-0"}`}>{content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-16 border-t border-[#e5e5e5]">
          <h3 className="text-[24px] font-medium text-[#111] mb-8">Có thể bạn cũng thích</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((item) => (
              <Link href={`/product/${item.slug}`} key={item.id} className="group flex flex-col cursor-pointer">
                <div className="bg-[#f5f5f5] rounded-xl aspect-square overflow-hidden mb-4 relative">
                  <img src={item.base_image_url || "/placeholder.png"} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h4 className="text-[15px] font-medium text-[#111] truncate">{item.name}</h4>
                <p className="text-[15px] font-medium text-[#111] mt-2">{Number(item.base_price || 0).toLocaleString("vi-VN")}₫</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}