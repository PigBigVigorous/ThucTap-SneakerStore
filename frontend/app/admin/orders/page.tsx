"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  RefreshCw, Search, Eye, X, Truck, User, ChevronRight,
  ChevronLeft, ChevronDown, Package, Clock, CheckCircle2,
  XCircle, RotateCcw, Loader2
} from "lucide-react";
import OrderDetailModal from "../../components/OrderDetailModal";

// ─── Status metadata ──────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  pending:    { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-700 border border-amber-200",     icon: Clock },
  processing: { label: "Đang đóng gói", cls: "bg-indigo-50 text-indigo-700 border border-indigo-200", icon: Package },
  shipped:    { label: "Vận chuyển",    cls: "bg-blue-50 text-blue-700 border border-blue-200",        icon: Truck },
  delivering: { label: "Đang giao",    cls: "bg-orange-50 text-orange-700 border border-orange-200",  icon: Truck },
  delivered:  { label: "Hoàn thành",   cls: "bg-green-50 text-green-700 border border-green-200",     icon: CheckCircle2 },
  cancelled:  { label: "Đã hủy",       cls: "bg-red-50 text-red-700 border border-red-200",           icon: XCircle },
  returned:   { label: "Trả hàng",     cls: "bg-gray-100 text-gray-600 border border-gray-200",       icon: RotateCcw },
  failed:     { label: "Thất bại",     cls: "bg-rose-50 text-rose-700 border border-rose-200",        icon: XCircle },
};

const TAB_FILTERS = [
  { key: "all",        label: "Tất cả" },
  { key: "pending",    label: "Chờ xác nhận" },
  { key: "processing", label: "Đóng gói" },
  { key: "shipped",    label: "Vận chuyển" },
  { key: "delivered",  label: "Hoàn thành" },
  { key: "cancelled",  label: "Đã hủy" },
  { key: "returned",   label: "Trả hàng" },
];

const PER_PAGE_OPTIONS = [10, 15, 25, 50];

