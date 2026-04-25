'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { MapPin, CheckCircle, Navigation, Info, ChevronLeft, Phone, ExternalLink, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../context/AuthContext';

const OrderTrackingMap = dynamic(() => import('../../../components/OrderTrackingMap'), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-xl" />
});

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
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
    if (token) {
      fetchOrder();
      fetchLocation();
    }
  }, [token, fetchOrder, fetchLocation]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    if (!status) {
      toast.error("Vui lòng chọn trạng thái");
      return;
    }

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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Cập nhật hành trình thành công!");
        setOrder(data.data);
        setLocationText('');
        setNote('');
        setImage(null);
        setPreview(null);
      } else {
        toast.error(data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setUpdating(false);
    }
  };

  const openGoogleMaps = () => {
    const address = `${order.address_detail}, ${order.ward}, ${order.district}, ${order.province}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-red-500">Không tìm thấy đơn hàng</div>;

  const statuses = [
    { value: 'picked_up', label: 'Đã lấy hàng' },
    { value: 'in_transit', label: 'Trung chuyển' },
    { value: 'delivering', label: 'Đang giao' },
    { value: 'delivered', label: 'Thành công' },
    { value: 'failed', label: 'Thất bại' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-bottom px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-gray-900 truncate">#{order.order_tracking_code}</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Đang thực hiện nhiệm vụ</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Customer Info Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-orange-600">
              <MapPin className="w-5 h-5" />
              <h2 className="font-bold text-sm uppercase tracking-wider">Địa chỉ giao</h2>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
              order.status === 'delivered' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {order.status}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-black text-lg text-gray-900">{order.customer_name}</p>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mt-1">
                {order.address_detail}, {order.ward}, {order.district}, {order.province}
              </p>
            </div>

            <div className="flex gap-2">
              <a 
                href={`tel:${order.customer_phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              >
                <Phone size={16} /> Gọi khách
              </a>
              <button 
                onClick={openGoogleMaps}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              >
                <ExternalLink size={16} /> Chỉ đường
              </button>
            </div>
          </div>
        </div>

        {/* Map Preview */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-500" /> Vị trí của bạn
            </h3>
            <button 
              onClick={fetchLocation}
              className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-lg"
              disabled={geoLoading}
            >
              {geoLoading ? "Đang lấy GPS..." : "Làm mới GPS"}
            </button>
          </div>
          <OrderTrackingMap 
            trackings={order.trackings || []} 
            destination={undefined}
          />
          {geoError && <p className="text-[10px] text-red-500 bg-red-50 p-3 rounded-xl font-medium">{geoError}</p>}
        </div>

        {/* Update Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="font-black text-gray-900 text-sm uppercase tracking-wider">Cập nhật tiến độ</h2>
          
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all text-xs font-bold ${
                  status === s.value 
                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                  : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
             {status === 'delivered' && (
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Ảnh bằng chứng giao hàng</label>
                 {preview ? (
                   <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-gray-100">
                     <img src={preview} alt="Proof" className="w-full h-full object-cover" />
                     <button 
                       onClick={() => { setImage(null); setPreview(null); }}
                       className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                     >
                       <X size={16} />
                     </button>
                   </div>
                 ) : (
                   <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                     <Camera className="w-8 h-8 text-gray-300 mb-2" />
                     <span className="text-xs font-bold text-gray-400">Bấm để chụp ảnh / Tải ảnh</span>
                     <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                   </label>
                 )}
               </div>
             )}

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Vị trí thực tế</label>
              <input 
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="VD: Cổng bảo vệ, Kho 1..."
                className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Ghi chú</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú nếu có..."
                rows={2}
                className="w-full mt-1 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={updating || !status}
            className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all ${
              updating || !status ? 'bg-gray-200 shadow-none' : 'bg-gradient-to-r from-orange-500 to-orange-600 active:scale-95'
            }`}
          >
            {updating ? "ĐANG XỬ LÝ..." : "CẬP NHẬT NGAY"}
          </button>
        </div>
      </div>
    </div>
  );
}
