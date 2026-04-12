"use client";

import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { RefreshCw, Search } from "lucide-react";

// ─── Status metadata ─────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string; next?: { label: string; value: string; cls: string }[] }> = {
  pending:   {
    label: "Chờ xử lý", cls: "bg-amber-100 text-amber-700",
    next: [
      { label: "Giao hàng", value: "shipped",   cls: "bg-blue-600 hover:bg-blue-700 text-white" },
      { label: "Hủy đơn",   value: "cancelled", cls: "bg-red-600  hover:bg-red-700  text-white" },
    ],
  },
  shipped:   {
    label: "Đang giao",  cls: "bg-blue-100  text-blue-700",
    next: [{ label: "Hoàn thành", value: "delivered", cls: "bg-green-600 hover:bg-green-700 text-white" }],
  },
  delivered: {
    label: "Đã giao",    cls: "bg-green-100 text-green-700",
    next: [{ label: "Hoàn / Trả", value: "returned", cls: "bg-orange-500 hover:bg-orange-600 text-white" }],
  },
  cancelled: { label: "Đã hủy",   cls: "bg-red-100    text-red-700"    },
  returned:  { label: "Trả hàng", cls: "bg-orange-100 text-orange-700" },
};

const TAB_FILTERS = [
  { key: "all",       label: "Tất cả"     },
  { key: "pending",   label: "Chờ xử lý"  },
  { key: "shipped",   label: "Đang giao"  },
  { key: "delivered", label: "Đã giao"    },
  { key: "cancelled", label: "Đã hủy"     },
  { key: "returned",  label: "Trả hàng"   },
];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("all");
  const [search, setSearch]   = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const json = await adminAPI.getOrders(token);
      if (json.success) setOrders(json.data ?? []);
      else toast.error(json.message || "Lỗi lấy đơn hàng!");
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
      } else {
        toast.error("Lỗi kết nối API!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [token]);

  const handleUpdate = async (orderId: number, newStatus: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    if (!token) return toast.error("Vui lòng đăng nhập!");
    setActionLoading(orderId);
    try {
      const data = await adminAPI.updateOrderStatus(orderId, newStatus, token);
      if (data.success) { toast.success(data.message); fetchOrders(); }
      else toast.error(data.message);
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchTab    = tab === "all" || o.status === tab;
    const matchSearch = !search ||
      o.order_tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_address?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const countByStatus = (s: string) => orders.filter((o) => o.status === s).length;

  return (
    <>
      <div className="space-y-5 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[26px] font-black text-gray-900 tracking-tight">Đơn hàng</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">{orders.length} đơn hàng tổng cộng</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl
                       text-[13px] font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {/* Search + Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

          {/* Search bar */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <div className="relative max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã đơn, địa chỉ..."
                className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-xl outline-none
                           focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide gap-1 px-4 py-2 border-b border-gray-50">
            {TAB_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap shrink-0 transition-all
                  ${tab === key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
              >
                {label}
                {key !== "all" && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                    ${tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {countByStatus(key)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 font-semibold animate-pulse">
              Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 font-semibold">
              Không có đơn hàng nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[11px] uppercase tracking-widest text-gray-400">
                    <th className="px-5 py-3 font-bold">Mã đơn</th>
                    <th className="px-5 py-3 font-bold">Ngày đặt</th>
                    <th className="px-5 py-3 font-bold">Địa chỉ giao</th>
                    <th className="px-5 py-3 font-bold text-right">Tổng tiền</th>
                    <th className="px-5 py-3 font-bold text-center">Trạng thái</th>
                    <th className="px-5 py-3 font-bold text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((order) => {
                    const meta = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-gray-100 text-gray-600" };
                    const isLoading = actionLoading === order.id;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4 font-bold text-blue-600 text-[13px]">
                          {order.order_tracking_code}
                        </td>
                        <td className="px-5 py-4 text-[13px] text-gray-500 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-4 text-[13px] text-gray-600 max-w-[220px] truncate" title={order.shipping_address}>
                          {order.shipping_address}
                        </td>
                        <td className="px-5 py-4 text-right font-black text-[14px] text-gray-900 whitespace-nowrap">
                          {Number(order.total_amount).toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {isLoading ? (
                              <span className="text-[12px] text-gray-400 font-semibold animate-pulse">Đang xử lý...</span>
                            ) : (
                              meta.next?.map(({ label, value, cls }) => (
                                <button
                                  key={value}
                                  onClick={() =>
                                    handleUpdate(
                                      order.id, value,
                                      value === "cancelled"
                                        ? "⚠️ Bạn có chắc muốn HỦY đơn hàng này?"
                                        : value === "returned"
                                        ? "⚠️ Xác nhận khách TRẢ HÀNG? Kho sẽ được cộng lại."
                                        : undefined
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors ${cls}`}
                                >
                                  {label}
                                </button>
                              ))
                            )}
                            {!meta.next && !isLoading && (
                              <span className="text-[12px] text-gray-400 font-semibold">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}