// ─── Pagination Component ─────────────────────────────────────────────────────
function Pagination({
  page, lastPage, total, perPage, loading,
  onPageChange, onPerPageChange,
}: {
  page: number; lastPage: number; total: number; perPage: number; loading: boolean;
  onPageChange: (p: number) => void; onPerPageChange: (n: number) => void;
}) {
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
    .reduce<(number | "...")[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-gray-50">
      {/* Info + per-page */}
      <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
        <span>Hiển thị <span className="text-gray-700 font-black">{from}–{to}</span> / <span className="text-gray-700 font-black">{total}</span> đơn</span>
        <div className="flex items-center gap-2">
          <span className="text-xs">Mỗi trang:</span>
          <div className="flex gap-1">
            {PER_PAGE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => onPerPageChange(n)}
                className={`w-9 h-7 rounded-lg text-xs font-black transition-all ${perPage === n ? "bg-gray-900 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={loading}
              className={`w-9 h-9 rounded-xl text-sm font-black transition-all ${p === page
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/15"
                : "border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 bg-white"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage || loading}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("all");
  const [search, setSearch]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [shippers, setShippers] = useState<any[]>([]);
  const [page, setPage]         = useState(1);
  const [perPage, setPerPage]   = useState(15);
  const [meta, setMeta]         = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  // Modal states
  const [isDetailOpen, setIsDetailOpen]               = useState(false);
  const [selectedOrderId, setSelectedOrderId]         = useState<number | undefined>(undefined);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<any | null>(null);
  const [assigning, setAssigning] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (opts: {
    p?: number; pp?: number; s?: string; t?: string; silent?: boolean;
  } = {}) => {
    if (!token) return;
    const { p = page, pp = perPage, s = debouncedSearch, t = tab, silent = false } = opts;
    if (!silent) setLoading(true);
    try {
      const json = await adminAPI.getOrders(token, {
        page: p, per_page: pp, status: t, search: s || undefined,
      });
      if (json.success) {
        setOrders(json.data ?? []);
        setMeta(json.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: pp });
      }
    } catch {
      if (!silent) toast.error("Lỗi kết nối API!");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, page, perPage, debouncedSearch, tab]);

  // ── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ── Fetch when filters/page change ─────────────────────────────────────────
  useEffect(() => {
    fetchOrders({ p: page, pp: perPage, s: debouncedSearch, t: tab });
  }, [page, perPage, debouncedSearch, tab, token]);

  // ── Real-time polling ───────────────────────────────────────────────────────
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchOrders({ p: page, pp: perPage, s: debouncedSearch, t: tab, silent: true });
    }, 8000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchOrders]);

  const fetchShippers = async () => {
    if (!token) return;
    try {
      const json = await adminAPI.getShippers(token);
      if (json.success) setShippers(json.data ?? []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchShippers(); }, [token]);

  // ── Tab change resets page ──────────────────────────────────────────────────
  const handleTabChange = (key: string) => {
    setTab(key);
    setPage(1);
  };

  // ── Per-page change resets page ─────────────────────────────────────────────
  const handlePerPageChange = (n: number) => {
    setPerPage(n);
    setPage(1);
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleAssignShipper = async (orderId: number, shipperId: number) => {
    if (!token) return;
    setAssigning(true);
    try {
      const data = await adminAPI.assignShipper(orderId, shipperId, token);
      if (data.success) {
        toast.success("✅ Đã giao đơn cho Shipper!");
        setSelectedOrderForAssign(null);
        fetchOrders({ p: page, pp: perPage, s: debouncedSearch, t: tab });
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
        fetchOrders({ p: page, pp: perPage, s: debouncedSearch, t: tab });
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    }
  };

  const openDetail = (id: number) => {
    setSelectedOrderId(id);
    setIsDetailOpen(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Quản lý Đơn hàng</h1>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Tổng cộng <span className="text-gray-700">{meta.total}</span> đơn hàng trong hệ thống
          </p>
        </div>
        <button
          onClick={() => fetchOrders({ p: page, pp: perPage, s: debouncedSearch, t: tab })}
          className="flex items-center gap-2 p-3 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-900 transition-all active:scale-95"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {TAB_FILTERS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn hàng, tên khách hàng, SĐT..."
            className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-gray-900 transition-all outline-none text-sm font-bold"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
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
            {loading ? (
              Array.from({ length: perPage > 10 ? 8 : perPage }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-5">
                      <div className="h-4 bg-gray-100 rounded-full animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-24">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                      <Package size={28} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-bold">Không có đơn hàng nào</p>
                    <p className="text-gray-300 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const statusInfo = STATUS_MAP[o.status];
                const StatusIcon = statusInfo?.icon;
                return (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-gray-900">{o.order_tracking_code}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {new Date(o.created_at).toLocaleDateString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-gray-900">{o.customer_name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{o.customer_phone}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusInfo?.cls || "bg-gray-100 text-gray-600"}`}>
                        {StatusIcon && <StatusIcon size={11} />}
                        {statusInfo?.label || o.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-gray-900">{Number(o.total_amount).toLocaleString("vi-VN")}₫</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(o.id)}
                          className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-blue-600"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>

                        {o.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, "processing")}
                            className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-blue-200"
                          >
                            Xác nhận
                          </button>
                        )}

                        {o.status === "processing" && !o.shipper_id && (
                          <button
                            onClick={() => setSelectedOrderForAssign(o)}
                            className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg shadow-gray-200"
                          >
                            Giao đơn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && meta.total > 0 && (
          <Pagination
            page={page}
            lastPage={meta.last_page}
            total={meta.total}
            perPage={perPage}
            loading={loading}
            onPageChange={(p) => setPage(p)}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </div>

      {/* Assign Shipper Modal */}
      {selectedOrderForAssign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
                <Truck className="text-blue-600" /> Chọn Shipper
              </h3>
              <button onClick={() => setSelectedOrderForAssign(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
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
                  {assigning
                    ? <Loader2 size={18} className="animate-spin text-gray-300" />
                    : <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                  }
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        orderId={selectedOrderId}
        onAssignShipper={setSelectedOrderForAssign}
      />
    </div>
  );
}