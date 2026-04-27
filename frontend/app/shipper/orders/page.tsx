'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, ChevronRight, Package, Clock, RotateCcw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function ShipperDashboardPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchMyOrders = async (isManual = false) => {
    if (!token) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/shipper/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [token]);

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const getStatusLabel = (status: string) => {
    const labels: any = {
      'pending': 'Chờ xác nhận',
      'shipped': 'Đã bàn giao cho đơn vị vận chuyển',
      'delivering': 'Đang giao hàng',
      'delivered': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'returned': 'Trả hàng',
      'failed': 'Giao hàng thất bại'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'pending': 'bg-amber-50 text-amber-600 border-amber-100',
      'shipped': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'delivering': 'bg-blue-50 text-blue-600 border-blue-100',
      'delivered': 'bg-green-50 text-green-600 border-green-100',
      'failed': 'bg-red-50 text-red-600 border-red-100'
    };
    return colors[status] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải nhiệm vụ...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Nhiệm vụ của tôi</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Xin chào, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMyOrders(true)}
              className={`w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-600 transition-all ${refreshing ? 'animate-spin' : ''}`}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-100 transition-all"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Tổng đơn</p>
            <p className="text-xl font-black text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
            <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Đang giao</p>
            <p className="text-xl font-black text-orange-600">{orders.filter(o => ['shipped', 'delivering'].includes(o.status)).length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-3xl border border-green-100">
            <p className="text-[10px] font-black text-green-400 uppercase mb-1">Đã giao</p>
            <p className="text-xl font-black text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['all', 'pending', 'shipped', 'delivering', 'delivered'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${filter === f
                  ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-900/10'
                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                }`}
            >
              {f === 'all' ? 'Tất cả' : getStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-900 font-bold">Không có đơn hàng nào</p>
            <p className="text-gray-400 text-xs mt-1">Danh sách đơn hàng của bạn đang trống.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/shipper/tracking/${order.id}`)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
                  {order.order_tracking_code}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                  <MapPin className="w-4 h-4 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{order.customer_name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                    {order.address_detail}, {order.ward}, {order.district}, {order.province}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <Clock size={12} />
                  {new Date(order.created_at).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center gap-1 text-orange-600 text-xs font-bold">
                  Cập nhật hành trình
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
