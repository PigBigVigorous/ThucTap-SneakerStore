"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../store/useCartStore";
import { Coins, MapPin, User, Check, Lock, Package, ChevronRight, Truck, CreditCard, ShieldCheck, Ticket, Banknote, ShoppingBag, X, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { orderAPI, discountAPI, shippingAPI, addressAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AuthRequiredModal from "../components/AuthRequiredModal";
import ShippingAddressSection from "./components/ShippingAddressSection";

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
    email: "",
    province: "",
    district: "",
    ward: "",
    addressDetail: "",
    shipping_name: "",
    shipping_phone: ""
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressDisplay, setAddressDisplay] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const subtotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const FREESHIP_THRESHOLD = 5000000;
  const [shippingFee, setShippingFee] = useState(0);

  // Discount State
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; id: number } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Loyalty Points State
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Removed old address fetching logic, handled in AddressSection component

  const handleAddressSelect = useCallback((data: any) => {
    setSelectedAddressId(data.addressId || null);
    setFormData(f => ({
      ...f,
      shipping_name: data.contactInfo?.name || "",
      shipping_phone: data.contactInfo?.phone || "",
      email: data.contactInfo?.email || f.email,
      province: data.shippingData?.province || "",
      district: data.shippingData?.district || "",
      ward: data.shippingData?.ward || "",
      addressDetail: data.detailAddress || ""
    }));
    setAddressDisplay(data.displayInfo || "");
  }, []);

  // Centralized calculations
  const { totalOriginal, pointDiscountValue, total, potentialPoints } = useMemo(() => {
    const original = subtotal + shippingFee;
    const pointValue = usePoints ? pointsToUse * 1000 : 0;
    const discount = appliedDiscount?.amount || 0;
    const final = Math.max(0, original - discount - pointValue);
    const potential = Math.floor((subtotal - discount - pointValue) / 100000);

    return {
      totalOriginal: original,
      pointDiscountValue: pointValue,
      total: final,
      potentialPoints: potential
    };
  }, [subtotal, shippingFee, usePoints, pointsToUse, appliedDiscount]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const isFormValid = formData.shipping_name && formData.shipping_phone && formData.province && formData.district && formData.ward && formData.addressDetail;

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

  const handleTogglePoints = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!usePoints) {
      if (!user?.points || user.points <= 0) {
        toast.error("Bạn không có điểm tích lũy để sử dụng.");
        return;
      }
      setPointsToUse(user.points || 0);
      setUsePoints(true);
      toast.success(`Đã áp dụng ${user.points || 0} điểm tích lũy!`);
    } else {
      setUsePoints(false);
      setPointsToUse(0);
      toast.success("Đã hủy dùng điểm tích lũy");
    }
  };

  const handlePreSubmit = () => {
    // Kiểm tra lần lượt từng điều kiện và hiển thị thông báo lỗi cụ thể
    if (!formData.shipping_name) { toast.error("Vui lòng nhập tên người nhận!"); return; }
    if (!formData.shipping_phone) { toast.error("Vui lòng nhập số điện thoại!"); return; }
    if (!formData.province) { toast.error("Vui lòng chọn Tỉnh / Thành phố!"); return; }
    if (!formData.district) { toast.error("Vui lòng chọn Quận / Huyện!"); return; }
    if (!formData.ward) { toast.error("Vui lòng chọn Phường / Xã!"); return; }
    if (!formData.addressDetail) { toast.error("Vui lòng nhập số nhà, tên đường cụ thể!"); return; }
    if (!isAuthenticated && !formData.email) { toast.error("Vui lòng nhập email để nhận thông báo đơn hàng!"); return; }

    if (paymentMethod === "qr") {
      setQrModalData({
        amount: total,
        description: `SDT ${formData.shipping_phone}`,
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
        address_id: selectedAddressId,
        customer_name: formData.shipping_name, customer_phone: formData.shipping_phone, customer_email: formData.email,
        province: formData.province, district: formData.district, ward: formData.ward,
        address_detail: formData.addressDetail, shipping_fee: shippingFee, total_amount: totalOriginal,
        discount_code: appliedDiscount ? appliedDiscount.code : null,
        payment_method: paymentMethod,
        points_used: usePoints ? pointsToUse : 0,
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
        refreshUser();
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

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
          <Check size={48} className="text-emerald-600 relative z-10" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase italic">Đặt hàng thành công!</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
          Cảm ơn bạn đã tin tưởng chọn Sneaker Store. Đơn hàng của bạn đang được xử lý và sẽ sớm được giao đến bạn.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link href={isAuthenticated ? "/my-orders" : "/"} className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/20 active:scale-95">
            {isAuthenticated ? "Xem đơn hàng của tôi" : "Về trang chủ"}
          </Link>
          <Link href="/" className="flex-1 px-8 py-4 border-2 border-gray-100 rounded-2xl font-black text-sm text-gray-900 uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !orderPlaced) {
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
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <ShoppingBag className="text-white" size={20} />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Sneaker Store</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-3 text-sm font-black text-gray-900 group">
              <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs shadow-lg shadow-gray-900/20 group-hover:rotate-6 transition-transform">1</div>
              <span className="uppercase tracking-widest">Giỏ hàng</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-100 rounded-full"></div>
            <div className="flex items-center gap-3 text-sm font-black text-blue-600 group">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform">2</div>
              <span className="uppercase tracking-widest">Thanh toán</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-100 rounded-full"></div>
            <div className="flex items-center gap-3 text-sm font-black text-gray-300 group">
              <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-300 flex items-center justify-center text-xs">3</div>
              <span className="uppercase tracking-widest">Hoàn tất</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <Lock size={14} className="text-green-500" />
            Bảo mật SSL
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
          {/* Left Column: Checkout Form */}
          <div className="w-full lg:w-[62%] space-y-8">

            {/* 1 & 2. Thông tin nhận hàng & Địa chỉ */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-gray-900 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-gray-900/20">1</span>
                Thông tin giao hàng
              </h2>

              <ShippingAddressSection
                isLoggedIn={isAuthenticated}
                onAddressSelect={handleAddressSelect}
              />


              {formData.district && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-sm animate-in zoom-in-95 duration-300">
                  <Truck size={18} />
                  <p className="font-medium">
                    Phí vận chuyển cho <strong>{formData.district}, {formData.province}</strong>:
                    <span className="ml-1 text-blue-800 font-bold">
                      {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString('vi-VN')} ₫`}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100/80 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-gray-900 text-white text-sm flex items-center justify-center font-bold shadow-xl shadow-gray-900/20">2</span>
                  Phương thức thanh toán
                </h2>
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Lock size={12} className="text-green-500" /> Thanh toán an toàn
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {[
                  { id: 'cod', title: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt khi shipper giao hàng', icon: <Banknote size={24} />, activeClass: 'border-gray-900 bg-gray-50/50 shadow-gray-900/5', ringClass: 'border-gray-900 bg-gray-900', iconColor: 'text-gray-900' },
                  { id: 'vnpay', title: 'Thanh toán thẻ (VNPay)', desc: 'ATM / Visa / Mastercard / JCB / ...', icon: <CreditCard size={24} />, activeClass: 'border-blue-600 bg-blue-50/50 shadow-blue-600/5', ringClass: 'border-blue-600 bg-blue-600', iconColor: 'text-blue-600' },
                  {
                    id: 'qr', title: 'Chuyển khoản QR Code', desc: 'Quét mã QR qua ứng dụng ngân hàng của bạn', icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                    ), activeClass: 'border-indigo-600 bg-indigo-50/50 shadow-indigo-600/5', ringClass: 'border-indigo-600 bg-indigo-600', iconColor: 'text-indigo-600'
                  }
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`group relative flex items-center gap-5 p-6 border-2 rounded-[1.5rem] cursor-pointer transition-all duration-500 overflow-hidden ${paymentMethod === method.id
                      ? `${method.activeClass} shadow-lg`
                      : 'border-gray-50 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    {paymentMethod === method.id && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-full -mr-12 -mt-12 animate-in zoom-in-50 duration-700"></div>
                    )}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${paymentMethod === method.id ? method.ringClass : 'border-gray-200 bg-white'
                      }`}>
                      {paymentMethod === method.id && <Check size={12} className="text-white animate-in zoom-in duration-300" />}
                    </div>
                    <div className="flex items-center gap-5 w-full relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 transition-all duration-300 ${paymentMethod === method.id ? 'bg-white scale-105 shadow-md' : 'bg-white group-hover:scale-105'
                        }`}>
                        <div className={paymentMethod === method.id ? method.iconColor : "text-gray-400"}>
                          {method.icon}
                        </div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className={`font-black text-[15px] transition-colors ${paymentMethod === method.id ? 'text-gray-900' : 'text-gray-500'}`}>
                          {method.title}
                        </span>
                        <span className="text-gray-400 text-xs mt-1 font-bold tracking-tight">{method.desc}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Loyalty Points Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                      <Coins size={14} />
                    </span>
                    Điểm tích lũy (Loyalty)
                  </h2>
                  {isAuthenticated && (
                    <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      Hiện có: {user?.points || 0} điểm
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-gray-900 mb-1">
                      {usePoints ? "Đang sử dụng điểm" : "Sử dụng điểm tích lũy?"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {usePoints
                        ? `Bạn đang dùng ${pointsToUse} điểm để được giảm ${(pointsToUse * 1000).toLocaleString('vi-VN')} ₫`
                        : "Quy đổi: 1 điểm = 1.000 ₫. Giảm trực tiếp vào hóa đơn."
                      }
                    </p>
                  </div>

                  <button
                    onClick={handleTogglePoints}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${usePoints
                      ? 'bg-white text-rose-500 border border-rose-100 hover:bg-rose-50'
                      : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                      }`}
                  >
                    {usePoints ? 'Hủy dùng điểm' : 'Dùng điểm ngay'}
                  </button>
                </div>

                {!isAuthenticated && (
                  <p className="mt-3 text-xs text-gray-400 text-center font-medium">
                    Hãy <button onClick={() => setIsAuthModalOpen(true)} className="text-amber-600 hover:underline">đăng nhập</button> để xem và sử dụng điểm tích lũy của bạn.
                  </p>
                )}

                {potentialPoints > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 w-fit px-3 py-1.5 rounded-lg border border-green-100">
                    <Check size={12} />
                    Bạn sẽ nhận được +{potentialPoints} điểm khi hoàn thành đơn này!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[38%] lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-900/5 border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

              <h2 className="text-lg font-black text-gray-900 mb-8 flex items-center justify-between relative z-10">
                Tóm tắt đơn hàng
                <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{cart.length} sản phẩm</span>
              </h2>

              <div className="space-y-6 max-h-[320px] overflow-y-auto pr-2 mb-8 scrollbar-thin relative z-10">
                {cart.map((item) => (
                  <div key={item.variant_id} className="flex gap-4 group/item">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 group-hover/item:border-gray-200 transition-all duration-300">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2 mix-blend-multiply group-hover/item:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover/item:text-blue-600 transition-colors">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 font-medium italic">Size: {item.size.replace('EU-', '')} · Số lượng: {item.quantity}</p>
                      <p className="text-sm font-black text-gray-900 mt-2">{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="space-y-3 mb-8 relative z-10">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mã giảm giá (Voucher)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                      <Ticket size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Nhập mã ưu đãi..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all font-bold uppercase tracking-wider"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button
                    onClick={handleApplyDiscount}
                    disabled={!discountCode || !!appliedDiscount}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${appliedDiscount
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400'
                      }`}
                  >
                    {appliedDiscount ? 'Đã áp dụng' : 'Áp dụng'}
                  </button>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between items-center px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 animate-in zoom-in-95 duration-300">
                    <span className="text-xs font-bold text-emerald-700">Tiết kiệm được: -{appliedDiscount.amount.toLocaleString('vi-VN')} ₫</span>
                    <button onClick={removeDiscount} className="text-emerald-500 hover:text-emerald-700 p-1"><X size={14} /></button>
                  </div>
                )}
              </div>

              {/* Calculations */}
              <div className="border-t border-dashed border-gray-200 pt-6 space-y-4 relative z-10">
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Tạm tính</span>
                  <span className="text-gray-900 font-bold">{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span className="text-gray-900 font-bold">{shippingFee === 0 ? 'Miễn phí' : `+${shippingFee.toLocaleString('vi-VN')} ₫`}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-sm font-bold text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100/50 animate-in slide-in-from-right-4 duration-300">
                    <span className="flex items-center gap-1.5"><Ticket size={14} /> Giảm giá voucher</span>
                    <span>-{appliedDiscount.amount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}

                {usePoints && (
                  <div className="flex justify-between text-sm font-bold text-amber-600 bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-100/50 animate-in slide-in-from-right-4 duration-300">
                    <span className="flex items-center gap-1.5"><Coins size={14} /> Dùng điểm tích lũy</span>
                    <span>-{(pointsToUse * 1000).toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">Tổng cộng</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Đã bao gồm VAT</span>
                  </div>
                  <span className="text-3xl font-black text-rose-600 tracking-tighter animate-in zoom-in duration-300">
                    {total.toLocaleString('vi-VN')} <span className="text-xs font-bold">₫</span>
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 space-y-4 relative z-10">
                <button
                  onClick={handlePreSubmit}
                  disabled={isLoading || orderPlaced}
                  className={`w-full py-5 rounded-2xl text-base font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${orderPlaced
                    ? 'bg-emerald-500 text-white cursor-not-allowed shadow-emerald-500/20'
                    : isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-blue-600 shadow-gray-900/20 hover:shadow-blue-600/20'
                    }`}
                >
                  {orderPlaced ? (
                    <span className="flex items-center justify-center gap-3">
                      <Check size={20} /> Đặt hàng thành công
                    </span>
                  ) : isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      Xác nhận đặt hàng
                      <ChevronRight size={20} />
                    </span>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <Lock size={12} className="text-green-500" />
                  Thanh toán an toàn 100% qua SSL
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
              <div className="text-2xl font-black text-blue-600">{(qrModalData?.amount || 0).toLocaleString('vi-VN')} ₫</div>
              <div className="text-sm text-gray-600 border-t border-dashed border-gray-300 pt-2 mt-2 font-medium">Nội dung CK: <strong className="text-gray-900">{qrModalData?.description || ""}</strong></div>
            </div>

            <button
              onClick={executeOrder}
              disabled={isLoading}
              className="w-full px-6 py-3.5 bg-gray-900 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Đang xử lý...
                </>
              ) : "Tôi đã thanh toán"}
            </button>
          </div>
        </div>
      )}

      {/* Render Modal Yêu cầu đăng nhập */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}