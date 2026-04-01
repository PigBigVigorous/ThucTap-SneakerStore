"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "../../store/useCartStore";
import { useFavoritesStore } from "../../store/useFavoritesStore";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Star, Heart, ChevronLeft, ChevronRight, Ruler, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function ClientProductInfo({ product }: { product: any }) {
  const { token } = useAuth();

  const addToCart = useCartStore((state) => state.addToCart);
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);

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
    if (product?.slug) fetchReviews();
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Vui lòng đăng nhập để đánh giá sản phẩm!");
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setReviewForm({ rating: 5, comment: "" });
        fetchReviews();
      } else {
        toast.error(data.message);
      }
    } catch (e) { toast.error("Lỗi kết nối máy chủ!"); }
    setIsSubmittingReview(false);
  };

  const handleColorChange = (color: any) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setMainImageIndex(0);
  };

  let currentGalleryImages = ["/placeholder.png"];
  if (product?.images && product.images.length > 0) {
    const filteredImages = product.images
      .filter((img: any) => selectedColor && img.color_id === selectedColor.id)
      .map((img: any) => img.image_url);
    currentGalleryImages = filteredImages.length > 0 ? filteredImages : product.images.map((img: any) => img.image_url);
  } else if (product?.base_image_url) {
    currentGalleryImages = [product.base_image_url];
  }

  const uniqueColors = product?.variants?.reduce((acc: any[], current: any) => {
    if (current?.color && !acc.find((item: any) => item.id === current.color.id)) acc.push(current.color);
    return acc;
  }, []) || [];

  const availableVariants = product?.variants?.filter((v: any) => v?.color?.id === selectedColor?.id).sort(
    (a: any, b: any) => parseFloat(a.size?.name?.replace(/[^\d.-]/g, "") || "0") - parseFloat(b.size?.name?.replace(/[^\d.-]/g, "") || "0")
  ) || [];

  const selectedVariant = availableVariants.find((v: any) => v?.size?.id === selectedSize?.id);

  const nextImage = () => setMainImageIndex((prev) => (prev + 1) % currentGalleryImages.length);
  const prevImage = () => setMainImageIndex((prev) => (prev - 1 + currentGalleryImages.length) % currentGalleryImages.length);

  const handleAddToCart = () => {
    if (!selectedSize) return toast.error("Vui lòng chọn Kích cỡ!");
    if ((selectedVariant?.total_stock || 0) === 0) return toast.error("Phân loại này đã hết hàng trên toàn hệ thống.");
    
    addToCart({
      variant_id: selectedVariant.id, 
      product_id: product?.id, 
      name: product?.name || 'Sản phẩm', 
      price: selectedVariant.price, 
      image: currentGalleryImages[0], 
      color: selectedColor?.name || '', 
      size: selectedSize?.name || '', 
      quantity: 1, 
      stock: selectedVariant.total_stock,
      slug: product?.slug 
    });
  };

  const handleToggleFavorite = () => {
    const isAdded = toggleFavorite({
      product_id: product?.id,
      product_name: product?.name || "Sản phẩm",
      category_name: "Giày Nam",
      price: selectedVariant ? selectedVariant.price : product?.variants?.[0]?.price || 0,
      image: currentGalleryImages[0],
      slug: product?.slug,
    });
    isAdded ? toast.success("Đã thêm vào Yêu thích") : toast.success("Đã xóa khỏi Yêu thích");
  };

  const toggleAccordion = (key: string) => setOpenAccordion((prev) => (prev === key ? null : key));

  const displayPrice = selectedVariant ? selectedVariant.price : product?.variants?.[0]?.price || 0;

  if (!product)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-base font-medium text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div suppressHydrationWarning className="bg-white font-sans text-gray-900">
      
      {/* ── BỐ CỤC CHUẨN GRID 12 CỘT TƯƠNG THÍCH MỌI MÀN HÌNH ── */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        
        {/* ── TRÁI: KHUNG ẢNH SẢN PHẨM (CHIẾM 8 CỘT TRÊN DESKTOP) ── */}
        <div className="lg:col-span-8 lg:sticky lg:top-24">
          <div className="flex flex-col-reverse md:flex-row gap-4">
            
            {/* Thanh cuộn ảnh Thumbnail */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:h-[680px] w-full md:w-[72px] shrink-0 scrollbar-hide pb-2 md:pb-4">
              {currentGalleryImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onMouseEnter={() => setMainImageIndex(idx)}
                  onClick={() => setMainImageIndex(idx)}
                  className={`shrink-0 w-[64px] h-[64px] md:w-[68px] md:h-[68px] rounded-lg overflow-hidden bg-[#f5f5f5] transition-colors p-1 ${
                    idx === mainImageIndex ? "border-[1.5px] border-black" : "border-[1.5px] border-transparent hover:border-gray-300"
                  }`}
                >
                  <img src={img || "/placeholder.png"} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>

            {/* Ảnh chính to */}
            <div className="flex-1 bg-[#f5f5f5] rounded-xl relative h-[400px] md:h-[680px] flex items-center justify-center overflow-hidden cursor-crosshair group">
              <img src={currentGalleryImages[mainImageIndex] || "/placeholder.png"} alt={product?.name} className="w-full h-full object-contain mix-blend-multiply" />
              
              {currentGalleryImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 bottom-4 md:bottom-6 w-10 h-10 md:w-11 md:h-11 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-transform active:scale-95 opacity-0 group-hover:opacity-100">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 bottom-4 md:bottom-6 w-10 h-10 md:w-11 md:h-11 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-transform active:scale-95 opacity-0 group-hover:opacity-100">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── PHẢI: THÔNG TIN SẢN PHẨM & ACCORDION (CHIẾM 4 CỘT) ── */}
        <div className="lg:col-span-4 flex flex-col pt-4 md:pt-0">
          
          <div className="mb-4">
            <h1 className="text-[24px] md:text-[28px] font-medium leading-tight text-[#111] m-0">{product?.name}</h1>
            <h2 className="text-[16px] font-normal text-[#757575] mt-1">{product?.category_name || "Giày Nam"}</h2>
          </div>

          <div className="mb-6">
            <span className="text-[16px] md:text-[18px] font-medium text-[#111]">
              {Number(displayPrice).toLocaleString("vi-VN")}₫
            </span>
          </div>

          {/* Chọn Màu */}
          {uniqueColors.length > 1 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color: any) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorChange(color)}
                    title={color.name}
                    className={`w-[60px] h-[60px] md:w-[64px] md:h-[64px] rounded-md overflow-hidden bg-[#f5f5f5] p-1 transition-colors ${
                      selectedColor?.id === color.id ? "border-[2px] border-[#111]" : "border-[2px] border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={product.images?.find((img: any) => img.color_id === color.id)?.image_url || product?.base_image_url} alt={color.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chọn Size */}
          {/* Chọn Size */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4 gap-4">
              <p className="text-base font-medium text-gray-900 leading-none m-0 whitespace-nowrap">
                Chọn Kích Cỡ
              </p>
              <Link 
                href="/size-guide" 
                target="_blank" 
                className="group flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all uppercase tracking-wide leading-none shrink-0 whitespace-nowrap"
              >
                <span className="underline underline-offset-4 decoration-gray-300 group-hover:decoration-gray-900 transition-colors">
                  Size Guide
                </span>
                <Ruler size={16} strokeWidth={2} className="text-gray-400 group-hover:text-gray-900 transition-colors mb-[2px]" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {availableVariants.map((v: any) => {
                const isOutOfStock = (v.total_stock || 0) === 0;
                const isSelected = selectedSize?.id === v.size.id;
                return (
                  <button
                    key={v.size.id}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(v.size)}
                    className={`relative py-3.5 rounded-md text-[14px] text-center transition-all ${
                      isSelected 
                        ? "border border-[#111] bg-white text-[#111] ring-1 ring-[#111]" 
                        : isOutOfStock 
                          ? "border border-[#e5e5e5] bg-[#fafafa] text-[#ccc] cursor-not-allowed" 
                          : "border border-[#e5e5e5] bg-white text-[#111] hover:border-[#111]"
                    }`}
                  >
                    {isOutOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <svg width="100%" height="100%" className="absolute top-0 left-0">
                          <line x1="0" y1="100%" x2="100%" y2="0" stroke="#111" strokeWidth="1" />
                        </svg>
                      </span>
                    )}
                    {v?.size?.name || ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 mb-8">
            <button onClick={handleAddToCart} className="w-full py-4 md:py-5 rounded-full bg-[#111] text-white text-[16px] font-medium hover:bg-[#333] transition-colors active:scale-[0.98]">
              Thêm vào Giỏ hàng
            </button>
            <button onClick={handleToggleFavorite} className="w-full py-4 md:py-5 rounded-full bg-white text-[#111] border border-[#e5e5e5] text-[16px] font-medium hover:border-[#111] transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
              {isFav ? "Đã yêu thích" : "Yêu thích"}
              <Heart size={20} className={isFav ? "fill-[#111] text-[#111]" : "text-[#111]"} />
            </button>
          </div>

          <p className="text-[15px] text-[#111] leading-relaxed mb-8">
            {product?.description || "Chưa có mô tả cho sản phẩm này."}
          </p>

          {/* ── BỘ ACCORDIONS ĐÃ ĐƯỢC CHUYỂN SANG TAILWIND (ANIMATION MƯỢT MÀ) ── */}
          <div className="border-t border-[#e5e5e5]">
            {[
              {
                key: "size-fit",
                label: "Kích Cỡ & Độ Vừa Vặn",
                content: (
                  <ul className="pl-5 text-[14px] text-[#444] leading-loose list-disc">
                    <li>Vừa nhỏ; chúng tôi khuyên bạn nên đặt nửa size lớn hơn</li>
                    <li><Link href="/size-guide" target="_blank" className="text-[#111] underline hover:text-gray-600">Hướng dẫn chọn size</Link></li>
                  </ul>
                ),
              },
              {
                key: "delivery",
                label: "Miễn Phí Giao Hàng và Đổi Trả",
                content: (
                  <div className="text-[14px] text-[#444] leading-loose">
                    <p>Đơn hàng từ 5.000.000₫ được miễn phí giao hàng tiêu chuẩn.</p>
                    <ul className="pl-5 my-2 list-disc">
                      <li>Giao hàng tiêu chuẩn 4-5 ngày làm việc</li>
                      <li>Giao hàng nhanh 2-4 ngày làm việc</li>
                    </ul>
                    <p>Đơn hàng được xử lý và giao từ Thứ Hai đến Thứ Sáu (không tính ngày lễ)</p>
                    <p className="mt-2">Thành viên Nike được <Link href="#" className="text-[#111] underline">miễn phí đổi trả</Link>.</p>
                  </div>
                ),
              },
              {
                key: "reviews",
                label: `Đánh Giá (${totalReviews})`,
                content: (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className={i < Math.round(avgRating) ? "fill-[#111] text-[#111]" : "text-[#111]"} />
                        ))}
                      </div>
                      <span className="text-[14px] text-[#757575]">{totalReviews > 0 ? `${avgRating} / 5` : "Chưa có đánh giá"}</span>
                    </div>

                    {token ? (
                      <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3 mb-6">
                        <p className="text-[14px] font-medium text-[#111]">Viết đánh giá của bạn:</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="focus:outline-none hover:scale-110 transition-transform">
                              <Star size={24} className={star <= reviewForm.rating ? "fill-[#111] text-[#111]" : "text-[#111]"} />
                            </button>
                          ))}
                        </div>
                        <textarea required value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={3} placeholder="Chia sẻ cảm nhận về sản phẩm..." className="p-3 border border-[#e5e5e5] rounded-lg text-[14px] resize-none outline-none focus:border-[#111] transition-colors" />
                        <button type="submit" disabled={isSubmittingReview} className="self-start px-6 py-3 rounded-full bg-[#111] text-white text-[14px] font-medium hover:bg-[#333] transition-colors disabled:bg-[#757575] disabled:cursor-not-allowed">
                          {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                        </button>
                      </form>
                    ) : (
                      <div className="mb-5">
                        <p className="text-[14px] text-[#757575] mb-3">Vui lòng đăng nhập để viết đánh giá.</p>
                        <Link href="/login" className="inline-block px-5 py-2.5 rounded-full bg-[#111] text-white text-[14px] font-medium hover:bg-[#333] transition-colors">Đăng nhập ngay</Link>
                      </div>
                    )}

                    {reviews.length === 0 ? (
                      <p className="text-[14px] text-[#757575]">Hãy là người đầu tiên đánh giá sản phẩm này.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-t border-[#f5f5f5] pt-4">
                            <div className="flex justify-between mb-1.5">
                              <span className="text-[14px] font-medium text-[#111]">{review.user?.name || "Khách hàng"}</span>
                              <span className="text-[12px] text-[#757575]">{new Date(review.created_at).toLocaleDateString("vi-VN")}</span>
                            </div>
                            <div className="flex gap-0.5 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={13} className={i < review.rating ? "fill-[#111] text-[#111]" : "text-[#111]"} />
                              ))}
                            </div>
                            <p className="text-[14px] text-[#444] leading-relaxed m-0">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              },
            ].map(({ key, label, content }) => (
              <div key={key} className="border-b border-[#e5e5e5]">
                <button
                  onClick={() => toggleAccordion(key)}
                  className="w-full flex justify-between items-center py-5 bg-transparent border-none cursor-pointer text-[15px] font-medium text-[#111] text-left hover:text-gray-600 transition-colors"
                >
                  {label}
                  <ChevronDown
                    size={20}
                    className={`shrink-0 transition-transform duration-300 ${openAccordion === key ? "rotate-180" : "rotate-0"}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openAccordion === key ? "max-h-[1500px] opacity-100 pb-5" : "max-h-0 opacity-0"
                  }`}
                >
                  {content}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}