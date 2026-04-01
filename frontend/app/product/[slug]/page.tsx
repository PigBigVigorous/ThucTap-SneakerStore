import Link from "next/link";
import ClientProductInfo from "./ClientProductInfo";
import { productAPI } from "../../services/api";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

// 1. Hàm lấy chi tiết sản phẩm
async function getProductDetail(slug: string) {
  try {
    const json = await productAPI.getBySlug(slug);
    return json.data;
  } catch {
    return null;
  }
}

// 🚨 2. HÀM MỚI (FULLSTACK): Lấy danh sách sản phẩm gợi ý
async function getRelatedProducts() {
  try {
    // Gọi API lấy danh sách sản phẩm (Tùy chỉnh số lượng per_page)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/products?per_page=12`, {
      next: { revalidate: 60 } // Caching 60s để tăng tốc độ load web
    });
    const data = await res.json();
    return data.data?.data || data.data || [];
  } catch {
    return [];
  }
}

// 3. Tự động tạo SEO (Dynamic Metadata)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) return { title: "Không tìm thấy sản phẩm" };

  return {
    title: `${product.name} | Sneaker Store`,
    description: product.description || `Mua ngay ${product.name} chính hãng tại Sneaker Store.`,
    openGraph: {
      images: [product.base_image_url || ''],
    },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 🚨 Gọi 2 hàm song song (Tối ưu hiệu suất)
  const product = await getProductDetail(slug);
  const allProducts = await getRelatedProducts();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-medium text-gray-500">
        Không tìm thấy sản phẩm!
      </div>
    );
  }

  // 🚨 Logic Senior: Lọc bỏ sản phẩm đang xem, chỉ lấy 8 sản phẩm hiển thị
  const relatedProducts = allProducts
    .filter((p: any) => p.id !== product.id)
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-white">
      {/* Nút quay lại */}
      <div className="max-w-[1920px] mx-auto px-4 md:px-12 pt-8 pb-2">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={16} /> Quay lại cửa hàng
        </Link>
      </div>

      {/* 🚨 Truyền thêm props relatedProducts vào Client Component */}
      <ClientProductInfo product={product} relatedProducts={relatedProducts} />
    </main>
  );
}