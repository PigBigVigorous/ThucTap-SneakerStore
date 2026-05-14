"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminProductAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { Package, Plus, X, Upload, Edit, Trash2, Pipette, Ruler, Search, ToggleLeft, ToggleRight } from "lucide-react";

/** ProductsPage - Trang quản lý sản phẩm: thêm, sửa, xóa, ẩn hiện và quản lý biến thể + gallery */
export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State cho Modal Thêm Sản phẩm
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State đánh dấu đang sửa
  const [editingId, setEditingId] = useState<number | null>(null);

  // State Form
  const [form, setForm] = useState({
    name: "", category_id: "1", brand_id: "1", description: "", branch_id: "1"
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState("info"); // Tab Quản lý Modal

  // State Biến thể (Mặc định có 1 dòng)
  const [variants, setVariants] = useState([
    { color_id: "1", size_id: "1", price: "2500000", stock: "50", colorway_name: "" }
  ]);

  // STATE QUẢN LÝ GALLERY THEO NHÓM MÀU (ảnh mới upload)
  const [galleryByColor, setGalleryByColor] = useState<Record<string, { files: File[], previews: string[] }>>({});
  // STATE HIỂN THỊ ẢNH GALLERY HIỆN CÓ (khi đang chỉnh sửa sản phẩm)
  const [existingGalleryByColor, setExistingGalleryByColor] = useState<Record<string, string[]>>({});

  // State danh sách màu và size - fetch từ API thay vì hardcode
  const [colorOptions, setColorOptions] = useState<{ id: string; name: string; hex_code?: string }[]>([]);
  const [sizeOptions, setSizeOptions] = useState<{ id: string; name: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; name: string }[]>([]);
  const [brandOptions, setBrandOptions] = useState<{ id: string; name: string }[]>([]);

  // State mini-form thêm màu mới
  const [showAddColorForm, setShowAddColorForm] = useState(false);
  const [newColorForm, setNewColorForm] = useState({ name: "", hex_code: "#000000" });
  const [isCreatingColor, setIsCreatingColor] = useState(false);

  // State mini-form thêm size mới
  const [showAddSizeForm, setShowAddSizeForm] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");
  const [isCreatingSize, setIsCreatingSize] = useState(false);

  // Lọc ra các ID màu sắc độc nhất mà người dùng đang chọn ở phần Biến thể
  const uniqueSelectedColors = Array.from(new Set(variants.map(v => v.color_id)));

  useEffect(() => {
    // Fetch danh sách màu sắc và size từ DB
    const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
    Promise.all([
      fetch(`${API}/colors`).then(r => r.json()),
      fetch(`${API}/sizes`).then(r => r.json()),
      fetch(`${API}/categories`).then(r => r.json()),
      fetch(`${API}/brands`).then(r => r.json()),
    ]).then(([colorsRes, sizesRes, catsRes, brandsRes]) => {
      if (colorsRes.success) setColorOptions(colorsRes.data.map((c: any) => ({ id: String(c.id), name: c.name, hex_code: c.hex_code })));
      if (sizesRes.success) setSizeOptions(sizesRes.data.map((s: any) => ({ id: String(s.id), name: s.name })));
      if (catsRes.success) setCategoryOptions(
        // Flatten: lấy cả cha lẫn con
        catsRes.data.flatMap((c: any) => [
          { id: String(c.id), name: c.name },
          ...(c.children || []).map((ch: any) => ({ id: String(ch.id), name: `↳ ${ch.name}` })),
        ])
      );
      if (brandsRes.success) setBrandOptions(brandsRes.data.map((b: any) => ({ id: String(b.id), name: b.name })));
    }).catch(() => {
      // Fallback nếu API lỗi
      setColorOptions([{ id: "1", name: "Trắng" }, { id: "2", name: "Đen" }, { id: "3", name: "Đỏ" }]);
      setSizeOptions([{ id: "1", name: "39" }, { id: "2", name: "40" }, { id: "3", name: "41" }, { id: "4", name: "42" }]);
    });
  }, []);

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => {
        fetchProducts();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [token, searchTerm]);

  /** fetchProducts - Lấy danh sách sản phẩm */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminProductAPI.getAll(token || "", searchTerm);
      if (res.success) setProducts(res.data.data || []);
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    }
    setLoading(false);
  };

  /** handleCreateColor - Tạo màu sắc mới trực tiếp trong form */
  const handleCreateColor = async () => {
    if (!newColorForm.name.trim()) return toast.error("Vui lòng nhập tên màu!");
    setIsCreatingColor(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${API}/admin/colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newColorForm.name.trim(), hex_code: newColorForm.hex_code }),
      });
      const data = await res.json();
      if (data.success) {
        const created = { id: String(data.data.id), name: data.data.name, hex_code: data.data.hex_code };

        setColorOptions(prev => [...prev, created]);

        setVariants(prev => {
          const newV = [...prev];
          newV[newV.length - 1] = { ...newV[newV.length - 1], color_id: created.id };
          return newV;
        });
        toast.success(`Đã tạo màu "${created.name}" thành công!`);
        setNewColorForm({ name: "", hex_code: "#000000" });
        setShowAddColorForm(false);
      } else {
        toast.error(data.message || "Lỗi tạo màu!");
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
    setIsCreatingColor(false);
  };

  /** handleEditClick - Đổ dữ liệu sản phẩm (biến thể, gallery) vào form và mở modal sửa */
  const handleEditClick = (product: any) => {
    setEditingId(product.id);

    setForm({
      name: product.name,
      category_id: product.category_id?.toString() || "1",
      brand_id: product.brand_id?.toString() || "1",
      description: product.description || "",
      branch_id: "1"
    });

    setPreviewUrl(product.base_image_url);
    setImageFile(null);

    // Reset gallery mới upload
    setGalleryByColor({});


    const groupedByColor: Record<string, string[]> = {};
    if (product.images && product.images.length > 0) {
      product.images.forEach((img: any) => {
        const cid = img.color_id ? String(img.color_id) : "none";
        if (!groupedByColor[cid]) groupedByColor[cid] = [];
        groupedByColor[cid].push(img.image_url);
      });
    }
    setExistingGalleryByColor(groupedByColor);

    // Đổ danh sách Biến thể ra
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map((v: any) => ({
        id: v.id,
        color_id: v.color_id?.toString() || "1",
        size_id: v.size_id?.toString() || "1",
        price: Number(v.price).toString(),
        stock: "0",
        colorway_name: v.colorway_name || "", // 🎨 Load tên phối màu hiện có
      })));
    } else {
      setVariants([{ color_id: "1", size_id: "1", price: "0", stock: "0", colorway_name: "" }]);
    }

    setActiveModalTab("info");
    setShowModal(true);
  };

  /** handleCreateSize - Tạo cỡ size mới trực tiếp trong form */
  const handleCreateSize = async () => {
    if (!newSizeName.trim()) return toast.error("Vui lòng nhập tên size!");
    setIsCreatingSize(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${API}/admin/sizes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newSizeName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const created = { id: String(data.data.id), name: data.data.name };
        setSizeOptions(prev => [...prev, created]);
        setVariants(prev => {
          const newV = [...prev];
          newV[newV.length - 1] = { ...newV[newV.length - 1], size_id: created.id };
          return newV;
        });
        toast.success(`Đã tạo size "US ${created.name}" thành công!`);
        setNewSizeName("");
        setShowAddSizeForm(false);
      } else {
        toast.error(data.message || "Lỗi tạo size!");
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
    setIsCreatingSize(false);
  };


  /** handleImageChange - Xử lý chọn file ảnh đại diện sản phẩm */
  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  /** handleGalleryByColorChange - Xử lý upload ảnh gallery nhóm theo từng màu sắc */
  const handleGalleryByColorChange = (colorId: string, e: any) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const previews = files.map(file => URL.createObjectURL(file));

      setGalleryByColor(prev => {
        const existing = prev[colorId] || { files: [], previews: [] };
        return {
          ...prev,
          [colorId]: {
            files: [...existing.files, ...files],
            previews: [...existing.previews, ...previews]
          }
        };
      });
    }
  };

  /** removeColorGalleryImage - Xóa một ảnh khỏi gallery của màu tương ứng */
  const removeColorGalleryImage = (colorId: string, indexToRemove: number) => {
    setGalleryByColor(prev => {
      const existing = prev[colorId];
      if (!existing) return prev;
      return {
        ...prev,
        [colorId]: {
          files: existing.files.filter((_, idx) => idx !== indexToRemove),
          previews: existing.previews.filter((_, idx) => idx !== indexToRemove)
        }
      };
    });
  };

  /** handleSubmit - Gửi form tạo mới hoặc cập nhật sản phẩm kèm biến thể và gallery */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category_id", form.category_id);
      formData.append("brand_id", form.brand_id);
      formData.append("description", form.description);
      formData.append("branch_id", form.branch_id);

      if (imageFile) formData.append("base_image", imageFile);

      // Đóng gói ảnh gallery theo đúng key ID màu sắc
      Object.entries(galleryByColor).forEach(([colorId, data]) => {
        data.files.forEach((file) => {
          formData.append(`gallery_images[${colorId}][]`, file);
        });
      });

      formData.append("variants", JSON.stringify(variants));

      const res = editingId
        ? await adminProductAPI.update(editingId, formData, token)
        : await adminProductAPI.create(formData, token);

      if (res.success) {
        if (editingId && res.data?.slug) {
          // Slug bị thay đổi: thông báo kèm link đến URL mới
          toast.success(
            <span>
              Cập nhật thành công!{" "}
              <a
                href={`/product/${res.data.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-black text-blue-600"
              >
                Xem sản phẩm →
              </a>
            </span>,
            { duration: 6000 }
          );
        } else {
          toast.success(editingId ? "Đã cập nhật thành công!" : "Đã thêm sản phẩm thành công!");
        }
        setShowModal(false);
        fetchProducts();
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error(" Lỗi khi lưu sản phẩm:", error);

      const status = error?.response?.status;
      const serverData = error?.response?.data;

      console.error("📦 Server response data:", serverData);
      console.error("🔢 HTTP Status:", status);

      if (serverData) {
        if (serverData.message) {
          toast.error(`[${status}] ${serverData.message}`, { duration: 6000 });
        } else if (serverData.errors) {
          const allErrors = Object.entries(serverData.errors)
            .map(([field, msgs]) =>
              `• ${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`
            )
            .join("\n");
          toast.error(`Lỗi validation:\n${allErrors}`, { duration: 8000 });
        } else {
          const raw = typeof serverData === "string"
            ? serverData.slice(0, 300)
            : JSON.stringify(serverData, null, 2).slice(0, 300);
          toast.error(`[${status}] Lỗi server:\n${raw}`, { duration: 8000 });
        }
      } else if (error?.message) {
        toast.error(`Lỗi kết nối: ${error.message}`);
      } else {
        toast.error("Lỗi không xác định. Kiểm tra Console (F12) để biết chi tiết.");
      }
    }
    setIsSubmitting(false);
  };

  /** handleDelete - Ẩn sản phẩm */
  const handleDelete = async (id: number) => {
    if (!window.confirm("⚠️ Bạn có chắc muốn xóa sản phẩm này?")) return;

    if (!token) return;
    try {
      const res = await adminProductAPI.delete(id, token);
      if (res.success) {
        toast.success(res.message);
        fetchProducts();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ khi xóa!");
    }
  };

  /** handleToggleStatus - Đổi trạng thái kinh doanh sản phẩm (optimistic update) */
  const handleToggleStatus = async (product: any) => {
    if (!token) return;
    const newStatus = !product.is_active;
    const label = newStatus ? "Đang bán" : "Ngừng bán";
    if (!window.confirm(`Xác nhận chuyển sản phẩm "${product.name}" sang trạng thái: ${label}?`)) return;
    setProducts((prev: any[]) =>
      prev.map((p: any) => p.id === product.id ? { ...p, is_active: newStatus } : p)
    );

    try {
      const res = await adminProductAPI.toggleStatus(product.id, token);
      if (res.success) {
        toast.success(res.message);
      } else {
        setProducts((prev: any[]) =>
          prev.map((p: any) => p.id === product.id ? { ...p, is_active: product.is_active } : p)
        );
        toast.error(res.message || "Cập nhật thất bại!");
      }
    } catch {
      setProducts((prev: any[]) =>
        prev.map((p: any) => p.id === product.id ? { ...p, is_active: product.is_active } : p)
      );
      toast.error("Lỗi kết nối máy chủ!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-black text-gray-900 uppercase flex items-center gap-3">
            <Package size={32} className="text-orange-600" /> Quản lý Sản phẩm
          </h1>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
            <input
              type="text"
              placeholder="Tìm theo tên, thương hiệu, danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-black focus:border-transparent outline-none shadow-sm group-hover:border-gray-300 transition-all font-medium text-gray-900"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", category_id: categoryOptions[0]?.id || "1", brand_id: brandOptions[0]?.id || "1", description: "", branch_id: "1" });
              setImageFile(null); setPreviewUrl(null); setGalleryByColor({}); setExistingGalleryByColor({});
              setVariants([{ color_id: colorOptions[0]?.id || "1", size_id: sizeOptions[0]?.id || "1", price: "2500000", stock: "50", colorway_name: "" }]);
              setActiveModalTab("info");
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus size={20} /> Thêm Sản Phẩm Mới
          </button>
        </div>

        {/* Bảng dữ liệu */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-4 py-5 sm:p-6">
            {loading ? (
              <div className="flex justify-center py-10"><p className="text-gray-500 font-bold animate-pulse">Đang tải dữ liệu...</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Hình ảnh</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Slug (URL)</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Danh mục</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Màu sắc</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Giá cơ bản</th>
                      <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">Kinh doanh</th>
                      <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {products.map((product: any) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={product.base_image_url || "/placeholder.jpg"}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100 bg-gray-50"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-gray-900 max-w-xs truncate group-hover:text-amber-600 transition-colors">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-xs text-blue-500 font-medium max-w-[160px] truncate" title={product.slug}>
                          <a
                            href={`/product/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline bg-blue-50 px-2 py-1 rounded-md"
                          >
                            /{product.slug}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-lg">{product.category?.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-lg">{product.brand?.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2 max-w-[120px]">
                            {(() => {
                              const seen = new Set<number>();
                              return (product.variants || []).reduce((acc: any[], v: any) => {
                                if (v?.color && !seen.has(v.color.id)) {
                                  seen.add(v.color.id);
                                  acc.push(v.color);
                                }
                                return acc;
                              }, []).map((c: any) => (
                                <span
                                  key={c.id}
                                  title={c.name}
                                  className="relative inline-block hover:scale-125 transition-transform"
                                >
                                  <span
                                    className="block w-6 h-6 rounded-full border border-white ring-2 ring-gray-200 shadow-sm"
                                    style={{ backgroundColor: c.hex_code || "#cccccc" }}
                                  />
                                </span>
                              ));
                            })()}
                            {(product.variants || []).filter((v: any, i: number, arr: any[]) =>
                              arr.findIndex((x: any) => x?.color?.id === v?.color?.id) === i && v?.color
                            ).length === 0 && (
                                <span className="text-xs text-gray-300 italic">Chưa có</span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-black text-red-600">
                          {product.variants?.length > 0
                            ? `${Number(product.variants[0].price).toLocaleString('vi-VN')} ₫`
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleStatus(product)}
                            title={product.is_active ? "Nhấn để Ngừng bán" : "Nhấn để Mở bán"}
                            className={`group/toggle inline-flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all duration-300 ${product.is_active
                              ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100"
                              : "border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 hover:shadow-md hover:shadow-orange-100"
                              }`}
                          >
                            {product.is_active ? (
                              <ToggleRight
                                size={26}
                                className="text-emerald-500 group-hover/toggle:scale-110 transition-transform"
                              />
                            ) : (
                              <ToggleLeft
                                size={26}
                                className="text-gray-400 group-hover/toggle:text-orange-500 group-hover/toggle:scale-110 transition-all"
                              />
                            )}
                            <span className={`text-[10px] font-black uppercase tracking-wide ${product.is_active ? "text-emerald-600" : "text-gray-400"
                              }`}>
                              {product.is_active ? "Đang bán" : "Ngừng bán"}
                            </span>
                          </button>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditClick(product)}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-200 shadow-sm"
                              title="Sửa sản phẩm"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-200 shadow-sm"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL THÊM/SỬA SẢN PHẨM --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 relative flex flex-col max-h-[90vh]">

            <div className="flex flex-col justify-between items-start md:items-center p-6 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <div className="flex justify-between items-center w-full mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{editingId ? "CẬP NHẬT SẢN PHẨM" : "TẠO SẢN PHẨM MỚI"}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-2 rounded-full shadow-sm border border-gray-100">
                  <X size={24} />
                </button>
              </div>

              {/* TABS NAVIGATION */}
              <div className="w-full flex flex-wrap gap-2">
                {[
                  { id: "info", label: "📝 Thông Tin Cơ Bản" },
                  { id: "variants", label: "🎨 Phân Loại & Biến Thể" },

                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModalTab(tab.id)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${activeModalTab === tab.id ? 'bg-black text-white shadow-md scale-[1.02]' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <div className="space-y-8">

                {/* ────────────────────────────────────────────────────────
                    TAB 1: THÔNG TIN CƠ BẢN
                ──────────────────────────────────────────────────────── */}
                <div className={activeModalTab === "info" ? "block animate-[fadeIn_0.3s_ease-out]" : "hidden"}>
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 flex items-start gap-3 border border-blue-100">
                    <span className="text-xl">💡</span>
                    <p className="text-sm font-medium leading-relaxed">Nhập các thông tin nền tảng của sản phẩm. Bạn có thể chọn ảnh đại diện đặc sắc nhất ở đây. Những ảnh góc máy khác sẽ được thêm ở phần Gallery sau.</p>
                  </div>

                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div>
                      <label className="block text-sm font-black text-gray-900 mb-2">Tên Sản Phẩm <span className="text-red-500">*</span></label>
                      <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-4 border bg-gray-50 hover:bg-white transition-colors font-bold text-gray-900 text-lg placeholder-gray-400" placeholder="VD: Nike Air Jordan 1 Retro High" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-black text-gray-900 mb-2">Danh mục <span className="text-red-500">*</span></label>
                        <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-3.5 border bg-gray-50 hover:bg-white text-gray-900 font-bold transition-colors">
                          {categoryOptions.length === 0
                            ? <option value="">Đang tải...</option>
                            : categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                          }
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-black text-gray-900 mb-2">Thương hiệu <span className="text-red-500">*</span></label>
                        <select value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-3.5 border bg-gray-50 hover:bg-white text-gray-900 font-bold transition-colors">
                          {brandOptions.length === 0
                            ? <option value="">Đang tải...</option>
                            : brandOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                          }
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-gray-900 mb-2">Ảnh Đại Diện (Thumbnail) <span className="text-red-500">*</span></label>
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                        <div className="shrink-0 w-32 h-32 border border-gray-200 rounded-2xl flex items-center justify-center bg-white overflow-hidden shadow-sm">
                          {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" /> : <Upload className="text-gray-300 w-10 h-10" />}
                        </div>
                        <div className="flex-1 w-full text-center sm:text-left">
                          <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-gray-900 file:text-white hover:file:bg-black transition-colors" />
                          <p className="text-xs text-gray-400 mt-2 italic">Chấp nhận JPG, PNG, WEBP. Tối đa 5MB. Kích thước khuyến nghị 800x800px.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-gray-900 mb-2">Mô tả sản phẩm</label>
                      <textarea rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-4 border bg-gray-50 hover:bg-white transition-colors font-medium text-gray-800" placeholder="Giới thiệu về chất liệu, thiết kế, form dáng..." />
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button type="button" onClick={() => setActiveModalTab("variants")} className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-md">
                        Tiếp theo: Biến Thể ➡️
                      </button>
                    </div>
                  </div>
                </div>

                {/* ────────────────────────────────────────────────────────
                    TAB 2: BIẾN THỂ & PHÂN LOẠI
                ──────────────────────────────────────────────────────── */}
                <div className={activeModalTab === "variants" ? "block animate-[fadeIn_0.3s_ease-out]" : "hidden"}>
                  {/* Quản lý Biến thể (Màu / Size) */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-black text-gray-900 uppercase">Danh sách Phân loại</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddColorForm(prev => !prev)}
                          title="Tạo màu mới"
                          className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${showAddColorForm ? "bg-purple-100 text-purple-700 border-purple-300" : "text-purple-600 border-purple-300 hover:bg-purple-50"}`}
                        >
                          <Pipette size={13} /> Màu mới
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddSizeForm(prev => !prev)}
                          title="Tạo size mới"
                          className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${showAddSizeForm ? "bg-teal-100 text-teal-700 border-teal-300" : "text-teal-600 border-teal-300 hover:bg-teal-50"}`}
                        >
                          <Ruler size={13} /> Size mới
                        </button>
                        <button type="button" onClick={() => setVariants([...variants, { color_id: colorOptions[0]?.id || "1", size_id: sizeOptions[0]?.id || "1", price: "2500000", stock: "0", colorway_name: "" }])} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Plus size={16} /> Thêm size/màu
                        </button>
                      </div>
                    </div>

                    {/* Mini-form tạo màu mới */}
                    {showAddColorForm && (
                      <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl shadow-inner">
                        <p className="text-sm font-black text-purple-800 uppercase mb-4 flex items-center gap-2">
                          <Pipette size={18} /> Khởi tạo Phân loại màu sắc mới
                        </p>
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-black text-gray-500 uppercase block mb-1.5 focus-within:text-purple-600 transition-colors">Tên hiển thị (VN/EN) *</label>
                            <input
                              type="text"
                              value={newColorForm.name}
                              onChange={e => setNewColorForm(p => ({ ...p, name: e.target.value }))}
                              placeholder="VD: Midnight Navy, Sail White..."
                              className="w-full text-base font-bold text-gray-900 border-2 border-purple-200 rounded-xl p-3 focus:ring-purple-500 focus:border-purple-500 bg-white placeholder-gray-300"
                              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCreateColor())}
                            />
                          </div>
                          <div className="shrink-0">
                            <label className="text-xs font-black text-gray-500 uppercase block mb-1.5 focus-within:text-purple-600 transition-colors">Chọn Mã Màu (Hex)</label>
                            <div className="flex items-center gap-3 border-2 border-purple-200 rounded-xl p-2 bg-white focus-within:border-purple-500 transition-colors cursor-pointer">
                              <input
                                type="color"
                                value={newColorForm.hex_code}
                                onChange={e => setNewColorForm(p => ({ ...p, hex_code: e.target.value }))}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                              />
                              <span className="text-sm text-gray-700 font-black font-mono w-20">{newColorForm.hex_code.toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCreateColor}
                              disabled={isCreatingColor || !newColorForm.name.trim()}
                              className="shrink-0 px-6 py-3 bg-purple-600 text-white text-base font-black rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none transition-all"
                            >
                              {isCreatingColor ? "Đang xử lý..." : "Lưu vào Kho"}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddColorForm(false); setNewColorForm({ name: "", hex_code: "#000000" }); }}
                              className="shrink-0 px-4 py-3 text-gray-500 bg-white border border-gray-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl font-bold transition-colors"
                            >
                              Đóng
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mini-form tạo size mới */}
                    {showAddSizeForm && (
                      <div className="mb-6 p-5 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl shadow-inner">
                        <p className="text-sm font-black text-teal-800 uppercase mb-4 flex items-center gap-2">
                          <Ruler size={18} /> Thêm size mới vào hệ thống
                        </p>
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-black text-gray-500 uppercase block mb-1.5 focus-within:text-teal-600 transition-colors">
                              Tên size (số EU hoặc chữ S/M/L) *
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-teal-600 shrink-0">US</span>
                              <input
                                type="text"
                                value={newSizeName}
                                onChange={e => setNewSizeName(e.target.value)}
                                placeholder="VD: 42, 42.5, XL..."
                                className="flex-1 text-base font-bold text-gray-900 border-2 border-teal-200 rounded-xl p-3 focus:ring-teal-500 focus:border-teal-500 bg-white placeholder-gray-300"
                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCreateSize())}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={handleCreateSize}
                              disabled={isCreatingSize || !newSizeName.trim()}
                              className="px-6 py-3 bg-teal-600 text-white text-base font-black rounded-xl shadow-lg shadow-teal-200 hover:bg-teal-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none transition-all"
                            >
                              {isCreatingSize ? "Đang xử lý..." : "Lưu vào Kho"}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddSizeForm(false); setNewSizeName(""); }}
                              className="px-4 py-3 text-gray-500 bg-white border border-gray-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl font-bold transition-colors"
                            >
                              Đóng
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── Danh sách phân loại: nhóm theo màu ─── */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">

                      {/* Card "Thêm màu mới" */}
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-between bg-gray-50/60 hover:border-purple-200 transition-colors">
                        <p className="text-sm font-bold text-gray-500">Chọn một màu để thêm vào sản phẩm</p>
                        <div className="flex items-center gap-2">
                          <select
                            className="text-sm font-bold border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-black text-gray-800 cursor-pointer"
                            onChange={e => {
                              const colorId = e.target.value;
                              if (!colorId) return;
                              // Kiểm tra màu này đã có chưa
                              const alreadyExists = variants.some(v => v.color_id === colorId);
                              if (alreadyExists) { toast.error("Màu này đã được thêm rồi!"); return; }
                              // Thêm 1 biến thể mặc định với màu đó
                              setVariants(prev => [...prev, {
                                color_id: colorId,
                                size_id: sizeOptions[0]?.id || "1",
                                price: "2500000",
                                stock: "0",
                                colorway_name: ""
                              }]);
                              e.target.value = "";
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>-- Chọn màu --</option>
                            {colorOptions.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Một card cho mỗi màu duy nhất */}
                      {uniqueSelectedColors.map((colorId) => {
                        const colorOpt = colorOptions.find(c => c.id === colorId);
                        const colorName = colorOpt?.name || "Màu chưa rõ";
                        const hexColor = colorOpt?.hex_code || "#cccccc";

                        // Khai báo cho gallery
                        const colorData = galleryByColor[colorId] || { files: [], previews: [] };
                        const existingImages = existingGalleryByColor[colorId] || [];

                        // Tất cả biến thể của màu này
                        const colorVariants = variants.filter(v => v.color_id === colorId);

                        // Colorway name dùng chung cho cả nhóm màu (lấy từ biến thể đầu tiên)
                        const firstVariant = colorVariants[0];
                        const colorwayName = (firstVariant as any)?.colorway_name || "";

                        // Hàm cập nhật price/stock theo size_id trong màu này
                        const updateVariantField = (sizeId: string, field: "price" | "stock", value: string) => {
                          setVariants(prev => prev.map(v =>
                            v.color_id === colorId && v.size_id === sizeId
                              ? { ...v, [field]: value }
                              : v
                          ));
                        };

                        // Hàm toggle bật/tắt một size trong màu này
                        const toggleSize = (sizeId: string) => {
                          const exists = colorVariants.some(v => v.size_id === sizeId);
                          if (exists) {
                            // Xóa size này (nhưng giữ ít nhất 1 size)
                            if (colorVariants.length <= 1) { toast.error("Mỗi màu cần ít nhất 1 size!"); return; }
                            setVariants(prev => prev.filter(v => !(v.color_id === colorId && v.size_id === sizeId)));
                          } else {
                            // Thêm size mới vào màu này, kế thừa giá từ size đầu tiên
                            const basePrice = colorVariants[0]?.price || "2500000";
                            setVariants(prev => [...prev, {
                              color_id: colorId,
                              size_id: sizeId,
                              price: basePrice,
                              stock: "0",
                              colorway_name: colorwayName
                            }]);
                          }
                        };

                        // Hàm xóa toàn bộ màu
                        const removeColor = () => {
                          if (uniqueSelectedColors.length <= 1) { toast.error("Sản phẩm cần ít nhất 1 màu!"); return; }
                          setVariants(prev => prev.filter(v => v.color_id !== colorId));
                        };

                        // Hàm cập nhật colorway_name cho toàn bộ biến thể của màu này
                        const updateColorwayName = (value: string) => {
                          setVariants(prev => prev.map(v =>
                            v.color_id === colorId ? { ...v, colorway_name: value } as any : v
                          ));
                        };

                        return (
                          <div key={colorId} className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-gray-300 transition-colors shadow-sm">
                            {/* Header màu */}
                            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-7 h-7 rounded-lg border-2 border-white ring-1 ring-gray-200 shadow-sm shrink-0"
                                  style={{ backgroundColor: hexColor }}
                                />
                                <span className="font-black text-gray-900 text-base">{colorName}</span>
                                <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                                  {colorVariants.length} size
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={removeColor}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                title="Xóa màu này"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            {/* Bảng size + giá */}
                            <div className="p-4">
                              {/* Hàng header bảng */}
                              <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                                <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase">Size</div>
                                <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase text-center">Bật</div>
                                <div className="col-span-4 text-[10px] font-black text-gray-400 uppercase text-right">Giá bán (₫)</div>
                                <div className="col-span-4 text-[10px] font-black text-gray-400 uppercase text-right">
                                  {editingId ? "Kho (khoá)" : "Kho gốc"}
                                </div>
                              </div>

                              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                                {sizeOptions.map(size => {
                                  const activeVariant = colorVariants.find(v => v.size_id === size.id);
                                  const isActive = !!activeVariant;

                                  return (
                                    <div
                                      key={size.id}
                                      className={`grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-xl transition-all ${isActive ? "bg-blue-50 border border-blue-100" : "bg-gray-50 border border-transparent opacity-50"}`}
                                    >
                                      {/* Tên size */}
                                      <div className="col-span-3">
                                        <span className="text-sm font-black text-gray-800">US {size.name}</span>
                                      </div>

                                      {/* Checkbox toggle */}
                                      <div className="col-span-1 flex justify-center">
                                        <button
                                          type="button"
                                          onClick={() => toggleSize(size.id)}
                                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isActive ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300 hover:border-blue-400"}`}
                                        >
                                          {isActive && <span className="text-white text-[10px] font-black">✓</span>}
                                        </button>
                                      </div>

                                      {/* Giá */}
                                      <div className="col-span-4 flex justify-end">
                                        {isActive ? (
                                          <input
                                            type="number"
                                            value={activeVariant!.price}
                                            onChange={e => updateVariantField(size.id, "price", e.target.value)}
                                            className="w-full text-right text-sm font-black bg-white border border-blue-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-blue-700 appearance-none"
                                            placeholder="2500000"
                                          />
                                        ) : (
                                          <span className="text-sm text-gray-300 font-bold">—</span>
                                        )}
                                      </div>

                                      {/* Kho */}
                                      <div className="col-span-4 flex justify-end">
                                        {isActive && !editingId ? (
                                          <input
                                            type="number"
                                            min="0"
                                            value={activeVariant!.stock || "0"}
                                            onChange={e => updateVariantField(size.id, "stock", e.target.value)}
                                            className="w-full text-right text-sm font-black bg-white border border-green-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-300 text-green-700 appearance-none"
                                            placeholder="0"
                                          />
                                        ) : isActive && editingId ? (
                                          <span className="text-xs text-gray-400 italic font-bold pr-1">Khoá</span>
                                        ) : (
                                          <span className="text-sm text-gray-300 font-bold">—</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Colorway Name cho cả màu */}
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <label className="text-[10px] font-black text-orange-500 uppercase tracking-wider block mb-1.5">
                                  Phối màu kỹ thuật số (tùy chọn)
                                </label>
                                <input
                                  type="text"
                                  placeholder="VD: Neutral Grey/Summit White/Infrared 23..."
                                  value={colorwayName}
                                  onChange={e => updateColorwayName(e.target.value)}
                                  className="w-full text-sm border border-orange-100 bg-orange-50/30 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 placeholder:text-gray-300 font-medium text-gray-800 transition-colors"
                                />
                                {colorwayName && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {colorwayName.split('/').map((part: string, i: number) => (
                                      part.trim() ? (
                                        <span key={i} className="text-[10px] font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md shadow-sm">
                                          {part.trim()}
                                        </span>
                                      ) : null
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Dòng mới: Ảnh theo màu */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                              <div className="flex items-center gap-2 mb-3">
                                <span
                                  className="shrink-0 w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                                  style={{ backgroundColor: hexColor }}
                                />
                                <p className="text-sm font-bold text-gray-800">
                                  📸 Ảnh cho màu: <span className="text-orange-600">{colorName}</span>
                                </p>
                              </div>
                              {editingId && existingImages.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ảnh hiện có:</p>
                                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                    {existingImages.map((imgUrl, idx) => (
                                      <div key={idx} className="relative shrink-0 w-20 h-20 border border-orange-200 rounded-xl overflow-hidden bg-white">
                                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-orange-500/10" />
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1">Upload ảnh mới bên dưới sẽ thay thế toàn bộ ảnh trên.</p>
                                </div>
                              )}
                              <input
                                type="file" multiple accept="image/*"
                                onChange={(e) => handleGalleryByColorChange(colorId, e)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-black hover:file:bg-gray-300 transition-colors mb-3"
                              />
                              {colorData.previews.length > 0 && (
                                <div>
                                  <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Ảnh mới sẽ upload:</p>
                                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                    {colorData.previews.map((preview, index) => (
                                      <div key={index} className="relative shrink-0 w-20 h-20 border-2 border-green-300 rounded-xl overflow-hidden group">
                                        <img src={preview} alt="New Gallery" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeColorGalleryImage(colorId, index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {uniqueSelectedColors.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-6">Chọn màu từ dropdown bên trên để bắt đầu.</p>
                      )}
                    </div>

                  </div>


                </div>




              </div>
            </form>

            {/* Nút Submit CHUNG nằm ngoài Form Scroll */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                Thoát
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting} className={`px-10 py-3.5 rounded-xl font-black text-white shadow-xl flex items-center gap-2 transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:-translate-y-1'}`}>
                {isSubmitting ? "Đang xử lý..." : (editingId ? "LƯU CẬP NHẬT TRÊN HỆ THỐNG" : "🌟 KIẾN TẠO SẢN PHẨM")}
              </button>
            </div>

          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}