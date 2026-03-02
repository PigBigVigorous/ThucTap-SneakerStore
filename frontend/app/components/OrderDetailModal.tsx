"use client";

import { X, PackageOpen } from "lucide-react";

type OrderDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
};

export default function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  return (
    // Lớp nền đen mờ bao phủ toàn màn hình
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
      
      {/* Khung nội dung Modal */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
              <PackageOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Chi tiết đơn hàng</h2>
              <p className="text-sm font-bold text-blue-600 mt-0.5">{order.order_tracking_code}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body Modal (Danh sách giày - Có thể cuộn) */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Sản phẩm đã đặt ({order.items?.length || 0})</h3>
          
          <div className="space-y-4 pr-2">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any) => (
                <div key={item.id} className="flex gap-5 items-center border border-gray-100 p-4 rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all">
                  
                  {/* Ảnh sản phẩm */}
                  <div className="relative shrink-0">
                    <img 
                      src={item.variant?.variant_image_url || item.variant?.product?.base_image_url || '/placeholder.png'} 
                      alt="shoe" 
                      className="w-24 h-24 object-cover rounded-xl bg-gray-50" 
                    />
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md">
                      x{item.quantity}
                    </span>
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">
                      {item.variant?.product?.name || 'Sản phẩm không xác định'}
                    </p>
                    <p className="text-sm text-gray-500 font-bold mt-1.5 flex items-center gap-2">
                      Màu: <span className="text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">{item.variant?.color?.name || '?'}</span> 
                      Size: <span className="text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">{item.variant?.size?.name || '?'}</span>
                    </p>
                    <div className="mt-3">
                      <p className="font-black text-red-600">{Number(item.unit_price).toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>

                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 font-medium py-4">Không tải được chi tiết sản phẩm.</p>
            )}
          </div>
        </div>

        {/* Footer Modal (Tổng tiền) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <span className="block font-bold text-gray-500 uppercase text-xs tracking-wider mb-1">Tổng thanh toán</span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status}
            </span>
          </div>
          <span className="font-black text-3xl text-red-600 tracking-tight">
            {Number(order.total_amount).toLocaleString('vi-VN')} đ
          </span>
        </div>

      </div>
    </div>
  );
}