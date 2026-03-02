import ClientHome from "./ClientHome";
import { productAPI } from "./services/api";

// Gọi API lấy danh sách sản phẩm từ Laravel
async function getProducts() {
  const json = await productAPI.getAll();
  return json.data.data;
}

export default async function Home() {
  const products = await getProducts();

  // Truyền dữ liệu vào giao diện Client có Banner và ô Tìm kiếm
  return <ClientHome initialProducts={products} />;
}