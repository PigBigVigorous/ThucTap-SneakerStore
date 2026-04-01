import Link from "next/link";
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