import Link from "next/link";
import { Metadata } from "next";
import ClientProductInfo from "./ClientProductInfo";
import { productAPI } from "../../services/api";
import { ArrowLeft } from "lucide-react";

async function getProductDetail(slug: string) {
  try {
    const json = await productAPI.getBySlug(slug);
    return json.data;
  } catch {
    return null;
  }
}

// Bổ sung: 📈 Dynamic SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) {
    return { title: "Không tìm thấy sản phẩm | SneakerStore" };
  }

  return {
    title: `${product.name} | SneakerStore`,
    description: product.description?.substring(0, 160) || `Mua ngay ${product.name} chính hãng với giá tốt nhất tại SneakerStore.`,
    openGraph: {
      title: `${product.name} - SneakerStore`,
      description: product.description?.substring(0, 160) || `Mua ngay ${product.name} chính hãng với giá tốt nhất tại SneakerStore.`,
      images: [product.base_image_url || "/placeholder.png"],
    },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-medium text-gray-500">
        Không tìm thấy sản phẩm!
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Nút quay lại sang trọng, không giới hạn không gian */}
      <div className="max-w-[1920px] mx-auto px-4 md:px-12 pt-8 pb-2">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={16} /> Quay lại cửa hàng
        </Link>
      </div>

      {/* Component con giờ đã được tự do tràn viền */}
      <ClientProductInfo product={product} />
    </main>
  );
}