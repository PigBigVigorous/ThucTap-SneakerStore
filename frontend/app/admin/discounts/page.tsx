"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminDiscountAPI, Discount } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { Ticket, Plus, Trash2, Edit2, X, Check, Save } from "lucide-react";

type FormState = Omit<Discount, "id" | "used_count">;

const emptyForm: FormState = {
  code: "",
  type: "percent",
  value: 0,
  min_order_value: null,
  max_discount_value: null,
  usage_limit: null,
  start_date: "",
  expiration_date: "",
  is_active: true,
};

export default function DiscountsPage() {
  const { token } = useAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form thêm mới
  const [form, setForm] = useState<FormState>(emptyForm);

  // Form sửa (Chỉnh sửa hiển thị dưới dạng Row mờ hoặc Modal)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const fetchDiscounts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminDiscountAPI.getAll(token);
      if (res.success) setDiscounts(res.data || []);
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchDiscounts();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !token) return;
    setIsSubmitting(true);
    try {
      // Validate
      if (form.value <= 0) {
        toast.error("Giá trị giảm phải lớn hơn 0");
        setIsSubmitting(false);
        return;
      }
      if (form.type === 'percent' && form.value > 100) {
        toast.error("Giá trị phần trăm không được vượt quá 100%");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...form,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        expiration_date: form.expiration_date ? new Date(form.expiration_date).toISOString() : null,
        min_order_value: form.min_order_value ? Number(form.min_order_value) : null,
        max_discount_value: form.max_discount_value ? Number(form.max_discount_value) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      };

      const res = await adminDiscountAPI.create(payload as any, token);
      if (res.success) {
        toast.success(`Đã tạo mã "${res.data.code}"!`);
        setForm(emptyForm);
        fetchDiscounts();
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi kết nối!");
    }
    setIsSubmitting(false);
  };

  const startEdit = (discount: Discount) => {
    setEditingId(discount.id);
    setEditForm({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      min_order_value: discount.min_order_value,
      max_discount_value: discount.max_discount_value,
      usage_limit: discount.usage_limit,
      start_date: discount.start_date ? new Date(discount.start_date).toISOString().slice(0, 16) : "",
      expiration_date: discount.expiration_date ? new Date(discount.expiration_date).toISOString().slice(0, 16) : "",
      is_active: discount.is_active,
    });
  };

  const handleUpdate = async (id: number) => {
    if (!editForm.code.trim() || !token) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...editForm,
        start_date: editForm.start_date ? new Date(editForm.start_date).toISOString() : null,
        expiration_date: editForm.expiration_date ? new Date(editForm.expiration_date).toISOString() : null,
      };
      const res = await adminDiscountAPI.update(id, payload as any, token);
      if (res.success) {
        toast.success("Đã cập nhật mã giảm giá!");
        setEditingId(null);
        fetchDiscounts();
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn voucher "${code}"?`)) return;
    if (!token) return;
    try {
      const res = await adminDiscountAPI.delete(id, token);
      if (res.success) {
        toast.success("Đã xóa mã giảm giá!");
        fetchDiscounts();
      } else {
        toast.error(res.message || "Lỗi xóa!");
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
  };

  const formatMoney = (amount: number | null | undefined) => {
    if (!amount) return "";
    return amount.toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-black text-gray-900 uppercase flex items-center gap-3">
            <Ticket size={32} className="text-indigo-600" /> Quản lý Mã Giảm Giá
          </h1>
          <p className="text-sm text-gray-400 font-medium tracking-wide">
            Tạo voucher thu hút khách hàng
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* === FORM THÊM MỚI === */}
          <div className="xl:col-span-4">
            <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 p-6 sticky top-24 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Plus size={22} className="text-indigo-500 bg-indigo-50 p-1rounded-lg" /> 
                Phát Hành Voucher Mới
              </h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                  {/* Mã định danh */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Mã Voucher <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="VD: WELCOME2026"
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 font-mono font-bold text-indigo-700 tracking-wider focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Loại mã */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Loại giảm
                      </label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="percent">Giảm %</option>
                        <option value="fixed">Giảm tiền mặt (đ)</option>
                      </select>
                    </div>

                    {/* Giá trị giảm */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Mức giảm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={form.value || ''}
                        onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                        placeholder={form.type === 'percent' ? "VD: 10" : "VD: 50000"}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                  {/* Điều kiện */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Đơn tối thiểu (đ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.min_order_value || ''}
                        onChange={(e) => setForm({ ...form, min_order_value: e.target.value ? Number(e.target.value) : null })}
                        placeholder="VD: 500000"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Giảm Tối Đa (đ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={form.type === 'fixed'}
                        value={form.max_discount_value || ''}
                        onChange={(e) => setForm({ ...form, max_discount_value: e.target.value ? Number(e.target.value) : null })}
                        placeholder={form.type === 'fixed' ? 'Bỏ qua' : 'VD: 100000'}
                        className={`w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none ${form.type==='fixed'?'bg-gray-100 opacity-50':''}`}
                      />
                    </div>
                  </div>

                  {/* Giới hạn lượt */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                       Giới hạn số lượt dùng (Bỏ trống = Vô hạn)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.usage_limit || ''}
                      onChange={(e) => setForm({ ...form, usage_limit: e.target.value ? Number(e.target.value) : null })}
                      placeholder="VD: 100 lượt"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                  {/* Thời gian */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Ngày bắt đầu</label>
                      <input
                        type="datetime-local"
                        value={form.start_date?.toString() || ''}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Ngày kết thúc</label>
                      <input
                        type="datetime-local"
                        value={form.expiration_date?.toString() || ''}
                        onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 outline-none"
                      />
                    </div>
                  </div>

                  {/* Toggle Trạng Thái */}
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="ml-3 text-sm font-bold text-gray-700">Kích hoạt ngay</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !form.code.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-4 rounded-xl transition-all shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <Plus size={20} />
                  {isSubmitting ? "Đang xử lý..." : "PHÁT HÀNH MÃ"}
                </button>
              </form>

            </div>
          </div>

          {/* === DANH SÁCH MÃ GIẢM GIÁ === */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10 flex justify-between items-center">
                <h2 className="font-black text-gray-900 text-lg uppercase tracking-wide flex items-center gap-2">
                  <Ticket size={20} className="text-gray-400" />
                  Kho Voucher ({discounts.length})
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : discounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-300 bg-gray-50/30">
                  <Ticket size={64} className="mb-4 text-gray-200" />
                  <p className="font-bold text-gray-400">Chưa có mã giảm giá nào được phát hành</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {discounts.map((discount) => (
                    <div key={discount.id} className="p-5 hover:bg-gray-50/80 transition-colors group">
                      
                      {/* XEM CHẾ ĐỘ THƯỜNG HOẶC CHỈNH SỬA */}
                      {editingId === discount.id ? (
                        /* CHẾ ĐỘ CHỈNH SỬA NHANH */
                        <div className="bg-white border-2 border-indigo-400 p-4 rounded-2xl shadow-lg relative">
                          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-md">
                            EDITING
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                               <label className="text-xs text-gray-500 font-bold mb-1 block">Mã giảm</label>
                               <input type="text" value={editForm.code} onChange={e=>setEditForm({...editForm, code: e.target.value})} className="border rounded-lg p-2 w-full font-mono text-indigo-700 font-bold" />
                            </div>
                            <div className="flex gap-2">
                               <div className="flex-1">
                                  <label className="text-xs text-gray-500 font-bold mb-1 block">Loại</label>
                                  <select value={editForm.type} onChange={e=>setEditForm({...editForm, type: e.target.value as 'percent'|'fixed'})} className="border rounded-lg p-2 w-full">
                                    <option value="percent">% Ngoại tệ</option>
                                    <option value="fixed">VND</option>
                                  </select>
                               </div>
                               <div className="flex-1">
                                  <label className="text-xs text-gray-500 font-bold mb-1 block">Giá trị</label>
                                  <input type="number" value={editForm.value} onChange={e=>setEditForm({...editForm, value: Number(e.target.value)})} className="border rounded-lg p-2 w-full font-bold" />
                               </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                             <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl font-bold flex items-center gap-1">
                                <X size={16} /> Hủy
                             </button>
                             <button onClick={() => handleUpdate(discount.id)} className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 shadow-md">
                                <Save size={16} /> Lưu Thay Đổi
                             </button>
                          </div>
                        </div>
                      ) : (
                        /* CHẾ ĐỘ HIỂN THỊ THÔNG THƯỜNG */
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative">
                          {/* Code Badge */}
                          <div className={`shrink-0 border-l-4 p-4 pl-5 rounded-r-xl ${discount.is_active ? 'bg-indigo-50/50 border-indigo-500' : 'bg-gray-100 border-gray-300'} flex flex-col justify-center`}>
                             <span className={`font-mono text-xl font-black tracking-widest ${discount.is_active ? 'text-indigo-700' : 'text-gray-400 line-through'}`}>
                               {discount.code}
                             </span>
                             <span className={`text-[11px] font-bold mt-1 uppercase ${discount.type === 'percent' ? 'text-purple-600' : 'text-emerald-600'}`}>
                               {discount.type === 'percent' ? `Giảm ${discount.value}%` : `Giảm ${formatMoney(discount.value)}`}
                             </span>
                          </div>

                          {/* Stats */}
                          <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4 pl-2 text-sm">
                             <div>
                               <p className="text-xs text-gray-400">Đơn tối thiểu</p>
                               <p className="font-semibold text-gray-800">{discount.min_order_value ? formatMoney(discount.min_order_value) : 'Không yêu cầu'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-gray-400">Giảm tối đa</p>
                               <p className="font-semibold text-gray-800">{discount.type==='percent' && discount.max_discount_value ? formatMoney(discount.max_discount_value) : '-'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-gray-400">Đã dùng / Giới hạn</p>
                               <p className="font-bold text-gray-800">
                                 <span className="text-blue-600">{discount.used_count}</span> 
                                 <span className="text-gray-300 mx-1">/</span> 
                                 {discount.usage_limit ? discount.usage_limit : '∞'}
                               </p>
                             </div>
                             <div>
                               <p className="text-xs text-gray-400">Thời hạn</p>
                               <p className="font-semibold text-gray-800 flex flex-col xl:flex-row xl:gap-2">
                                 {(!discount.start_date && !discount.expiration_date) && <span className="text-emerald-500">Vĩnh viễn</span>}
                                 {discount.start_date && <span>Từ: {new Date(discount.start_date).toLocaleDateString('vi-VN')}</span>}
                                 {discount.expiration_date && <span className="text-rose-500">Đến: {new Date(discount.expiration_date).toLocaleDateString('vi-VN')}</span>}
                               </p>
                             </div>
                          </div>

                          {/* Actions */}
                          <div className="flex sm:flex-col gap-2 shrink-0 sm:items-end mt-4 sm:mt-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(discount)}
                              className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Edit2 size={14} /> Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(discount.id, discount.code)}
                              className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg hover:bg-rose-500 hover:text-white transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
