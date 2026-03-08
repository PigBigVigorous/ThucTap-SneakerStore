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

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    variant_id: "",
    from_branch_id: "",
    to_branch_id: "",
    quantity: "",
    note: "",
  });

  // Adjust form state
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
      const res = await adminInventoryAPI.getTransactions(token);
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
      const res = await adminInventoryAPI.transferStock(transferForm, token);
      if (res.success) {
        toast.success("Chuyển kho thành công");
        setTransferForm({ variant_id: "", from_branch_id: "", to_branch_id: "", quantity: "", note: "" });
      } else {
        toast.error(res.message || "Lỗi khi chuyển kho");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminInventoryAPI.adjustStock(adjustForm, token);
      if (res.success) {
        toast.success("Điều chỉnh kho thành công");
        setAdjustForm({ variant_id: "", branch_id: "", quantity_change: "", note: "" });
      } else {
        toast.error(res.message || "Lỗi khi điều chỉnh kho");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý Kho hàng</h1>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === "history"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Lịch sử biến động
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === "transfer"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Chuyển kho
          </button>
          <button
            onClick={() => setActiveTab("adjust")}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === "adjust"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Kiểm kê/Bù trừ
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "history" && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lịch sử biến động kho</h3>
              {loading ? (
                <p>Đang tải...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Biến thể
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thay đổi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ghi chú
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((tx: any) => (
                        <tr key={tx.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tx.transaction_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tx.variant?.product?.name} - {tx.variant?.color?.name} - {tx.variant?.size?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tx.quantity_change}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tx.note}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(tx.created_at).toLocaleDateString()}
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chuyển kho</h3>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Variant ID</label>
                  <input
                    type="number"
                    value={transferForm.variant_id}
                    onChange={(e) => setTransferForm({ ...transferForm, variant_id: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">From Branch ID</label>
                  <input
                    type="number"
                    value={transferForm.from_branch_id}
                    onChange={(e) => setTransferForm({ ...transferForm, from_branch_id: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">To Branch ID</label>
                  <input
                    type="number"
                    value={transferForm.to_branch_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_branch_id: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Note</label>
                  <textarea
                    value={transferForm.note}
                    onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Chuyển kho
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "adjust" && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Kiểm kê/Bù trừ</h3>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Variant ID</label>
                  <input
                    type="number"
                    value={adjustForm.variant_id}
                    onChange={(e) => setAdjustForm({ ...adjustForm, variant_id: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch ID</label>
                  <input
                    type="number"
                    value={adjustForm.branch_id}
                    onChange={(e) => setAdjustForm({ ...adjustForm, branch_id: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity Change</label>
                  <input
                    type="number"
                    value={adjustForm.quantity_change}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Note</label>
                  <textarea
                    value={adjustForm.note}
                    onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Điều chỉnh kho
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