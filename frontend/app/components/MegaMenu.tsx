"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

// 🚨 Dữ liệu giả lập cho Mega Menu (Bạn có thể tùy chỉnh lại link và tên sau)
const MENU_DATA = [
  {
    id: "brands",
    title: "Thương Hiệu",
    columns: [
      {
        heading: "Phổ Biến",
        links: ["Nike", "Adidas", "Puma", "Vans", "Converse", "New Balance"]
      },
      {
        heading: "Dòng Giày Nike",
        links: ["Air Force 1", "Air Jordan 1", "Air Max", "Nike Dunk", "Blazer"]
      },
      {
        heading: "Dòng Giày Adidas",
        links: ["Yeezy", "Ultraboost", "Stan Smith", "Superstar", "Samba"]
      }
    ]
  },
  {
    id: "men",
    title: "Nam",
    columns: [
      {
        heading: "Nổi Bật",
        links: ["Hàng Mới Về", "Bán Chạy Nhất", "Phiên Bản Giới Hạn", "Sale Cuối Mùa"]
      },
      {
        heading: "Giày Nam",
        links: ["Lifestyle", "Chạy Bộ (Running)", "Bóng Rổ", "Đá Bóng", "Tập Gym"]
      },
      {
        heading: "Theo Mức Giá",
        links: ["Dưới 2 Triệu", "Từ 2 - 5 Triệu", "Trên 5 Triệu"]
      }
    ]
  },
  {
    id: "women",
    title: "Nữ",
    columns: [
      {
        heading: "Nổi Bật",
        links: ["Hàng Mới Về", "Bán Chạy Nhất", "Thiết Kế Độc Quyền", "Sale"]
      },
      {
        heading: "Giày Nữ",
        links: ["Lifestyle", "Chạy Bộ", "Tập Gym & Yoga", "Giày Lười (Slip-on)"]
      }
    ]
  }
];

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    // Thẻ bọc ngoài cùng để bắt sự kiện chuột
    <div 
      className="flex items-center h-full"
      onMouseLeave={() => setActiveMenu(null)} // Kéo chuột ra khỏi khu vực menu là đóng
    >
      {/* 1. Các Nút Menu Chính trên Header */}
      <div className="flex items-center gap-6 h-full px-4">
        <Link href="/" className="flex items-center text-gray-900 font-bold uppercase text-sm tracking-wide hover:text-black transition-colors h-full border-b-2 border-transparent hover:border-black">
          Tất cả sản phẩm
        </Link>
        
        {MENU_DATA.map((menu) => (
          <div 
            key={menu.id}
            onMouseEnter={() => setActiveMenu(menu.id)}
            className={`flex items-center gap-1 cursor-pointer h-full font-bold uppercase text-sm tracking-wide transition-colors border-b-2 ${activeMenu === menu.id ? 'text-black border-black' : 'text-gray-600 border-transparent hover:text-black hover:border-gray-300'}`}
          >
            {menu.title}
            <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === menu.id ? 'rotate-180' : ''}`} />
          </div>
        ))}
      </div>

      {/* 2. Lớp Nền Đen Làm Mờ (Backdrop) */}
      <div 
        className={`fixed inset-0 top-16 bg-black/40 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          activeMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 3. Bảng Mega Menu Thả Xuống Tràn Viền */}
      <div 
        className={`absolute left-0 top-full w-full bg-white z-50 transition-all duration-300 ease-out border-t border-gray-100 shadow-xl overflow-hidden ${
          activeMenu ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="max-w-6xl mx-auto px-8 py-10">
          {MENU_DATA.map((menu) => (
            <div 
              key={menu.id} 
              className={`flex justify-center gap-16 transition-opacity duration-300 absolute inset-x-0 py-10 top-0 ${
                activeMenu === menu.id ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {menu.columns.map((col, idx) => (
                <div key={idx} className="flex flex-col min-w-[180px]">
                  <h3 className="text-base font-black text-gray-900 mb-5">{col.heading}</h3>
                  <ul className="space-y-3">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        {/* Trong thực tế, thẻ <span> này sẽ là <Link href="..."> */}
                        <span className="text-gray-500 hover:text-black font-medium text-sm transition-colors cursor-pointer block">
                          {link}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
          {/* Một khối div rỗng để giữ chiều cao cố định cho mượt mà (Tùy số lượng link) */}
          <div className="h-[280px] pointer-events-none"></div>
        </div>
      </div>

    </div>
  );
}