'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Package, MapPin, Truck, CreditCard, User, Camera } from 'lucide-react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { orderAPI, adminAPI, shipperAPI } from '../services/api';



interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any;
  orderId?: number;
  onCancel?: (id: number) => void;
  onReturn?: (id: number) => void;
  onAssignShipper?: (order: any) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function OrderDetailModal({ isOpen, onClose, order: initialOrder, orderId, onCancel, onReturn, onAssignShipper }: OrderDetailModalProps) {
  const { token } = useAuth();
  const [order, setOrder] = useState<any>(initialOrder);
  const [loading, setLoading] = useState(!initialOrder && !!orderId);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId || !token) return;
    setLoading(true);
    try {
      let data;
      if (location.pathname.includes('/shipper/')) {
        data = await shipperAPI.getOrderDetail(orderId, token);
      } else if (location.pathname.includes('/admin/')) {
        data = await adminAPI.getOrderDetail(orderId, token);
      } else {
        data = await orderAPI.getDetail(orderId, token);
      }

      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        setOrder(initialOrder);
        setLoading(false);
      } else if (orderId) {
        fetchOrderDetail();
      }
    }
  }, [isOpen, initialOrder, orderId, fetchOrderDetail]);

  if (!isOpen) return null;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Chờ xác nhận',
      'processing': 'Đang đóng gói',
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
    if (['delivered'].includes(status)) return 'text-emerald-600 bg-emerald-50';
    if (['cancelled', 'failed'].includes(status)) return 'text-rose-600 bg-rose-50';
    if (['shipped', 'delivering', 'picked_up', 'in_transit'].includes(status)) return 'text-blue-600 bg-blue-50';
    return 'text-amber-600 bg-amber-50';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Chi tiết đơn hàng</h2>
            <div className="flex items-center gap-2 mt-1">
              {order && (
                <>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    • {order.order_tracking_code}
                  </span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {loading ? (
            <div className="space-y-6">
              <div className="h-40 bg-gray-50 rounded-3xl animate-pulse" />
              <div className="h-20 bg-gray-50 rounded-3xl animate-pulse" />
              <div className="h-60 bg-gray-50 rounded-3xl animate-pulse" />
            </div>
          ) : !order ? (
            <div className="text-center py-20 text-gray-400 font-bold">Không tìm thấy thông tin đơn hàng</div>
          ) : (
            <>


              {/* Items Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                  <Package size={16} className="text-gray-400" /> Danh sách sản phẩm
                </h3>
                <div className="border border-gray-100 rounded-[24px] overflow-hidden divide-y divide-gray-100">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                        <img src={item.variant?.product?.base_image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{item.variant?.product?.name}</p>
                        <p className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-wider">
                          {item.variant?.color?.name} / {item.variant?.size?.name?.replace("EU-", "")}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">x{item.quantity}</span>
                          <span className="text-sm font-black text-gray-900">{Number(item.unit_price).toLocaleString('vi-VN')}₫</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipper Section */}
              {order.shipper && (
                <div className="bg-blue-50 border border-blue-100 rounded-[32px] p-6 text-blue-900 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-blue-700 uppercase tracking-widest text-[10px] font-black">
                    <Truck size={14} /> Nhân viên vận chuyển
                  </div>
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black">{order.shipper.name}</p>
                      <p className="text-[11px] text-blue-600 font-bold mt-0.5">{order.shipper.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Proof Image */}
              {order.delivery_proof_image && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-6 text-emerald-900 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-emerald-700 uppercase tracking-widest text-[10px] font-black">
                    <Camera size={14} /> Ảnh xác nhận giao hàng
                  </div>
                  <div className="mt-3 rounded-2xl overflow-hidden border border-emerald-200/50 w-full max-h-80 shadow-inner bg-white">
                    <img
                      src={order.delivery_proof_image.startsWith('http') ? order.delivery_proof_image : `${API_BASE_URL.replace('/api', '')}${order.delivery_proof_image}`}
                      alt="Xác nhận giao hàng"
                      className="w-full h-full object-contain max-h-80"
                    />
                  </div>
                </div>
              )}

              {/* Payment Section */}
              <div className="bg-gray-900 rounded-[32px] p-6 text-white shadow-xl shadow-gray-200">
                <div className="flex items-center gap-2 mb-4 text-gray-400 uppercase tracking-widest text-[10px] font-black">
                  <CreditCard size={14} /> Thanh toán chi tiết
                </div>

                {(() => {
                  const subtotal = order.items?.reduce((acc: number, item: any) => acc + (Number(item.unit_price) * item.quantity), 0) || 0;
                  const shipping = Number(order.shipping_fee || 0);
                  const discount = Number(order.discount_amount || 0);
                  const points = Number((order.points_used || 0) * 1000);
                  const total = subtotal + shipping - discount - points;

                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-gray-400 font-bold">
                        <span>Tạm tính</span>
                        <span className="text-white">{subtotal.toLocaleString('vi-VN')}₫</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 font-bold">
                        <span>Vận chuyển</span>
                        <span className="text-white">+{shipping.toLocaleString('vi-VN')}₫</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-xs text-rose-400 font-bold">
                          <span>Giảm giá</span>
                          <span>-{discount.toLocaleString('vi-VN')}₫</span>
                        </div>
                      )}
                      {points > 0 && (
                        <div className="flex justify-between text-xs text-amber-400 font-bold">
                          <span>Dùng điểm</span>
                          <span>-{points.toLocaleString('vi-VN')}₫</span>
                        </div>
                      )}
                      <div className="pt-4 mt-2 border-t border-white/10 flex justify-between items-center">
                        <p className="text-sm font-black uppercase tracking-widest text-gray-400">Tổng tiền</p>
                        <p className="text-2xl font-black text-white tracking-tighter">{Math.max(0, total).toLocaleString('vi-VN')}₫</p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-1 rounded-lg text-gray-300">
                          {order.payment_method === 'cod' ? 'Tiền mặt' : 'Online'}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex flex-wrap gap-3 justify-end">
          {!order?.shipper_id && !['cancelled', 'returned', 'delivered'].includes(order?.status) && onAssignShipper && (
            <button 
              onClick={() => { onAssignShipper(order); onClose(); }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
            >
              <Truck size={14} /> Giao cho Shipper
            </button>
          )}
          {order?.status === 'pending' && onCancel && (
            <button
              onClick={() => { onCancel(order.id); onClose(); }}
              className="px-6 py-3 border-2 border-rose-100 text-rose-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-50 transition-all"
            >
              Hủy đơn hàng
            </button>
          )}

          {order?.status === 'delivered' && onReturn && (
            <button
              onClick={() => { onReturn(order.id); onClose(); }}
              className="px-6 py-3 border-2 border-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
            >
              Yêu cầu trả hàng
            </button>
          )}

          <button onClick={onClose} className="px-10 py-3 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-200">
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}