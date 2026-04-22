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

  useEffect(() => {
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
    fetchOrders();
  }, [token]);

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = order.order_tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items?.some((item: any) => item.variant?.product?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  if (!user) return null;

  return (
    <div className="bg-white rounded-sm">
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex overflow-x-auto no-scrollbar shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderStatus)}
            className={`flex-1 min-w-[120px] py-4 text-sm transition-colors relative ${
              activeTab === tab.id ? "text-orange-600" : "text-gray-700 hover:text-orange-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
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
      <div className="bg-[#f5f5f5] space-y-4">
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
            <div key={order.id} className="bg-white rounded-sm shadow-sm overflow-hidden mb-4">
              {/* Order Header */}
              <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs bg-gray-100 px-2 py-0.5 rounded">SHOP</span>
                  <span className="text-sm font-semibold">Sneaker Store</span>
                  <button className="flex items-center gap-1 text-xs bg-orange-600 text-white px-2 py-1 rounded-sm ml-2">
                    <MessageCircle size={12} /> Chat
                  </button>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center text-orange-600 text-sm gap-1">
                      <Truck size={16} />
                      <span className="uppercase font-medium text-xs">
                        {order.status === 'pending' ? 'Chờ xác nhận' :
                         order.status === 'shipped' ? 'Đang giao hàng' :
                         order.status === 'delivered' ? 'Hoàn thành' :
                         order.status === 'cancelled' ? 'Đã hủy' : 'Trả hàng'}
                      </span>
                   </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-gray-50">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="p-4 flex gap-4">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-100 flex-shrink-0">
                      <img 
                        src={item.variant?.product?.base_image_url || "/placeholder.png"} 
                        alt={item.variant?.product?.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-800 truncate mb-1">{item.variant?.product?.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">
                        Phân loại: {item.variant?.color?.name}, {item.variant?.size?.name}
                      </p>
                      <p className="text-xs font-medium">x{item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-orange-600 font-medium">
                        {Number(item.unit_price).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="bg-[#fffefb] px-4 py-6 border-t border-gray-50">
                <div className="flex justify-end items-center gap-2 mb-6">
                  <span className="text-sm text-gray-600">Thành tiền:</span>
                  <span className="text-xl text-orange-600 font-bold">
                    {Number(order.total_amount).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-end items-center gap-2">
                   <button className="bg-orange-600 text-white px-10 py-2 rounded-sm text-sm hover:bg-orange-700 transition-colors">
                     Mua lại
                   </button>
                   <button className="border border-gray-300 px-6 py-2 rounded-sm text-sm hover:bg-gray-50 transition-colors">
                     Liên hệ Người bán
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
