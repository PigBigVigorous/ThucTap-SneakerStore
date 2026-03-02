"use client";

import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext"; // 👈 Nhúng AuthContext

export default function AdminOrdersPage() {
  const { token } = useAuth(); // 👈 Lấy token của Admin đang đăng nhập
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!token) return; // Nếu chưa load xong token thì khoan gọi API
    try {
      const json = await adminAPI.getOrders(token);
      if (json.success) {
        setOrders(json.data);
      } else {
        toast.error(json.message || "Lỗi lấy dữ liệu!");
      }
    } catch (error) {
      toast.error("Lỗi lấy dữ liệu đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]); // Gắn token vào mảng dependency để tự động gọi lại khi có token

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập trước!");
      return;
    }
    try {
      const data = await adminAPI.updateOrderStatus(orderId, newStatus, token);
      
      if (data.success) {
        toast.success(data.message);
        fetchOrders(); 
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Lỗi kết nối đến máy chủ!");
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center text-xl font-bold">Đang tải dữ liệu...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-wide">
            Quản Lý Đơn Hàng
          </h1>
          <div className="flex gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-black font-bold transition">
              Quản lý Kho
            </Link>
            <span className="bg-black text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md">
              Đơn hàng
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider border-b-2 border-gray-200">
                  <th className="p-5 font-bold">Mã Đơn</th>
                  <th className="p-5 font-bold">Ngày đặt</th>
                  <th className="p-5 font-bold max-w-xs">Thông tin giao hàng</th>
                  <th className="p-5 font-bold text-right">Tổng tiền</th>
                  <th className="p-5 font-bold text-center">Trạng thái</th>
                  <th className="p-5 font-bold text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-5 font-bold text-blue-600">{order.order_tracking_code}</td>
                    <td className="p-5 text-gray-600 text-sm font-medium">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-5 text-sm text-gray-600 font-medium max-w-xs line-clamp-2" title={order.shipping_address}>
                      {order.shipping_address}
                    </td>
                    <td className="p-5 text-right font-black text-red-600 text-lg">
                      {Number(order.total_amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition"
                            >
                              Giao hàng
                            </button>
                            <button 
                              onClick={() => {
                                if(window.confirm('⚠️ Bạn có chắc chắn muốn HỦY đơn hàng này không?')) {
                                  handleUpdateStatus(order.id, 'cancelled');
                                }
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition"
                            >
                              Hủy đơn
                            </button>
                          </>
                        )}
                        
                        {order.status === 'shipped' && (
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition"
                          >
                            Hoàn thành
                          </button>
                        )}
                        
                        {order.status === 'delivered' && (
                          <span className="text-gray-400 font-bold text-sm">✔ Đã giao</span>
                        )}

                        {order.status === 'cancelled' && (
                          <span className="text-red-500 font-bold text-sm">❌ Đã hủy</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}