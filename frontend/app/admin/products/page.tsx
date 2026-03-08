"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminProductAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // 🚨 FIX LỖI TS: Thêm || "" để đảm bảo luôn truyền vào chuỗi
      const res = await adminProductAPI.getAll(token || "");
      if (res.success) {
        setProducts(res.data.data || []);
      } else {
        toast.error(res.message || "Lỗi khi tải dữ liệu");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    }
    setLoading(false);
  };

  const handleAddProduct = () => {
    toast("Tính năng đang phát triển", { icon: "🚧" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
          <button
            onClick={handleAddProduct}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            + Thêm sản phẩm mới
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {loading ? (
              <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình ảnh</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá cơ bản</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product: any) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={product.base_image_url || "/placeholder.jpg"}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md border border-gray-200"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.brand?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {product.variants?.length > 0 
                            ? `${Number(product.variants[0].price).toLocaleString('vi-VN')} ₫` 
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}