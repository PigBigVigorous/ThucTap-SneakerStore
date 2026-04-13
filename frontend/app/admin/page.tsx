"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { adminAPI, adminReportAPI } from "../services/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, ShoppingBag, Clock, TrendingUp,
  Package, ClipboardList, ArrowRight, ArrowUpRight,
  Download, Filter,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M ₫`
    : `${n.toLocaleString("vi-VN")} ₫`;

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-[22px] font-black text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const TX_TYPE_MAP: Record<string, { label: string; cls: string }> = {
  IMPORT:    { label: "Nhập kho",    cls: "bg-blue-50   text-blue-700"   },
  SALE:      { label: "Bán ra",      cls: "bg-red-50    text-red-700"    },
  RETURN:    { label: "Hoàn trả",    cls: "bg-green-50  text-green-700"  },
  TRANSFER:  { label: "Chuyển kho",  cls: "bg-purple-50 text-purple-700" },
  ADJUSTMENT:{ label: "Điều chỉnh",  cls: "bg-orange-50 text-orange-700" },
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { token, hasPermission, user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalRevenue: 0, totalOrders: 0, pendingOrders: 0, revenueByDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // ── RBAC Redirect Logic ──
  useEffect(() => {
    if (!user || !token) return;

    // Nếu KHÔNG CÓ quyền xem dashboard, tự động chuyển hướng tới trang đầu tiên họ có quyền
    if (!hasPermission("view-dashboard")) {
      if (hasPermission("pos-sale")) return router.replace("/admin/pos");
      if (hasPermission("manage-orders")) return router.replace("/admin/orders");
      if (hasPermission("manage-products")) return router.replace("/admin/products");
      if (hasPermission("manage-inventory")) return router.replace("/admin/branches");
      
      toast.error("Bạn không có quyền truy cập trang quản trị!");
      return router.replace("/");
    }
  }, [user, token, hasPermission, router]);

  useEffect(() => {
    if (!token || !hasPermission("view-dashboard")) return;
    (async () => {
      try {
        const [jsonTx, jsonStats] = await Promise.all([
          adminAPI.getInventoryTransactions(token),
          adminAPI.getStatistics(token),
        ]);
        if (jsonTx.success && jsonStats.success) {
          setTransactions(jsonTx.data.data ?? []);
          setStats(jsonStats.data);
          // Initial chart data from statistics (last 7 days)
          setChartData((jsonStats.data.revenueByDay ?? []).map((d: any) => ({
            name: formatChartDate(d.date, 'day'),
            revenue: Number(d.total),
          })));
        } else {
          toast.error("Lỗi phân quyền hoặc dữ liệu!");
        }
      } catch {
        toast.error("Lỗi kết nối API Admin!");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const formatChartDate = (date: string, period: string) => {
    if (period === 'year') return date;
    if (period === 'month') {
      const parts = date.split('-');
      return `Tháng ${parts[1]}/${parts[0]}`;
    }
    return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const fetchDetailedRevenue = async (period: 'day' | 'month' | 'year') => {
    if (!token) return;
    setChartLoading(true);
    setReportPeriod(period);
    try {
      const res = await adminReportAPI.getRevenue(token, period);
      if (res.success) {
        setChartData(res.data.map((d: any) => ({
          name: formatChartDate(d.date, period),
          revenue: Number(d.total),
          orders: d.order_count
        })));
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải báo cáo");
    } finally {
      setChartLoading(false);
    }
  };

  const handleExport = async () => {
    if (!token) return;
    const loadingToast = toast.loading("Đang tạo file báo cáo...");
    try {
      await adminReportAPI.downloadCSV(token, reportPeriod);
      toast.success("Xuất báo cáo thành công!", { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xuất file!", { id: loadingToast });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 font-semibold animate-pulse">
        Đang tải bảng điều khiển...
      </div>
    );

  const totalRevenue = Number(stats.totalRevenue ?? 0);

  return (
    <>
      <div className="space-y-6 max-w-7xl">

        {/* Header */}
        <div>
          <h1 className="text-[26px] font-black text-gray-900 tracking-tight">Tổng quan</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Doanh thu" value={fmt(totalRevenue)}
            icon={DollarSign} color="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            label="Tổng đơn" value={`${stats.totalOrders}`} sub="đơn hàng"
            icon={ShoppingBag} color="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="Chờ xử lý" value={`${stats.pendingOrders}`} sub="cần duyệt"
            icon={Clock} color="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="Tăng trưởng" value="—"
            icon={TrendingUp} color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/orders",   icon: ClipboardList, label: "Đơn hàng",  color: "text-blue-600  bg-blue-50" },
            { href: "/admin/products", icon: Package,       label: "Sản phẩm",  color: "text-orange-600 bg-orange-50" },
            { href: "/admin/inventory",icon: ArrowUpRight,  label: "Nhập kho",  color: "text-red-600   bg-red-50" },
            { href: "/admin/pos",      icon: ShoppingBag,   label: "POS",       color: "text-purple-600 bg-purple-50" },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href} href={href}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm
                         hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <span className="font-bold text-[13px] text-gray-700">{label}</span>
              <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-600 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-[15px] font-black text-gray-900 uppercase tracking-wide">
              Phân tích Doanh thu
            </h2>
            
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
              {[
                { key: 'day', label: 'Ngày' },
                { key: 'month', label: 'Tháng' },
                { key: 'year', label: 'Năm' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => fetchDetailedRevenue(p.key as any)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all
                    ${reportPeriod === p.key 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-400 hover:text-gray-600"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl
                         text-[12px] font-bold hover:bg-emerald-100 transition-all ml-auto"
            >
              <Download size={14} /> Xuất CSV
            </button>
          </div>

          <div className="h-72 w-full relative">
            {chartLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center text-gray-400 font-bold animate-pulse">
                Đang cập nhật dữ liệu...
              </div>
            )}
            
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={reportPeriod === 'day' ? 30 : 50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fill: "#9CA3AF", fontWeight: 600, fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} width={72}
                    tick={{ fill: "#9CA3AF", fontWeight: 600, fontSize: 11 }}
                    tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v.toLocaleString()} />
                  <Tooltip
                    cursor={{ fill: "#F9FAFB" }}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,.1)", fontSize: 13 }}
                    formatter={(v: number, name: string, props: any) => [
                      <div key="tip" className="space-y-1">
                        <p className="font-black text-gray-900">{v.toLocaleString("vi-VN")} ₫</p>
                        {props.payload.orders !== undefined && (
                          <p className="text-[11px] text-gray-400 font-bold uppercase">{props.payload.orders} đơn hàng</p>
                        )}
                      </div>, 
                      ""
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 font-semibold italic text-[13px]">
                Không có dữ liệu doanh thu trong kỳ này
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-[15px] font-black text-gray-900 uppercase tracking-wide">
              Biến động kho gần đây
            </h2>
            <Link href="/admin/inventory"
              className="text-[12px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Xem tất cả <ArrowRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[11px] uppercase tracking-widest text-gray-400">
                  <th className="px-5 py-3 font-bold">Loại</th>
                  <th className="px-5 py-3 font-bold">Sản phẩm</th>
                  <th className="px-5 py-3 font-bold text-center">Biến động</th>
                  <th className="px-5 py-3 font-bold text-center">Chi nhánh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.slice(0, 6).map((tx: any) => {
                  const type = TX_TYPE_MAP[tx.transaction_type] ?? { label: tx.transaction_type, cls: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide ${type.cls}`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700 max-w-[220px] truncate">
                        {tx.variant?.product?.name}
                        <span className="font-normal text-gray-400 ml-1">
                          ({tx.variant?.color?.name} – {tx.variant?.size?.name})
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-black text-[15px]">
                        <span className={tx.quantity_change > 0 ? "text-blue-600" : "text-red-500"}>
                          {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-[13px] font-medium text-gray-600">
                        {tx.to_branch?.name ?? tx.from_branch?.name ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}