"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Edit, Trash2, MapPin, Phone, Mail, X, Store } from "lucide-react";

export default function BranchManagementPage() {
  const { token } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "", address: "", phone: "", email: "", is_main: false // 🚨 Thêm is_main
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/admin/branches`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setBranches(Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.data) ? data.data.data : []));
      }
    } catch (error) { } finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchBranches(); }, [token]);

  const openModal = (branch: any = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || "", address: branch.address || "",
        phone: branch.phone || "", email: branch.email || "",
        is_main: branch.is_main ? true : false // 🚨 Load dữ liệu cũ
      });
    } else {
      setEditingBranch(null);
      setFormData({ name: "", address: "", phone: "", email: "", is_main: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingBranch(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const method = editingBranch ? "PUT" : "POST";
    const url = editingBranch ? `${baseUrl}/admin/branches/${editingBranch.id}` : `${baseUrl}/admin/branches`;

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingBranch ? "Cập nhật thành công!" : "Tạo chi nhánh thành công!");
        closeModal(); fetchBranches();
      } else { toast.error(data.message || "Có lỗi xảy ra"); }
    } catch (error) { toast.error("Lỗi kết nối"); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("CẢNH BÁO: Rủi ro liên quan đến tài sản! Bạn có chắc chắn muốn xóa?")) return;
    try {
      const res = await fetch(`${baseUrl}/admin/branches/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã xóa!");
        fetchBranches();
      } else {
        // 🚨 Hiển thị Toast thông báo lỗi nếu backend báo thất bại (kể cả lỗi kế toán hay phân quyền)
        toast.error(data.message || "Không thể xóa chi nhánh này!");
      }
    } catch (error) { toast.error("Lỗi mạng"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase">Quản lý Chi Nhánh</h1>
          </div>
          <button onClick={() => openModal()} className="bg-black text-white font-bold px-5 py-3 rounded-lg flex items-center gap-2">
            <Plus size={20} /> Thêm Mới
          </button>
        </div>

        {/* Thay thế Table khô khan bằng Grid Card hiện đại */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(branches) && branches.length > 0 ? branches.map((branch) => (
              <div 
                key={branch.id} 
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col group"
              >
                {/* Header Thẻ */}
                <div className="p-6 pb-4 border-b border-gray-100 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black text-gray-900 leading-tight pr-8">{branch.name}</h3>
                    {branch.is_main ? (
                      <div className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-sm" title="Kho Tổng">
                        <Store size={18} className="fill-current" />
                      </div>
                    ) : (
                      <div className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500" title="Chi Nhánh">
                        <Store size={18} />
                      </div>
                    )}
                  </div>
                  
                  {branch.is_main && (
                    <span className="inline-block px-3 py-1 text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-md mb-2 shadow-sm">
                      🌟 Kho Tổng Bán Buôn
                    </span>
                  )}
                </div>

                {/* Body Thẻ */}
                <div className="p-6 pt-4 flex-grow space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="font-medium leading-relaxed">{branch.address || "Chưa cập nhật địa chỉ"}</span>
                  </div>
                  {(branch.phone || branch.email) && (
                    <div className="pt-2 border-t border-gray-50 flex flex-col gap-2 mt-2">
                      {branch.phone && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{branch.phone}</span>
                        </div>
                      )}
                      {branch.email && (
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{branch.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Thẻ - Thao tác */}
                <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => openModal(branch)} 
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Edit size={16} /> Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(branch.id)} 
                    className="flex items-center gap-2 text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                <Store size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Chưa có chi nhánh nào</h3>
                <p className="text-gray-500 mt-1">Hãy thêm chi nhánh đầu tiên của bạn để bắt đầu hệ thống Omni-channel.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 animate-[fadeIn_0.2s_ease-out]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                {editingBranch ? "Chỉnh sửa Chi Nhánh" : "Thêm Chi Nhánh Mới"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500 transition-colors bg-white p-1 rounded-full shadow-sm border border-gray-100 hover:bg-red-50">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Chi Nhánh <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="Ví dụ: Sneaker Store HCM 1" 
                  className="w-full border-gray-300 rounded-lg focus:ring-black focus:border-black p-3 border font-medium text-black bg-gray-50 focus:bg-white transition-colors" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  placeholder="Số nhà, Đường, Quận, Thành phố..." 
                  className="w-full border-gray-300 rounded-lg focus:ring-black focus:border-black p-3 border font-medium text-black bg-gray-50 focus:bg-white transition-colors" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    placeholder="Hotline cửa hàng" 
                    className="w-full border-gray-300 rounded-lg focus:ring-black focus:border-black p-3 border text-black font-medium bg-gray-50 focus:bg-white transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email liên hệ</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="Email cửa hàng" 
                    className="w-full border-gray-300 rounded-lg focus:ring-black focus:border-black p-3 border text-black font-medium bg-gray-50 focus:bg-white transition-colors" 
                  />
                </div>
              </div>

              {/* 🚨 CHECKBOX KHO TỔNG CỰC ĐẸP ĐÃ ĐƯỢC LÀM LẠI */}
              <div className="pt-2 border-t border-gray-100 flex items-center">
                <label className={`w-full relative flex items-center justify-between cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                  formData.is_main ? 'bg-purple-50 flex border-purple-400 shadow-md ring-4 ring-purple-100' : 'bg-gray-50 border-transparent hover:bg-purple-50/50'
                }`}>
                  <div className="flex-1 pr-4">
                    <span className={`block text-sm font-black uppercase mb-1 ${formData.is_main ? 'text-purple-700' : 'text-gray-700'}`}>
                      🌟 Thiết lập làm Kho Tổng
                    </span>
                    <p className={`text-xs font-medium leading-relaxed ${formData.is_main ? 'text-purple-600/80' : 'text-gray-500'}`}>
                      Kho tổng có quyền năng đặc biệt: Nhận hàng hóa trực tiếp từ số lượng lớn của xưởng sản xuất hoặc NCC.
                    </p>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={formData.is_main} 
                      onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })} 
                      className="sr-only" 
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${formData.is_main ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 shadow-sm ${formData.is_main ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-6 py-3 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Hủy Bỏ</button>
                <button type="submit" disabled={isSubmitting} className={`px-8 py-3 font-bold text-white rounded-xl shadow-lg transition-all ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:-translate-y-0.5'
                }`}>
                  {isSubmitting ? "Đang xử lý..." : "Lưu Thông Tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}