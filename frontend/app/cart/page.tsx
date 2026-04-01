"use client";

import Link from "next/link";
import { useCartStore } from "../store/useCartStore"; 
import { Trash2, Heart, ChevronDown, HelpCircle } from "lucide-react";

export default function CartPage() {
  
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const subtotal = getTotalPrice();
  const freeshipThreshold = 5000000; 
  const progress = Math.min((subtotal / freeshipThreshold) * 100, 100);
  const remainingForFreeship = freeshipThreshold - subtotal;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4">
        <h1 className="text-[28px] font-medium text-gray-900 mb-6">Giỏ hàng của bạn đang trống.</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. Khám phá ngay những mẫu giày mới nhất của chúng tôi.
        </p>
        <Link href="/" className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors">
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
          <div className="w-full lg:w-[65%]">
            <div className="bg-[#F5F5F5] p-5 rounded-2xl mb-8">
              <h2 className="text-[#FA5400] font-medium text-base mb-1">
                {remainingForFreeship > 0 
                  ? `Mua thêm ${remainingForFreeship.toLocaleString('vi-VN')} ₫ để được Giao hàng miễn phí.` 
                  : "Tuyệt vời! Bạn đã được Giao hàng tiêu chuẩn miễn phí."}
              </h2>
              <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
                <div className="bg-[#FA5400] h-full transition-all duration-700 ease-out rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h1 className="text-[28px] font-medium text-gray-900 mb-6 tracking-tight">Giỏ hàng</h1>

            <div className="space-y-8 divide-y divide-gray-100 border-b border-gray-100 pb-8">
              {items.map((item) => (
                <div key={item.variant_id} className="pt-8 first:pt-0 flex gap-4 sm:gap-6">
                  
                  {/* 🚨 ĐÃ FIX: Sử dụng đúng item.slug và thêm hiệu ứng click mượt mà */}
                  <Link href={`/product/${item.slug}`} className="w-[150px] h-[150px] shrink-0 bg-[#F5F5F5] rounded-xl overflow-hidden block transition-transform hover:opacity-90 active:scale-95">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply p-2" />
                  </Link>

                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 text-base">{item.name}</h3>
                        <p className="text-gray-500 text-base mt-1">Giày Nam</p>
                        <p className="text-gray-500 text-base mt-0.5">{item.color}</p>
                        
                        <div className="flex items-center gap-6 mt-3">
                          <p className="text-gray-500 text-base">Size: <span className="text-gray-900">{item.size.replace('EU-', '')}</span></p>
                          <div className="flex items-center gap-2 text-gray-500 text-base">
                            <label htmlFor={`qty-${item.variant_id}`}>Số lượng:</label>
                            <select 
                              id={`qty-${item.variant_id}`}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.variant_id, Number(e.target.value))}
                              className="bg-transparent text-gray-900 font-medium outline-none cursor-pointer"
                            >
                              {/* Chặn số lượng tối đa dựa vào stock */}
                              {Array.from({ length: Math.min(10, item.stock) }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900 text-base whitespace-nowrap">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>

                    <div className="mt-auto pt-4 flex items-center gap-4 text-gray-500">
                      <button className="hover:text-black transition-colors" title="Thêm vào Yêu thích">
                        <Heart size={22} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => removeFromCart(item.variant_id)} className="hover:text-black transition-colors" title="Xóa khỏi Giỏ hàng">
                        <Trash2 size={22} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: SUMMARY */}
          <div className="w-full lg:w-[35%]">
            <div className="sticky top-24">
              <h2 className="text-[28px] font-medium text-gray-900 mb-6 tracking-tight">Summary</h2>
              <details className="group [&_summary::-webkit-details-marker]:hidden mb-6 border-b border-gray-100 pb-2">
                <summary className="flex items-center justify-between cursor-pointer py-2 font-medium text-base text-gray-900 list-none hover:opacity-70 transition-opacity">
                  Bạn có mã Khuyến mãi?
                  <span className="transition duration-300 group-open:-rotate-180"><ChevronDown size={20} strokeWidth={1.5} /></span>
                </summary>
                <div className="pt-4 pb-6 flex gap-2">
                  <input type="text" placeholder="Nhập mã" className="flex-1 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-black transition-colors font-medium"/>
                  <button className="bg-white text-gray-900 border border-gray-300 hover:border-black font-medium px-6 py-3 rounded-lg transition-colors">Áp dụng</button>
                </div>
              </details>

              <div className="space-y-4 text-base font-medium border-b border-gray-100 pb-6 mb-6">
                <div className="flex justify-between text-gray-900"><p>Tạm tính</p><p>{subtotal.toLocaleString('vi-VN')} ₫</p></div>
                <div className="flex justify-between items-start text-gray-900">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:underline">Giao hàng & Xử lý <HelpCircle size={14} className="text-gray-500"/></div>
                  <p>{remainingForFreeship > 0 ? "250.000 ₫" : "Miễn phí"}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-gray-900 font-medium text-[20px] mb-8">
                <p>Tổng cộng</p>
                <p>{(subtotal + (remainingForFreeship > 0 ? 250000 : 0)).toLocaleString('vi-VN')} ₫</p>
              </div>

              <Link href="/checkout" className="w-full bg-black text-white hover:bg-gray-800 font-medium py-5 rounded-full transition-colors text-lg shadow-lg active:scale-[0.98] block text-center">
                Thanh Toán (Checkout)
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}