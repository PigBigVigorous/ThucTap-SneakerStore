"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminInventoryAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";

export default function InventoryPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("history");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [transferForm, setTransferForm] = useState({
    variant_id: "",
    from_branch_id: "",
    to_branch_id: "",
    quantity: "",
    note: "",
  });

  const [adjustForm, setAdjustForm] = useState({
    variant_id: "",
    branch_id: "",
    quantity_change: "",
    note: "",
  });

  useEffect(() => {
    if (activeTab === "history" && token) {
      fetchTransactions();
    }
  }, [activeTab, token]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // 🚨 FIX LỖI TS: token || ""
      const res = await adminInventoryAPI.getTransactions(token || "");
      if (res.success) {
        setTransactions(res.data.data || []);
      } else {
        toast.error(res.message || "Lỗi khi tải dữ liệu");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
    setLoading(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 🚨 FIX LỖI TS: Ép kiểu toàn bộ Payload sang số nguyên
      const payload = {
        variant_id: Number(transferForm.variant_id),
        from_branch_id: Number(transferForm.from_branch_id),
        to_branch_id: Number(transferForm.to_branch_id),
        quantity: Number(transferForm.quantity),
        note: transferForm.note
      };

      const res = await adminInventoryAPI.transferStock(payload, token || "");
      if (res.success) {
        toast.success("Chuyển kho thành công!");
        setTransferForm({ variant_id: "", from_branch_id: "", to_branch_id: "", quantity: "", note: "" });
      } else {
        toast.error(res.message || "Lỗi khi chuyển kho");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 🚨 FIX LỖI TS: Ép kiểu toàn bộ Payload sang số nguyên
      const payload = {
        variant_id: Number(adjustForm.variant_id),
        branch_id: Number(adjustForm.branch_id),
        quantity_change: Number(adjustForm.quantity_change),
        note: adjustForm.note
      };

      const res = await adminInventoryAPI.adjustStock(payload, token || "");
      if (res.success) {
        toast.success("Điều chỉnh kho thành công!");
        setAdjustForm({ variant_id: "", branch_id: "", quantity_change: "", note: "" });
      } else {
        toast.error(res.message || "Lỗi khi điều chỉnh kho");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý Kho hàng (Omnichannel)</h1>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm transition-colors ${
              activeTab === "history" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            Lịch sử biến động
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm transition-colors ${
              activeTab === "transfer" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            Chuyển Kho (Transfer)
          </button>
          <button
            onClick={() => setActiveTab("adjust")}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm transition-colors ${
              activeTab === "adjust" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            Kiểm kê & Bù trừ
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "history" && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <p className="text-gray-500 font-medium">Đang tải lịch sử...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Loại</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Biến thể (SKU)</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tăng/Giảm</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(tx.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                tx.transaction_type === 'SALE' ? 'bg-red-100 text-red-800' :
                                tx.transaction_type === 'IMPORT' ? 'bg-green-100 text-green-800' :
                                tx.transaction_type === 'TRANSFER' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {tx.transaction_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {tx.variant?.product?.name} <br/>
                            <span className="text-gray-500 font-normal">Màu: {tx.variant?.color?.name} | Size: {tx.variant?.size?.name}</span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tx.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "transfer" && (
          <div className="bg-white shadow rounded-lg max-w-2xl border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Lệnh Chuyển Kho</h3>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Biến thể (Variant ID)</label>
                    <input type="number" value={transferForm.variant_id} onChange={(e) => setTransferForm({ ...transferForm, variant_id: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số lượng chuyển</label>
                    <input type="number" min="1" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Từ Chi Nhánh (ID)</label>
                    <input type="number" value={transferForm.from_branch_id} onChange={(e) => setTransferForm({ ...transferForm, from_branch_id: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Đến Chi Nhánh (ID)</label>
                    <input type="number" value={transferForm.to_branch_id} onChange={(e) => setTransferForm({ ...transferForm, to_branch_id: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ghi chú (Tùy chọn)</label>
                  <textarea value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" rows={3} placeholder="Ví dụ: Chuyển gấp 5 đôi AF1 cho cửa hàng Q1" />
                </div>
                <button type="submit" className="w-full bg-black text-white font-bold px-4 py-3 rounded-md hover:bg-gray-800 transition-colors shadow-lg active:scale-[0.98]">
                  Thực hiện Chuyển Kho
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "adjust" && (
          <div className="bg-white shadow rounded-lg max-w-2xl border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Lệnh Kiểm Kê / Bù Trừ (Adjust)</h3>
              <p className="text-sm text-gray-500 mb-6">Sử dụng khi phát hiện mất hàng, hỏng hóc hoặc tìm thấy hàng thất lạc. Điền số âm để trừ kho, số dương để cộng kho.</p>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Biến thể (Variant ID)</label>
                    <input type="number" value={adjustForm.variant_id} onChange={(e) => setAdjustForm({ ...adjustForm, variant_id: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chi Nhánh (ID)</label>
                    <input type="number" value={adjustForm.branch_id} onChange={(e) => setAdjustForm({ ...adjustForm, branch_id: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900">Mức thay đổi (Quantity Change)</label>
                  <input type="number" placeholder="VD: -2 (Mất hàng), 1 (Tìm thấy)" value={adjustForm.quantity_change} onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border bg-gray-50" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lý do điều chỉnh</label>
                  <textarea value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" rows={3} placeholder="VD: Chuột cắn nát 2 hộp giày, tiến hành hủy mã..." required />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold px-4 py-3 rounded-md hover:bg-red-700 transition-colors shadow-lg active:scale-[0.98]">
                  Xác nhận Bù trừ Kho
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}