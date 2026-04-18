"use client";

import { useState, useEffect } from "react";
import { adminStaffAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  Users, UserPlus, Shield, Lock, Unlock,
  Trash2, Mail, RefreshCw, Search, X, Check
} from "lucide-react";

export default function AdminStaffPage() {
  const { token, user: currentUser, hasPermission } = useAuth();

  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier"
  });

  const canManage = hasPermission("manage-users");

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        adminStaffAPI.getAll(token),
        adminStaffAPI.getRoles(token)
      ]);

      if (staffRes.success) setStaff(staffRes.data || []);
      if (rolesRes.success) setRoles(rolesRes.data || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleToggleStatus = async (id: number) => {
    if (!token || !canManage) return;
    try {
      const res = await adminStaffAPI.toggleStatus(id, token);
      if (res.success) {
        toast.success(res.message);
        setStaff(staff.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi thao tác!");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !canManage) return;
    if (!window.confirm("⚠️ Bạn có chắc muốn xóa nhân viên này? Thao tác này không thể hoàn tác.")) return;

    try {
      const res = await adminStaffAPI.delete(id, token);
      if (res.success) {
        toast.success(res.message);
        setStaff(staff.filter(u => u.id !== id));
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa nhân viên!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canManage) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await adminStaffAPI.update(editingId, formData, token);
        if (res.success) {
          toast.success(res.message);
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await adminStaffAPI.create(formData, token);
        if (res.success) {
          toast.success(res.message);
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu thông tin!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", password: "", role: "cashier" });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Để trống password khi sửa
      role: user.roles?.[0]?.name || "cashier"
    });
    setIsModalOpen(true);
  };

  const filteredStaff = staff.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.roles?.[0]?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="text-red-500" /> Quản lý Nhân sự
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">Quản lý đội ngũ vận hành và phân quyền hệ thống</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl
                       text-[13px] font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl
                         text-[13px] font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
            >
              <UserPlus size={16} /> Thêm nhân viên
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, email, chức vụ..."
              className="w-full pl-9 pr-4 py-2 text-[13px] text-gray-900 border border-gray-200 rounded-xl outline-none
                         focus:border-red-400 transition-colors bg-white font-medium"
            />
          </div>
          <div className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
            {filteredStaff.length} nhân sự
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 font-semibold animate-pulse">
            Đang tải dữ liệu nhân sự...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-4">
            <Users size={48} className="opacity-20" />
            <p className="font-bold">Không tìm thấy nhân viên nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-widest text-gray-400 font-black">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Chức vụ</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStaff.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-black text-white
                          ${u.is_active ? "bg-gradient-to-br from-gray-700 to-gray-900" : "bg-gray-300"}`}>
                          {u.name[0]}
                        </div>
                        <div>
                          <p className={`text-[14px] font-bold ${u.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
                            {u.name} {u.id === currentUser?.id && <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase">Bạn</span>}
                          </p>
                          <p className="text-[12px] text-gray-400 flex items-center gap-1"><Mail size={12} /> {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700">
                        <Shield size={14} className="text-red-500" />
                        {u.roles?.[0]?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-green-100 text-green-700">
                          <Check size={10} /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-red-100 text-red-700">
                          <Lock size={10} /> Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canManage && u.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all"
                              title="Chỉnh sửa"
                            >
                              <Search size={16} /> {/* Thay bằng icon Edit nếu có */}
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className={`p-2 rounded-lg transition-all ${u.is_active ? "text-amber-500 hover:bg-amber-50" : "text-green-500 hover:bg-green-50"
                                }`}
                              title={u.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            >
                              {u.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        {!canManage && <span className="text-[12px] text-gray-300 font-bold italic">Chỉ xem</span>}
                        {u.id === currentUser?.id && <span className="text-[12px] text-gray-300 font-bold italic">Tài khoản hiện tại</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-[18px] font-black text-gray-900 uppercase tracking-tight">
                {editingId ? "Cập nhật nhân sự" : "Thêm nhân viên mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider ml-1">Họ và tên</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-red-400 transition-all font-medium text-[14px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider ml-1">Email đăng nhập</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@sneaker.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-red-400 transition-all font-medium text-[14px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider ml-1">
                  Mật khẩu {editingId && <span className="text-[10px] lowercase font-normal italic">(Để trống nếu không đổi)</span>}
                </label>
                <input
                  required={!editingId}
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-red-400 transition-all font-medium text-[14px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black text-gray-400 uppercase tracking-wider ml-1">Chức vụ (Role)</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-red-400 transition-all font-bold text-[14px] appearance-none"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : (editingId ? "Cập nhật" : "Tạo tài khoản")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
