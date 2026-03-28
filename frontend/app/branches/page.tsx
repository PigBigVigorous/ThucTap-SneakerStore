"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Edit, Trash2, MapPin, Phone, Mail, X } from "lucide-react";

export default function BranchManagementPage() {
  const { token } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  // 1. LẤY DANH SÁCH CHI NHÁNH
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/admin/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
      } else {
        toast.error("Lỗi lấy dữ liệu chi nhánh");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBranches();
  }, [token]);

  // 2. MỞ FORM THÊM MỚI HOẶC SỬA
  const openModal = (branch: any = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || "",
        address: branch.address || "",
        phone: branch.phone || "",
        email: branch.email || ""
      });
    } else {
      setEditingBranch(null);
      setFormData({ name: "", address: "", phone: "", email: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
    setFormData({ name: "", address: "", phone: "", email: "" });
  };

  // 3. XỬ LÝ SUBMIT FORM (TẠO MỚI / CẬP NHẬT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const method = editingBranch ? "PUT" : "POST";
    const url = editingBranch 
      ? `${baseUrl}/admin/branches/${editingBranch.id}` 
      : `${baseUrl}/admin/branches`;

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(editingBranch ? "Cập nhật chi nhánh thành công!" : "Tạo chi nhánh & rải mã tồn kho thành công!");
        closeModal();
        fetchBranches(); // Tải lại danh sách
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. XÓA CHI NHÁNH
  const handleDelete = async (id: number) => {
    if (!window.confirm("CẢNH BÁO: Xóa chi nhánh sẽ xóa toàn bộ tồn kho tại chi nhánh này! Bạn có chắc chắn không?")) return;
    
    try {
      const res = await fetch(`${baseUrl}/admin/branches/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Đã xóa chi nhánh thành công!");
        fetchBranches();
      } else {
        toast.error(data.message || "Lỗi khi xóa chi nhánh");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
              Quản lý Chi Nhánh
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Hệ thống mạng lưới cửa hàng & kho vận</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-black text-white font-bold px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2 active:scale-95"
          >
            <Plus size={20} />
            Thêm Chi Nhánh Mới
          </button>
        </div>

        {/* BẢNG DANH SÁCH CHI NHÁNH */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-8 text-center font-bold text-gray-500">Đang tải dữ liệu chi nhánh...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tên Chi Nhánh</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Liên hệ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-medium">Chưa có chi nhánh nào trong hệ thống.</td>
                    </tr>
                  ) : (
                    branches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-400">#{branch.id}</td>
                        <td className="px-6 py-4">
                          <div className="text-base font-bold text-gray-900">{branch.name}</div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin size={14} /> {branch.address || "Chưa cập nhật địa chỉ"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            {branch.phone && <span className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {branch.phone}</span>}
                            {branch.email && <span className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {branch.email}</span>}
                            {!branch.phone && !branch.email && <span className="text-gray-400 italic">Chưa cập nhật</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => openModal(branch)} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-md mx-1 transition-colors" title="Sửa">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(branch.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md mx-1 transition-colors" title="Xóa">
                            <Trash2 size={18} />
                          </button>
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

      {/* MODAL THÊM / SỬA CHI NHÁNH */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-gray-900 uppercase">
                {editingBranch ? "Chỉnh sửa Chi Nhánh" : "Thêm Chi Nhánh Mới"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Chi Nhánh <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="VD: Kho Đà Nẵng, Cửa hàng Quận 1..."
                  // 🚨 CHỮ ĐEN IN ĐẬM
                  className="w-full border border-gray-300 rounded-lg p-3 text-black font-bold focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ đầy đủ <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  placeholder="VD: 123 Đường Lê Lợi..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-black font-medium focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="VD: 0909123456"
                    className="w-full border border-gray-300 rounded-lg p-3 text-black font-medium focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="VD: kho@sneaker.com"
                    className="w-full border border-gray-300 rounded-lg p-3 text-black font-medium focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`px-6 py-3 font-bold text-white rounded-lg transition-all shadow-lg flex items-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                >
                  {isSubmitting ? "Đang lưu..." : (editingBranch ? "Lưu thay đổi" : "Tạo Chi Nhánh")}
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