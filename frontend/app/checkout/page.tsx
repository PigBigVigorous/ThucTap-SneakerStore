"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../store/useCartStore";
import { Check, Lock, Package, ChevronRight, Truck, CreditCard, MapPin, User, ShieldCheck, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import { orderAPI, discountAPI } from "../services/api";

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

// --- Payment Badge ---
const PaymentOption = ({ value, current, onChange, label, badge }: any) => (
  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${current === value ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${current === value ? 'border-gray-900' : 'border-gray-300'}`}>
      {current === value && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
    </div>
    <input type="radio" name="payment" value={value} checked={current === value} onChange={() => onChange(value)} className="sr-only" />
    <div className="flex items-center gap-2 flex-1">
      <span className="text-sm font-semibold text-gray-900">{label}</span>
      {badge && badge}
    </div>
  </label>
);

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

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
  const [shippingFee, setShippingFee] = useState(30000);

  // Discount State
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; id: number } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const totalOriginal = subtotal + shippingFee;
  const total = Math.max(0, totalOriginal - (appliedDiscount?.amount || 0));

  // Load provinces
  useEffect(() => {
    fetch(`${API_BASE_URL}/provinces`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setProvinces(d); else if (d?.data) setProvinces(d.data); })
      .catch(() => {});
  }, []);

  // Auto calculate shipping
  useEffect(() => {
    const p = formData.province?.toLowerCase() || "";
    const d = formData.district?.toLowerCase() || "";
    const innerHCM = ["quận 1","quận 3","quận 4","quận 5","quận 6","quận 7","quận 8","quận 10","quận 11","tân bình","tân phú","phú nhuận","gò vấp","bình thạnh"];
    const innerHN  = ["ba đình","hoàn kiếm","tây hồ","long biên","cầu giấy","đống đa","hai bà trưng","hoàng mai","thanh xuân","nam từ liêm","bắc từ liêm","hà đông"];
    const innerDN  = ["hải châu","thanh khê","sơn trà","cẩm lệ"];
    const inner = (p.includes("hồ chí minh") && innerHCM.some(x => d.includes(x)))
               || (p.includes("hà nội")     && innerHN.some(x  => d.includes(x)))
               || (p.includes("đà nẵng")    && innerDN.some(x  => d.includes(x)));
    setShippingFee(inner ? 0 : 30000);
  }, [formData.province, formData.district]);

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
      // Calculate subtotal to pass to backend check
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

  const handlePlaceOrder = async () => {
    if (!isFormValid) { toast.error("Vui lòng điền đầy đủ thông tin giao hàng!"); return; }
    setIsLoading(true);
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token") || "";
    try {
      const data = await orderAPI.create({
        user_id: user?.id || null,
        customer_name: formData.name, customer_phone: formData.phone, customer_email: formData.email,
        province: formData.province, district: formData.district, ward: formData.ward,
        address_detail: formData.addressDetail, shipping_fee: shippingFee, total_amount: totalOriginal, // Send original, backend subtracts
        discount_code: appliedDiscount ? appliedDiscount.code : null, // Dòng này gửi lên mã
        payment_method: paymentMethod,
        items: cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity }))
      }, token);

      if (data.success) {
        if (data.data?.payment_url) { window.location.href = data.data.payment_url; return; }
        toast.success(`Đặt hàng thành công! Mã: ${data.data?.order_tracking_code}`, { duration: 5000 });
        clearCart();
        setOrderSuccess(true);
        setTimeout(() => router.push(user ? "/my-orders" : "/"), 2500);
      } else {
        toast.error(data.message || "Có lỗi xảy ra từ máy chủ.");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.length === 0 && !orderSuccess) {
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
      {/* Header */}
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

          {/* LEFT COL: Form */}
          <div className="w-full lg:w-[58%] space-y-6">
            
            {/* Section: Contact */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                Thông tin người nhận
              </h2>
              <div className="space-y-3">
                <FloatingInput name="name" label="Họ và Tên *" value={formData.name} onChange={handleInputChange} icon={<User size={16}/>} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FloatingInput name="phone" label="Số điện thoại *" type="tel" value={formData.phone} onChange={handleInputChange} />
                  <FloatingInput name="email" label="Email (để nhận xác nhận)" type="email" value={formData.email} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Section: Delivery Address */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                Địa chỉ giao hàng
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={15}/>} />
                  <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange} options={districts} disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={handleWardChange} options={wards} disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
                  <FloatingInput name="addressDetail" label="Số nhà, Tên đường *" value={formData.addressDetail} onChange={handleInputChange} />
                </div>

                {/* Shipping Fee Badge */}
                {formData.district && (
                  <div className={`flex items-center gap-2.5 p-3 rounded-xl text-sm font-semibold mt-1 transition-all ${shippingFee === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    <Truck size={16} />
                    {shippingFee === 0
                      ? "🎉 Miễn phí giao hàng nội thành!"
                      : `Phí giao hàng: ${shippingFee.toLocaleString('vi-VN')} ₫ (Ngoại thành / Tỉnh)`
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Section: Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">3</span>
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                <PaymentOption value="cod" current={paymentMethod} onChange={setPaymentMethod}
                  label="Thanh toán khi nhận hàng (COD)"
                  badge={<span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">Phổ biến</span>}
                />
                <PaymentOption value="vnpay" current={paymentMethod} onChange={setPaymentMethod}
                  label="Thanh toán online qua VNPAY"
                  badge={<span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">An toàn</span>}
                />
              </div>
            </div>

            {/* Place Order Button (Mobile) */}
            <div className="lg:hidden">
              <button
                onClick={handlePlaceOrder}
                disabled={isLoading || !isFormValid}
                className={`w-full py-4 rounded-2xl text-base font-bold transition-all shadow-lg ${isLoading || !isFormValid ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]'}`}
              >
                {isLoading ? "Đang xử lý..." : `Đặt hàng · ${total.toLocaleString('vi-VN')} ₫`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3 font-medium">
                🔒 Dữ liệu được mã hoá SSL. An toàn 100%.
              </p>
            </div>
          </div>

          {/* RIGHT COL: Order Summary */}
          <div className="w-full lg:w-[42%]">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center justify-between">
                  Tóm tắt đơn hàng
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{cart.length} sản phẩm</span>
                </h2>

                {/* Cart Items */}
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

                {/* Totals */}
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

                {/* VOUCHER INPUT BLOCK KHÔNG CHẠM MẠCH */}
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

              {/* CTA - Desktop */}
              <div className="hidden lg:block">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading || !isFormValid}
                  className={`w-full py-4 rounded-2xl text-base font-bold transition-all shadow-lg ${isLoading || !isFormValid ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] shadow-gray-900/20'}`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
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

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: "🚚", label: "Giao hàng\ntoàn quốc" },
                  { icon: "↩️", label: "Đổi trả\n30 ngày" },
                  { icon: "💬", label: "Hỗ trợ\n24/7" },
                ].map(b => (
                  <div key={b.label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{b.icon}</div>
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight whitespace-pre-line">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}