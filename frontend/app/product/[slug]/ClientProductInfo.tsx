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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/products/${product.slug}/reviews`
      );
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/products/${product.slug}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(reviewForm),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setReviewForm({ rating: 5, comment: "" });
        fetchReviews();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error("Lỗi kết nối máy chủ!");
    }
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
    currentGalleryImages =
      filteredImages.length > 0
        ? filteredImages
        : product.images.map((img: any) => img.image_url);
  } else if (product?.base_image_url) {
    currentGalleryImages = [product.base_image_url];
  }

  const uniqueColors =
    product?.variants?.reduce((acc: any[], current: any) => {
      if (current?.color && !acc.find((item: any) => item.id === current.color.id))
        acc.push(current.color);
      return acc;
    }, []) || [];

  const availableVariants =
    product?.variants
      ?.filter((v: any) => v?.color?.id === selectedColor?.id)
      .sort(
        (a: any, b: any) =>
          parseFloat(a.size?.name?.replace(/[^\d.-]/g, "") || "0") -
          parseFloat(b.size?.name?.replace(/[^\d.-]/g, "") || "0")
      ) || [];

  const selectedVariant = availableVariants.find(
    (v: any) => v?.size?.id === selectedSize?.id
  );

  const nextImage = () =>
    setMainImageIndex((prev) => (prev + 1) % currentGalleryImages.length);
  const prevImage = () =>
    setMainImageIndex(
      (prev) => (prev - 1 + currentGalleryImages.length) % currentGalleryImages.length
    );

  const handleAddToCart = () => {
    if (!selectedSize) return toast.error("Vui lòng chọn Kích cỡ!");
    if ((selectedVariant?.total_stock || 0) === 0)
      return toast.error("Phân loại này đã hết hàng trên toàn hệ thống.");
    addToCart({
      variant_id: selectedVariant.id,
      product_id: product?.id,
      name: product?.name || "Sản phẩm",
      price: selectedVariant.price,
      image: currentGalleryImages[0],
      color: selectedColor?.name || "",
      size: selectedSize?.name || "",
      quantity: 1,
      stock: selectedVariant.total_stock,
    });
  };

  const handleToggleFavorite = () => {
    const isAdded = toggleFavorite({
      product_id: product?.id,
      product_name: product?.name || "Sản phẩm",
      category_name: "Giày Nam",
      price: selectedVariant
        ? selectedVariant.price
        : product?.variants?.[0]?.price || 0,
      image: currentGalleryImages[0],
      slug: product?.slug,
    });
    isAdded
      ? toast.success("Đã thêm vào Yêu thích")
      : toast.success("Đã xóa khỏi Yêu thích");
  };

  const toggleAccordion = (key: string) =>
    setOpenAccordion((prev) => (prev === key ? null : key));

  const displayPrice = selectedVariant
    ? selectedVariant.price
    : product?.variants?.[0]?.price || 0;

  if (!product)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-base font-medium text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div suppressHydrationWarning className="bg-white font-[Helvetica,Arial,sans-serif]">

      {/* ── MAIN PDP GRID ── */}
      <div
        className="max-w-[1920px] mx-auto"
        style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "start" }}
      >
        {/* ── LEFT: IMAGE GALLERY ── */}
        <div
          className="px-6 pt-10 pb-10"
          style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "16px", position: "sticky", top: 0 }}
        >
          {/* Thumbnail strip */}
          <div
            className="flex flex-col gap-2"
            style={{ maxHeight: "680px", overflowY: "auto", scrollbarWidth: "none" }}
          >
            {currentGalleryImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onMouseEnter={() => setMainImageIndex(idx)}
                onClick={() => setMainImageIndex(idx)}
                style={{
                  width: "68px",
                  height: "68px",
                  flexShrink: 0,
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#f5f5f5",
                  border: idx === mainImageIndex ? "1.5px solid #111" : "1.5px solid transparent",
                  padding: "4px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <img
                  src={img || "/placeholder.png"}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </button>
            ))}
          </div>

          {/* Main image */}
          <div
            style={{
              position: "relative",
              background: "#f5f5f5",
              borderRadius: "12px",
              height: "680px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={currentGalleryImages[mainImageIndex] || "/placeholder.png"}
              alt={product?.name}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            {/* Nav arrows */}
            {currentGalleryImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  style={{
                    position: "absolute", left: "16px", bottom: "20px",
                    background: "white", border: "none", borderRadius: "50%",
                    width: "44px", height: "44px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "background 0.15s",
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  style={{
                    position: "absolute", right: "16px", bottom: "20px",
                    background: "white", border: "none", borderRadius: "50%",
                    width: "44px", height: "44px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "background 0.15s",
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: PRODUCT INFO ── */}
        <div
          className="pt-10 pb-10 pr-6"
          style={{ width: "440px", flexShrink: 0 }}
        >
          {/* Product Title */}
          <div style={{ marginBottom: "12px" }}>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "500",
                lineHeight: "1.2",
                color: "#111",
                margin: 0,
              }}
            >
              {product?.name}
            </h1>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "400",
                color: "#757575",
                margin: "4px 0 0 0",
              }}
            >
              {product?.category_name || "Giày Nam"}
            </h2>
          </div>

          {/* Price */}
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "500",
                color: "#111",
              }}
            >
              {Number(displayPrice).toLocaleString("vi-VN")}₫
            </span>
          </div>

          {/* Color Picker */}
          {uniqueColors.length > 1 && (
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {uniqueColors.map((color: any) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorChange(color)}
                    title={color.name}
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      background: "#f5f5f5",
                      border:
                        selectedColor?.id === color.id
                          ? "2px solid #111"
                          : "2px solid transparent",
                      padding: "4px",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <img
                      src={
                        product.images?.find(
                          (img: any) => img.color_id === color.id
                        )?.image_url || product?.base_image_url
                      }
                      alt={color.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#111" }}>
                Chọn Kích Cỡ
              </span>
              <Link
                href="/size-guide"
                target="_blank"
                style={{
                  fontSize: "14px",
                  color: "#111",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: "500",
                }}
              >
                <Ruler size={16} />
                Hướng dẫn chọn size
              </Link>
            </div>

            {/* Size grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
              }}
            >
              {availableVariants.map((v: any) => {
                const isOutOfStock = (v.total_stock || 0) === 0;
                const isSelected = selectedSize?.id === v.size.id;
                return (
                  <button
                    key={v.size.id}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(v.size)}
                    style={{
                      padding: "14px 8px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "400",
                      border: isSelected
                        ? "1px solid #111"
                        : isOutOfStock
                        ? "1px solid #e5e5e5"
                        : "1px solid #e5e5e5",
                      background: isSelected ? "white" : isOutOfStock ? "#fafafa" : "white",
                      color: isOutOfStock ? "#ccc" : "#111",
                      cursor: isOutOfStock ? "not-allowed" : "pointer",
                      textAlign: "center",
                      transition: "border-color 0.15s",
                      outline: isSelected ? "1px solid #111" : "none",
                      position: "relative",
                    }}
                  >
                    {/* Strike-through for out-of-stock */}
                    {isOutOfStock && (
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="100%"
                          height="100%"
                          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
                        >
                          <line
                            x1="0"
                            y1="100%"
                            x2="100%"
                            y2="0"
                            stroke="#ccc"
                            strokeWidth="1"
                          />
                        </svg>
                      </span>
                    )}
                    {v?.size?.name || ""}
                  </button>
                );
              })}
            </div>

            {/* Size note */}
            <p style={{ fontSize: "13px", color: "#757575", marginTop: "10px" }}>
              • Vừa nhỏ; chúng tôi khuyên bạn nên đặt nửa size lớn hơn
            </p>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            <button
              onClick={handleAddToCart}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "30px",
                background: "#111",
                color: "white",
                fontSize: "16px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "#333")}
              onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "#111")}
            >
              Thêm vào Giỏ hàng
            </button>

            <button
              onClick={handleToggleFavorite}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "30px",
                background: "white",
                color: "#111",
                fontSize: "16px",
                fontWeight: "500",
                border: "1px solid #e5e5e5",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor = "#111")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e5e5")
              }
            >
              {isFav ? "Đã yêu thích" : "Yêu thích"}
              <Heart
                size={20}
                style={{
                  fill: isFav ? "#111" : "none",
                  stroke: "#111",
                }}
              />
            </button>
          </div>

          {/* Description */}
          <p style={{ fontSize: "15px", color: "#111", lineHeight: "1.7", marginBottom: "24px" }}>
            {product?.description || "Chưa có mô tả cho sản phẩm này."}
          </p>

          {/* Accordions */}
          {[
            {
              key: "size-fit",
              label: "Kích Cỡ & Độ Vừa Vặn",
              content: (
                <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "14px", color: "#444", lineHeight: "1.8" }}>
                  <li>Vừa nhỏ; chúng tôi khuyên bạn nên đặt nửa size lớn hơn</li>
                  <li>
                    <Link href="/size-guide" target="_blank" style={{ color: "#111", textDecoration: "underline" }}>
                      Hướng dẫn chọn size
                    </Link>
                  </li>
                </ul>
              ),
            },
            {
              key: "delivery",
              label: "Miễn Phí Giao Hàng và Đổi Trả",
              content: (
                <div style={{ fontSize: "14px", color: "#444", lineHeight: "1.8" }}>
                  <p>Đơn hàng từ 5.000.000₫ được miễn phí giao hàng tiêu chuẩn.</p>
                  <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
                    <li>Giao hàng tiêu chuẩn 4-5 ngày làm việc</li>
                    <li>Giao hàng nhanh 2-4 ngày làm việc</li>
                  </ul>
                  <p>Đơn hàng được xử lý và giao từ Thứ Hai đến Thứ Sáu (không tính ngày lễ)</p>
                  <p style={{ marginTop: "8px" }}>
                    Thành viên Nike được{" "}
                    <Link href="#" style={{ color: "#111", textDecoration: "underline" }}>
                      miễn phí đổi trả
                    </Link>
                    .
                  </p>
                </div>
              ),
            },
            {
              key: "reviews",
              label: `Đánh Giá (${totalReviews})`,
              content: (
                <div>
                  {/* Rating summary */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          style={{
                            fill: i < Math.round(avgRating) ? "#111" : "none",
                            stroke: "#111",
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: "14px", color: "#757575" }}>
                      {totalReviews > 0 ? `${avgRating} / 5` : "Chưa có đánh giá"}
                    </span>
                  </div>

                  {/* Review form */}
                  {token ? (
                    <form
                      onSubmit={handleReviewSubmit}
                      style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}
                    >
                      <p style={{ fontSize: "14px", fontWeight: "500", color: "#111" }}>
                        Viết đánh giá của bạn:
                      </p>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <Star
                              size={24}
                              style={{
                                fill: star <= reviewForm.rating ? "#111" : "none",
                                stroke: "#111",
                              }}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        required
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={3}
                        placeholder="Chia sẻ cảm nhận về sản phẩm..."
                        style={{
                          padding: "12px",
                          border: "1px solid #e5e5e5",
                          borderRadius: "8px",
                          fontSize: "14px",
                          resize: "none",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        style={{
                          padding: "12px 24px",
                          borderRadius: "30px",
                          background: isSubmittingReview ? "#757575" : "#111",
                          color: "white",
                          border: "none",
                          cursor: isSubmittingReview ? "not-allowed" : "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          alignSelf: "flex-start",
                        }}
                      >
                        {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                      </button>
                    </form>
                  ) : (
                    <div style={{ marginBottom: "20px" }}>
                      <p style={{ fontSize: "14px", color: "#757575", marginBottom: "10px" }}>
                        Vui lòng đăng nhập để viết đánh giá.
                      </p>
                      <Link
                        href="/login"
                        style={{
                          padding: "10px 20px",
                          borderRadius: "30px",
                          background: "#111",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "500",
                          textDecoration: "none",
                        }}
                      >
                        Đăng nhập ngay
                      </Link>
                    </div>
                  )}

                  {/* Reviews list */}
                  {reviews.length === 0 ? (
                    <p style={{ fontSize: "14px", color: "#757575" }}>
                      Hãy là người đầu tiên đánh giá sản phẩm này.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          style={{ borderTop: "1px solid #f5f5f5", paddingTop: "16px" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <span style={{ fontSize: "14px", fontWeight: "500", color: "#111" }}>
                              {review.user?.name || "Khách hàng ẩn danh"}
                            </span>
                            <span style={{ fontSize: "12px", color: "#757575" }}>
                              {new Date(review.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                style={{
                                  fill: i < review.rating ? "#111" : "none",
                                  stroke: "#111",
                                }}
                              />
                            ))}
                          </div>
                          <p style={{ fontSize: "14px", color: "#444", lineHeight: "1.6", margin: 0 }}>
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
          ].map(({ key, label, content }) => (
            <div
              key={key}
              style={{ borderTop: "1px solid #e5e5e5" }}
            >
              <button
                onClick={() => toggleAccordion(key)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "#111",
                  textAlign: "left",
                }}
              >
                {label}
                <ChevronDown
                  size={20}
                  style={{
                    transform: openAccordion === key ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                  }}
                />
              </button>
              {openAccordion === key && (
                <div style={{ paddingBottom: "20px" }}>{content}</div>
              )}
            </div>
          ))}
          <div style={{ borderTop: "1px solid #e5e5e5" }} />
        </div>
      </div>
    </div>
  );
}
