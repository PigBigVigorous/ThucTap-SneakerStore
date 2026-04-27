"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminCategoryAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { Layers, Plus, Trash2, ChevronRight, FolderOpen, Folder } from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  children?: Category[];
};

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");

  const fetchCategories = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminCategoryAPI.getAll(token);
      if (res.success && res.data) {
        const flat: Category[] = [];
        res.data.forEach((parent: any) => {
          flat.push({
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
            parent_id: parent.parent_id,
          });
          if (parent.children && Array.isArray(parent.children)) {
            parent.children.forEach((child: any) => {
              flat.push({
                id: child.id,
                name: child.name,
                slug: child.slug,
                parent_id: child.parent_id,
              });
            });
          }
        });
        setCategories(flat);
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !token) return;
    setIsSubmitting(true);
    try {
      const res = await adminCategoryAPI.create(
        {
          name: newName.trim(),
          parent_id: newParentId ? Number(newParentId) : null,
        },
        token
      );
      if (res.success) {
        toast.success(`Đã tạo danh mục "${res.data.name}"!`);
        setNewName("");
        setNewParentId("");
        fetchCategories();
      } else {
        const errMsg =
          res.errors?.name?.[0] || res.message || "Có lỗi xảy ra";
        toast.error(errMsg);
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (cat: Category) => {
    if (
      !window.confirm(
        `Xóa danh mục "${cat.name}"? Các danh mục con sẽ được chuyển lên cấp trên.`
      )
    )
      return;
    if (!token) return;
    try {
      const res = await adminCategoryAPI.delete(cat.id, token);
      if (res.success) {
        toast.success(res.message || "Đã xóa danh mục!");
        fetchCategories();
      } else {
        toast.error(res.message || "Lỗi xóa danh mục!");
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
  };

  // Phân cấp: danh mục gốc (parent_id = null)
  const rootCategories = categories.filter((c) => c.parent_id === null);
  // Danh mục con theo parent_id
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parent_id === parentId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-black text-gray-900 uppercase flex items-center gap-3">
            <Layers size={32} className="text-indigo-600" /> Quản lý Danh mục
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Danh mục thêm/xóa sẽ phản ánh ngay trên MegaMenu
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* === FORM THÊM DANH MỤC === */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                <Plus size={20} className="text-indigo-600" /> Thêm Danh Mục Mới
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="VD: Giày Chạy Bộ, Giày Lifestyle..."
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-900 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Danh mục cha{" "}
                    <span className="text-gray-400 font-normal">(để trống = danh mục gốc)</span>
                  </label>
                  <select
                    value={newParentId}
                    onChange={(e) => setNewParentId(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-900 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">— Danh mục cấp 1 (gốc) —</option>
                    {rootCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  {isSubmitting ? "Đang lưu..." : "Tạo Danh Mục"}
                </button>
              </form>

              {/* Ghi chú */}
              <div className="mt-5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  💡 Danh mục <strong>cấp 1 (gốc)</strong> sẽ hiện lên thanh điều hướng MegaMenu.
                  <br />
                  Danh mục <strong>cấp 2 (con)</strong> sẽ hiện trong bảng dropdown bên dưới mục cha.
                </p>
              </div>
            </div>
          </div>

          {/* === DANH SÁCH DANH MỤC === */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-black text-gray-900 text-base uppercase tracking-wide flex items-center gap-2">
                  <FolderOpen size={18} className="text-indigo-500" />
                  Danh sách ({categories.length} danh mục)
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <p className="text-gray-400 animate-pulse font-bold">Đang tải...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-300">
                  <Layers size={48} className="mb-3" />
                  <p className="font-bold">Chưa có danh mục nào</p>
                  <p className="text-sm mt-1">Thêm danh mục đầu tiên ở bên trái</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 p-4 space-y-2">
                  {rootCategories.map((root) => {
                    const children = getChildren(root.id);
                    return (
                      <div key={root.id} className="rounded-xl overflow-hidden border border-gray-100">
                        {/* Danh mục gốc */}
                        <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors group">
                          <div className="flex items-center gap-3">
                            <Folder size={18} className="text-indigo-500 shrink-0" />
                            <div>
                              <p className="font-black text-gray-900 text-sm">{root.name}</p>
                              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                /{root.slug}
                                {children.length > 0 && (
                                  <span className="ml-2 text-indigo-400">
                                    • {children.length} danh mục con
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(root)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                            title="Xóa danh mục"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Danh mục con */}
                        {children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between px-5 py-2.5 bg-white hover:bg-gray-50 transition-colors group border-t border-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight size={13} className="text-gray-300 shrink-0" />
                              <Folder size={15} className="text-gray-400 shrink-0" />
                              <div>
                                <p className="font-bold text-gray-700 text-sm">{child.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">/{child.slug}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete(child)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                              title="Xóa danh mục con"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
