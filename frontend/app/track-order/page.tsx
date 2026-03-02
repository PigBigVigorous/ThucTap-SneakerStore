"use client";

import { useState } from "react";
import { orderAPI } from "../services/api";
import Link from "next/link";

export default function TrackOrderPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    // Kiểm tra nếu người dùng chưa nhập gì
    if (!trackingCode.trim()) {
      setError("Vui lòng nhập mã đơn hàng!");
      return;
    }

    setLoading(true);
    setError("");
    setOrderData(null);

    try {
      // 🚨 BÍ QUYẾT Ở ĐÂY: Dùng encodeURIComponent để biến dấu # thành %23 an toàn
      const safeCode = encodeURIComponent(trackingCode.trim());
      const data = await orderAPI.getByTrackingCode(safeCode);

      if (data.success) {
        setOrderData(data.data); // Lưu dữ liệu đơn hàng vào state để hiển thị
      } else {
        setError(data.message || "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã!");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-8 uppercase tracking-wide">
          Tra Cứu Đơn Hàng
        </h1>

        {/* Form nhập mã tra cứu */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-md mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Nhập mã đơn hàng (VD: #ORD-O6LBPU)"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-black transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Đang tìm..." : "Tra cứu"}
          </button>
        </div>

        {/* Báo lỗi nếu nhập sai */}
        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded-xl text-center font-semibold mb-8 border border-red-200">
            {error}
          </div>
        )}

        {/* Bảng hiển thị kết quả nếu tìm thấy */}
        {orderData && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
            {/* Header: Mã & Trạng thái */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6 gap-4">
              <div>
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Mã vận đơn</p>
                <p className="text-2xl font-black text-blue-600">{orderData.order_tracking_code}</p>
              </div>
              <div className="md:text-right">
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Trạng thái</p>
                <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold uppercase text-sm">
                  {orderData.status === 'pending' ? 'Đang chờ xử lý' : orderData.status}
                </span>
              </div>
            </div>

            {/* Thông tin giao hàng */}
            <div className="mb-8 bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-700 mb-2"><strong>📍 Giao đến:</strong> {orderData.shipping_address}</p>
              <p className="text-gray-700"><strong>🕒 Ngày đặt:</strong> {new Date(orderData.created_at).toLocaleString('vi-VN')}</p>
            </div>

            {/* Danh sách sản phẩm */}
            <h3 className="font-bold text-xl mb-4 text-gray-800">Sản phẩm đã mua:</h3>
            <div className="space-y-4 mb-8">
              {orderData.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-center border border-gray-200 p-4 rounded-xl hover:shadow-sm transition">
                  <img 
                    src={item.variant.variant_image_url || item.variant.product.base_image_url} 
                    alt="product" 
                    className="w-24 h-24 object-cover rounded-lg bg-gray-100" 
                  />
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">{item.variant.product.name}</p>
                    <p className="text-gray-500 font-medium mt-1">
                      Màu: <span className="text-gray-800">{item.variant.color.name}</span> | 
                      Size: <span className="text-gray-800">{item.variant.size.name}</span>
                    </p>
                    <p className="text-sm font-semibold mt-2 bg-gray-200 inline-block px-2 py-1 rounded">
                      x{item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-red-600">
                    {Number(item.unit_price).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              ))}
            </div>

            {/* Tổng tiền */}
            <div className="text-right border-t pt-6">
              <p className="text-gray-500 font-bold uppercase tracking-widest mb-2">Tổng thanh toán</p>
              <p className="text-4xl font-black text-red-600">
                {Number(orderData.total_amount).toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>
        )}
        
        {/* Nút quay lại trang chủ */}
        <div className="text-center mt-10">
            <Link href="/" className="text-blue-500 font-bold hover:text-blue-700 transition-colors inline-flex items-center gap-2">
                &larr; Tiếp tục mua sắm
            </Link>
        </div>
      </div>
    </main>
  );
}