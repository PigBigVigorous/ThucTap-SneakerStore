"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { orderAPI } from "../../services/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  Search, 
  ShoppingBag, 
  Store,
  MessageCircle,
  Truck,
  ChevronRight,
  Package,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  LayoutGrid
} from "lucide-react";

import OrderDetailModal from "../../components/OrderDetailModal";

type OrderStatus = 'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

const TABS = [
  { id: 'all', label: 'Tất cả', icon: <LayoutGrid size={16} /> },
  { id: 'pending', label: 'Chờ xác nhận', icon: <Clock size={16} /> },
  { id: 'shipped', label: 'Vận chuyển', icon: <Truck size={16} /> },
  { id: 'delivered', label: 'Hoàn thành', icon: <CheckCircle2 size={16} /> },
  { id: 'cancelled', label: 'Đã huỷ', icon: <XCircle size={16} /> },
  { id: 'returned', label: 'Trả hàng', icon: <RotateCcw size={16} /> },
];

const StatusBadge = ({ status }: { status: string }) => {
  const configs: any = {
    pending: { label: 'Chờ xác nhận', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Clock size={12} /> },
    shipped: { label: 'Đang giao hàng', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <Truck size={12} /> },
    delivered: { label: 'Đã hoàn thành', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={12} /> },
    cancelled: { label: 'Đã hủy', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <XCircle size={12} /> },
    returned: { label: 'Trả hàng', color: 'text-gray-600 bg-gray-50 border-gray-100', icon: <RotateCcw size={12} /> },
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${config.color}`}>
      {config.icon}
      {config.label}
    </div>
  );
};

export default function UserPurchasePage() {
  const { user, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId: number) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    try {
      const res = await orderAPI.cancel(orderId, token);
      if (res.success) {
        toast.success(res.message);
        fetchOrders();
        refreshUser();
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
        refreshUser();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể yêu cầu trả hàng");
    }
  };

  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesTab = activeTab === 'all' || order.status === activeTab;
      const q = searchQuery.toLowerCase();
      const matchesSearch = order.order_tracking_code.toLowerCase().includes(q) ||
                           order.items?.some((item: any) => item.variant?.product?.name.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const router = useMemo(() => ({ push: (url: string) => window.location.href = url }), []);

  if (!user) return null;

  return (
    <div className="bg-transparent animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="p-6 sm:p-8 bg-white border-b border-gray-100 rounded-t-3xl">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <ShoppingBag className="text-gray-900" size={28} />
          Đơn hàng của tôi
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">Theo dõi và quản lý lịch sử mua sắm của bạn</p>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex overflow-x-auto no-scrollbar shadow-sm px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderStatus)}
            className={`flex items-center gap-2 px-6 py-4 text-sm transition-all relative font-bold whitespace-nowrap ${
              activeTab === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 rounded-t-full animate-in slide-in-from-bottom-1" />
            )}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="p-4 sm:p-6">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 sm:px-6 space-y-6 pb-20">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 animate-pulse space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                <div className="h-6 w-40 bg-gray-100 rounded-full"></div>
                <div className="h-6 w-24 bg-gray-100 rounded-full"></div>
              </div>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl"></div>
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded-full"></div>
                  <div className="h-3 w-1/2 bg-gray-50 rounded-full"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white flex flex-col items-center justify-center py-32 rounded-3xl border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 rotate-12 transition-transform hover:rotate-0 duration-500">
              <ShoppingBag size={48} className="text-gray-200" />
            </div>
            <p className="text-gray-900 font-black text-xl">Chưa có đơn hàng nào</p>
            <p className="text-gray-400 text-sm mt-2 mb-8">Bắt đầu mua sắm để lấp đầy lịch sử của bạn!</p>
            <Link 
              href="/"
              className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-900/5 transition-all duration-500 group">
              {/* Order Header */}
              <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4 bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Store size={18} className="text-gray-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900">Sneaker Store</span>
                      {(order.sales_channel?.type === 'pos' || order.salesChannel?.type === 'pos') && (
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">POS</span>
                      )}
                    </div>
                    {(order.sales_channel?.type === 'pos' || order.salesChannel?.type === 'pos') && (
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                         {order.branch?.province?.name || order.branch?.name || 'Chi nhánh'}
                      </p>
                    )}
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Order Items */}
              <div className="divide-y divide-gray-50 px-6">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="py-6 flex gap-5 group/item cursor-pointer" onClick={() => openDetail(order)}>
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 relative group-hover/item:border-gray-200 transition-all">
                      <img 
                        src={item.variant?.product?.base_image_url || "/placeholder.png"} 
                        alt={item.variant?.product?.name} 
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-base font-bold text-gray-900 group-hover/item:text-blue-600 transition-colors line-clamp-1">{item.variant?.product?.name}</h3>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-gray-900">
                            {Number(item.unit_price).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 font-medium">
                        Phân loại: <span className="text-gray-600">{item.variant?.color?.name}</span> · Size: <span className="text-gray-600 uppercase">{item.variant?.size?.name?.replace('EU-', '')}</span>
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">x{item.quantity}</span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-widest">
                          <AlertCircle size={12} />
                          Trả hàng miễn phí 7 ngày
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="bg-gray-50/50 px-6 py-6 border-t border-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <div className="flex items-center gap-1.5">
                      <Package size={14} />
                      {order.items?.length || 0} sản phẩm
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-rose-600 tracking-tighter">
                      {Number(order.total_amount).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                   <button 
                    onClick={() => openDetail(order)}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
                   >
                     Chi tiết đơn hàng
                   </button>

                   {order.status === 'pending' && (
                     <button 
                      onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-white border border-rose-100 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
                     >
                       Hủy đơn hàng
                     </button>
                   )}

                   {order.status === 'delivered' && (
                     <>
                      <button 
                        onClick={() => router.push("/")}
                        className="flex-1 sm:flex-none px-8 py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-900/10"
                      >
                        Mua lại
                      </button>
                      <button 
                        onClick={() => handleReturnOrder(order.id)}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                      >
                        Yêu cầu trả hàng
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
