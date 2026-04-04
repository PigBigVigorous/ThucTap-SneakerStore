"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../store/useCartStore"; 
import { Check, Lock, Package } from "lucide-react";
import toast from "react-hot-toast";
import { orderAPI } from "../services/api";


const FloatingInput = ({ label, name, type = "text", value, onChange }: any) => (
  <div className="relative w-full">
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="block px-4 pb-2.5 pt-6 w-full text-base text-gray-900 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-black focus:border-black peer transition-colors"
      placeholder=" "
      required
    />
    <label className="absolute text-base text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text pointer-events-none">
      {label}
    </label>
  </div>
);

export default function CheckoutPage() {
  const router = useRouter();
  
  const cart = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // 1. STATE LƯU THÔNG TIN KHÁCH NHẬP
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    phone: ""
  });

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Tính toán tiền nong
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const isFreeship = subtotal >= 5000000;
  const shippingCost = shippingMethod === "express" ? 250000 : (isFreeship ? 0 : 250000);
  const total = subtotal + shippingCost;

  // Cập nhật dữ liệu form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (!formData.firstName || !formData.address || !formData.phone) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng!");
      setActiveStep(1);
      return;
    }

    setIsLoading(true);

    const fullShippingAddress = `Người nhận: ${formData.lastName} ${formData.firstName} - SĐT: ${formData.phone} - Email: ${formData.email || 'Không có'} - Địa chỉ: ${formData.address}`;

    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const user = userString ? JSON.parse(userString) : null;

    const orderPayload = {
      user_id: user ? user.id : null,
      shipping_address: fullShippingAddress,
      payment_method: paymentMethod,
      items: cart.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity
      }))
    };

    try {
      const data = await orderAPI.create(orderPayload, token || "");

      if (data.success) {
        
        // NẾU BACKEND TRẢ VỀ URL VNPAY -> REDIRECT CHỨ KHÔNG PUSH ROUTER NỮA
        if (data.data?.payment_url) {
            window.location.href = data.data.payment_url;
            return; // Dừng tại đây, không xoá giỏ hàng vội (chỉ xoá khi thanh toán xong)
        }

        const trackingCode = data.data?.order_tracking_code || '';
        toast.success(`Đặt hàng thành công! Mã đơn: ${trackingCode}`, { duration: 4000 });
        
        clearCart(); 
        
        setTimeout(() => {
          if (user) {
            router.push("/my-orders");
          } else {
            router.push("/");
          }
        }, 2000);
      } else {
        console.error("🚨 CHI TIẾT LỖI TỪ BACKEND:", JSON.stringify(data, null, 2));
        toast.error(data.message || "Có lỗi xảy ra từ máy chủ. Vui lòng bật F12 để xem chi tiết!");
      }
    } catch (error) {
      console.error("Lỗi Network/CORS:", error);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-2xl font-medium mb-4">Giỏ hàng của bạn đang trống</h1>
        <Link href="/cart" className="underline font-medium hover:text-gray-600">Quay lại Giỏ hàng</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-[1000px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/cart" className="font-black text-2xl tracking-tighter text-gray-900">
            SNEAKER<span className="text-red-600">.</span>
          </Link>
          <div className="flex items-center gap-2 text-gray-900 font-medium">
            <Lock size={18} /><span>Thanh toán an toàn</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1000px] mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          <div className="w-full lg:w-[60%]">
            {/* BƯỚC 1: THÔNG TIN GIAO HÀNG */}
            <div className="border-b border-gray-200 pb-8 mb-8">
              <h2 className={`text-[24px] font-medium tracking-tight mb-6 flex items-center gap-3 ${activeStep > 1 ? 'text-gray-400' : 'text-gray-900'}`}>
                1. Thông tin Giao hàng
                {activeStep > 1 && <Check size={24} className="text-green-600" />}
              </h2>
              
              {activeStep === 1 ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput name="firstName" label="Tên" value={formData.firstName} onChange={handleInputChange} />
                    <FloatingInput name="lastName" label="Họ" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                  <FloatingInput name="address" label="Địa chỉ nhận hàng (Số nhà, Tên đường)" value={formData.address} onChange={handleInputChange} />
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} />
                    <FloatingInput name="phone" label="Số điện thoại" type="tel" value={formData.phone} onChange={handleInputChange} />
                  </div>
                  <button 
                    onClick={() => setActiveStep(2)}
                    className="w-full bg-black text-white font-medium py-4.5 rounded-full mt-6 hover:bg-gray-800 transition-colors text-lg"
                  >
                    Lưu & Tiếp tục
                  </button>
                </div>
              ) : (
                <div className="text-base text-gray-900 font-medium cursor-pointer hover:underline" onClick={() => setActiveStep(1)}>
                  {formData.lastName} {formData.firstName} <br/> {formData.address}
                </div>
              )}
            </div>

            {/* BƯỚC 2: PHƯƠNG THỨC VẬN CHUYỂN */}
            <div className="border-b border-gray-200 pb-8 mb-8">
              <h2 className={`text-[24px] font-medium tracking-tight mb-6 flex items-center gap-3 ${activeStep < 2 ? 'text-gray-300' : (activeStep > 2 ? 'text-gray-400' : 'text-gray-900')}`}>
                2. Vận chuyển
                {activeStep > 2 && <Check size={24} className="text-green-600" />}
              </h2>
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className={`flex items-start p-5 border rounded-xl cursor-pointer transition-all ${shippingMethod === 'standard' ? 'border-black ring-1 ring-black' : 'border-gray-200'}`}>
                    <input type="radio" name="shipping" value="standard" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} className="mt-1 w-5 h-5 accent-black text-black" />
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Giao hàng Tiêu chuẩn</span>
                        <span className="font-bold text-gray-900">{isFreeship ? 'Miễn phí' : '250.000 ₫'}</span>
                      </div>
                      <p className="text-gray-500 mt-1 text-sm font-medium">Nhận hàng trong 4-5 ngày làm việc</p>
                    </div>
                  </label>
                  <button onClick={() => setActiveStep(3)} className="w-full bg-black text-white font-medium py-4.5 rounded-full mt-6 hover:bg-gray-800 transition-colors text-lg">
                    Tiếp tục tới Thanh toán
                  </button>
                </div>
              )}
              {activeStep > 2 && (
                <div className="text-base text-gray-900 font-medium cursor-pointer hover:underline" onClick={() => setActiveStep(2)}>
                  {shippingMethod === 'standard' ? 'Giao hàng Tiêu chuẩn' : 'Giao hàng Hỏa tốc'}
                </div>
              )}
            </div>

            {/* BƯỚC 3: THANH TOÁN */}
            <div>
              <h2 className={`text-[24px] font-medium tracking-tight mb-6 ${activeStep < 3 ? 'text-gray-300' : 'text-gray-900'}`}>
                3. Thanh toán
              </h2>
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
                      <label className="flex items-center p-5 cursor-pointer hover:bg-gray-50">
                          <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-black text-black" />
                            <span className="ml-4 font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                      </label>
                      <label className="flex items-center p-5 cursor-pointer hover:bg-gray-50 bg-[#F0F8FF]">
                          <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="w-5 h-5 accent-blue-600 text-blue-600" />
                            <span className="ml-4 font-bold text-gray-900 flex items-center gap-2">
                            Thanh toán online qua VNPAY / Thẻ ATM
                            <img src="data:image/png;base64,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" alt="vnpay" className="h-6 object-contain ml-2"/>
                            </span>
                      </label>
                    </div>
                  <div className="pt-6">
                    <p className="text-xs text-gray-500 mb-6 leading-relaxed font-medium">
                      Bằng việc bấm "Đặt hàng", bạn đồng ý với Điều khoản Sử dụng và Chính sách Bảo mật của chúng tôi.
                    </p>
                    <button 
                      onClick={handlePlaceOrder}
                      disabled={isLoading}
                      className={`w-full text-white font-medium py-5 rounded-full transition-all text-lg shadow-lg active:scale-[0.98] ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                    >
                      {isLoading ? "Đang xử lý..." : "Đặt hàng"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: MINI-BAG SUMMARY */}
          <div className="w-full lg:w-[40%]">
            <div className="sticky top-10 bg-white">
              <h2 className="text-[24px] font-medium text-gray-900 mb-6 tracking-tight">Tóm tắt Đơn hàng</h2>
              <div className="space-y-4 text-base font-medium border-b border-gray-200 pb-6 mb-6">
                <div className="flex justify-between text-gray-900"><p className="text-gray-500">Tạm tính</p><p>{subtotal.toLocaleString('vi-VN')} ₫</p></div>
                <div className="flex justify-between text-gray-900"><p className="text-gray-500">Phí giao hàng</p><p>{shippingCost === 0 ? "Miễn phí" : `${shippingCost.toLocaleString('vi-VN')} ₫`}</p></div>
              </div>
              <div className="flex justify-between items-center text-gray-900 font-medium text-[20px] mb-8 pb-8 border-b border-gray-200">
                <p>Tổng cộng</p><p>{total.toLocaleString('vi-VN')} ₫</p>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Package size={16}/> SẼ ĐƯỢC GIAO</p>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.variant_id} className="flex gap-4">
                    <div className="w-[80px] h-[80px] bg-[#F5F5F5] rounded-md overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply p-1" />
                    </div>
                    <div className="flex-1 text-sm font-medium text-gray-900">
                      <p className="line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-gray-500 mt-1">Size: {item.size.replace('EU-', '')}</p>
                      <div className="flex justify-between mt-1 text-gray-500"><p>SL: {item.quantity}</p><p className="text-gray-900">{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}