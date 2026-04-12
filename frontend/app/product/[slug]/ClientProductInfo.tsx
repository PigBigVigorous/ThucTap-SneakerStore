"use client";

import { useState, useEffect, useCallback } from "react";
import { useCartStore } from "../../store/useCartStore";
import { useFavoritesStore } from "../../store/useFavoritesStore";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  Star, Heart, ChevronLeft, ChevronRight, Ruler,
  ChevronDown, X, ZoomIn, MessageSquare, ThumbsUp,
  User, Calendar, ArrowRight, ShoppingBag, CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Review = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: { id: number; name: string } | null;
};

type RelatedProduct = {
  id: number;
  name: string;
  slug: string;
  base_image_url: string;
  brand?: { name: string };
  variants?: { price: number; color?: { hex_code?: string } }[];
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// ─── Add-to-cart overlay (Puma style) ─────────────────────────────────────────────────

type OverlayItem = {
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  totalInCart: number;
};

function AddToCartOverlay({
  item,
  onClose,
}: {
  item: OverlayItem;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[200] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-overlay-title"
        className="fixed z-[201] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[calc(100vw-32px)] max-w-[480px] bg-white rounded-2xl shadow-2xl
                   animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            <p id="cart-overlay-title" className="text-[14px] font-semibold text-gray-900">
              Đã thêm <strong>1</strong> mục hàng vào giỏ hàng của bạn!
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product row */}
        <div className="flex gap-4 px-5 py-4">
          {/* Image */}
          <div className="w-24 h-24 shrink-0 rounded-xl bg-gray-50 overflow-hidden border border-gray-100">
            <img
              src={item.image || "/placeholder.png"}
              alt={item.name}
              className="w-full h-full object-contain mix-blend-multiply p-1"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2">
                {item.name}
              </h3>
              <span className="text-[14px] font-bold text-gray-900 shrink-0">
                {Number(item.price).toLocaleString("vi-VN")}₫
              </span>
            </div>

            <div className="mt-2 space-y-0.5">
              <p className="text-[13px] text-gray-500">
                <span className="text-gray-400">Màu: </span>
                {item.color}
              </p>
              <p className="text-[13px] text-gray-500">
                <span className="text-gray-400">Kích cỡ: </span>
                {item.size}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <Link
            href="/cart"
            onClick={onClose}
            className="flex items-center justify-center gap-2 border-2 border-gray-900 text-gray-900
                       text-[13px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag size={16} />
            Xem giỏ hàng ({item.totalInCart})
          </Link>
          <Link
            href="/checkout"
            onClick={onClose}
            className="flex items-center justify-center bg-gray-900 text-white
                       text-[13px] font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            Thanh toán
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── Helper: Star row ─────────────────────────────────────────────────────────

function StarRow({
  rating,
  size = 16,
  interactive = false,
  onSelect,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onSelect?: (r: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onSelect?.(s)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
          aria-label={interactive ? `Chọn ${s} sao` : undefined}
        >
          <Star
            size={size}
            className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Helper: Rating breakdown bar ─────────────────────────────────────────────

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-right text-gray-500 shrink-0">{star}</span>
      <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right text-gray-400 text-xs shrink-0">{count}</span>
    </div>
  );
}

// ─── Helper: Avatar initials ──────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <span
      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${color}`}
    >
      {initials}
    </span>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const name = review.user?.name || "Khách hàng";
  const date = new Date(review.created_at).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex gap-3 py-5 border-b border-gray-100 last:border-0">
      <Avatar name={name} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-[14px] text-gray-900">{name}</span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Calendar size={11} />
            {date}
          </span>
        </div>
        <StarRow rating={review.rating} size={13} />
        <p className="mt-2 text-[14px] text-gray-600 leading-relaxed">{review.comment}</p>
      </div>
    </div>
  );
}

// ─── Related Product Card ─────────────────────────────────────────────────────

function RelatedCard({ item }: { item: RelatedProduct }) {
  const price = item.variants?.[0]?.price ?? 0;
  const colors = item.variants
    ?.map((v) => v.color?.hex_code)
    .filter(Boolean)
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .slice(0, 5) as string[];

  return (
    <Link
      href={`/product/${item.slug}`}
      className="group flex flex-col cursor-pointer"
    >
      {/* Image */}
      <div className="relative bg-[#f5f5f5] rounded-2xl aspect-square overflow-hidden mb-3">
        <img
          src={item.base_image_url || "/placeholder.png"}
          alt={item.name}
          className="w-full h-full object-contain mix-blend-multiply p-4
                     group-hover:scale-105 transition-transform duration-500"
        />
        <div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-2xl"
        />
        <div
          className="absolute bottom-3 right-3 bg-black text-white w-9 h-9 rounded-full
                      flex items-center justify-center opacity-0 group-hover:opacity-100
                      translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
        >
          <ShoppingBag size={16} />
        </div>
      </div>

      {/* Info */}
      <div>
        {item.brand && (
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
            {item.brand.name}
          </p>
        )}
        <h3
          className="text-[14px] font-semibold text-gray-900 truncate
                     group-hover:text-black transition-colors mb-1"
        >
          {item.name}
        </h3>

        {/* Color dots */}
        {colors.length > 0 && (
          <div className="flex gap-1 mb-2">
            {colors.map((hex, i) => (
              <span
                key={i}
                className="block w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}

        <p className="text-[15px] font-bold text-gray-900">
          {price > 0 ? Number(price).toLocaleString("vi-VN") + "₫" : "Liên hệ"}
        </p>
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientProductInfo({ product }: { product: any }) {
  const { token } = useAuth();
  const addToCart = useCartStore((state) => state.addToCart);
  const items     = useCartStore((state) => state.items);
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  // Gallery
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Add-to-cart overlay
  const [overlayItem, setOverlayItem] = useState<OverlayItem | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({});
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewLastPage, setReviewLastPage] = useState(1);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Related
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

  // Accordion (chỉ cho Size & Delivery — reviews đã tách ra section riêng)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const toggleAccordion = (key: string) =>
    setOpenAccordion((prev) => (prev === key ? null : key));

  const isFav = favorites.some((f) => f.product_id === product?.id);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchReviews = useCallback(
    async (page = 1) => {
      setReviewLoading(true);
      try {
        const res = await fetch(
          `${API}/products/${product.slug}/reviews?page=${page}`
        );
        const data = await res.json();
        if (data.success) {
          // API trả về paginate object trong data.data
          const paginated = data.data;
          setReviews(paginated.data ?? []);
          setReviewPage(paginated.current_page ?? 1);
          setReviewLastPage(paginated.last_page ?? 1);
          setAvgRating(data.average_rating ?? 0);
          setTotalReviews(data.total_reviews ?? 0);

          // Tính breakdown trực tiếp từ mảng trang hiện tại để tránh query thêm
          // (breakdown chính xác sẽ update khi user submit review mới)
        }
      } catch { /* silently ignore */ }
      setReviewLoading(false);
    },
    [product.slug]
  );

  const fetchRelated = useCallback(async () => {
    try {
      const res = await fetch(`${API}/products/${product.slug}/related`);
      const data = await res.json();
      if (data.success) setRelatedProducts(data.data ?? []);
    } catch { /* silently ignore */ }
  }, [product.slug]);

  // Tính rating breakdown từ tất cả reviews đã load (gần đúng; đủ dùng)
  useEffect(() => {
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
    });
    setRatingBreakdown(breakdown);
  }, [reviews]);

  useEffect(() => {
    if (product?.variants?.length > 0) {
      setSelectedColor(product.variants[0]?.color || null);
    }
    if (product?.slug) {
      fetchReviews(1);
      fetchRelated();
    }
  }, [product, fetchReviews, fetchRelated]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Vui lòng đăng nhập để đánh giá!");
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${API}/products/${product.slug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setReviewForm({ rating: 5, comment: "" });
        fetchReviews(1); // reload trang 1
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    }
    setIsSubmittingReview(false);
  };

  // ── Gallery logic ─────────────────────────────────────────────────────────

  const handleColorChange = (color: any) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setMainImageIndex(0);
  };

  let currentGalleryImages: string[] = [];
  if (selectedColor) {
    const colorSpecific =
      product?.images
        ?.filter((img: any) => Number(img.color_id) === Number(selectedColor.id))
        .map((img: any) => img.image_url) || [];
    currentGalleryImages =
      colorSpecific.length > 0
        ? colorSpecific
        : product?.base_image_url
        ? [product.base_image_url]
        : [];
  } else if (product?.base_image_url) {
    currentGalleryImages = [product.base_image_url];
  }
  currentGalleryImages = Array.from(new Set(currentGalleryImages));
  if (currentGalleryImages.length === 0) currentGalleryImages = ["/placeholder.png"];

  const uniqueColors = product?.variants?.reduce((acc: any[], cur: any) => {
    if (cur?.color && !acc.find((c: any) => c.id === cur.color.id))
      acc.push(cur.color);
    return acc;
  }, []) || [];

  const availableVariants = product?.variants
    ?.filter((v: any) => v?.color?.id === selectedColor?.id)
    .sort(
      (a: any, b: any) =>
        parseFloat(a.size?.name?.replace(/[^\d.-]/g, "") || "0") -
        parseFloat(b.size?.name?.replace(/[^\d.-]/g, "") || "0")
    ) || [];

  const selectedVariant = availableVariants.find(
    (v: any) => v?.size?.id === selectedSize?.id
  );
  const currentStock = selectedVariant?.total_stock || 0;
  const displayPrice =
    selectedVariant
      ? selectedVariant.price
      : product?.variants?.[0]?.price || 0;

  const selectedColorwayLabel =
    availableVariants[0]?.colorway_name || selectedColor?.name || "—";

  const nextImage = () =>
    setMainImageIndex((prev) => (prev + 1) % currentGalleryImages.length);
  const prevImage = () =>
    setMainImageIndex(
      (prev) => (prev - 1 + currentGalleryImages.length) % currentGalleryImages.length
    );

  const handleAddToCart = () => {
    if (!selectedSize) return toast.error("Vui lòng chọn Kích cỡ!");
    if (currentStock === 0) return toast.error("Phân loại này đã hết hàng.");

    addToCart({
      variant_id: selectedVariant.id,
      product_id: product?.id,
      name: product?.name || "Sản phẩm",
      price: selectedVariant.price,
      image: currentGalleryImages[0],
      color: selectedColor?.name || "",
      size: selectedSize?.name || "",
      quantity: 1,
      stock: currentStock,
      slug: product?.slug,
    });

    // Tính tổng items trong giỏ sau khi thêm
    const totalInCart = items.reduce((s, i) => s + i.quantity, 0) + 1;

    setOverlayItem({
      name: product?.name || "Sản phẩm",
      price: selectedVariant.price,
      image: currentGalleryImages[0],
      color: selectedColor?.name || "",
      size: selectedSize?.name || "",
      totalInCart,
    });
  };

  const handleToggleFavorite = () => {
    const isAdded = toggleFavorite({
      product_id: product?.id,
      product_name: product?.name || "Sản phẩm",
      category_name: product?.category_name || "Giày Nam",
      price: displayPrice,
      image: currentGalleryImages[0],
      slug: product?.slug,
    });
    isAdded
      ? toast.success("Đã thêm vào Yêu thích")
      : toast.success("Đã xóa khỏi Yêu thích");
  };

  if (!product)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Đang tải dữ liệu...
      </div>
    );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div suppressHydrationWarning className="bg-white font-sans text-gray-900">

      {/* ══════════════════════════════════════════
          ADD-TO-CART OVERLAY (Puma style)
      ══════════════════════════════════════════ */}
      {overlayItem && (
        <AddToCartOverlay
          item={overlayItem}
          onClose={() => setOverlayItem(null)}
        />
      )}

      {/* ══════════════════════════════════════════
          LIGHTBOX
      ══════════════════════════════════════════ */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 z-10 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium select-none">
            {mainImageIndex + 1} / {currentGalleryImages.length}
          </span>
          <img
            src={currentGalleryImages[mainImageIndex] || "/placeholder.png"}
            alt="Zoom"
            className="max-w-[90vw] max-h-[88vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
          {currentGalleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          {currentGalleryImages.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 px-4 overflow-x-auto max-w-[90vw]">
              {currentGalleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setMainImageIndex(idx); }}
                  className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                    idx === mainImageIndex
                      ? "border-white opacity-100"
                      : "border-transparent opacity-40 hover:opacity-70"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          MAIN: GALLERY + INFO
      ══════════════════════════════════════════ */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-8 lg:py-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* ── LEFT: Gallery ── */}
        <div className="lg:col-span-7 lg:sticky lg:top-[40px]" aria-roledescription="carousel">
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            Image {mainImageIndex + 1} of {currentGalleryImages.length}
          </span>
          <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* Thumbnail strip */}
            {currentGalleryImages.length > 1 && (
              <div className="hidden md:flex flex-col gap-2 overflow-y-auto w-[80px] shrink-0 max-h-[580px] scrollbar-hide pr-1">
                {currentGalleryImages.map((img, idx) => {
                  const isActive = idx === mainImageIndex;
                  return (
                    <button
                      key={idx}
                      onMouseEnter={() => setMainImageIndex(idx)}
                      onClick={() => setMainImageIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={`relative shrink-0 w-[80px] h-[100px] bg-[#f5f5f5] transition-all duration-200 ${
                        isActive
                          ? "opacity-100 shadow-[0_0_0_1px_black]"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img || "/placeholder.png"} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main image */}
            <div
              className="relative w-full bg-[#f6f6f6] overflow-hidden group cursor-zoom-in grow"
              style={{ height: "580px" }}
              onClick={() => setIsLightboxOpen(true)}
            >
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-sm shadow-sm pointer-events-none">
                <Star size={14} className="fill-[#111] text-[#111]" />
                <span className="text-[12px] font-bold text-[#111] uppercase">Highly Rated</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                className="absolute top-4 right-4 z-20 bg-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm hover:scale-110"
                aria-label="Phóng to"
              >
                <ZoomIn size={18} className="text-[#111]" />
              </button>
              {currentGalleryImages.length > 1 && (
                <div className="absolute bottom-4 right-4 z-20 bg-black/60 text-white text-[11px] md:hidden font-bold px-2 py-1 rounded-sm pointer-events-none">
                  {mainImageIndex + 1} / {currentGalleryImages.length}
                </div>
              )}
              {currentGalleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
                    idx === mainImageIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={img || "/placeholder.png"}
                    alt="Product"
                    draggable={false}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-[1.02] transition-transform duration-500 select-none p-4"
                  />
                </div>
              ))}
              {currentGalleryImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-50"
                  >
                    <ChevronLeft size={20} className="text-[#111]" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-50"
                  >
                    <ChevronRight size={20} className="text-[#111]" />
                  </button>
                </>
              )}
            </div>

            {/* Dot (mobile) */}
            {currentGalleryImages.length > 1 && (
              <div className="flex justify-center gap-2 mt-4 md:hidden w-full absolute bottom-[-24px]">
                {currentGalleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImageIndex(idx)}
                    className={`rounded-full transition-all duration-300 ${
                      idx === mainImageIndex ? "w-2.5 h-2.5 bg-black" : "w-2 h-2 bg-gray-300 hover:bg-gray-500"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Product Info ── */}
        <div className="lg:col-span-5 flex flex-col pt-4 lg:pt-12">
          {/* Breadcrumb — hỗ trợ đến 3 cấp: Trang chủ / Cha / Con / Sản phẩm */}
          <nav
            aria-label="breadcrumb"
            className="flex items-center flex-wrap gap-x-1 text-[13px] text-gray-400 mb-4"
          >
            <Link href="/" className="hover:text-gray-900 transition-colors shrink-0">
              Trang chủ
            </Link>

            {/* Nếu category có cha → hiện cả 2 tầng */}
            {product?.category?.parent && (
              <>
                <span className="mx-1 text-gray-300">/</span>
                <Link
                  href={`/?category=${product.category.parent.slug}`}
                  className="hover:text-gray-900 transition-colors shrink-0"
                >
                  {product.category.parent.name}
                </Link>
              </>
            )}

            {/* Danh mục hiện tại (có thể là con hoặc gốc) */}
            {product?.category && (
              <>
                <span className="mx-1 text-gray-300">/</span>
                <Link
                  href={`/?category=${product.category.slug}`}
                  className="hover:text-gray-900 transition-colors shrink-0"
                >
                  {product.category.name}
                </Link>
              </>
            )}

            {/* Tên sản phẩm */}
            <span className="mx-1 text-gray-300">/</span>
            <span className="text-gray-900 font-medium line-clamp-1">
              {product?.name}
            </span>
          </nav>

          <div className="mb-8 pl-0 lg:pl-10">
            <h1 className="text-[28px] font-medium leading-tight text-[#111] m-0 mb-1">{product?.name}</h1>
            <h2 className="text-[16px] text-[#111] mb-2">
              {product?.category?.name || "Giày"}
            </h2>

            {/* Avg rating inline */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRow rating={Math.round(avgRating)} size={14} />
                <span className="text-[13px] text-gray-500">
                  {avgRating.toFixed(1)} ({totalReviews} đánh giá)
                </span>
              </div>
            )}

            <div className="text-[16px] font-medium text-[#111] mb-8">
              {Number(displayPrice).toLocaleString("vi-VN")}₫
            </div>

            {/* Colors */}
            {uniqueColors.length >= 1 && (
              <div className="mb-6">
                <p className="text-[14px] text-[#111] mb-3">
                  <span className="text-[#757575]">Màu hiển thị: </span>
                  <span className="font-medium">{selectedColorwayLabel}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map((color: any) => {
                    const isSoldOut = product?.variants
                      ?.filter((v: any) => v?.color?.id === color.id)
                      .every((v: any) => (v.total_stock || 0) === 0);
                    const isSelected = selectedColor?.id === color.id;
                    const colorImg =
                      product.images?.find((img: any) => Number(img.color_id) === Number(color.id))?.image_url ||
                      product?.base_image_url;
                    const hexCode = color.hex_code || null;

                    return (
                      <div key={color.id} className="relative group">
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#111] text-white text-[11px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                          {(() => {
                            const v = product?.variants?.find((v: any) => v?.color?.id === color.id);
                            return v?.colorway_name || color.name;
                          })()}
                          {isSoldOut && <span className="ml-1 text-red-400">(Hết)</span>}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111]" />
                        </div>
                        <button
                          onClick={() => !isSoldOut && handleColorChange(color)}
                          title={color.name}
                          aria-label={`Chọn màu ${color.name}`}
                          className={`relative overflow-hidden transition-all duration-150 rounded-sm flex flex-col ${
                            isSelected
                              ? "shadow-[0_0_0_2px_#111] opacity-100"
                              : isSoldOut
                              ? "opacity-35 cursor-not-allowed grayscale"
                              : "opacity-75 hover:opacity-100 hover:shadow-[0_0_0_1px_#bbb]"
                          }`}
                          style={{ width: "64px" }}
                        >
                          <div className="flex items-center gap-1.5 w-full px-1.5 pt-1.5 pb-1">
                            <span
                              className="shrink-0 w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                              style={{ backgroundColor: hexCode || "#cccccc" }}
                            />
                            <span className="text-[9px] font-semibold text-[#444] truncate leading-none" title={color.name}>
                              {color.name}
                            </span>
                          </div>
                          <div className="w-full h-[52px] bg-[#f5f5f5] relative overflow-hidden">
                            <img src={colorImg} alt={color.name} className="w-full h-full object-contain mix-blend-multiply p-0.5" />
                            {isSoldOut && (
                              <div className="absolute inset-0 pointer-events-none">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <line x1="100" y1="0" x2="0" y2="100" stroke="#767677" strokeWidth="1.5" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
                {uniqueColors.length > 1 && (
                  <p className="text-[12px] text-[#757575] mt-2">{uniqueColors.length} màu có sẵn</p>
                )}
              </div>
            )}

            {/* Sizes */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-4 gap-4">
                <p className="text-base font-medium text-[#111] leading-none m-0">Chọn Kích Cỡ</p>
                <Link href="/size-guide" target="_blank" className="group flex items-center gap-1 text-[15px] font-medium text-[#757575] hover:text-[#111]">
                  <span>Hướng Dẫn Chọn Size</span><Ruler size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {availableVariants.map((v: any) => {
                  const isOutOfStock = (v.total_stock || 0) === 0;
                  const isSelected = selectedSize?.id === v.size.id;
                  return (
                    <button
                      key={v.size.id}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(v.size)}
                      className={`relative py-3 rounded-md text-[16px] text-center transition-all ${
                        isSelected
                          ? "border border-[#111] bg-white text-[#111] ring-1 ring-[#111]"
                          : isOutOfStock
                          ? "border border-[#e5e5e5] bg-[#f5f5f5] text-[#ccc] cursor-not-allowed"
                          : "border border-[#e5e5e5] bg-white text-[#111] hover:border-[#111]"
                      }`}
                    >
                      {isOutOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center opacity-40">
                          <svg width="100%" height="100%" className="absolute">
                            <line x1="0" y1="100%" x2="100%" y2="0" stroke="#111" strokeWidth="1" />
                          </svg>
                        </span>
                      )}
                      {v?.size?.name || ""}
                    </button>
                  );
                })}
              </div>
              {selectedSize && currentStock > 0 && currentStock <= 3 && (
                <p className="mt-4 text-[14px] font-medium text-red-600 animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  Sắp hết hàng! Chỉ còn đúng {currentStock} đôi.
                </p>
              )}
              {selectedSize && currentStock === 0 && (
                <p className="mt-4 text-[14px] font-medium text-gray-500">Size này hiện đã hết hàng.</p>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3 mb-10">
              <button
                onClick={handleAddToCart}
                className="w-full py-[18px] rounded-full bg-[#111] text-white text-[16px] font-medium hover:bg-[#333] active:scale-[0.98] transition-transform"
              >
                Thêm vào Giỏ hàng
              </button>
              <button
                onClick={handleToggleFavorite}
                className="w-full py-[18px] rounded-full bg-white text-[#111] border border-[#e5e5e5] text-[16px] font-medium hover:border-[#111] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {isFav ? "Đã yêu thích" : "Yêu thích"}{" "}
                <Heart size={20} className={isFav ? "fill-[#111] text-[#111]" : "text-[#111]"} />
              </button>
            </div>

            <p className="text-[16px] text-[#111] leading-relaxed mb-10">
              {product?.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
            </p>
          </div>

          {/* Accordion (Size fit + Delivery) */}
          <div className="border-t border-[#e5e5e5]">
            {[
              {
                key: "size-fit",
                label: "Kích Cỡ & Độ Vừa Vặn",
                content: (
                  <ul className="pl-5 text-[14px] text-[#444] list-disc">
                    <li>Vừa nhỏ; chúng tôi khuyên bạn nên đặt nửa size lớn hơn</li>
                    <li>
                      <Link href="/size-guide" target="_blank" className="text-[#111] underline">
                        Hướng dẫn chọn size
                      </Link>
                    </li>
                  </ul>
                ),
              },
              {
                key: "delivery",
                label: "Miễn Phí Giao Hàng",
                content: (
                  <div className="text-[14px] text-[#444]">
                    <p>Đơn hàng từ 5.000.000₫ được miễn phí giao hàng.</p>
                  </div>
                ),
              },
            ].map(({ key, label, content }) => (
              <div key={key} className="border-b border-[#e5e5e5]">
                <button
                  onClick={() => toggleAccordion(key)}
                  className="w-full flex justify-between items-center py-5 text-[15px] font-medium text-[#111] hover:text-gray-600 transition-colors"
                >
                  {label}
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-300 ${openAccordion === key ? "rotate-180" : "rotate-0"}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openAccordion === key ? "max-h-[400px] opacity-100 pb-5" : "max-h-0 opacity-0"
                  }`}
                >
                  {content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION: ĐÁNH GIÁ SẢN PHẨM
      ══════════════════════════════════════════ */}
      <section className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-16 border-t border-[#e5e5e5]">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <MessageSquare size={22} className="text-gray-400" />
          <h2 className="text-[22px] font-bold text-[#111]">
            Đánh giá sản phẩm
          </h2>
          {totalReviews > 0 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full">
              {totalReviews} đánh giá
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── Cột trái: Tổng quan + Form viết review ── */}
          <div className="lg:col-span-4">

            {/* Rating tổng quan */}
            {totalReviews > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                {/* Điểm lớn */}
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-[56px] font-black text-gray-900 leading-none">
                    {avgRating.toFixed(1)}
                  </span>
                  <div className="pb-2">
                    <StarRow rating={Math.round(avgRating)} size={18} />
                    <p className="text-sm text-gray-400 mt-1">{totalReviews} lượt đánh giá</p>
                  </div>
                </div>

                {/* Breakdown bars */}
                <div className="flex flex-col gap-2">
                  {[5, 4, 3, 2, 1].map((s) => (
                    <RatingBar
                      key={s}
                      star={s}
                      count={ratingBreakdown[s] ?? 0}
                      total={reviews.length}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ThumbsUp size={16} className="text-gray-400" />
                Viết đánh giá của bạn
              </h3>
              {token ? (
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                  <div>
                    <p className="text-[13px] text-gray-500 mb-2">Chọn số sao:</p>
                    <StarRow
                      rating={reviewForm.rating}
                      size={28}
                      interactive
                      onSelect={(r) => setReviewForm({ ...reviewForm, rating: r })}
                    />
                  </div>
                  <textarea
                    required
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    rows={4}
                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    className="w-full p-3 border border-gray-200 rounded-xl text-[14px] resize-none
                               focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                               transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-3 rounded-full bg-[#111] text-white text-[14px] font-medium
                               hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed
                               active:scale-[0.98] transition-all"
                  >
                    {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <User size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-[14px] text-gray-500 mb-4">
                    Đăng nhập để chia sẻ đánh giá của bạn
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111] text-white text-[14px] font-medium hover:bg-[#333] transition-colors"
                  >
                    Đăng nhập
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Cột phải: Danh sách đánh giá ── */}
          <div className="lg:col-span-8">
            {reviewLoading ? (
              /* Skeleton */
              <div className="flex flex-col gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 py-5 border-b border-gray-100 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare size={40} className="text-gray-200 mb-4" />
                <p className="text-[16px] font-medium text-gray-400">
                  Chưa có đánh giá nào
                </p>
                <p className="text-[14px] text-gray-300 mt-1">
                  Hãy là người đầu tiên đánh giá sản phẩm này!
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>

                {/* Pagination */}
                {reviewLastPage > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => { fetchReviews(reviewPage - 1); }}
                      disabled={reviewPage <= 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200
                                 text-[13px] font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={15} /> Trước
                    </button>
                    <span className="text-[13px] text-gray-500 px-2">
                      Trang {reviewPage} / {reviewLastPage}
                    </span>
                    <button
                      onClick={() => { fetchReviews(reviewPage + 1); }}
                      disabled={reviewPage >= reviewLastPage}
                      className="flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200
                                 text-[13px] font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Tiếp <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION: SẢN PHẨM ĐỀ XUẤT
      ══════════════════════════════════════════ */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-16 border-t border-[#e5e5e5]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                Gợi ý cho bạn
              </p>
              <h2 className="text-[22px] font-bold text-[#111]">Có thể bạn cũng thích</h2>
            </div>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-gray-500
                         hover:text-black transition-colors group"
            >
              Xem thêm <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {relatedProducts.map((item) => (
              <RelatedCard key={item.id} item={item} />
            ))}
          </div>

          <div className="flex sm:hidden justify-center mt-8">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200
                         text-[14px] font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900
                         transition-all"
            >
              Xem tất cả sản phẩm <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}