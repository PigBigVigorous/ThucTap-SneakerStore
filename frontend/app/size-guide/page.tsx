"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Ruler } from "lucide-react";

// Dữ liệu bảng size chuẩn Nike
const SIZE_DATA = [
  { usM: "6", usW: "7.5", uk: "5.5", eu: "38.5", cm: "24", in: "9 1/2" },
  { usM: "6.5", usW: "8", uk: "6", eu: "39", cm: "24.5", in: "9 5/8" },
  { usM: "7", usW: "8.5", uk: "6", eu: "40", cm: "25", in: "9 7/8" },
  { usM: "7.5", usW: "9", uk: "6.5", eu: "40.5", cm: "25.5", in: "10" },
  { usM: "8", usW: "9.5", uk: "7", eu: "41", cm: "26", in: "10 1/4" },
  { usM: "8.5", usW: "10", uk: "7.5", eu: "42", cm: "26.5", in: "10 3/8" },
  { usM: "9", usW: "10.5", uk: "8", eu: "42.5", cm: "27", in: "10 5/8" },
  { usM: "9.5", usW: "11", uk: "8.5", eu: "43", cm: "27.5", in: "10 7/8" },
  { usM: "10", usW: "11.5", uk: "9", eu: "44", cm: "28", in: "11" },
  { usM: "10.5", usW: "12", uk: "9.5", eu: "44.5", cm: "28.5", in: "11 1/4" },
  { usM: "11", usW: "12.5", uk: "10", eu: "45", cm: "29", in: "11 3/8" },
  { usM: "11.5", usW: "13", uk: "10.5", eu: "45.5", cm: "29.5", in: "11 5/8" },
  { usM: "12", usW: "13.5", uk: "11", eu: "46", cm: "30", in: "11 7/8" },
];

export default function SizeGuidePage() {
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Header đơn giản */}
      <div className="border-b border-gray-100">
        <div className="max-w-[900px] mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-bold text-sm uppercase tracking-widest">
            <ChevronLeft size={18} /> Về cửa hàng
          </Link>
          <div className="flex items-center gap-2 font-black text-xl uppercase tracking-tighter">
            <Ruler size={24} className="text-black" />
            Size Guide
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-12">
        {/* Tiêu đề & Nút Toggle đổi đơn vị */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-medium text-gray-900 leading-tight mb-3 tracking-tighter">
              Bảng kích cỡ giày Nam
            </h1>
            <p className="text-gray-500 font-medium">
              Tìm kích cỡ của bạn trong bảng bên dưới. Cuộn ngang để xem thêm.
            </p>
          </div>

          {/* Toggle Button Chuẩn Nike */}
          <div className="bg-gray-100 p-1 rounded-full flex relative shrink-0">
            <div 
              className={`absolute top-1 bottom-1 w-[80px] bg-white rounded-full shadow-sm transition-all duration-300 ease-out
                ${unit === 'in' ? 'left-1' : 'left-[81px]'}`}
            />
            <button 
              onClick={() => setUnit('in')}
              className={`relative z-10 w-[80px] py-2 text-sm font-bold transition-colors ${unit === 'in' ? 'text-black' : 'text-gray-500'}`}
            >
              in.
            </button>
            <button 
              onClick={() => setUnit('cm')}
              className={`relative z-10 w-[80px] py-2 text-sm font-bold transition-colors ${unit === 'cm' ? 'text-black' : 'text-gray-500'}`}
            >
              cm
            </button>
          </div>
        </div>

        {/*  BẢNG SIZE TRÀN VIỀN (SCROLL NGANG) */}
        <div className="relative border border-gray-200 rounded-2xl overflow-hidden mb-16 shadow-sm">
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <tbody>
                {/* Hàng Tiêu Đề Trái */}
                {[
                  { label: "US - Men's", key: "usM" },
                  { label: "US - Women's", key: "usW" },
                  { label: "UK", key: "uk" },
                  { label: "EU", key: "eu" },
                  { label: `Chiều dài chân (${unit})`, key: unit }, // Cột đổi linh hoạt theo state
                ].map((row, rowIdx) => (
                  <tr key={row.key} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    {/* Cột Đầu Tiên: Bị ghim cố định bên trái (Sticky) */}
                    <th className="p-5 font-bold text-gray-900 bg-white sticky left-0 z-10 border-r border-gray-100 min-w-[160px] shadow-[4px_0_12px_rgba(0,0,0,0.03)]">
                      {row.label}
                    </th>
                    {/* Các cột dữ liệu */}
                    {SIZE_DATA.map((data: any, colIdx) => (
                      <td key={colIdx} className="p-5 text-gray-700 font-medium text-center min-w-[80px]">
                        {data[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Cách đo chiều dài bàn chân</h2>
          <ol className="space-y-5 text-gray-700 font-medium list-decimal list-inside marker:font-black marker:text-black pl-2">
            <li className="pl-3 leading-relaxed">
              Cố định một tờ giấy xuống một mặt phẳng cứng, đảm bảo giấy không bị trượt.
            </li>
            <li className="pl-3 leading-relaxed">
              Đứng lên tờ giấy, hai chân rộng bằng vai và dồn đều trọng lượng (chỉ cần đặt một bàn chân lên giấy).
            </li>
            <li className="pl-3 leading-relaxed">
              Dùng bút hướng thẳng đứng xuống, nhờ một người bạn đánh dấu điểm dài nhất của ngón chân cái và phần ngoài cùng của gót chân.
            </li>
            <li className="pl-3 leading-relaxed">
              Bước ra khỏi giấy và dùng thước kẻ hoặc thước dây để đo khoảng cách giữa hai điểm vừa đánh dấu. Đây chính là chiều dài bàn chân của bạn.
            </li>
            <li className="pl-3 leading-relaxed">
              Lặp lại quy trình với bàn chân kia. <i>(Lưu ý: Rất bình thường nếu một bàn chân có kích thước hơi khác bàn chân còn lại).</i>
            </li>
            <li className="pl-3 leading-relaxed">
              Lấy số đo dài hơn trong hai số đo và đối chiếu với bảng kích cỡ phía trên để tìm size giày phù hợp. Nếu số đo của bạn nằm giữa hai size, chúng tôi khuyên bạn nên chọn <strong>size lớn hơn</strong>.
            </li>
          </ol>
        </div>

      </div>
    </main>
  );
}