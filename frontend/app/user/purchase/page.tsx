"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { orderAPI } from "../../services/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  Search, 
  ShoppingBag, 
  Store,
  MessageCircle,
  Truck
} from "lucide-react";

import OrderDetailModal from "../../components/OrderDetailModal";

type OrderStatus = 'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'shipped', label: 'Chờ giao hàng' },
  { id: 'delivered', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã huỷ' },
  { id: 'returned', label: 'Trả hàng/Hoàn tiền' },
];

export default function UserPurchasePage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const json = await orderAPI.getMyOrders(token);
      if (json.success) {
        setOrders(json.data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleCancelOrder = async (orderId: number) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    try {
      const res = await orderAPI.cancel(orderId, token);
      if (res.success) {
        toast.success(res.message);
        fetchOrders();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể hủy đơn hàng");
    }
  };

  const handleReturnOrder = async (orderId: number) => {
    if (!token) return;
    const reason = prompt("Vui lòng nhập lý do trả hàng:");
    if (!reason) return;

    try {
      const res = await orderAPI.return(orderId, reason, token);
      if (res.success) {
        toast.success(res.message);
        fetchOrders();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể yêu cầu trả hàng");
    }
  };

  const handleBuyAgain = (order: any) => {
    // Thêm các sản phẩm vào giỏ hàng và chuyển trang
    // Tạm thời chỉ redirect về trang chủ để khách chọn lại, hoặc logic add to cart
    toast.success("Đang chuyển hướng đến giỏ hàng...");
    router.push("/");
  };

  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = order.order_tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items?.some((item: any) => item.variant?.product?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const router = React.useMemo(() => ({ push: (url: string) => window.location.href = url }), []);

  if (!user) return null;

  return (
    <div className="bg-white rounded-sm">
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex overflow-x-auto no-scrollbar shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderStatus)}
            className={`flex-1 min-w-[120px] py-4 text-sm transition-colors relative font-bold ${
              activeTab === tab.id ? "text-red-600" : "text-gray-700 hover:text-red-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-[#f5f5f5]">
        <div className="relative bg-white border border-gray-200 rounded-sm p-3 flex items-center gap-2 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Bạn có thể tìm kiếm theo ID đơn hàng hoặc Tên Sản phẩm"
            className="bg-transparent flex-1 text-sm focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-[#f5f5f5] space-y-4 pb-10">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-sm animate-pulse space-y-4">
              <div className="flex justify-between border-b pb-3">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white flex flex-col items-center justify-center py-20 rounded-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={48} className="text-gray-200" />
            </div>
            <p className="text-gray-600 text-sm">Chưa có đơn hàng</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-sm shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-500 mr-1">Sneaker Store</span>
                  {(order.sales_channel?.type === 'pos' || order.salesChannel?.type === 'pos') && (
                    <span className="text-xs text-gray-400 border-l pl-2">
                      Chi nhánh {order.branch?.province?.name || order.branch?.name || 'Hệ thống'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center text-red-600 text-sm gap-1 font-bold">
                      <Truck size={16} />
                      <span className="uppercase text-xs">
                        {order.status === 'pending' ? 'Chờ xác nhận' :
                         order.status === 'shipped' ? 'Đang giao hàng' :
                         order.status === 'delivered' ? 'Đã giao hàng' :
                         order.status === 'cancelled' ? 'Đã hủy' : 'Trả hàng'}
                      </span>
                   </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-gray-50">
                {order.items?.map((item: any) => (
                  <Link href={"/product/" + item.variant?.product?.slug} key={item.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors group">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-100 flex-shrink-0 rounded overflow-hidden">
                      <img 
                        src={item.variant?.product?.base_image_url || "/placeholder.png"} 
                        alt={item.variant?.product?.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-800 truncate mb-1 group-hover:text-red-600 transition-colors">{item.variant?.product?.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">
                        Phân loại: {item.variant?.color?.name}, {item.variant?.size?.name}
                      </p>
                      <p className="text-xs font-medium">x{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-red-600 font-bold">
                        {Number(item.unit_price).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Order Footer */}
              <div className="bg-[#fffefb] px-4 py-4 border-t border-gray-50">
                <div className="flex justify-end items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Thành tiền:</span>
                  <span className="text-xl text-red-600 font-black">
                    {(() => {
                      const subtotal = order.items?.reduce((acc: number, item: any) => acc + (Number(item.unit_price) * item.quantity), 0) || 0;
                      const shipping = Number(order.shipping_fee || 0);
                      const discount = Number(order.discount_amount || 0);
                      const points = Number((order.points_used || 0) * 1000);
                      const total = subtotal + shipping - discount - points;
                      return Math.max(0, total).toLocaleString('vi-VN');
                    })()}đ
                  </span>
                </div>
                <div className="flex justify-end items-center gap-3">
                   <button 
                    onClick={() => openDetail(order)}
                    className="border border-gray-300 px-6 py-2 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors"
                   >
                     Xem chi tiết
                   </button>

                   {order.status === 'pending' && (
                     <button 
                      onClick={() => handleCancelOrder(order.id)}
                      className="border border-red-500 text-red-600 px-6 py-2 rounded-sm text-sm font-bold hover:bg-red-50 transition-colors"
                     >
                       Hủy đơn
                     </button>
                   )}

                   {order.status === 'delivered' && (
                     <>
                      <button 
                        onClick={() => handleBuyAgain(order)}
                        className="bg-red-600 text-white px-8 py-2 rounded-sm text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        Mua lại
                      </button>
                      <button 
                        onClick={() => handleReturnOrder(order.id)}
                        className="border border-gray-300 px-6 py-2 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors"
                      >
                        Trả hàng
                      </button>
                     </>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <OrderDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        orderId={selectedOrder?.id}
        trackingCode={selectedOrder?.order_tracking_code}
        onCancel={handleCancelOrder}
        onReturn={handleReturnOrder}
      />
    </div>
  );
}
