import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { discountAPI, Discount } from "../services/api";
import { useAuth } from "../context/AuthContext";

export type Product = {
  id: number;
  name: string;
  slug: string;
  base_image_url: string;
  brand?: { id: number; name: string };
  category?: { name: string; slug: string };
  variants?: { price: number; color?: { id: number; name: string; hex_code?: string }; colorway_name?: string }[];
};

export type FilterState = {
  brands: string[];
  priceMin: number | "";
  priceMax: number | "";
  sortBy: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export function useProductFilters(
  initialProducts: Product[],
  initialMeta: { current_page: number; last_page: number; total: number },
  activeCategory?: string,
  activeBrand?: string
) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [vouchers, setVouchers] = useState<Discount[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    brands: activeBrand ? [activeBrand] : [],
    priceMin: "",
    priceMax: "",
    sortBy: "newest",
  });

  const [tempPriceMin, setTempPriceMin] = useState<string>("");
  const [tempPriceMax, setTempPriceMax] = useState<string>("");

  useEffect(() => {
    setTempPriceMin(filters.priceMin === "" ? "" : String(filters.priceMin));
    setTempPriceMax(filters.priceMax === "" ? "" : String(filters.priceMax));
  }, [filters.priceMin, filters.priceMax]);

  useEffect(() => {
    if (user?.role === "shipper") {
      router.push("/shipper/orders");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const token = localStorage.getItem("token") || undefined;
        const res = await discountAPI.getActive(token);
        if (res.success) setVouchers(res.data);
      } catch (err) {
        console.error("Lỗi tải voucher:", err);
      }
    };
    fetchVouchers();
  }, [isAuthenticated]);

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
            last_page: data.data?.last_page ?? 1,
            total: data.data?.total ?? 0,
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

  const applyFilters = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      fetchProducts(1, newFilters, searchTerm);
    },
    [fetchProducts, searchTerm]
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchProducts(1, filters, searchTerm);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm]);

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
    if (activeCategory || activeBrand) startTransition(() => router.push("/"));
  };

  return {
    products,
    meta,
    page,
    loading,
    searchTerm,
    setSearchTerm,
    vouchers,
    filters,
    setFilters,
    tempPriceMin,
    setTempPriceMin,
    tempPriceMax,
    setTempPriceMax,
    toggleBrand,
    resetAll,
    fetchProducts,
    applyFilters,
    user,
    isAuthenticated
  };
}
