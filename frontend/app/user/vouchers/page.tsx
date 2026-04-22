"use client";

import React from "react";
import { Ticket } from "lucide-react";

export default function VouchersPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="border-b border-gray-100 pb-5 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Ví Voucher</h1>
          <p className="text-sm text-gray-500 mt-1">Lưu trữ các mã giảm giá của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center py-20 col-span-full text-gray-400">
           <Ticket size={48} className="mx-auto mb-4 opacity-20" />
           <p>Kho voucher của bạn đang trống.</p>
        </div>
      </div>
    </div>
  );
}
