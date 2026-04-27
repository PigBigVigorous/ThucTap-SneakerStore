"use client";

import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { RefreshCw, Search, Eye, X, Truck, User, ChevronRight } from "lucide-react";
import OrderDetailModal from "../../components/OrderDetailModal";

// ─── Status metadata (Synchronized) ──────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string; next?: { label: string; value: string; cls: string }[] }> = {
  pending: {
    label: "Chờ xác nhận", cls: "bg-amber-100 text-amber-700",
    next: [
      { label: "Hủy đơn", value: "cancelled", cls: "bg-red-600 hover:bg-red-700 text-white" },
    ],
  },
  processing: {
    label: "Đang đóng gói", cls: "bg-indigo-100 text-indigo-700",
    next: [],
  },
  shipped: {
    label: "Đã bàn giao cho đơn vị vận chuyển", cls: "bg-blue-100 text-blue-700",
  },
  delivering: {
    label: "Đang giao hàng", cls: "bg-orange-100 text-orange-700",
  },
  delivered: {
    label: "Hoàn thành", cls: "bg-green-100 text-green-700",
    next: [{ label: "Hoàn / Trả", value: "returned", cls: "bg-orange-500 hover:bg-orange-600 text-white" }],
  },
  cancelled: { label: "Đã hủy", cls: "bg-red-100 text-red-700" },
  returned: { label: "Trả hàng", cls: "bg-gray-100 text-gray-700" },
  failed: { label: "Thất bại", cls: "bg-rose-100 text-rose-700" },

};

const TAB_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "processing", label: "Đang đóng gói" },
  { key: "shipped", label: "Vận chuyển" },
  { key: "delivered", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
  { key: "returned", label: "Trả hàng" },
];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [shippers, setShippers] = useState<any[]>([]);

  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>(undefined);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<any | null>(null);
  const [assigning, setAssigning] = useState(false);

  const fetchOrders = async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    try {
      const json = await adminAPI.getOrders(token);
      if (json.success) setOrders(json.data ?? []);
    } catch (err: any) {
      toast.error("Lỗi kết nối API!");
    } finally {
      setLoading(false);
    }
  };

  const fetchShippers = async () => {
    if (!token) return;
    try {
      const json = await adminAPI.getShippers(token);
      if (json.success) setShippers(json.data ?? []);
    } catch (err) {
      console.error("Lỗi lấy danh sách shipper", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchShippers();

    // 🔄 Real-time Polling mỗi 5 giây
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  const handleAssignShipper = async (orderId: number, shipperId: number) => {
    if (!token) return;
    setAssigning(true);
    try {
      const data = await adminAPI.assignShipper(orderId, shipperId, token);
      if (data.success) {
        toast.success("✅ Đã giao đơn cho Shipper!");
        setSelectedOrderForAssign(null);
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    if (!token) return;
    try {
      const data = await adminAPI.updateOrderStatus(orderId, status, token);
      if (data.success) {
        toast.success("✅ Đã cập nhật trạng thái đơn hàng!");
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    }
  };

  const filtered = orders.filter((o) => {
    const matchTab = tab === "all" ||
      (tab === "shipped" && ['shipped', 'delivering'].includes(o.status)) ||
      o.status === tab;
    const matchSearch = !search ||
      o.order_tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const openDetail = (id: number) => {
    setSelectedOrderId(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Quản lý Đơn hàng</h1>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">Tổng cộng {orders.length} đơn hàng trong hệ thống</p>
        </div>
        <button onClick={() => fetchOrders()} className="flex items-center gap-2 p-3 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-900 transition-all active:scale-95">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {TAB_FILTERS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === t.key ? "bg-gray-900 text-white shadow-lg shadow-gray-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn hàng, tên khách hàng..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-gray-900 transition-all outline-none text-sm font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Đơn hàng</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Khách hàng</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Tổng tiền</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-5">
                  <p className="text-sm font-black text-gray-900">{o.order_tracking_code}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(o.created_at).toLocaleDateString('vi-VN')}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-sm font-bold text-gray-900">{o.customer_name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{o.customer_phone}</p>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_MAP[o.status]?.cls || "bg-gray-100"}`}>
                    {STATUS_MAP[o.status]?.label || o.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <p className="text-sm font-black text-gray-900">{Number(o.total_amount).toLocaleString('vi-VN')}₫</p>
                </td>
                <td className="px-6 py-5 text-right space-x-2">
                  <button onClick={() => openDetail(o.id)} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-blue-600">
                    <Eye size={18} />
                  </button>

                  {o.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'processing')}
                      className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-blue-200"
                    >
                      Xác nhận
                    </button>
                  )}

                  {o.status === 'processing' && !o.shipper_id && (
                    <button
                      onClick={() => setSelectedOrderForAssign(o)}
                      className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-gray-200"
                    >
                      Giao đơn
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Shipper Modal */}
      {selectedOrderForAssign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
                <Truck className="text-blue-600" /> Chọn Shipper
              </h3>
              <button onClick={() => setSelectedOrderForAssign(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
              {shippers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleAssignShipper(selectedOrderForAssign.id, s.id)}
                  disabled={assigning}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-white hover:shadow-xl hover:border-gray-900 border-2 border-transparent rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-gray-900 transition-colors">
                      <User size={20} className="text-gray-400 group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{s.name}</p>
                      <p className="text-[11px] text-gray-400 font-bold">{s.phone}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shared Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        orderId={selectedOrderId}
        onAssignShipper={setSelectedOrderForAssign}
      />
    </div>
  );
}