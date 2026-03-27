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
      items: cart.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity
      }))
    };

    try {
      const data = await orderAPI.create(orderPayload, token || "");

      if (data.success) {
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