"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminProductAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { Package, Plus, X, Upload, Edit, Trash2, Pipette, Search } from "lucide-react";

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
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

  // Tạo màu mới ngay trong form — gọi API POST /colors
  const handleCreateColor = async () => {
    if (!newColorForm.name.trim()) return toast.error("Vui lòng nhập tên màu!");
    setIsCreatingColor(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${API}/colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newColorForm.name.trim(), hex_code: newColorForm.hex_code }),
      });
      const data = await res.json();
      if (data.success) {
        const created = { id: String(data.data.id), name: data.data.name, hex_code: data.data.hex_code };
        // Thêm màu mới vào danh sách
        setColorOptions(prev => [...prev, created]);
        // Tự động chọn màu mới cho dòng biến thể cuối cùng
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

  // Khi bấm nút Sửa trên từng dòng sản phẩm
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

    // ============================================================
    // 🎨 LOAD ẢNH GALLERY HIỆN CÓ — NHÓM THEO MÀU SẮC
    // ============================================================
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

    setActiveModalTab("info"); // Reset về tab info khi mở
    setShowModal(true);
  };

  // Xử lý chọn ảnh đại diện
  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Hàm xử lý Upload Gallery cho TỪNG MÀU SẮC
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

  // Xóa bớt ảnh gallery của một màu
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

  // Xử lý Submit Form
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
      
      // 🚀 BÍ QUYẾT GÓI DỮ LIỆU: Đóng gói ảnh gallery theo đúng key ID màu sắc
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
        // Reset Form...
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ!");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("⚠️ Bạn có chắc muốn xóa sản phẩm này? (Dữ liệu sẽ được ẩn đi để bảo toàn lịch sử hóa đơn)")) return;
    
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
              setActiveModalTab("info"); // Đặt mặc định mở tab thông tin
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
                        {/* ================================================
                            🎨 CỘT MÀU SẮC — HIỆN DOT TRÒN MỖI BIẾN THỂ MÀU
                            ================================================ */}
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
                  { id: "gallery", label: "📸 Bộ Sưu Tập (Gallery)" }
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
                      <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-4 border bg-gray-50 hover:bg-white transition-colors font-bold text-gray-900 text-lg placeholder-gray-400" placeholder="VD: Nike Air Jordan 1 Retro High" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-black text-gray-900 mb-2">Danh mục <span className="text-red-500">*</span></label>
                        <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-3.5 border bg-gray-50 hover:bg-white text-gray-900 font-bold transition-colors">
                          {categoryOptions.length === 0
                            ? <option value="">Đang tải...</option>
                            : categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                          }
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-black text-gray-900 mb-2">Thương hiệu <span className="text-red-500">*</span></label>
                        <select value={form.brand_id} onChange={e => setForm({...form, brand_id: e.target.value})} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-3.5 border bg-gray-50 hover:bg-white text-gray-900 font-bold transition-colors">
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
                      <textarea rows={6} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-4 border bg-gray-50 hover:bg-white transition-colors font-medium text-gray-800" placeholder="Giới thiệu về chất liệu, thiết kế, form dáng..." />
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
                  <div className="bg-purple-50 text-purple-800 p-4 rounded-xl mb-6 flex items-start gap-3 border border-purple-100">
                    <span className="text-xl">🗂️</span>
                    <p className="text-sm font-medium leading-relaxed">Xây dựng danh sách các tuỳ chọn mua hàng. Nút <strong>Tạo màu mới</strong> giúp bạn nhanh chóng thêm mã màu lạ (Kèm theo mã Hex) mà không cần phải rời trang.</p>
                  </div>

                  {/* Quản lý Biến thể (Màu / Size) */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                      <label className="block text-lg font-black text-gray-900 uppercase">Danh sách Option</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddColorForm(prev => !prev)}
                          title="Tạo màu mới"
                          className={`text-sm font-bold flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 transition-all ${showAddColorForm ? "bg-purple-50 text-purple-700 border-purple-400 shadow-sm" : "text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300"}`}
                        >
                          <Pipette size={16} /> Nhúng mã màu mới
                        </button>
                        <button type="button" onClick={() => setVariants([...variants, { color_id: colorOptions[0]?.id || "1", size_id: sizeOptions[0]?.id || "1", price: "2500000", stock: "0", colorway_name: "" }])} className="text-sm font-bold bg-gray-100 text-gray-800 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors flex items-center gap-1.5 shadow-sm">
                          <Plus size={16}/> Thêm dòng
                        </button>
                      </div>
                    </div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh Gallery theo màu sắc</label>
                    
                    {uniqueSelectedColors.map((colorId) => {
                      const colorOption = colorOptions.find(c => c.id === colorId);
                      const colorName = colorOption?.name || "Màu chưa rõ";
                      const hexColor = colorOption?.hex_code || "#cccccc";
                      const colorData = galleryByColor[colorId] || { files: [], previews: [] };
                      const existingImages = existingGalleryByColor[colorId] || [];

                      return (
                        <div key={colorId} className="mb-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                          {/* Header: hex dot + tên màu */}
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className="shrink-0 w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                              style={{ backgroundColor: hexColor }}
                            />
                            <p className="text-sm font-bold text-gray-800">
                              📸 Ảnh cho màu: <span className="text-orange-600">{colorName}</span>
                            </p>
                          </div>

                          {/* Ảnh gallery hiện có (khi đang chỉnh sửa) */}
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

                          {/* Upload ảnh mới */}
                          <input 
                            type="file" multiple accept="image/*" 
                            onChange={(e) => handleGalleryByColorChange(colorId, e)} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-black hover:file:bg-gray-300 transition-colors mb-3" 
                          />
                          
                          {/* Preview ảnh mới chọn */}
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
                      );
                    })}
                    {uniqueSelectedColors.length === 0 && <p className="text-xs text-gray-400 italic">Vui lòng chọn biến thể màu sắc ở bên dưới trước để tải ảnh lên.</p>}
                  </div>

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
                        <button type="button" onClick={() => setVariants([...variants, { color_id: colorOptions[0]?.id || "1", size_id: sizeOptions[0]?.id || "1", price: "2500000", stock: "0", colorway_name: "" }])} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Plus size={16}/> Thêm size/màu
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

                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {variants.map((v, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl relative group hover:border-gray-300 hover:shadow-sm transition-all">
                          {variants.length > 1 && (
                            <button type="button" title="Xoá dòng hiển thị này" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="absolute -top-3 -right-3 w-7 h-7 bg-white text-red-500 rounded-full border border-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:scale-110 shadow-sm z-10"><X size={14}/></button>
                          )}
                          <div className="col-span-1">
                            <span className="text-xs font-black text-gray-500 uppercase">Màu cơ sở</span>
                            <div className="flex items-center gap-2 mt-1.5 focus-within:ring-2 focus-within:ring-black rounded-lg transition-shadow">
                              <span
                                className="shrink-0 w-6 h-6 rounded-md border border-gray-300 shadow-sm ml-1"
                                title={colorOptions.find(c => c.id === v.color_id)?.name || ""}
                                style={{ backgroundColor: colorOptions.find(c => c.id === v.color_id)?.hex_code || "#cccccc" }}
                              />
                              <select
                                value={v.color_id}
                                onChange={e => { const newV = [...variants]; newV[index].color_id = e.target.value; setVariants(newV); }}
                                className="w-full text-base font-bold bg-transparent border-0 py-2 pl-1 pr-3 focus:ring-0 text-gray-900 cursor-pointer"
                              >
                                {colorOptions.length === 0 ? <option value="">Đang tải...</option> : colorOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          <div className="col-span-1 border-l border-gray-200 pl-4">
                            <span className="text-xs font-black text-gray-500 uppercase">Size</span>
                            <select value={v.size_id} onChange={e => {const newV = [...variants]; newV[index].size_id = e.target.value; setVariants(newV);}} className="w-full text-base font-black bg-transparent border-0 mt-1.5 p-0 py-1 focus:ring-0 text-gray-900 cursor-pointer">
                              {sizeOptions.length === 0 ? <option value="">Đang tải...</option> : sizeOptions.map(s => <option key={s.id} value={s.id}>US {s.name}</option>)}
                            </select>
                          </div>
                          
                          <div className="col-span-1 border-l border-gray-200 pl-4">
                            <span className="text-xs font-black text-gray-500 uppercase">Giá bán lẻ</span>
                            <input type="number" placeholder="2,500,000" value={v.price} onChange={e => {const newV = [...variants]; newV[index].price = e.target.value; setVariants(newV);}} className="w-full text-base font-black bg-transparent border-0 mt-1.5 p-0 focus:ring-0 text-blue-600 appearance-none" />
                          </div>
                          
                          <div className="col-span-1 border-l border-gray-200 pl-4">
                            <div className="flex justify-between items-end mb-1">
                              <span className="text-xs font-black text-gray-500 uppercase">{(v as any).id ? "Kho hiện tại" : "Kho gốc"}</span>
                            </div>
                            {editingId ? (
                              <div className="text-base font-black text-gray-400 mt-1.5 pl-1 italic" title="Quản lí kho từ module Kho Hàng">Khoá thay đổi</div>
                            ) : (
                              <input 
                                type="number" min="0" placeholder="0"
                                value={v.stock || "0"} 
                                onChange={e => {const newV = [...variants]; newV[index].stock = e.target.value; setVariants(newV);}} 
                                className="w-full text-base font-black bg-transparent border-0 mt-1.5 p-0 focus:ring-0 text-green-600 appearance-none" 
                              />
                            )}
                          </div>

                          {/* 🎨 COLORWAY NAME — TÔN PHỐI MÀU (trải dài full width) */}
                          <div className="col-span-4 mt-2 mb-1 px-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-black text-orange-600 uppercase">Phối Màu Kỹ Thuật Số (Tùy Chọn)</span>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="VD: Neutral Grey/Summit White/Infrared 23..."
                                value={(v as any).colorway_name || ""}
                                onChange={e => { const newV = [...variants]; (newV[index] as any).colorway_name = e.target.value; setVariants(newV); }}
                                className="w-full text-sm border-0 border-b-2 border-orange-200 bg-orange-50/20 py-2 focus:ring-0 focus:border-orange-500 placeholder:text-gray-300 transition-colors font-medium text-gray-800"
                              />
                            </div>
                            {(v as any).colorway_name && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                {((v as any).colorway_name as string).split('/').map((part: string, i: number) => {
                                  if (!part.trim()) return null;
                                  return (
                                    <span key={i} className="text-[10px] font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-md shadow-sm">
                                      {part.trim()}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 flex justify-between items-center max-w-5xl mx-auto">
                    <button type="button" onClick={() => setActiveModalTab("info")} className="text-gray-500 font-bold hover:text-black transition-colors underline decoration-2 underline-offset-4">
                      ⬅️ Quay lại thông tin
                    </button>
                    <button type="button" onClick={() => setActiveModalTab("gallery")} className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-md">
                      Tiếp theo: Bộ Sưu Tập Ảnh ➡️
                    </button>
                  </div>
                </div>

                {/* ────────────────────────────────────────────────────────
                    TAB 3: GALLERY & MEDIA
                ──────────────────────────────────────────────────────── */}
                <div className={activeModalTab === "gallery" ? "block animate-[fadeIn_0.3s_ease-out]" : "hidden"}>
                  <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-6 flex items-start gap-3 border border-green-100">
                    <span className="text-xl">📸</span>
                    <p className="text-sm font-medium leading-relaxed">Mỗi góc chụp giúp trải nghiệm mua sắm của Khách hàng hoàn hảo hơn. Tải lên 3-5 ảnh cho mỗi màu sắc ở bên dưới.</p>
                  </div>
                  
                  <div className="max-w-4xl mx-auto space-y-6">
                    <label className="block text-lg font-black text-gray-900 border-b border-gray-100 pb-2 mb-4">Tải Ảnh (Group theo màu sắc)</label>
                    
                    {uniqueSelectedColors.map((colorId) => {
                      const colorOption = colorOptions.find(c => c.id === colorId);
                      const colorName = colorOption?.name || "Màu gốc";
                      const hexColor = colorOption?.hex_code || "#cccccc";
                      const colorData = galleryByColor[colorId] || { files: [], previews: [] };
                      const existingImages = existingGalleryByColor[colorId] || [];

                      return (
                        <div key={colorId} className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white hover:border-gray-300 transition-colors">
                          {/* Header: hex dot + tên màu */}
                          <div className="flex items-center gap-3 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 w-fit">
                            <span
                              className="shrink-0 w-6 h-6 rounded-md border-2 border-white ring-1 ring-gray-200 shadow-sm"
                              style={{ backgroundColor: hexColor }}
                            />
                            <p className="text-base font-black text-gray-800 uppercase tracking-wide">
                              Màu <span className="text-green-700">{colorName}</span>
                            </p>
                          </div>

                          {/* Ảnh gallery hiện có (khi đang chỉnh sửa) */}
                          {editingId && existingImages.length > 0 && (
                            <div className="mb-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">🖼️ Ảnh cũ đang lưu trữ</p>
                              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {existingImages.map((imgUrl, idx) => (
                                  <div key={idx} className="relative shrink-0 w-24 h-24 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-transform hover:scale-105">
                                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-orange-500 font-bold mt-3 italic">⚠️ Nếu bạn chọn tải lên hình mới bên dưới, các hình cũ của màu này sẽ bị xóa bỏ.</p>
                            </div>
                          )}

                          {/* Upload ảnh mới */}
                          <div className="relative">
                            <input 
                              type="file" multiple accept="image/*" 
                              onChange={(e) => handleGalleryByColorChange(colorId, e)} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm" 
                            />
                            <div className="w-full border-2 border-dashed border-green-200 rounded-xl p-6 flex flex-col items-center justify-center bg-green-50/50 hover:bg-green-50 transition-colors text-green-700">
                              <Upload className="mb-2 opacity-50" size={24} />
                              <p className="font-bold">Bấm vào đây duyệt file hoặc kéo thả ảnh</p>
                            </div>
                          </div>
                          
                          {/* Preview ảnh mới chọn */}
                          {colorData.previews.length > 0 && (
                            <div className="mt-5">
                              <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-3">✅ Ảnh chờ tải lên</p>
                              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {colorData.previews.map((preview, index) => (
                                  <div key={index} className="relative shrink-0 w-28 h-28 border-[3px] border-green-400 rounded-xl overflow-hidden group shadow-sm transition-transform hover:scale-105">
                                    <img src={preview} alt="New Gallery" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeColorGalleryImage(colorId, index)} className="absolute top-1.5 right-1.5 bg-white text-red-500 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md hover:bg-red-50 hover:scale-110">
                                      <X size={14} className="stroke-[3px]" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {uniqueSelectedColors.length === 0 && (
                      <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
                        <span className="text-4xl block mb-2 opacity-30">🎨</span>
                        <p className="text-sm font-bold text-gray-500">Chưa có màu sắc nào được chọn. Hãy qua tab Biến Thể để cấu hình.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-8 flex justify-between items-center max-w-4xl mx-auto">
                    <button type="button" onClick={() => setActiveModalTab("variants")} className="text-gray-500 font-bold hover:text-black transition-colors underline decoration-2 underline-offset-4">
                      ⬅️ Thu lại kho biến thể
                    </button>
                  </div>
                </div>

              </div>
            </form>

            {/* Nút Submit CHUNG nằm ngoài Form Scroll (Luôn hiển thị) */}
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