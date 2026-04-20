"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../store/useCartStore";
import { Check, Lock, Package, ChevronRight, Truck, CreditCard, MapPin, User, ShieldCheck, Ticket, Banknote } from "lucide-react";
import toast from "react-hot-toast";
import { orderAPI, discountAPI, shippingAPI } from "../services/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type LocationItem = { code: string; name: string; };

// --- Mini Components ---
const FloatingInput = ({ label, name, type = "text", value, onChange, icon }: any) => (
  <div className="relative w-full group">
    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-800 transition-colors z-10 pointer-events-none">{icon}</div>}
    <input
      type={type} name={name} value={value} onChange={onChange}
      className={`block ${icon ? 'pl-11' : 'pl-4'} pr-4 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent peer transition-all`}
      placeholder=" " required
    />
    <label className={`absolute text-sm text-gray-400 duration-200 transform -translate-y-2.5 scale-[0.80] top-4 z-10 origin-[0] ${icon ? 'left-11' : 'left-4'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.80] peer-focus:-translate-y-2.5 cursor-text pointer-events-none font-medium`}>
      {label}
    </label>
  </div>
);

const CustomSelect = ({ label, value, onChange, options, disabled, defaultOption, icon }: any) => (
  <div className="relative w-full group">
    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">{icon}</div>}
    <select
      value={value || ""} onChange={onChange} disabled={disabled}
      className={`block ${icon ? 'pl-11' : 'pl-4'} pr-10 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
      required
    >
      <option value="" disabled hidden></option>
      {defaultOption && <option value="" disabled>{defaultOption}</option>}
      {Array.isArray(options) && options.map((opt: any) => (
        <option key={opt.code} value={opt.code}>{opt.name}</option>
      ))}
    </select>
    <label className={`absolute text-sm duration-200 transform top-4 z-10 origin-[0] ${icon ? 'left-11' : 'left-4'} pointer-events-none font-medium transition-all ${value ? 'text-gray-400 scale-[0.80] -translate-y-2.5' : 'text-gray-400'}`}>
      {label}
    </label>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
);

export default function CheckoutPage() {
  const router = useRouter();
  const allCartItems = useCartStore((state) => state.items);
  const cart = allCartItems.filter(i => i.selected !== false);
  const clearSelectedItems = useCartStore((state) => state.clearSelectedItems);

  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false); // Khóa nút sau khi đặt thành công
  const [qrModalData, setQrModalData] = useState<{ amount: number; description: string; name: string } | null>(null);

  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");

  const [formData, setFormData] = useState({
    name: "", phone: "", email: "",
    province: "", district: "", ward: "", addressDetail: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const FREESHIP_THRESHOLD = 5000000;
  const [shippingFee, setShippingFee] = useState(0);

  // Discount State
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; id: number } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const totalOriginal = subtotal + shippingFee;
  const total = Math.max(0, totalOriginal - (appliedDiscount?.amount || 0));

  // Load provinces
  useEffect(() => {
    fetch(`${API_BASE_URL}/provinces`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setProvinces(d); else if (d?.data) setProvinces(d.data); })
      .catch(() => { });
  }, []);

  // Auto calculate shipping via API
  useEffect(() => {
    if (subtotal >= FREESHIP_THRESHOLD) {
      setShippingFee(0);
      return;
    }
    
    // Chỉ tính phí khi đã chọn đủ Tỉnh và Huyện
    if (formData.province && formData.district) {
      const fetchShippingFee = async () => {
        try {
          const res = await shippingAPI.calculateFee(formData.province, formData.district, formData.ward);
          if (res.success) {
            setShippingFee(res.shipping_fee);
          }
        } catch (error) {
          console.error("Lỗi tính phí ship:", error);
          // Fallback nếu API lỗi (giữ lại 30k làm dự phòng)
          setShippingFee(30000);
        }
      };
      fetchShippingFee();
    }
  }, [formData.province, formData.district, formData.ward, subtotal]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedProvinceCode(code); setSelectedDistrictCode(""); setSelectedWardCode("");
    setFormData(f => ({ ...f, province: name, district: "", ward: "" }));
    setDistricts([]); setWards([]);
    if (code) fetch(`${API_BASE_URL}/districts/${code}`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDistricts(d); else if (d?.data) setDistricts(d.data); });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedDistrictCode(code); setSelectedWardCode("");
    setFormData(f => ({ ...f, district: name, ward: "" }));
    setWards([]);
    if (code) fetch(`${API_BASE_URL}/wards/${code}`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWards(d); else if (d?.data) setWards(d.data); });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWardCode(e.target.value);
    setFormData(f => ({ ...f, ward: e.target.options[e.target.selectedIndex].text }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const isFormValid = formData.name && formData.phone && formData.province && formData.district && formData.ward && formData.addressDetail;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsApplyingDiscount(true);
    try {
      const currentSubtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
      const res = await discountAPI.apply(discountCode.trim(), currentSubtotal, cart.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      })));
      if (res.success) {
        setAppliedDiscount({
          code: res.data.code,
          amount: res.data.discount_amount,
          id: res.data.discount_id
        });
        toast.success(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Mã không hợp lệ hoặc đã hết hạn");
      setAppliedDiscount(null);
    }
    setIsApplyingDiscount(false);
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    toast.success("Đã gỡ mã giảm giá");
  };

  const handlePreSubmit = () => {
    if (!isFormValid) { toast.error("Vui lòng điền đầy đủ thông tin giao hàng!"); return; }
    
    if (paymentMethod === "qr") {
      setQrModalData({
        amount: total,
        description: `SDT ${formData.phone}`,
        name: "SNEAKER STORE"
      });
    } else {
      executeOrder();
    }
  };

  const executeOrder = async () => {
    setIsLoading(true);
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token") || "";

    // Dùng toast có ID cố định để update in-place, không bị mất khi re-render
    const toastId = "order-processing";
    toast.loading(
      paymentMethod === "qr" ? "Đang xác nhận thanh toán..." : "Đang xử lý đơn hàng...",
      { id: toastId }
    );

    try {
      const data = await orderAPI.create({
        user_id: user?.id || null,
        customer_name: formData.name, customer_phone: formData.phone, customer_email: formData.email,
        province: formData.province, district: formData.district, ward: formData.ward,
        address_detail: formData.addressDetail, shipping_fee: shippingFee, total_amount: totalOriginal,
        discount_code: appliedDiscount ? appliedDiscount.code : null,
        payment_method: paymentMethod,
        items: cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity }))
      }, token);

      if (data.data?.payment_url) {
        toast.dismiss(toastId);
        window.location.href = data.data.payment_url;
        return;
      }

      if (data.success) {
        const trackingCode = data.data?.order_tracking_code || "";
        const msg = paymentMethod === "qr"
          ? `✅ Thanh toán thành công! Mã đơn: ${trackingCode}`
          : `✅ Đặt hàng thành công! Mã đơn: ${trackingCode}`;

        // Update CÙNG toast ID thành success — nó sẽ hiện trên màn hình dù giỏ hàng bị xóa
        toast.success(msg, { id: toastId, duration: 5000 });

        // Đánh dấu đã đặt xong TRƯỚC khi clear cart để tránh flash "giỏ trống"
        setOrderPlaced(true);
        setOrderSuccess(true);
        setQrModalData(null);
        clearSelectedItems();
        setTimeout(() => router.push(user ? "/my-orders" : "/"), 3500);
      } else {
        toast.error(data.message || "Có lỗi xảy ra từ máy chủ.", { id: toastId, duration: 5000 });
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ.", { id: toastId, duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.length === 0 && !orderSuccess && !orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
          <Package size={36} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng của bạn đang trống</h1>
        <p className="text-gray-500 text-sm">Hãy thêm sản phẩm vào giỏ trước khi thanh toán.</p>
        <Link href="/" className="mt-2 px-8 py-3 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tighter text-gray-900">
            SHOES<span className="text-red-500">.</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <ShieldCheck size={15} className="text-green-500" />
            Thanh toán bảo mật SSL
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <div className="w-full lg:w-[58%] space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                Thông tin người nhận
              </h2>
              <div className="space-y-3">
                <FloatingInput name="name" label="Họ và Tên *" value={formData.name} onChange={handleInputChange} icon={<User size={16} />} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FloatingInput name="phone" label="Số điện thoại *" type="tel" value={formData.phone} onChange={handleInputChange} />
                  <FloatingInput name="email" label="Email (để nhận xác nhận)" type="email" value={formData.email} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                Địa chỉ giao hàng
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={15} />} />
                  <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange} options={districts} disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={handleWardChange} options={wards} disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
                  <FloatingInput name="addressDetail" label="Số nhà, Tên đường *" value={formData.addressDetail} onChange={handleInputChange} />
                </div>
                {formData.district && (
                  <div className={`flex items-center gap-2.5 p-3 rounded-xl text-sm font-semibold mt-1 transition-all ${shippingFee === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    <Truck size={16} />
                    {shippingFee === 0
                      ? subtotal >= FREESHIP_THRESHOLD ? "🎉 Miễn phí giao hàng cho đơn từ 5.000.000đ!" : "🎉 Miễn phí giao hàng nội thành!"
                      : `Phí giao hàng: ${shippingFee.toLocaleString('vi-VN')} ₫ (Ngoại thành / Tỉnh)`
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">3</span>
                Phương thức thanh toán
              </h2>
              <div className="space-y-4">
                <label className={`block flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${paymentMethod === 'cod' ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-red-200 hover:bg-gray-50'}`} onClick={() => setPaymentMethod('cod')}>
                  <div className={`w-5 h-5 rounded-full border flex flex-col items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-red-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <Banknote size={24} className={paymentMethod === 'cod' ? "text-red-500" : "text-gray-400"} />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-[15px]">Thanh toán khi nhận hàng (COD)</span>
                      <span className="text-gray-500 text-sm mt-0.5">Thanh toán bằng tiền mặt khi giao hàng</span>
                    </div>
                  </div>
                </label>
                <label className={`block flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${paymentMethod === 'vnpay' ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-red-200 hover:bg-gray-50'}`} onClick={() => setPaymentMethod('vnpay')}>
                  <div className={`w-5 h-5 rounded-full border flex flex-col items-center justify-center shrink-0 ${paymentMethod === 'vnpay' ? 'border-red-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'vnpay' && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <CreditCard size={24} className={paymentMethod === 'vnpay' ? "text-red-500" : "text-gray-400"} />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-[15px]">Thanh toán thẻ (VNPay)</span>
                      <span className="text-gray-500 text-sm mt-0.5">ATM / Visa / Mastercard / JCB / ...</span>
                    </div>
                  </div>
                </label>
                <label className={`block flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${paymentMethod === 'qr' ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-red-200 hover:bg-gray-50'}`} onClick={() => setPaymentMethod('qr')}>
                  <div className={`w-5 h-5 rounded-full border flex flex-col items-center justify-center shrink-0 ${paymentMethod === 'qr' ? 'border-red-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'qr' && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${paymentMethod === 'qr' ? "text-red-500" : "text-gray-400"}`}>
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-[15px]">Thanh toán bằng mã QR</span>
                      <span className="text-gray-500 text-sm mt-0.5">Quét mã QR qua ứng dụng ngân hàng</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[42%]">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center justify-between">
                  Tóm tắt đơn hàng
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{cart.length} sản phẩm</span>
                </h2>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-1 mb-5 scrollbar-thin">
                  {cart.map((item) => (
                    <div key={item.variant_id} className="flex gap-3 group">
                      <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1 mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">Size {item.size.replace('EU-', '')} · SL: {item.quantity}</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-gray-200 pt-4 space-y-2.5">
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>Tạm tính</span>
                    <span className="text-gray-800">{subtotal.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>Phí giao hàng</span>
                    <span className={shippingFee === 0 ? 'text-green-600 font-bold' : 'text-gray-800'}>
                      {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString('vi-VN')} ₫`}
                    </span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm font-bold text-indigo-600">
                      <span>Voucher "{appliedDiscount.code}"</span>
                      <span>-{appliedDiscount.amount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-gray-200 mt-4 pt-4">
                  {appliedDiscount ? (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Ticket size={16} className="text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-700">{appliedDiscount.code}</span>
                      </div>
                      <button onClick={removeDiscount} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
                        Gỡ bỏ
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Mã giảm giá (nếu có)"
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase tracking-wide font-mono"
                      />
                      <button
                        onClick={handleApplyDiscount}
                        disabled={!discountCode.trim() || isApplyingDiscount}
                        className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isApplyingDiscount ? "..." : "Áp Dụng"}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                  <span className="text-xl font-black text-rose-600">{total.toLocaleString('vi-VN')} <span className="text-sm font-bold">₫</span></span>
                </div>
              </div>
              <div>
                <button
                  onClick={handlePreSubmit}
                  disabled={isLoading || !isFormValid || orderPlaced}
                  className={`w-full py-4 rounded-2xl text-base font-bold transition-all shadow-lg ${
                    orderPlaced
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : isLoading || !isFormValid
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] shadow-gray-900/20'
                  }`}
                >
                  {orderPlaced ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check size={18} /> Đã đặt hàng thành công!
                    </span>
                  ) : isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Xác nhận đặt hàng
                      <ChevronRight size={18} />
                    </span>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3 font-medium flex items-center justify-center gap-1.5">
                  <Lock size={11} /> Dữ liệu được mã hoá SSL. An toàn 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center relative animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thanh toán đơn hàng</h2>
            <p className="text-sm text-gray-500 text-center mb-6">Mở app Ngân hàng của bạn và quét mã QR dưới đây để hoàn tất thanh toán.</p>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 shadow-inner border border-gray-100 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/5 rotate-45 scale-150 transition-transform group-hover:rotate-90"></div>
              <img
                src="/maqrck.png"
                alt="QR Code"
                className="w-full max-w-[200px] h-auto object-contain relative z-10"
              />
            </div>

            <div className="w-full bg-gray-50 rounded-xl p-4 text-center border border-gray-100 space-y-2 mb-6">
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Tổng tiền thanh toán</div>
              <div className="text-2xl font-black text-blue-600">{(qrModalData.amount).toLocaleString('vi-VN')} ₫</div>
              <div className="text-sm text-gray-600 border-t border-dashed border-gray-300 pt-2 mt-2 font-medium">Nội dung CK: <strong className="text-gray-900">{qrModalData.description}</strong></div>
            </div>

            <button
               onClick={executeOrder}
               disabled={isLoading}
               className="w-full px-6 py-3.5 bg-gray-900 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Đang xử lý...
                </>
              ) : "Tôi đã thanh toán"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}