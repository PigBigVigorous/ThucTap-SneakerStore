"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Heart, X, SlidersHorizontal, ChevronDown,
  ArrowUpDown, Search, ChevronLeft, ChevronRight,
  RotateCcw, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useFavoritesStore } from "./store/useFavoritesStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  slug: string;
  base_image_url: string;
  brand?: { id: number; name: string };
  category?: { name: string; slug: string };
  variants?: { price: number; color?: { id: number; name: string; hex_code?: string }; colorway_name?: string }[];
};

type FilterState = {
  brands: string[];       // brand names đang chọn
  priceMin: number | "";
  priceMax: number | "";
  sortBy: string;
};

const SORT_OPTIONS = [
  { value: "newest",     label: "Mới nhất" },
  { value: "price_asc",  label: "Giá: Thấp → Cao" },
  { value: "price_desc", label: "Giá: Cao → Thấp" },
  { value: "name_asc",   label: "Tên A → Z" },
];

// Hàm format giá ngắn gọn: 1500000 → "1.5tr", 250000 → "250k"
function fmtPrice(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "tr";
  if (n >= 1_000)     return Math.round(n / 1_000) + "k";
  return String(n);
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const PER_PAGE = 20;

// ─── Helper: Product card ─────────────────────────────────────────────────────

function ProductCard({
  product,
  isFav,
  onToggleFav,
}: {
  product: Product;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent, product: Product) => void;
}) {
  const uniqueColors: { id: number; name: string; hex_code: string; colorway_name?: string }[] = [];
  (product.variants || []).forEach((v) => {
    if (v?.color && !uniqueColors.find((c) => c.id === v.color!.id)) {
      uniqueColors.push({
        id: v.color.id,
        name: v.color.name,
        hex_code: v.color.hex_code || "#ccc",
        colorway_name: v.colorway_name,
      });
    }
  });
  const visibleColors = uniqueColors.slice(0, 6);
  const remaining = uniqueColors.length - 6;
  const price = product.variants?.[0]?.price;

  return (
    <div className="relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100">
      {/* Fav button */}
      <button
        onClick={(e) => onToggleFav(e, product)}
        className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition-transform"
        title={isFav ? "Xóa khỏi Yêu thích" : "Thêm vào Yêu thích"}
      >
        <Heart
          size={18}
          className={isFav ? "fill-rose-500 text-rose-500" : "text-gray-400"}
          strokeWidth={isFav ? 0 : 2}
        />
      </button>

      <Link href={`/product/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative h-64 w-full bg-gray-50 overflow-hidden">
          <img
            src={product.base_image_url || "/placeholder.png"}
            alt={product.name}
            className="object-contain w-full h-full mix-blend-multiply p-4
                       group-hover:scale-105 transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow z-10">
            NEW
          </span>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[10px] text-gray-400 font-black mb-0.5 uppercase tracking-widest">
            {product.brand?.name}
          </p>
          <h2 className="text-[15px] font-bold text-gray-900 mb-1.5 truncate group-hover:text-black transition-colors">
            {product.name}
          </h2>
          <p className="text-[16px] text-gray-900 font-black mb-2">
            {price ? Number(price).toLocaleString("vi-VN") + " ₫" : "Liên hệ"}
          </p>

          {/* Color dots */}
          {visibleColors.length > 0 && (
            <div className="flex items-center gap-1.5">
              {visibleColors.map((color) => (
                <div key={color.id} title={color.colorway_name || color.name} className="relative group/dot">
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none z-10">
                    {color.colorway_name || color.name}
                  </span>
                  <span
                    className="block w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm hover:ring-2 hover:ring-offset-1 hover:ring-gray-400 transition-all cursor-pointer"
                    style={{ backgroundColor: color.hex_code }}
                  />
                </div>
              ))}
              {remaining > 0 && (
                <span className="text-[10px] font-bold text-gray-400">+{remaining}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

// ─── Active filter badge ──────────────────────────────────────────────────────

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 bg-gray-900 text-white text-[12px] font-semibold rounded-full">
      {label}
      <button onClick={onRemove} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
        <X size={11} />
      </button>
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientHome({
  initialProducts,
  initialMeta,
  activeCategory,
  activeBrand,
  allBrands,
  priceRange,
}: {
  initialProducts: Product[];
  initialMeta: { current_page: number; last_page: number; total: number };
  activeCategory?: string;
  activeBrand?: string;
  allBrands: { id: number; name: string }[];
  priceRange: { min: number; max: number; buckets: { min: number; max: number }[] };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Products & pagination state
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    brands: activeBrand ? [activeBrand] : [],
    priceMin: "",
    priceMax: "",
    sortBy: "newest",
  });

  // Mobile filter drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  // ── Fetch products from API ───────────────────────────────────────────────

  const fetchProducts = useCallback(
    async (overridePage = 1, overrideFilters?: FilterState, overrideSearch?: string) => {
      setLoading(true);
      const f = overrideFilters ?? filters;
      const s = overrideSearch ?? searchTerm;
      try {
        const url = new URL(`${API}/products`);
        if (activeCategory) url.searchParams.set("category", activeCategory);
        if (f.brands.length > 0) url.searchParams.set("brand", f.brands.join(","));
        if (s.trim()) url.searchParams.set("search", s.trim());
        if (f.sortBy && f.sortBy !== "newest") url.searchParams.set("sort_by", f.sortBy);
        if (f.priceMin !== "") url.searchParams.set("price_min", String(f.priceMin));
        if (f.priceMax !== "") url.searchParams.set("price_max", String(f.priceMax));
        url.searchParams.set("page", String(overridePage));

        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setProducts(data.data?.data ?? []);
          setMeta({
            current_page: data.data?.current_page ?? 1,
            last_page:    data.data?.last_page ?? 1,
            total:        data.data?.total ?? 0,
          });
          setPage(overridePage);
        }
      } catch {
        toast.error("Không thể tải sản phẩm!");
      }
      setLoading(false);
    },
    [filters, searchTerm, activeCategory]
  );

  // ── On filter change → refetch page 1 ────────────────────────────────────

  const applyFilters = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      fetchProducts(1, newFilters, searchTerm);
    },
    [fetchProducts, searchTerm]
  );

  // ── Search with debounce ──────────────────────────────────────────────────

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchProducts(1, filters, searchTerm);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleToggleFavorite = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const price = product.variants?.[0]?.price || 0;
    const isAdded = toggleFavorite({
      product_id: product.id,
      product_name: product.name,
      category_name: product.brand?.name || "Giày Thể Thao",
      price,
      image: product.base_image_url,
      slug: product.slug,
    });
    isAdded
      ? toast.success("Đã thêm vào Yêu thích!")
      : toast("Đã xóa khỏi Yêu thích", { icon: "🗑️" });
  };

  const toggleBrand = (brandName: string) => {
    const next = filters.brands.includes(brandName)
      ? filters.brands.filter((b) => b !== brandName)
      : [...filters.brands, brandName];
    applyFilters({ ...filters, brands: next });
  };

  const resetAll = () => {
    setSearchTerm("");
    const def: FilterState = { brands: [], priceMin: "", priceMax: "", sortBy: "newest" };
    applyFilters(def);
    if (activeCategory || activeBrand) {
      startTransition(() => router.push("/"));
    }
  };

  // Active filter count (không đếm sort vì nó luôn có giá trị)
  const activeFilterCount =
    filters.brands.length +
    (filters.priceMin !== "" ? 1 : 0) +
    (filters.priceMax !== "" ? 1 : 0) +
    (searchTerm ? 1 : 0) +
    (activeCategory ? 1 : 0);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? "Mới nhất";

  // ── Sidebar filter panel (shared between desktop & mobile drawer) ──────────

  const FilterPanel = () => (
    <div className="flex flex-col gap-7">
      {/* ── Thương hiệu ── */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
          Thương hiệu
        </p>
        <div className="flex flex-col gap-2">
          {allBrands.map((brand) => {
            const checked = filters.brands.includes(brand.name);
            return (
              <label key={brand.id} className="flex items-center gap-2.5 cursor-pointer group">
                <span
                  className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded flex items-center justify-center border transition-all ${
                    checked
                      ? "bg-gray-900 border-gray-900"
                      : "border-gray-300 group-hover:border-gray-500"
                  }`}
                  onClick={() => toggleBrand(brand.name)}
                >
                  {checked && (
                    <svg viewBox="0 0 12 10" fill="white" width="10" height="10">
                      <polyline points="1,5 4.5,8.5 11,1" strokeWidth="1.5" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-[14px] transition-colors ${
                    checked ? "font-bold text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                  }`}
                  onClick={() => toggleBrand(brand.name)}
                >
                  {brand.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Khoảng giá ── */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
          Khoảng giá
        </p>

        {/* Hiển thị khoảng đang chọn */}
        <div className="flex justify-between text-[13px] font-semibold text-gray-700 mb-3">
          <span>{filters.priceMin !== "" ? fmtPrice(Number(filters.priceMin)) : fmtPrice(priceRange.min)}</span>
          <span>{filters.priceMax !== "" ? fmtPrice(Number(filters.priceMax)) : fmtPrice(priceRange.max)}</span>
        </div>

        {/* Dual range slider */}
        <div className="relative h-5 flex items-center mb-4">
          {/* Track */}
          <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
          {/* Fill range */}
          <div
            className="absolute h-1.5 bg-gray-900 rounded-full"
            style={{
              left: `${((Number(filters.priceMin !== "" ? filters.priceMin : priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
              right: `${100 - ((Number(filters.priceMax !== "" ? filters.priceMax : priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
            }}
          />
          {/* Min thumb */}
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={100_000}
            value={filters.priceMin !== "" ? Number(filters.priceMin) : priceRange.min}
            onChange={(e) => {
              const val = Number(e.target.value);
              const maxVal = filters.priceMax !== "" ? Number(filters.priceMax) : priceRange.max;
              if (val <= maxVal) {
                const priceMin: number | "" = val === priceRange.min ? "" : val;
                const next = { ...filters, priceMin };
                setFilters(next);
                applyFilters(next);
              }
            }}
            className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900
                       [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab
                       [&::-webkit-slider-thumb]:active:cursor-grabbing"
            style={{ zIndex: filters.priceMin !== "" && Number(filters.priceMin) >= priceRange.max - 100_000 ? 5 : 3 }}
          />
          {/* Max thumb */}
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={100_000}
            value={filters.priceMax !== "" ? Number(filters.priceMax) : priceRange.max}
            onChange={(e) => {
              const val = Number(e.target.value);
              const minVal = filters.priceMin !== "" ? Number(filters.priceMin) : priceRange.min;
              if (val >= minVal) {
                const priceMax: number | "" = val === priceRange.max ? "" : val;
                const next = { ...filters, priceMax };
                setFilters(next);
                applyFilters(next);
              }
            }}
            className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900
                       [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab
                       [&::-webkit-slider-thumb]:active:cursor-grabbing"
            style={{ zIndex: 4 }}
          />
        </div>

        {/* Preset buckets từ server — tự động theo dữ liệu thực */}
        {priceRange.buckets.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {priceRange.buckets.map((b, i) => {
              const isLast = i === priceRange.buckets.length - 1;
              const label = i === 0
                ? `Dưới ${fmtPrice(b.max)}`
                : isLast
                ? `Trên ${fmtPrice(b.min)}`
                : `${fmtPrice(b.min)} – ${fmtPrice(b.max)}`;
              const active = filters.priceMin === b.min && filters.priceMax === (isLast ? "" : b.max);
              return (
                <button
                  key={i}
                  onClick={() =>
                    applyFilters({
                      ...filters,
                      priceMin: active ? "" : (i === 0 ? "" : b.min),
                      priceMax: active ? "" : (isLast ? "" : b.max),
                    })
                  }
                  className={`text-left text-[13px] px-3 py-1.5 rounded-lg transition-all ${
                    active
                      ? "bg-gray-900 text-white font-bold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <button
          onClick={resetAll}
          className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-red-600 transition-colors"
        >
          <RotateCcw size={13} />
          Xóa tất cả bộ lọc
        </button>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <div className="relative bg-black text-white py-20 px-8 mb-0 flex flex-col items-center justify-center text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-35 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1552346154-21d32810baa3?q=80&w=2000&auto=format&fit=crop')",
          }}
        />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-black mb-5 tracking-tighter uppercase italic drop-shadow-lg">
            BƯỚC ĐI TỰ TIN{" "}
            <br />
            <span className="text-red-500">DẪN ĐẦU PHONG CÁCH</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 mb-8 font-medium drop-shadow-md max-w-xl mx-auto">
            Khám phá bộ sưu tập giày giới hạn, độc quyền từ các thương hiệu hàng đầu thế giới.
          </p>
          {/* Searchbar */}
          <div className="relative max-w-xl mx-auto">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm giày, thương hiệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20
                         text-white placeholder:text-gray-400 text-[15px] font-medium
                         focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT: SIDEBAR + GRID ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8">

        {/* ── TOOLBAR: Sort + Filter toggle (mobile) ── */}
        <div className="flex items-center justify-between mb-6 gap-3">
          {/* Left: title + active badges */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h2 className="text-[18px] font-black text-gray-900 uppercase tracking-wide shrink-0">
              {activeCategory
                ? activeCategory.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                : activeBrand
                ? activeBrand
                : searchTerm
                ? `"${searchTerm}"`
                : "Tất cả sản phẩm"}
            </h2>
            {/* Active filter chips */}
            {filters.brands.map((b) => (
              <FilterBadge key={b} label={b} onRemove={() => toggleBrand(b)} />
            ))}
            {(filters.priceMin !== "" || filters.priceMax !== "") && (
              <FilterBadge
                label={`${filters.priceMin !== "" ? Number(filters.priceMin).toLocaleString("vi-VN") + "₫" : "0"} – ${filters.priceMax !== "" ? Number(filters.priceMax).toLocaleString("vi-VN") + "₫" : "∞"}`}
                onRemove={() => applyFilters({ ...filters, priceMin: "", priceMax: "" })}
              />
            )}
            {activeCategory && (
              <FilterBadge
                label={activeCategory}
                onRemove={() => startTransition(() => router.push(activeBrand ? `/?brand=${activeBrand}` : "/"))}
              />
            )}
          </div>

          {/* Right: product count + sort + filter button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Product count */}
            {!loading && (
              <span className="hidden sm:block text-[13px] text-gray-400 font-medium">
                {meta.total} sản phẩm
              </span>
            )}

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-[13px] font-semibold text-gray-700
                           hover:border-gray-900 hover:text-gray-900 transition-all bg-white"
              >
                <ArrowUpDown size={14} />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <ChevronDown size={13} className={`transition-transform ${sortDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {sortDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-40 min-w-[180px] py-1.5 overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          applyFilters({ ...filters, sortBy: opt.value });
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                          filters.sortBy === opt.value
                            ? "font-bold text-gray-900 bg-gray-50"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {opt.label}
                        {filters.sortBy === opt.value && (
                          <span className="ml-2 text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded-full">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-[13px] font-semibold text-gray-700
                         hover:border-gray-900 hover:text-gray-900 transition-all bg-white relative"
            >
              <SlidersHorizontal size={14} />
              Lọc
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[10px] font-black w-4.5 h-4.5 w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── MAIN LAYOUT: SIDEBAR + GRID ── */}
        <div className="flex gap-8">

          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="hidden lg:block w-[220px] shrink-0">
            <div className="sticky top-[80px]">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[12px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal size={14} />
                  Bộ lọc
                  {activeFilterCount > 0 && (
                    <span className="bg-gray-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </p>
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* ── PRODUCT GRID ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              /* Skeleton grid */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: PER_PAGE }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                    <div className="h-64 bg-gray-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-16" />
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                  <Search size={28} className="text-gray-300" />
                </div>
                <p className="text-[18px] font-bold text-gray-500 mb-2">
                  Không tìm thấy sản phẩm nào
                </p>
                <p className="text-[14px] text-gray-400 mb-6">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                </p>
                <button
                  onClick={resetAll}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw size={14} />
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFav={favorites.some((f) => f.product_id === product.id)}
                      onToggleFav={handleToggleFavorite}
                    />
                  ))}
                </div>

                {/* ── Pagination ── */}
                {meta.last_page > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-12">
                    <button
                      onClick={() => fetchProducts(page - 1)}
                      disabled={page <= 1 || loading}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-gray-200
                                 text-[13px] font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
                    >
                      <ChevronLeft size={15} /> Trước
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                        .reduce<(number | "...")[]>((acc, p, i, arr) => {
                          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) =>
                          p === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => fetchProducts(p as number)}
                              className={`w-9 h-9 rounded-full text-[13px] font-semibold transition-all ${
                                p === page
                                  ? "bg-gray-900 text-white"
                                  : "border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 bg-white"
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}
                    </div>

                    <button
                      onClick={() => fetchProducts(page + 1)}
                      disabled={page >= meta.last_page || loading}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-gray-200
                                 text-[13px] font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900
                                 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
                    >
                      Tiếp <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE FILTER DRAWER
      ══════════════════════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 lg:hidden ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out lg:hidden max-h-[85vh] flex flex-col ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0">
          <p className="font-black text-gray-900 text-[16px] flex items-center gap-2">
            <SlidersHorizontal size={16} />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="bg-gray-900 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </p>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <FilterPanel />
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-full py-3.5 rounded-full bg-gray-900 text-white font-bold text-[15px] hover:bg-gray-700 transition-colors"
          >
            Xem {meta.total} sản phẩm
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-[13px] font-semibold z-50">
          <Loader2 size={14} className="animate-spin" />
          Đang tải...
        </div>
      )}
    </main>
  );
}