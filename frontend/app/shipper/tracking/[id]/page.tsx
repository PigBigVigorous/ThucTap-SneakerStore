'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGeolocation } from '../../../hooks/useGeolocation';
import {
  MapPin, CheckCircle, Navigation, Info, ChevronLeft,
  Phone, ExternalLink, Camera, X, Copy, Package,
  Clock, CheckSquare, Truck, AlertCircle, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../context/AuthContext';

// Map has been removed as per request

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function ShipperTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const { location, error: geoError, loading: geoLoading, fetchLocation } = useGeolocation();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');
  const [locationText, setLocationText] = useState('');
  const [note, setNote] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/shipper/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setStatus(data.data.status);
      }
    } catch (err) {
      toast.error("Không thể lấy thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchOrder();
    fetchLocation();
  }, [fetchOrder, fetchLocation]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã chép ${label}`);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    if (!status) return toast.error("Vui lòng chọn trạng thái");
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', status);
      if (location?.lat) formData.append('latitude', location.lat.toString());
      if (location?.lng) formData.append('longitude', location.lng.toString());
      formData.append('location_text', locationText || "Vị trí shipper");
      formData.append('note', note);
      if (image) formData.append('image', image);

      const res = await fetch(`${API_BASE_URL}/shipper/orders/${order.id}/track`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("✅ Đã cập nhật trạng thái!");
        setOrder(data.data);
        setStatus(data.data.status);
        setLocationText('');
        setNote('');
        setImage(null);
        setPreview(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setUpdating(false);
    }
  };

  // Mở Google Maps để dẫn đường (Ưu tiên tọa độ Lat/Lng để chính xác tuyệt đối)
  const openGoogleMaps = () => {
    let url = "";
    if (order.latitude && order.longitude) {
      // Nếu có tọa độ, dùng tọa độ để đánh dấu marker chính xác
      url = `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;
    } else {
      // Nếu không, dùng địa chỉ văn bản
      const address = `${order.address_detail}, ${order.ward}, ${order.district}, ${order.province}`;
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-10">
      <div className="w-full max-w-md space-y-4">
        <div className="h-20 bg-white rounded-3xl animate-pulse" />
        <div className="h-64 bg-white rounded-3xl animate-pulse" />
        <div className="h-40 bg-white rounded-3xl animate-pulse" />
      </div>
    </div>
  );

  if (!order) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">⚠️ Đơn hàng không tồn tại</div>;

  const statuses = [
    { value: 'shipped', label: 'Đã bàn giao cho đơn vị vận chuyển', icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'delivering', label: 'Đang giao hàng', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'delivered', label: 'Hoàn thành', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { value: 'returned', label: 'Trả hàng', icon: RotateCcw, color: 'text-gray-600', bg: 'bg-gray-50' },
    { value: 'failed', label: 'Giao hàng thất bại', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const fullAddress = `${order.address_detail}, ${order.ward}, ${order.district}, ${order.province}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-2xl transition-all active:scale-90 text-gray-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-gray-900 text-base leading-tight tracking-tight">{order.order_tracking_code}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang hoạt động</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">

        {/* Customer & Navigation Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">Khách hàng</p>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">{order.customer_name}</h2>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-6">
            <MapPin className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-900 leading-snug">{fullAddress}</p>
              <button
                onClick={() => copyToClipboard(fullAddress, 'địa chỉ')}
                className="mt-2 text-[11px] font-black text-orange-600 uppercase flex items-center gap-1 hover:opacity-70"
              >
                <Copy size={12} /> Sao chép địa chỉ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => copyToClipboard(order.customer_phone, 'số điện thoại')}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[13px] border-2 border-indigo-100 active:scale-95 transition-all"
            >
              <span className="text-[10px] uppercase text-indigo-400 font-black">Số điện thoại</span>
              <div className="flex items-center gap-2">
                <Phone size={14} />
                {order.customer_phone}
                <Copy size={12} className="opacity-50" />
              </div>
            </button>
            <button
              onClick={openGoogleMaps}
              className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-black text-[13px] active:scale-95 transition-all"
            >
              <Navigation size={18} className="text-blue-600" /> DẪN ĐƯỜNG
            </button>
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <Package size={16} className="text-gray-400" /> Sản phẩm cần giao
          </h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-2xl">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{item.variant?.product?.name}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{item.variant?.color?.name} | Size {item.variant?.size?.name?.replace("EU-", "")}</p>
                </div>
                <span className="bg-white px-3 py-1 rounded-xl text-xs font-black text-gray-900 border border-gray-100">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Update Logic */}
        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-[11px] uppercase tracking-widest">Cập nhật tiến độ</h2>
            <Clock size={16} className="text-gray-300" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statuses.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 transition-all text-[12px] font-black ${status === s.value
                    ? `border-gray-900 ${s.bg} ${s.color}`
                    : 'border-gray-50 bg-gray-50 text-gray-400'
                    }`}
                >
                  <Icon size={16} /> {s.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-5">
            {status === 'delivered' && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase ml-1">Hình ảnh giao thành công</p>
                {preview ? (
                  <div className="relative w-full h-56 rounded-3xl overflow-hidden shadow-inner bg-gray-100 border-2 border-white">
                    <img src={preview} alt="Proof" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setImage(null); setPreview(null); }}
                      className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full backdrop-blur-md"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-[32px] bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all hover:border-orange-300 group">
                    <Camera className="w-10 h-10 text-gray-300 mb-2 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Chụp ảnh đồng kiểm</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-2 tracking-widest">Ghi chú địa điểm</p>
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="VD: Cổng bảo vệ, Nhà xe..."
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-gray-900 transition-all outline-none text-[13px] font-bold"
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-2 tracking-widest">Thông tin thêm</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú cho khách hàng..."
                  rows={2}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-gray-900 transition-all outline-none text-[13px] font-bold resize-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={updating || !status}
            className={`w-full py-5 rounded-[32px] font-black text-[14px] tracking-widest uppercase text-white shadow-2xl transition-all active:scale-95 ${updating || !status
              ? 'bg-gray-200 shadow-none'
              : 'bg-gray-900 shadow-gray-900/30'
              }`}
          >
            {updating ? "Đang gửi dữ liệu..." : "Xác nhận cập nhật"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper icon
function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
