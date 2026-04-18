"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminBrandAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { Tag, Plus, Trash2, Edit2, X, Check, Package } from "lucide-react";

type Brand = {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  products_count?: number;
};

type FormState = {
  name: string;
  description: string;
};

const emptyForm: FormState = { name: "", description: "" };

export default function BrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form thêm mới
  const [form, setForm] = useState<FormState>(emptyForm);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const fetchBrands = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminBrandAPI.getAll(token);
      if (res.success) setBrands(res.data || []);
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchBrands();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !token) return;
    setIsSubmitting(true);
    try {
      const res = await adminBrandAPI.create(
        {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        },
        token
      );
      if (res.success) {
        toast.success(`Đã tạo thương hiệu "${res.data.name}"!`);
        setForm(emptyForm);
        fetchBrands();
      } else {
        const errMsg = res.errors?.name?.[0] || res.message || "Có lỗi xảy ra";
        toast.error(errMsg);
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
    setIsSubmitting(false);
  };

  const startEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setEditForm({
      name: brand.name,
      description: brand.description || "",
    });
  };

  const handleUpdate = async (id: number) => {
    if (!editForm.name.trim() || !token) return;
    setIsSubmitting(true);
    try {
      const res = await adminBrandAPI.update(
        id,
        {
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
        },
        token
      );
      if (res.success) {
        toast.success("Đã cập nhật thương hiệu!");
        setEditingId(null);
        fetchBrands();
      } else {
        const errMsg = res.errors?.name?.[0] || res.message || "Có lỗi xảy ra";
        toast.error(errMsg);
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (brand: Brand) => {
    if (!window.confirm(`Xóa thương hiệu "${brand.name}"?`)) return;
    if (!token) return;
    try {
      const res = await adminBrandAPI.delete(brand.id, token);
      if (res.success) {
        toast.success(res.message || "Đã xóa thương hiệu!");
        fetchBrands();
      } else {
        toast.error(res.message || "Lỗi xóa!");
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-black text-gray-900 uppercase flex items-center gap-3">
            <Tag size={32} className="text-rose-600" /> Quản lý Thương Hiệu
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Thêm/sửa/xóa thương hiệu — hiện ngay trên MegaMenu
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* === FORM THÊM === */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                <Plus size={20} className="text-rose-600" /> Thêm Thương Hiệu Mới
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Tên thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: Nike, Adidas, Puma..."
                    className="w-full text-gray-900 border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Mô tả{" "}
                    <span className="text-gray-400 font-normal">(tùy chọn)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả ngắn về thương hiệu..."
                    className="w-full text-gray-900 border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none"
                  />
                </div>


                <button
                  type="submit"
                  disabled={isSubmitting || !form.name.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  {isSubmitting ? "Đang lưu..." : "Tạo Thương Hiệu"}
                </button>
              </form>

              <div className="mt-5 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-xs text-rose-700 font-medium leading-relaxed">
                  💡 Thương hiệu mới sẽ hiện ngay trong mục <strong>Thương Hiệu</strong> trên MegaMenu.
                  <br />
                  Không thể xóa thương hiệu đang có sản phẩm.
                </p>
              </div>
            </div>
          </div>

          {/* === DANH SÁCH THƯƠNG HIỆU === */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-black text-gray-900 text-base uppercase tracking-wide flex items-center gap-2">
                  <Tag size={18} className="text-rose-500" />
                  Danh sách ({brands.length} thương hiệu)
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <p className="text-gray-400 animate-pulse font-bold">Đang tải...</p>
                </div>
              ) : brands.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-300">
                  <Tag size={48} className="mb-3" />
                  <p className="font-bold">Chưa có thương hiệu nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {brands.map((brand) =>
                    editingId === brand.id ? (
                      /* --- INLINE EDIT ROW --- */
                      <div key={brand.id} className="p-4 bg-rose-50 border-l-4 border-rose-500">
                        <div className="space-y-2">
                          <input
                            autoFocus
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full border border-rose-300 rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                            placeholder="Tên thương hiệu *"
                          />
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
                            placeholder="Mô tả (tùy chọn)"
                          />
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <X size={14} /> Hủy
                            </button>
                            <button
                              onClick={() => handleUpdate(brand.id)}
                              disabled={isSubmitting || !editForm.name.trim()}
                              className="px-4 py-1.5 text-sm bg-rose-600 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-rose-700 disabled:opacity-50 transition-colors"
                            >
                              <Check size={14} /> Lưu
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* --- DISPLAY ROW --- */
                      <div
                        key={brand.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                      >
                        {/* Logo */}
                        <div className="shrink-0 w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {brand.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Tag size={20} className="text-gray-300" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-sm">{brand.name}</p>
                          {brand.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{brand.description}</p>
                          )}
                          {(brand.products_count !== undefined) && (
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                              <Package size={11} />
                              {brand.products_count} sản phẩm
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => startEdit(brand)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa thương hiệu"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(brand)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={brand.products_count && brand.products_count > 0 ? `Không thể xóa (${brand.products_count} sản phẩm)` : "Xóa thương hiệu"}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
