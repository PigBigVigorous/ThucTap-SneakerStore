"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminInventoryAPI, adminBranchAPI, adminBrandAPI, adminProductAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { Search } from "lucide-react";

export default function InventoryPage() {
  const { token } = useAuth();
  // 🚨 MẶC ĐỊNH MỞ TAB "STOCKS" ĐẦU TIÊN KHI VÀO TRANG
  const [activeTab, setActiveTab] = useState("stocks");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [branches, setBranches] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  // 🚨 STATE CHO BẢNG TỒN KHO
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("");

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
    if (token) {
      const timer = setTimeout(() => {
        if (activeTab === "history") fetchTransactions();
        if (activeTab === "stocks") fetchStocks(selectedBranchFilter);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, token, selectedBranchFilter, selectedBrandFilter, searchTerm]);

  useEffect(() => {
    if ((activeTab === "import" || activeTab === "transfer" || activeTab === "adjust" || activeTab === "stocks") && token) {
      fetchDropdownData();
    }
  }, [activeTab, token]);

  // LẤY DỮ LIỆU TỒN KHO TỪ BE
  const fetchStocks = async (branchId = "") => {
    setLoading(true);
    try {
      const res = await adminInventoryAPI.getStocks(token || "", branchId, searchTerm, selectedBrandFilter);
      if (res.success) {
        setStocks(res.data || []);
      } else {
        toast.error(res.message || "Lỗi khi tải dữ liệu tồn kho");
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
      const res = await adminInventoryAPI.getTransactions(token || "", searchTerm, selectedBrandFilter);
      if (res.success) setTransactions(res.data.data || []);
    } catch (error) { }
    setLoading(false);
  };

  const fetchDropdownData = async () => {
    try {
      const branchData = await adminBranchAPI.getAll(token || "");
      if (branchData.success) {
        const branchArray = Array.isArray(branchData.data) ? branchData.data : (Array.isArray(branchData.data?.data) ? branchData.data.data : []);
        setBranches(branchArray);
      }

      const brandData = await adminBrandAPI.getAll(token || "");
      if (brandData.success) {
        setBrands(brandData.data || []);
      }

      const prodData = await adminProductAPI.getAll(token || "", { per_page: 100 });
      if (prodData.success) {
        const allVariants: any[] = [];
        const products = prodData.data?.data || prodData.data || [];
        products.forEach((p: any) => {
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

      const res = await adminInventoryAPI.importStock(payload, token || "");
      const data = res;

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Kho hàng</h1>

          {(activeTab === "stocks" || activeTab === "history") && (
            <div className="relative group w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
              <input
                type="text"
                placeholder="Tìm sản phẩm, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-black focus:border-transparent outline-none shadow-sm group-hover:border-gray-300 transition-all font-medium text-gray-900"
              />
            </div>
          )}
        </div>

        {/* Filter Bar - Visible for Stocks and History */}
        {(activeTab === "stocks" || activeTab === "history") && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-wrap items-center gap-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-gray-700">Lọc theo kho:</span>
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border bg-gray-50 hover:bg-white text-black font-bold text-sm min-w-[200px] transition-colors"
              >
                <option value="" className="text-blue-600 font-bold">🌟 Xem Tất cả các Kho</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} {b.is_main ? '(Kho Tổng)' : ''}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-gray-700">Thương hiệu:</span>
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border bg-gray-50 hover:bg-white text-black font-bold text-sm min-w-[180px] transition-colors"
              >
                <option value="">-- Tất cả thương hiệu --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Tabs - Dạng Segmented Controls Hiện Đại */}
        <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          {[
            { id: "stocks", icon: "📊", label: "Tồn Kho Hiện Tại" },
            { id: "import", icon: "📦", label: "Nhập Hàng Mới", color: "text-green-700", activeBg: "bg-green-100/80" },
            { id: "history", icon: "🕒", label: "Lịch Sử Giao Dịch" },
            { id: "transfer", icon: "🚚", label: "Chuyển Kho" },
            { id: "adjust", icon: "⚖️", label: "Kiểm Kê / Bù Trừ" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === tab.id
                  ? `${tab.activeBg || "bg-white text-gray-900"} shadow-sm border border-gray-200/50 ${tab.color || ""}`
                  : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                }`}
            >
              <span className="text-lg">{tab.icon}</span> <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB TỒN KHO HIỆN TẠI */}
        {activeTab === "stocks" && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
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
                          <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-xl">👟</span>
                                </div>
                                <div>
                                  <div className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{item.variant?.product?.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5 font-mono bg-gray-100 inline-block px-1.5 py-0.5 rounded">SKU: {item.variant?.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <span className="w-4 h-4 rounded-full shadow-inner border border-gray-200 block" style={{ backgroundColor: item.variant?.color?.name === 'Đen' ? '#000' : item.variant?.color?.name === 'Trắng' ? '#fff' : '#ccc' }}></span>
                                  <span className="font-bold text-gray-700">{item.variant?.color?.name}</span>
                                </div>
                                <div className="text-xs font-bold text-gray-500 border border-gray-200 bg-gray-50 rounded px-2 py-0.5 inline-block w-fit">Size {item.variant?.size?.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.branch?.is_main ? (
                                <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-black uppercase rounded-lg bg-gradient-to-r from-purple-100 to-indigo-50 text-purple-700 border border-purple-200 shadow-sm">
                                  🌟 {item.branch?.name}
                                </span>
                              ) : (
                                <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-black uppercase rounded-lg bg-gray-50 text-gray-600 border border-gray-200">
                                  🏬 {item.branch?.name}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {item.stock > 10 ? (
                                <div className="inline-flex flex-col items-end">
                                  <span className="text-2xl font-black text-green-600 tracking-tight">{item.stock}</span>
                                  <span className="text-[10px] uppercase font-bold text-green-500 tracking-wider">Còn hàng</span>
                                </div>
                              ) : item.stock > 0 ? (
                                <div className="inline-flex flex-col items-end">
                                  <span className="text-2xl font-black text-amber-500 tracking-tight">{item.stock}</span>
                                  <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Sắp hết</span>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-end">
                                  <span className="text-2xl font-black text-red-500 tracking-tight">0</span>
                                  <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-2 mt-1 rounded tracking-wider">Hết hàng</span>
                                </div>
                              )}
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
          <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl max-w-2xl border border-gray-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-5">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="text-2xl drop-shadow-md">📥</span> Nhập Hàng Từ Nhà Cung Cấp
              </h3>
              <p className="text-green-50 mt-1 font-medium text-sm">Bổ sung số lượng vào Kho Tổng để sẵn sàng phân phối</p>
            </div>
            <div className="px-6 py-6 sm:p-8">
              {branches.filter(b => b.is_main).length === 0 ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-xl font-bold border border-red-200 shadow-inner flex flex-col items-center text-center gap-3">
                  <span className="text-3xl">⚠️</span>
                  <span>Hệ thống chưa có Kho Tổng nào! Vui lòng sang mục "Chi Nhánh", tạo mới hoặc Sửa một chi nhánh và đánh dấu nó là Kho Tổng để bắt đầu nhập hàng.</span>
                </div>
              ) : (
                <form onSubmit={handleImport} className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-2">Sản phẩm (Biến thể) <span className="text-red-500">*</span></label>
                    <select value={importForm.variant_id} onChange={(e) => setImportForm({ ...importForm, variant_id: e.target.value })} className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 text-gray-900 font-bold bg-gray-50 hover:bg-white transition-colors" required>
                      <option value="" disabled>-- Chọn Sản phẩm --</option>
                      {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-black text-purple-700 mb-2">Nhập vào Kho Tổng <span className="text-red-500">*</span></label>
                      <select value={importForm.branch_id} onChange={(e) => setImportForm({ ...importForm, branch_id: e.target.value })} className="block w-full p-3.5 border-2 bg-purple-50 text-purple-900 rounded-xl font-bold border-purple-200 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-colors" required>
                        <option value="" disabled>-- Chỉ chọn được Kho Tổng --</option>
                        {branches.filter(b => b.is_main).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-black text-gray-900 mb-2">Số lượng Lô hàng <span className="text-red-500">*</span></label>
                      <input type="number" min="1" placeholder="VD: 500" value={importForm.quantity} onChange={(e) => setImportForm({ ...importForm, quantity: e.target.value })} className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm bg-gray-50 text-green-700 font-black text-lg focus:ring-green-500 focus:border-green-500 hover:bg-white transition-colors" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-2">Nguồn gốc / Ghi chú</label>
                    <textarea value={importForm.note} onChange={(e) => setImportForm({ ...importForm, note: e.target.value })} className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm text-gray-900 font-medium focus:ring-green-500 focus:border-green-500 placeholder-gray-400 bg-gray-50 hover:bg-white transition-colors" rows={2} placeholder="VD: Nhập lô hàng từ nhà máy trung quốc đợt 1..." required />
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={isSubmitting} className={`w-full text-white font-black text-lg px-4 py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0'}`}>
                      {isSubmitting ? <><span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5"></span> Đang xử lý...</> : "📤 XÁC NHẬN NHẬP KHO TỔNG"}
                    </button>
                  </div>
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
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                            {new Date(tx.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              switch (tx.transaction_type) {
                                case 'IMPORT': return <span className="px-2.5 py-1 rounded border border-blue-200 text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 shadow-sm">📥 Nhập Kho</span>;
                                case 'SALE': return <span className="px-2.5 py-1 rounded border border-red-200 text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 shadow-sm">🛍️ Bán Ra</span>;
                                case 'RETURN': return <span className="px-2.5 py-1 rounded border border-green-200 text-xs font-black uppercase tracking-wider bg-green-50 text-green-700 shadow-sm">♻️ Khách Trả</span>;
                                case 'TRANSFER': return <span className="px-2.5 py-1 rounded border border-purple-200 text-xs font-black uppercase tracking-wider bg-purple-50 text-purple-700 shadow-sm">🚚 Chuyển Kho</span>;
                                case 'ADJUSTMENT': return <span className="px-2.5 py-1 rounded border border-amber-200 text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 shadow-sm">⚖️ Điều Chỉnh</span>;
                                default: return <span className="px-2.5 py-1 rounded border border-gray-200 text-xs font-black uppercase tracking-wider bg-gray-100 text-gray-600 shadow-sm">{tx.transaction_type}</span>;
                              }
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-l border-gray-100">
                            {tx.variant?.product?.name}
                            <div className="text-xs text-gray-500 font-medium mt-0.5 opacity-80">Màu: <span className="text-gray-800">{tx.variant?.color?.name}</span> | Size: <span className="text-gray-800">{tx.variant?.size?.name}</span></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg text-sm font-black border ${tx.quantity_change > 0 ? 'bg-green-50 text-green-700 border-green-200/60' : 'bg-red-50 text-red-700 border-red-200/60'
                              }`}>
                              {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium max-w-sm" title={tx.note}>
                            <div className="line-clamp-2">{tx.note}</div>
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
          <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl max-w-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="text-2xl drop-shadow-md">🚚</span> Lệnh Chuyển Kho Nội Bộ
              </h3>
              <p className="text-gray-300 mt-1 font-medium text-sm">Điều phối hàng hóa giữa các chi nhánh hoặc từ Kho Tổng</p>
            </div>
            <div className="px-6 py-6 sm:p-8">
              <form onSubmit={handleTransfer} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Sản phẩm (Biến thể) <span className="text-red-500">*</span></label>
                  <select
                    value={transferForm.variant_id}
                    onChange={(e) => setTransferForm({ ...transferForm, variant_id: e.target.value })}
                    className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-black focus:border-black bg-gray-50 hover:bg-white text-gray-900 font-bold transition-colors" required
                  >
                    <option value="" disabled>-- Chọn Biến thể Sản phẩm --</option>
                    {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6 relative">
                  {/* Arrow connector */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-3 z-10 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm text-gray-400">
                    ➡️
                  </div>
                  <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
                    <label className="block text-sm font-black text-red-700 mb-2">Kho Xuất (Tự động trừ hàng)</label>
                    <select
                      value={transferForm.from_branch_id}
                      onChange={(e) => setTransferForm({ ...transferForm, from_branch_id: e.target.value })}
                      className="block w-full p-3 border-2 border-red-200 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white text-red-900 font-bold shadow-sm" required
                    >
                      <option value="" disabled>-- Chọn Kho Xuất --</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name} {b.is_main ? '(Kho Tổng)' : ''}</option>)}
                    </select>
                  </div>
                  <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl">
                    <label className="block text-sm font-black text-green-700 mb-2">Kho Nhập (Tự động cộng hàng)</label>
                    <select
                      value={transferForm.to_branch_id}
                      onChange={(e) => setTransferForm({ ...transferForm, to_branch_id: e.target.value })}
                      className="block w-full p-3 border-2 border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 bg-white text-green-900 font-bold shadow-sm" required
                    >
                      <option value="" disabled>-- Chọn Kho Nhập --</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Số lượng chuyển <span className="text-red-500">*</span></label>
                  <input type="number" min="1" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-black focus:border-black text-center text-2xl font-black text-blue-600 bg-gray-50 hover:bg-white transition-colors" required />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Ghi chú vận chuyển</label>
                  <textarea value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })} className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-black focus:border-black text-gray-900 font-medium placeholder-gray-400 bg-gray-50 hover:bg-white transition-colors" rows={2} placeholder="Ví dụ: Chuyển bằng xe tải biển số 29A, gửi cho khách quen..." />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white font-black text-lg px-4 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0'}`}
                  >
                    {isSubmitting ? <><span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5"></span> Đang đẩy lệnh...</> : "🚀 THỰC HIỆN CHUYỂN KHO"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB KIỂM KÊ / BÙ TRỪ */}
        {activeTab === "adjust" && (
          <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl max-w-2xl border border-gray-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-5">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="text-2xl drop-shadow-md">⚖️</span> Lệnh Kiểm Kê / Bù Trừ
              </h3>
              <p className="text-orange-50 mt-1 font-medium text-sm">Cập nhật sai số hàng hóa thực tế và trên phần mềm</p>
            </div>
            <div className="px-6 py-6 sm:p-8">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 flex gap-3 shadow-inner">
                <span className="text-xl mt-0.5">💡</span>
                <p className="text-sm font-medium leading-relaxed">Sử dụng tính năng này khi phát hiện mất mát, hỏng hóc hoặc hàng tồn dư không khớp. Sử dụng <strong>cộng (+)</strong> khi thấy dư và <strong>trừ (-)</strong> khi thấy thiếu.</p>
              </div>

              <form onSubmit={handleAdjust} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Sản phẩm (Biến thể) <span className="text-red-500">*</span></label>
                  <select
                    value={adjustForm.variant_id}
                    onChange={(e) => setAdjustForm({ ...adjustForm, variant_id: e.target.value })}
                    className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 bg-gray-50 hover:bg-white text-gray-900 font-bold transition-colors" required
                  >
                    <option value="" disabled>-- Chọn Biến thể Sản phẩm --</option>
                    {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-2">Chi Nhánh <span className="text-red-500">*</span></label>
                    <select
                      value={adjustForm.branch_id}
                      onChange={(e) => setAdjustForm({ ...adjustForm, branch_id: e.target.value })}
                      className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 bg-gray-50 hover:bg-white text-gray-900 font-bold transition-colors" required
                    >
                      <option value="" disabled>-- Chọn Chi nhánh --</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-2">Số lượng thay đổi <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center mb-0.5 pointer-events-none">
                        <span className="text-gray-400 font-bold text-lg">±</span>
                      </div>
                      <input
                        type="number"
                        placeholder="Vd: -2 hoặc 5"
                        value={adjustForm.quantity_change}
                        onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })}
                        className="block w-full pl-9 p-3.5 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 bg-white text-lg text-amber-700 font-black placeholder-gray-400 transition-colors" required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-900 mb-2">Lý do điều chỉnh (Bắt buộc) <span className="text-red-500">*</span></label>
                  <textarea
                    value={adjustForm.note}
                    onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                    className="block w-full p-3.5 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 text-gray-900 font-medium placeholder-gray-400 bg-gray-50 hover:bg-white transition-colors"
                    rows={2}
                    placeholder="VD: Kiểm kho cuối tháng phát hiện 1 đôi bị rách hộp, xuất bỏ..."
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white font-black text-lg px-4 py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0'}`}
                  >
                    {isSubmitting ? <><span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5"></span> Đang lưu sổ sách...</> : "📋 LƯU BIÊN BẢN KIỂM KÊ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}