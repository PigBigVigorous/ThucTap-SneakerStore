"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import toast from "react-hot-toast";
// 🚨 Nhúng các công cụ vẽ biểu đồ và Icon
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Clock, Activity } from "lucide-react";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenueByDay: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        // Lấy Lịch sử Kho
        const jsonTx = await adminAPI.getInventoryTransactions(token);
        
        // Lấy Thống kê Doanh thu
        const jsonStats = await adminAPI.getStatistics(token);

        if (jsonTx.success && jsonStats.success) {
          setTransactions(jsonTx.data.data);
          
          // Format lại dữ liệu ngày tháng cho biểu đồ đẹp hơn
          const formattedChartData = jsonStats.data.revenueByDay.map((item: any) => ({
            name: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            "Doanh thu": Number(item.total)
          }));

          setStats({
            ...jsonStats.data,
            revenueByDay: formattedChartData
          });

        } else {
          toast.error("Lỗi phân quyền dữ liệu!");
        }
      } catch (error) {
        toast.error("Lỗi lấy dữ liệu Admin!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) return <div className="min-h-screen flex justify-center items-center font-bold text-xl text-gray-500">Đang tải Bảng điều khiển...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
          <Activity size={32} className="text-red-600" />
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            TỔNG QUAN HỆ THỐNG
          </h1>
        </div>

        {/* 🌟 KHU VỰC 1: CÁC THẺ BÁO CÁO NHANH */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thẻ Doanh thu */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="bg-green-100 text-green-600 p-4 rounded-2xl"><DollarSign size={32} /></div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng doanh thu</p>
              <p className="text-3xl font-black text-gray-900">{Number(stats.totalRevenue).toLocaleString('vi-VN')} ₫</p>
            </div>
          </div>

          {/* Thẻ Tổng đơn */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl"><ShoppingBag size={32} /></div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng đơn hàng</p>
              <p className="text-3xl font-black text-gray-900">{stats.totalOrders} <span className="text-lg text-gray-500 font-bold">đơn</span></p>
            </div>
          </div>

          {/* Thẻ Chờ xử lý */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="bg-yellow-100 text-yellow-600 p-4 rounded-2xl"><Clock size={32} /></div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Đang chờ xử lý</p>
              <p className="text-3xl font-black text-gray-900">{stats.pendingOrders} <span className="text-lg text-gray-500 font-bold">đơn</span></p>
            </div>
          </div>
        </div>

        {/* 🌟 KHU VỰC 2: BIỂU ĐỒ DOANH THU */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-6">Biểu đồ doanh thu (7 ngày qua)</h2>
          <div className="h-80 w-full">
            {stats.revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 'bold'}} dx={-10} width={80} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number | undefined) => value !== undefined ? [`${value.toLocaleString('vi-VN')} ₫`, 'Doanh thu'] : ['N/A', 'Doanh thu']}
                  />
                  <Bar dataKey="Doanh thu" fill="#111827" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold">Chưa có dữ liệu doanh thu tuần này.</div>
            )}
          </div>
        </div>

        {/* 🌟 KHU VỰC 3: BẢNG LỊCH SỬ KHO (Giữ nguyên như cũ) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Biến động kho hàng gần đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100">
                  <th className="p-5 font-bold">Mã GD</th>
                  <th className="p-5 font-bold">Loại</th>
                  <th className="p-5 font-bold">Sản phẩm</th>
                  <th className="p-5 font-bold text-center">Biến động</th>
                  <th className="p-5 font-bold text-center">Tồn kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.slice(0, 5).map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 font-bold text-gray-900">#{tx.id}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${tx.transaction_type === 'IMPORT' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        {tx.transaction_type === 'IMPORT' ? 'NHẬP' : 'XUẤT'}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-gray-700 text-sm">
                      {tx.variant?.product?.name} ({tx.variant?.color?.name} - {tx.variant?.size?.name})
                    </td>
                    <td className="p-5 text-center font-black text-base">
                      <span className={tx.quantity_change > 0 ? 'text-blue-600' : 'text-red-600'}>
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                      </span>
                    </td>
                    <td className="p-5 text-center font-black text-gray-900">{tx.variant?.current_stock}</td>
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