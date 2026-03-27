"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { orderAPI } from "../services/api";
import toast from "react-hot-toast";
import Link from "next/link";
import OrderDetailModal from "../components/OrderDetailModal";

export default function MyOrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchMyOrders = async () => {
      if (!token) return;
      try {
        const json = await orderAPI.getMyOrders(token);
        if (json.success) {
          setOrders(json.data);
        } else {
          toast.error(json.message || "Lỗi lấy dữ liệu đơn hàng!");
        }
      } catch (error) {
        toast.error("Lỗi kết nối đến máy chủ!");
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [token]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Bạn cần đăng nhập để xem đơn hàng!</h1>
        <Link href="/login" className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gray-800 transition">
          Đến trang Đăng nhập
        </Link>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center font-bold text-xl text-gray-600">Đang tải dữ liệu...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-wide mb-8">
          Đơn Hàng Của Tôi
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 font-bold text-xl mb-6">Bạn chưa có đơn hàng nào cả. 😢</p>
            <Link href="/" className="bg-black text-white px-8 py-4 rounded-xl font-bold inline-block hover:bg-gray-800 transition shadow-lg">
              &larr; Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-center hover:shadow-md transition-shadow">
                
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="font-black text-blue-600 text-xl tracking-wider hover:text-blue-800 hover:underline cursor-pointer transition-all"
                    >
                      {order.order_tracking_code}
                    </button>
                    
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-bold">
                    📅 Ngày đặt: <span className="text-gray-800">{new Date(order.created_at).toLocaleString('vi-VN')}</span>
                  </p>
                  <p className="text-sm text-gray-500 font-bold line-clamp-2" title={order.shipping_address}>
                    📍 Giao đến: <span className="text-gray-800">{order.shipping_address}</span>
                  </p>
                </div>
                
                <div className="text-left md:text-right w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  <p className="text-sm text-gray-400 font-bold mb-1 uppercase tracking-widest">Tổng tiền</p>
                  <p className="font-black text-red-600 text-2xl">
                    {Number(order.total_amount).toLocaleString('vi-VN')} đ
                  </p>
                  {/* Nút Phụ để mở Modal cho dễ thấy */}
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    Xem chi tiết &rarr;
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
        <OrderDetailModal 
          isOpen={!!selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          order={selectedOrder} 
        />

      </div>
    </main>
  );
}