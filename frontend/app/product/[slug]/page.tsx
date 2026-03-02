import Link from "next/link";
import ClientProductInfo from "./ClientProductInfo"; // Nhúng Component giao diện vào
import { productAPI } from "../../services/api";

// Gọi API lấy chi tiết sản phẩm theo slug
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
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold">
        Không tìm thấy sản phẩm!
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        {/* Nút quay lại */}
        <Link href="/" className="text-blue-500 hover:text-blue-700 font-semibold mb-6 inline-block">
          &larr; Quay lại cửa hàng
        </Link>

        {/* Toàn bộ giao diện Ảnh, Thông tin, Chọn Size/Màu được nhét vào đây */}
        <ClientProductInfo product={product} />
        
      </div>
    </main>
  );
}