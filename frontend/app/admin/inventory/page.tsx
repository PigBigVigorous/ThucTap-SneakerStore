"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminInventoryAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";

export default function InventoryPage() {
  const { token } = useAuth();
  // 🚨 MẶC ĐỊNH MỞ TAB "STOCKS" ĐẦU TIÊN KHI VÀO TRANG
  const [activeTab, setActiveTab] = useState("stocks"); 
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  
  // 🚨 STATE CHO BẢNG TỒN KHO
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("");

  // 🚨 STATE CHO FORM NHẬP KHO TỔNG (MỚI THÊM)
  const [importForm, setImportForm] = useState({
    variant_id: "", branch_id: "", quantity: "", note: "",
  });

  const [transferForm, setTransferForm] = useState({
    variant_id: "", from_branch_id: "", to_branch_id: "", quantity: "", note: "",
  });

  const [adjustForm, setAdjustForm] = useState({
    variant_id: "", branch_id: "", quantity_change: "", note: "",
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    if (activeTab === "history" && token) fetchTransactions();
    if (activeTab === "stocks" && token) fetchStocks(selectedBranchFilter);
  }, [activeTab, token, selectedBranchFilter]);

  useEffect(() => {
    if ((activeTab === "import" || activeTab === "transfer" || activeTab === "adjust" || activeTab === "stocks") && token) {
      fetchDropdownData();
    }
  }, [activeTab, token]);

  // LẤY DỮ LIỆU TỒN KHO TỪ BE
  const fetchStocks = async (branchId = "") => {
    setLoading(true);
    try {
      const url = branchId 
        ? `${baseUrl}/admin/inventory/stocks?branch_id=${branchId}` 
        : `${baseUrl}/admin/inventory/stocks`;
        
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setStocks(data.data || []);
      } else {
        toast.error(data.message || "Lỗi khi tải dữ liệu tồn kho");
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminInventoryAPI.getTransactions(token || "");
      if (res.success) setTransactions(res.data.data || []);
    } catch (error) {}
    setLoading(false);
  };

  const fetchDropdownData = async () => {
    try {
      const branchRes = await fetch(`${baseUrl}/admin/branches`, { headers: { Authorization: `Bearer ${token}` } });
      const branchData = await branchRes.json();
      if (branchData.success) {
        // Fix lỗi mảng cho branch
        const branchArray = Array.isArray(branchData.data) ? branchData.data : (Array.isArray(branchData.data?.data) ? branchData.data.data : []);
        setBranches(branchArray);
      }

      const prodRes = await fetch(`${baseUrl}/admin/products?per_page=100`, { headers: { Authorization: `Bearer ${token}` } });
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
    } catch (error) { console.error(error); }
  };

  // 🚨 HÀM XỬ LÝ NHẬP KHO TỔNG (MỚI THÊM)
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        variant_id: Number(importForm.variant_id),
        branch_id: Number(importForm.branch_id),
        quantity: Math.abs(Number(importForm.quantity)),
        note: `[NHẬP LÔ HÀNG MỚI] ${importForm.note}`
      };
      
      // Chuyển hướng gọi tới endpoint /import chuyên dụng
      const res = await fetch(`${baseUrl}/admin/inventory/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Đã nhập hàng thành công vào Kho Tổng!");
        setImportForm({ variant_id: "", branch_id: "", quantity: "", note: "" });
        
        // 🔄 TỰ ĐỘNG ĐỒNG BỘ GIAO DIỆN (LIÊN KẾT REAL-TIME)
        fetchTransactions(); // 1. Cập nhật dòng lịch sử Nhập kho mới
        fetchStocks(selectedBranchFilter); // 2. Bơm lại số lượng ở Tab Tồn kho
      } else { 
        toast.error(data.message || "Lỗi khi nhập kho"); 
      }
    } catch (error) { 
      toast.error("Lỗi kết nối máy chủ"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.from_branch_id === transferForm.to_branch_id) {
      toast.error("Kho xuất và Kho nhập không được trùng nhau!");
      return;
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
        fetchTransactions();
      } else {
        toast.error(res.message || "Lỗi khi chuyển kho");
      }
    } catch (error) { toast.error("Lỗi kết nối"); } 
    finally { setIsSubmitting(false); }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(adjustForm.quantity_change) === 0) {
      toast.error("Mức thay đổi phải khác 0!");
      return;
    }
    setIsSubmitting(true);
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
        fetchTransactions();
      } else {
        toast.error(res.message || "Lỗi khi điều chỉnh kho");
      }
    } catch (error) { toast.error("Lỗi kết nối"); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý Kho hàng (Omnichannel)</h1>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("stocks")}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === "stocks" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            📊 Tồn Kho Hiện Tại
          </button>
          
          {/* 🚨 NÚT TAB NHẬP KHO (MỚI THÊM) */}
          <button 
            onClick={() => setActiveTab("import")} 
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors text-green-600 ${
              activeTab === "import" ? "bg-green-100" : "hover:bg-green-50"
            }`}
          >
            📦 Nhập Hàng Mới
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === "history" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            Lịch sử biến động
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === "transfer" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            Chuyển Kho (Transfer)
          </button>
          <button
            onClick={() => setActiveTab("adjust")}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${
              activeTab === "adjust" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black hover:bg-gray-100"
            }`}
          >
            Kiểm kê & Bù trừ
          </button>
        </div>

        {/* TAB TỒN KHO HIỆN TẠI */}
        {activeTab === "stocks" && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
              <span className="font-bold text-sm text-gray-700">Lọc theo kho:</span>
              <select 
                value={selectedBranchFilter} 
                onChange={(e) => setSelectedBranchFilter(e.target.value)} 
                className="border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border bg-white text-black font-bold text-sm min-w-[200px]"
              >
                <option value="" className="text-blue-600 font-bold">🌟 Xem Tất cả các Kho</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} {b.is_main ? '(Kho Tổng)' : ''}</option>)}
              </select>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <p className="text-gray-500 font-medium text-center py-4">Đang tải dữ liệu tồn kho...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm (SKU)</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Phân loại</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Thuộc Chi Nhánh</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Tồn Kho Hiện Tại</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stocks.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">Chưa có dữ liệu tồn kho.</td></tr>
                      ) : (
                        stocks.map((item: any) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">{item.variant?.product?.name}</div>
                              <div className="text-xs text-gray-500 mt-1 font-mono">SKU: {item.variant?.sku}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                              Màu: <span className="text-black">{item.variant?.color?.name}</span> | Size: <span className="text-black">{item.variant?.size?.name}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${item.branch?.is_main ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                {item.branch?.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-black">
                              {item.stock > 0 
                                ? <span className="text-green-600">{item.stock}</span> 
                                : <span className="text-red-500 bg-red-50 px-3 py-1 rounded-md text-sm">Hết hàng (0)</span>
                              }
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🚨 TAB NHẬP KHO TỔNG (MỚI THÊM) */}
        {activeTab === "import" && (
          <div className="bg-white shadow rounded-lg max-w-2xl border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-black text-green-700 uppercase mb-4">Nhập Hàng Từ Nhà Cung Cấp</h3>
              
              {branches.filter(b => b.is_main).length === 0 ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg font-bold border border-red-200">
                  ⚠️ Hệ thống chưa có Kho Tổng nào! Vui lòng sang mục "Chi Nhánh", tạo mới hoặc Sửa một chi nhánh và đánh dấu nó là Kho Tổng để bắt đầu nhập hàng.
                </div>
              ) : (
                <form onSubmit={handleImport} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Sản phẩm (Biến thể)</label>
                    <select value={importForm.variant_id} onChange={(e) => setImportForm({ ...importForm, variant_id: e.target.value })} className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black text-black font-bold" required>
                      <option value="" disabled>-- Chọn Sản phẩm --</option>
                      {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-purple-700">Nhập vào Kho Tổng</label>
                      <select value={importForm.branch_id} onChange={(e) => setImportForm({ ...importForm, branch_id: e.target.value })} className="mt-1 block w-full p-3 border bg-purple-50 text-purple-900 rounded-md font-bold border-purple-200 focus:ring-purple-500" required>
                        <option value="" disabled>-- Chỉ chọn được Kho Tổng --</option>
                        {branches.filter(b => b.is_main).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900">Số lượng Lô hàng</label>
                      <input type="number" min="1" placeholder="VD: 500" value={importForm.quantity} onChange={(e) => setImportForm({ ...importForm, quantity: e.target.value })} className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-green-600 font-black focus:ring-black focus:border-black" required />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nguồn gốc / Ghi chú</label>
                    <textarea value={importForm.note} onChange={(e) => setImportForm({ ...importForm, note: e.target.value })} className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm text-black font-bold focus:ring-black focus:border-black placeholder-gray-400" rows={2} placeholder="VD: Nhập lô hàng từ nhà máy sản xuất đợt 1..." required />
                  </div>
                  
                  <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold px-4 py-3 rounded-md shadow-lg transition-colors ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-[0.98]'}`}>
                    {isSubmitting ? "Đang xử lý..." : "📥 XÁC NHẬN NHẬP KHO TỔNG"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab Lịch sử (GIỮ NGUYÊN BẢN CỦA NGÀI) */}
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

        {/* TAB CHUYỂN KHO (GIỮ NGUYÊN BẢN CỦA NGÀI) */}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-black font-bold" required
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
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-red-600 font-bold" required
                    >
                      <option value="" disabled className="text-gray-500">-- Chọn Kho Xuất --</option>
                      {branches.map(b => <option key={b.id} value={b.id} className="text-black">{b.name} {b.is_main ? '(Kho Tổng)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Đến Chi Nhánh (Kho nhập)</label>
                    <select 
                      value={transferForm.to_branch_id} 
                      onChange={(e) => setTransferForm({ ...transferForm, to_branch_id: e.target.value })} 
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-green-600 font-bold" required
                    >
                      <option value="" disabled className="text-gray-500">-- Chọn Kho Nhập --</option>
                      {branches.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">Số lượng chuyển</label>
                  <input type="number" min="1" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border text-black font-bold" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ghi chú (Tùy chọn)</label>
                  <textarea value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border text-black font-bold placeholder-gray-400" rows={2} placeholder="Ví dụ: Chuyển gấp cho khách hàng V.I.P" />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full text-white font-bold px-4 py-3 rounded-md transition-colors shadow-lg mt-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 active:scale-[0.98]'}`}
                >
                  {isSubmitting ? "Đang xử lý..." : "Thực hiện Chuyển Kho"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB KIỂM KÊ / BÙ TRỪ (GIỮ NGUYÊN BẢN CỦA NGÀI) */}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-black font-bold" required
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
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-white text-black font-bold" required
                    >
                      <option value="" disabled className="text-gray-500">-- Chọn Chi nhánh --</option>
                      {branches.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900">Mức thay đổi</label>
                    <input type="number" placeholder="VD: -2 hoặc +1" value={adjustForm.quantity_change} onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border bg-gray-50 text-red-600 font-bold placeholder-gray-400" required />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lý do điều chỉnh</label>
                  <textarea value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-3 border text-black font-bold placeholder-gray-400" rows={2} placeholder="VD: Chuột cắn nát 2 hộp giày, tiến hành hủy mã..." required />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full text-white font-bold px-4 py-3 rounded-md transition-colors shadow-lg ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'}`}
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận Bù trừ Kho"}
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