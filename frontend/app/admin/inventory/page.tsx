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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

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

  useEffect(() => {
    if ((activeTab === "transfer" || activeTab === "adjust") && token) {
      fetchDropdownData();
    }
  }, [activeTab, token]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
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

  const fetchDropdownData = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      
      const branchRes = await fetch(`${baseUrl}/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const branchData = await branchRes.json();
      if (branchData.success) setBranches(branchData.data);

      const prodRes = await fetch(`${baseUrl}/admin/products?per_page=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      if (prodData.success) {
        const allVariants: any[] = [];
        prodData.data.data.forEach((p: any) => {
          p.variants?.forEach((v: any) => {
            allVariants.push({
              id: v.id,
              name: `${p.name} - Màu ${v.color?.name || 'N/A'} - Size ${v.size?.name || 'N/A'} (SKU: ${v.sku})`
            });
          });
        });
        setVariants(allVariants);
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu dropdown", error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.from_branch_id === transferForm.to_branch_id) {
      return toast.error("Kho xuất và Kho nhập không được trùng nhau!");
    }

    setIsSubmitting(true);

    try {
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
    } finally {
      setIsSubmitting(false); // 🚨 MỞ KHÓA NÚT LẠI KHI XONG
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
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
    } finally {
      setIsSubmitting(false); // 🚨 MỞ KHÓA NÚT
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
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Loại</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Biến thể (SKU)</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tăng/Giảm</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(tx.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {(() => {
                              switch (tx.transaction_type) {
                                case 'IMPORT': return <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600">NHẬP KHO</span>;
                                case 'SALE': return <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600">BÁN RA</span>;
                                case 'RETURN': return <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-600">HOÀN TRẢ</span>;
                                case 'TRANSFER': return <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-600">CHUYỂN KHO</span>;
                                case 'ADJUSTMENT': return <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600">ĐIỀU CHỈNH</span>;
                                default: return <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600">{tx.transaction_type}</span>;
                              }
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {tx.variant?.product?.name} <br/>
                            <span className="text-gray-500 font-normal">Màu: {tx.variant?.color?.name} | Size: {tx.variant?.size?.name}</span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={tx.note}>
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

        {/* TAB CHUYỂN KHO */}
        {activeTab === "transfer" && (
          <div className="bg-white shadow rounded-lg max-w-2xl border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Lệnh Chuyển Kho</h3>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700">Sản phẩm (Biến thể)</label>
                  <select 
                    value={transferForm.variant_id} 
                    onChange={(e) => setTransferForm({ ...transferForm, variant_id: e.target.value })} 
                    // 🚨 CHỮ ĐEN IN ĐẬM
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-black font-medium" required
                  >
                    <option value="" disabled className="text-gray-500">-- Chọn Biến thể Sản phẩm --</option>
                    {variants.map(v => <option key={v.id} value={v.id} className="text-black">{v.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Từ Chi Nhánh (Kho xuất)</label>
                    <select 
                      value={transferForm.from_branch_id} 
                      onChange={(e) => setTransferForm({ ...transferForm, from_branch_id: e.target.value })} 
                      // 🚨 KHO XUẤT MÀU ĐỎ ĐẬM
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-red-600 font-medium" required
                    >
                      <option value="" disabled className="text-gray-500">-- Chọn Kho Xuất --</option>
                      {branches.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Đến Chi Nhánh (Kho nhập)</label>
                    <select 
                      value={transferForm.to_branch_id} 
                      onChange={(e) => setTransferForm({ ...transferForm, to_branch_id: e.target.value })} 
                      // 🚨 KHO NHẬP MÀU XANH LÁ ĐẬM
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-green-600 font-medium" required
                    >
                      <option value="" disabled className="text-gray-500">-- Chọn Kho Nhập --</option>
                      {branches.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">Số lượng chuyển</label>
                  <input type="number" min="1" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border text-black font-medium" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ghi chú (Tùy chọn)</label>
                  <textarea value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border text-black font-medium placeholder-gray-400" rows={2} placeholder="Ví dụ: Chuyển gấp cho khách hàng V.I.P" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white font-bold px-4 py-3 rounded-md hover:bg-gray-800 transition-colors shadow-lg active:scale-[0.98] mt-2">
                  {isSubmitting ? 'Đang thực hiện...' : 'Thực hiện Chuyển Kho'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB KIỂM KÊ / BÙ TRỪ */}
        {activeTab === "adjust" && (
          <div className="bg-white shadow rounded-lg max-w-2xl border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Lệnh Kiểm Kê / Bù Trừ (Adjust)</h3>
              <p className="text-sm text-gray-500 mb-6">Sử dụng khi phát hiện mất hàng, hỏng hóc hoặc tìm thấy hàng thất lạc. Điền số âm để trừ kho, số dương để cộng kho.</p>
              <form onSubmit={handleAdjust} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-bold text-gray-700">Sản phẩm (Biến thể)</label>
                  <select 
                    value={adjustForm.variant_id} 
                    onChange={(e) => setAdjustForm({ ...adjustForm, variant_id: e.target.value })} 
                    // 🚨 CHỮ ĐEN IN ĐẬM
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-black font-medium" required
                  >
                    <option value="" disabled className="text-gray-500">-- Chọn Biến thể Sản phẩm --</option>
                    {variants.map(v => <option key={v.id} value={v.id} className="text-black">{v.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Chi Nhánh</label>
                    <select 
                      value={adjustForm.branch_id} 
                      onChange={(e) => setAdjustForm({ ...adjustForm, branch_id: e.target.value })} 
                      // 🚨 CHỮ ĐEN IN ĐẬM
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-black font-medium" required
                    >
                      <option value="" disabled className="text-gray-500">-- Chọn Chi nhánh --</option>
                      {branches.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900">Mức thay đổi</label>
                    <input type="number" placeholder="VD: -2 hoặc +1" value={adjustForm.quantity_change} onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-gray-50 text-red-600 font-medium placeholder-gray-400" required />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lý do điều chỉnh</label>
                  {/* 🚨 CHỮ ĐEN IN ĐẬM, CÒN PLACEHOLDER THÌ MÀU XÁM */}
                  <textarea value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border text-black font-medium placeholder-gray-400" rows={2} placeholder="VD: Chuột cắn nát 2 hộp giày, tiến hành hủy mã..." required />
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 text-white font-bold px-4 py-3 rounded-md hover:bg-red-700 transition-colors shadow-lg active:scale-[0.98]">
                  {isSubmitting ? 'Đang thực hiện...' : 'Xác nhận Bù trừ Kho'}
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