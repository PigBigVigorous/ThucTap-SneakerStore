"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Edit, Trash2, MapPin, Phone, Mail, X } from "lucide-react";

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

        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Chi Nhánh</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Array.isArray(branches) && branches.length > 0 ? branches.map((branch) => (
                <tr key={branch.id}>
                  <td className="px-6 py-4">
                    <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                      {branch.name}
                      {/* 🚨 HUY HIỆU PHÂN BIỆT KHO TỔNG & KHO NHỎ */}
                      {branch.is_main ? (
                        <span className="px-2 py-1 text-[10px] font-black uppercase bg-purple-100 text-purple-700 rounded-md shadow-sm">Kho Tổng</span>
                      ) : (
                        <span className="px-2 py-1 text-[10px] font-black uppercase bg-gray-100 text-gray-600 rounded-md">Chi Nhánh</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1"><MapPin size={14} /> {branch.address}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openModal(branch)} className="text-blue-600 bg-blue-50 p-2 rounded-md mx-1"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(branch.id)} className="text-red-600 bg-red-50 p-2 rounded-md mx-1"><Trash2 size={18} /></button>
                  </td>
                </tr>
              )) : <tr><td colSpan={2} className="text-center py-8">Chưa có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-black uppercase mb-4">{editingBranch ? "Sửa" : "Thêm"} Chi Nhánh</h2>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Tên chi nhánh..." className="w-full border p-3 rounded text-black font-bold" required />
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Địa chỉ..." className="w-full border p-3 rounded text-black font-medium" required />

              {/* 🚨 CHECKBOX KHO TỔNG CỰC ĐẸP */}
              <div className="pt-2 border-t border-gray-100 mt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">
                  <input type="checkbox" checked={formData.is_main} onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                  <div>
                    <span className="text-sm font-black text-purple-900 uppercase">🌟 Đánh dấu là KHO TỔNG</span>
                    <p className="text-xs text-purple-700 font-medium mt-0.5">Kho tổng được phép nhận hàng trực tiếp từ Xưởng/NCC.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-3 font-bold bg-gray-100 rounded">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 font-bold text-white bg-blue-600 rounded">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}