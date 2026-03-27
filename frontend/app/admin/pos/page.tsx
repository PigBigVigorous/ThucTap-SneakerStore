"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Search, Plus, Minus, ShoppingCart, X } from "lucide-react";

interface Product {
  id: number;
  sku: string;
  price: number;
  image_url: string;
  product: {
    id: number;
    name: string;
    description: string;
  };
  color: { id: number; name: string } | null;
  size: { id: number; name: string } | null;
  stock: number;
}

interface CartItem {
  variant_id: number;
  quantity: number;
  product: Product;
}

export default function PosPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [branchId, setBranchId] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [token, branchId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.sku.toLowerCase().includes(query) ||
            p.product.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await adminAPI.getPosProducts(token, branchId, 100);
      if (response.success) {
        setProducts(response.data || []);
      } else {
        toast.error("Lỗi tải danh sách sản phẩm!");
      }
    } catch (error) {
      toast.error("Lỗi kết nối API!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Sản phẩm này hết hàng!");
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.variant_id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map((item) =>
            item.variant_id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          toast.error("Không đủ hàng để tăng số lượng!");
          return prevCart;
        }
      } else {
        return [...prevCart, { variant_id: product.id, quantity: 1, product }];
      }
    });
    toast.success("Thêm vào giỏ hàng!");
  };

  const removeFromCart = (variantId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.variant_id !== variantId));
    toast.success("Xóa khỏi giỏ hàng!");
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    const product = products.find((p) => p.id === variantId);
    if (product && quantity > product.stock) {
      toast.error("Số lượng vượt quá hàng trong kho!");
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variant_id === variantId ? { ...item, quantity } : item
      )
    );
  };

  // 🚨 ĐÃ FIX: Bọc Number() để tránh lỗi phép cộng chuỗi
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Giỏ hàng trống!");
      return;
    }

    setProcessing(true);
    try {
      const items = cart.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));

      const response = await adminAPI.posCreateOrder(token!, {
        items,
        branch_id: branchId,
      });

      if (response.success) {
        toast.success("Thanh toán thành công!");
        setCart([]);
        fetchProducts();
      } else {
        toast.error(response.message || "Lỗi thanh toán!");
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi kết nối!");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          Hệ Thống Bán Hàng Tại Quầy (POS)
        </h1>
        <p className="text-gray-600 mt-2">Chi nhánh: Branch {branchId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Products (70%) */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo SKU hoặc tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative bg-gray-200 h-40 md:h-48 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">
                      {product.product.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">SKU: {product.sku}</p>

                    <div className="flex gap-2 mt-2 text-xs text-gray-600">
                      {product.color && <span>Color: {product.color.name}</span>}
                      {product.size && <span>Size: {product.size.name}</span>}
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <span className="font-bold text-blue-600">
                        {Number(product.price).toLocaleString('vi-VN')} ₫
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          product.stock > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        Còn: {product.stock}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`w-full mt-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        product.stock > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="inline w-4 h-4 mr-1" />
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Cart (30%) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              Giỏ Hàng
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Giỏ hàng trống</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variant_id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">
                          {item.product.product.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          SKU: {item.product.sku}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variant_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded">
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="px-2 font-semibold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <span className="font-semibold text-sm text-blue-600">
                        {(Number(item.product.price) * item.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 mb-4"></div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Tên thành tiền:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {Number(calculateTotal()).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              className={`w-full py-3 rounded-lg font-bold text-white text-lg transition-colors ${
                cart.length === 0 || processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {processing ? 'Đang xử lý...' : 'Thanh Toán'}
            </button>

            <button
              onClick={fetchProducts}
              className="w-full mt-2 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Làm Mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}