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
  Truck,
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

type OrderStatus = 'all' | 'pending' | 'shipped' | 'delivering' | 'delivered' | 'cancelled' | 'returned' | 'failed';

const TABS = [
  { id: 'all', label: 'Tất cả', icon: <LayoutGrid size={16} /> },
  { id: 'pending', label: 'Chờ xác nhận', icon: <Clock size={16} /> },
  { id: 'shipped', label: 'Đã bàn giao', icon: <Truck size={16} /> },
  { id: 'delivering', label: 'Đang giao hàng', icon: <Truck size={16} /> },
  { id: 'delivered', label: 'Hoàn thành', icon: <CheckCircle2 size={16} /> },
  { id: 'failed', label: 'Thất bại', icon: <AlertCircle size={16} /> },
  { id: 'cancelled', label: 'Đã huỷ', icon: <XCircle size={16} /> },
  { id: 'returned', label: 'Trả hàng', icon: <RotateCcw size={16} /> },
];

const StatusBadge = ({ status }: { status: string }) => {
  const configs: any = {
    pending: { label: 'Chờ xác nhận', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Clock size={12} /> },
    shipped: { label: 'Đã bàn giao cho đơn vị vận chuyển', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <Truck size={12} /> },
    delivering: { label: 'Đang giao hàng', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: <Truck size={12} /> },
    delivered: { label: 'Hoàn thành', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={12} /> },
    cancelled: { label: 'Đã hủy', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <XCircle size={12} /> },
    returned: { label: 'Trả hàng', color: 'text-gray-600 bg-gray-50 border-gray-100', icon: <RotateCcw size={12} /> },
    failed: { label: 'Thất bại', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <AlertCircle size={12} /> },
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.color}`}>
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
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>(undefined);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const handleOpenReturnModal = (orderId: number) => {
    setReturnOrderId(orderId);
    setReturnReason("");
    setIsReturnModalOpen(true);
  };

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
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

    // 🔄 Real-time Polling mỗi 5 giây
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => clearInterval(interval);
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

  const handleReturnOrder = (orderId: number) => {
    handleOpenReturnModal(orderId);
  };

  const submitReturnRequest = async () => {
    if (!token || !returnOrderId) return;
    if (!returnReason.trim()) {
      toast.error("Vui lòng nhập lý do trả hàng!");
      return;
    }
    setIsSubmittingReturn(true);
    try {
      const res = await orderAPI.return(returnOrderId, returnReason, token);
      if (res.success) {
        toast.success(res.message);
        setIsReturnModalOpen(false);
        fetchOrders();
        refreshUser();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể yêu cầu trả hàng");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const openDetail = (id: number) => {
    setSelectedOrderId(id);
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

  if (!user) return null;

  return (
    <div className="bg-transparent animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="p-6 sm:p-8 bg-white border-b border-gray-100 rounded-t-3xl shadow-sm">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 uppercase">
          <ShoppingBag className="text-gray-900" size={28} />
          Đơn hàng của tôi
        </h1>
        <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mt-1">Lịch sử mua sắm và quản lý đơn hàng</p>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex overflow-x-auto no-scrollbar shadow-sm px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderStatus)}
            className={`flex items-center gap-2 px-6 py-5 text-xs transition-all relative font-black uppercase tracking-widest whitespace-nowrap ${activeTab === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
          >
            {tab.id === activeTab && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse mr-1" />}
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 rounded-t-full" />
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
            placeholder="Mã đơn hàng, tên sản phẩm..."
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 sm:px-6 space-y-6 pb-20">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 animate-pulse h-60" />
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white flex flex-col items-center justify-center py-32 rounded-[32px] border border-gray-100">
            <ShoppingBag size={48} className="text-gray-100 mb-4" />
            <p className="text-gray-900 font-black text-lg uppercase">Trống trải quá...</p>
            <p className="text-gray-400 text-xs mt-2 mb-8 font-bold uppercase tracking-widest">Bạn chưa có đơn hàng nào trong mục này</p>
            <Link href="/" className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-gray-200">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-gray-900 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm uppercase tracking-tighter">
                    {order.order_tracking_code}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    • {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Items Preview (Only first one) */}
              <div className="px-6 py-6" onClick={() => openDetail(order.id)}>
                {order.items && order.items[0] && (
                  <div className="flex gap-4 cursor-pointer group">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                      <img src={order.items[0].variant?.product?.base_image_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-sm font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {order.items[0].variant?.product?.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">
                        {order.items[0].variant?.color?.name} / {order.items[0].variant?.size?.name?.replace("EU-", "")}
                      </p>
                      {order.items.length > 1 && (
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-2">
                          + {order.items.length - 1} sản phẩm khác
                        </p>
                      )}
                    </div>
                    <div className="text-right flex flex-col justify-center shrink-0">
                      <p className="text-sm font-black text-gray-900">{Number(order.total_amount).toLocaleString('vi-VN')}₫</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tổng tiền</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => openDetail(order.id)}
                  className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
                >
                  Xem chi tiết
                </button>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="px-6 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-100 transition-all active:scale-95"
                  >
                    Hủy đơn
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button
                    onClick={() => handleOpenReturnModal(order.id)}
                    className="px-6 py-2.5 rounded-xl bg-gray-900 border border-gray-900 text-[11px] font-black uppercase tracking-widest text-white hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                  >
                    Trả hàng
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        orderId={selectedOrderId}
        onCancel={handleCancelOrder}
        onReturn={handleReturnOrder}
      />

      {/* Custom Return Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={() => setIsReturnModalOpen(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-[15px] font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
                <RotateCcw size={18} className="text-gray-900" />
                Yêu cầu trả hàng
              </h2>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors bg-white p-1 rounded-full shadow-sm border border-gray-100 hover:bg-rose-50">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                Lý do trả hàng <span className="text-rose-500">*</span>
              </p>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Vui lòng nhập chi tiết lý do bạn muốn trả lại sản phẩm này..."
                rows={4}
                className="w-full border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 p-4 text-sm font-bold text-gray-900 bg-gray-50 focus:bg-white transition-all resize-none placeholder-gray-400 outline-none border"
                required
              />
              <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl p-4 text-[11px] leading-relaxed font-bold">
                <strong>⚠️ Lưu ý:</strong> Thao tác trả hàng sẽ hoàn trả số tiền tương ứng, thu hồi số điểm đã cộng khi mua và hoàn lại điểm tích lũy (nếu đã tiêu).
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-6 py-3 font-black text-[11px] uppercase tracking-widest text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitReturnRequest}
                disabled={isSubmittingReturn}
                className={`px-8 py-3 font-black text-[11px] uppercase tracking-widest text-white rounded-xl shadow-lg transition-all flex items-center gap-2 ${isSubmittingReturn ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 shadow-black/10'}`}
              >
                {isSubmittingReturn ? (
                  <>
                    <div className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" />
                    Đang xử lý...
                  </>
                ) : (
                  "Gửi yêu cầu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
