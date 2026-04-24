"use client";

import React, { useEffect, useState } from "react";
import { X, Truck, MapPin, Package, CreditCard, Calendar } from "lucide-react";
import { orderAPI } from "../services/api";
import toast from "react-hot-toast";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  trackingCode: string;
  onCancel?: (id: number) => Promise<void>;
  onReturn?: (id: number) => Promise<void>;
}

export default function OrderDetailModal({ isOpen, onClose, orderId, trackingCode, onCancel, onReturn }: OrderDetailModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && trackingCode) {
      const fetchOrder = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await orderAPI.getByTrackingCode(trackingCode, token);
          if (res.success) {
            setOrder(res.data);
          }
        } catch (error) {
          toast.error("Không thể tải chi tiết đơn hàng");
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [isOpen, trackingCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Chi tiết đơn hàng</h2>
            <p className="text-xs text-gray-500 mt-0.5">Mã đơn: <span className="font-mono font-bold text-gray-800">{trackingCode}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : order && (
            <>
              {/* Status & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                    <Package size={14} /> Trạng thái
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {order.status === 'pending' ? 'Chờ xác nhận' :
                     order.status === 'shipped' ? 'Đang giao hàng' :
                     order.status === 'delivered' ? 'Đã giao hàng' :
                     order.status === 'cancelled' ? 'Đã hủy' : 'Trả hàng'}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                    <Calendar size={14} /> Ngày đặt
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={16} className="text-red-500" /> Thông tin giao hàng
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm space-y-1.5">
                  <p className="font-bold text-gray-800">{order.customer_name} <span className="font-normal text-gray-500">| {order.customer_phone}</span></p>
                  <p className="text-gray-600">
                    {order.address_detail}, {order.ward}, {order.district}, {order.province}
                  </p>
                    {order.branch && (
                      <p className="text-xs text-indigo-600 font-semibold mt-2">
                        Được xử lý bởi: Sneaker Store - Chi nhánh {order.branch.province?.name || order.branch.name || 'Hệ thống'}
                      </p>
                    )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Package size={16} className="text-blue-500" /> Sản phẩm
                </h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex gap-3">
                      <img 
                        src={item.variant?.product?.base_image_url} 
                        className="w-12 h-12 object-cover rounded-lg border border-gray-100" 
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{item.variant?.product?.name}</p>
                        <p className="text-xs text-gray-500">Size: {item.variant?.size?.name} | Màu: {item.variant?.color?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{Number(item.unit_price * item.quantity).toLocaleString('vi-VN')}đ</p>
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-green-500" /> Thanh toán
                </h3>
                <div className="bg-gray-900 text-white p-4 rounded-xl space-y-2">
                  {/* Calculations */}
                  {(() => {
                    const subtotal = order.items?.reduce((acc: number, item: any) => acc + (Number(item.unit_price) * item.quantity), 0) || 0;
                    const shipping = Number(order.shipping_fee || 0);
                    const discount = Number(order.discount_amount || 0);
                    const points = Number((order.points_used || 0) * 1000);
                    const displayTotal = subtotal + shipping - discount - points;

                    return (
                      <>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Tiền hàng</span>
                          <span className="text-white">{subtotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Phí vận chuyển</span>
                          <span className="text-white">+{shipping.toLocaleString('vi-VN')}đ</span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between text-xs text-red-400">
                            <span>Giảm giá {order.discount?.code ? `(${order.discount.code})` : ''}</span>
                            <span>-{discount.toLocaleString('vi-VN')}đ</span>
                          </div>
                        )}

                        {points > 0 && (
                          <div className="flex justify-between text-xs text-amber-400">
                            <span>Dùng điểm</span>
                            <span>-{points.toLocaleString('vi-VN')}đ</span>
                          </div>
                        )}

                        <div className="border-t border-gray-800 my-2 pt-2 flex justify-between items-center">
                          <span className="text-sm font-bold">Tổng thanh toán</span>
                          <span className="text-lg font-black text-rose-500">{Math.max(0, displayTotal).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </>
                    );
                  })()}
                  <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest font-bold">
                    Phương thức: {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán Online'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50/50 flex items-center justify-center gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>

          {order && order.status === 'pending' && onCancel && (
             <button 
                onClick={() => { onCancel(order.id); onClose(); }}
                className="px-6 py-2.5 border border-red-500 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors"
             >
                Hủy đơn hàng
             </button>
          )}

          {order && order.status === 'delivered' && onReturn && (
             <button 
                onClick={() => { onReturn(order.id); onClose(); }}
                className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
             >
                Trả hàng/Hoàn tiền
             </button>
          )}
        </div>
      </div>
    </div>
  );
}