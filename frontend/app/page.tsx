import ClientHome from "./ClientHome";
import { productAPI } from "./services/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function getAllBrands(): Promise<{ id: number; name: string }[]> {
  try {
    const res = await fetch(`${API}/brands`, { cache: "no-store" });
    const data = await res.json();
    return data.success ? (data.data ?? []) : [];
  } catch {
    return [];
  }
}

async function getPriceRange(): Promise<{
  min: number;
  max: number;
  buckets: { min: number; max: number }[];
}> {
  try {
    const res = await fetch(`${API}/products/price-range`, { cache: "no-store" });
    const data = await res.json();
    return data.success ? data.data : { min: 0, max: 10_000_000, buckets: [] };
  } catch {
    return { min: 0, max: 10_000_000, buckets: [] };
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string; search?: string }>;
}) {
  const params = await searchParams;

  const [json, brands, priceRange] = await Promise.all([
    productAPI.getAll({
      category: params.category,
      brand: params.brand,
      search: params.search,
    }),
    getAllBrands(),
    getPriceRange(),
  ]);

  const paginateObj = json.data ?? {};
  const products = paginateObj.data ?? [];
  const meta = {
    current_page: paginateObj.current_page ?? 1,
    last_page: paginateObj.last_page ?? 1,
    total: paginateObj.total ?? 0,
  };

  return (
    <ClientHome
      initialProducts={products}
      initialMeta={meta}
      activeCategory={params.category}
      activeBrand={params.brand}
      allBrands={brands}
      priceRange={priceRange}
    />
  );
}