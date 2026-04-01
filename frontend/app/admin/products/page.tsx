"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminProductAPI } from "../../services/api";
import toast, { Toaster } from "react-hot-toast";
import { Package, Plus, X, Upload, Edit, Trash2 } from "lucide-react";

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
  
  // State Biến thể (Mặc định có 1 dòng)
  const [variants, setVariants] = useState([
    { color_id: "1", size_id: "1", price: "2500000", stock: "50" }
  ]);

  // THÊM STATE QUẢN LÝ GALLERY THEO NHÓM MÀU
  const [galleryByColor, setGalleryByColor] = useState<Record<string, { files: File[], previews: string[] }>>({});

  // Danh mục màu (tạm thời fix cứng theo DB, nếu sau này bạn có API lấy màu thì thay bằng mảng từ API)
  const colorOptions = [
    { id: "1", name: "Trắng" }, 
    { id: "2", name: "Đen" }, 
    { id: "3", name: "Đỏ" }
  ];

  // Lọc ra các ID màu sắc độc nhất mà người dùng đang chọn ở phần Biến thể
  const uniqueSelectedColors = Array.from(new Set(variants.map(v => v.color_id)));

  useEffect(() => {
    if (token) fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminProductAPI.getAll(token || "");
      if (res.success) setProducts(res.data.data || []);
    } catch (error) {
      toast.error("Lỗi kết nối máy chủ");
    }
    setLoading(false);
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
    
    // Reset lại gallery
    setGalleryByColor({});

    // Đổ danh sách Biến thể ra
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map((v: any) => ({
        id: v.id,
        color_id: v.color_id?.toString() || "1",
        size_id: v.size_id?.toString() || "1",
        price: Number(v.price).toString(),
        stock: "0" 
      })));
    } else {
      setVariants([{ color_id: "1", size_id: "1", price: "0", stock: "0" }]);
    }

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
      
      if (imageFile) {
        formData.append("base_image", imageFile);
      }
      
      // NHÉT ẢNH PHỤ THEO TỪNG NHÓM MÀU VÀO FORMDATA
      Object.entries(galleryByColor).forEach(([colorId, data]) => {
        data.files.forEach((file) => {
          formData.append(`gallery_images[${colorId}][]`, file); 
        });
      });

      formData.append("variants", JSON.stringify(variants));

      let res;
      if (editingId) {
        res = await adminProductAPI.update(editingId, formData, token);
      } else {
        res = await adminProductAPI.create(formData, token);
      }
      
      if (res.success) {
        toast.success(editingId ? "Đã cập nhật thành công!" : "Đã thêm sản phẩm thành công!");
        setShowModal(false);
        fetchProducts(); 
        
        // Reset sạch sẽ form
        setEditingId(null);
        setForm({ name: "", category_id: "1", brand_id: "1", description: "", branch_id: "1" });
        setImageFile(null); 
        setPreviewUrl(null); 
        setGalleryByColor({}); // Reset state gallery
        setVariants([{ color_id: "1", size_id: "1", price: "2500000", stock: "50" }]);
      } else {
        toast.error(res.message || (editingId ? "Lỗi khi cập nhật sản phẩm" : "Lỗi khi thêm sản phẩm"));
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
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", category_id: "1", brand_id: "1", description: "", branch_id: "1" });
              setImageFile(null); setPreviewUrl(null); setGalleryByColor({});
              setVariants([{ color_id: "1", size_id: "1", price: "2500000", stock: "50" }]);
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
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Danh mục</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Giá cơ bản</th>
                      <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {products.map((product: any) => (
                      <tr key={product.id} className="hover:bg-orange-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={product.base_image_url || "/placeholder.jpg"}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-200 bg-white"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 max-w-xs truncate">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          {product.category?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          {product.brand?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-600">
                          {product.variants?.length > 0 
                            ? `${Number(product.variants[0].price).toLocaleString('vi-VN')} ₫` 
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleEditClick(product)} 
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Sửa sản phẩm"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
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
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-2xl font-black text-gray-900">{editingId ? "CẬP NHẬT SẢN PHẨM" : "TẠO SẢN PHẨM MỚI"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 p-2 rounded-full">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Cột 1: Thông tin cơ bản */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tên Sản Phẩm *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-3 border bg-gray-50" placeholder="VD: Nike Air Jordan 1 Retro" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Danh mục *</label>
                      <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-3 border bg-gray-50">
                        <option value="1">Giày Nam</option>
                        <option value="2">Giày Nữ</option>
                        <option value="3">Sneaker Nam</option>
                        <option value="4">Giày Chạy Bộ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Thương hiệu *</label>
                      <select value={form.brand_id} onChange={e => setForm({...form, brand_id: e.target.value})} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-3 border bg-gray-50">
                        <option value="1">Nike</option>
                        <option value="2">Adidas</option>
                        <option value="3">Vans</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả chi tiết</label>
                    <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-black focus:border-black p-3 border bg-gray-50" placeholder="Nhập mô tả sản phẩm..." />
                  </div>
                </div>

                {/* Cột 2: Ảnh & Biến thể */}
                <div className="space-y-6">
                  {/* Upload Ảnh Đại Diện */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh Đại Diện</label>
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 w-28 h-28 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gray-50 overflow-hidden">
                        {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <Upload className="text-gray-400" />}
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-black file:text-white hover:file:bg-gray-800 transition-colors" />
                    </div>
                  </div>
                  
                  {/* TÍCH HỢP GALLERY THEO MÀU SẮC */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh Gallery theo màu sắc</label>
                    
                    {uniqueSelectedColors.map((colorId) => {
                      const colorName = colorOptions.find(c => c.id === colorId)?.name || "Màu chưa rõ";
                      const colorData = galleryByColor[colorId] || { files: [], previews: [] };

                      return (
                        <div key={colorId} className="mb-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                          <p className="text-sm font-bold text-gray-800 mb-2">📸 Tải ảnh cho màu: <span className="text-orange-600">{colorName}</span></p>
                          <input 
                            type="file" multiple accept="image/*" 
                            onChange={(e) => handleGalleryByColorChange(colorId, e)} 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-black hover:file:bg-gray-300 transition-colors mb-3" 
                          />
                          
                          {colorData.previews.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                              {colorData.previews.map((preview, index) => (
                                <div key={index} className="relative shrink-0 w-20 h-20 border border-gray-200 rounded-xl overflow-hidden group">
                                  <img src={preview} alt="Gallery Preview" className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => removeColorGalleryImage(colorId, index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {uniqueSelectedColors.length === 0 && <p className="text-xs text-gray-400 italic">Vui lòng chọn biến thể màu sắc ở bên dưới trước để tải ảnh lên.</p>}
                  </div>

                  {/* Quản lý Biến thể (Màu / Size) */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-black text-gray-900 uppercase">Danh sách Phân loại</label>
                      <button type="button" onClick={() => setVariants([...variants, { color_id: "1", size_id: "1", price: "2500000", stock: "0" }])} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <Plus size={16}/> Thêm size/màu
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {variants.map((v, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100 relative group">
                          {variants.length > 1 && (
                            <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12}/>
                            </button>
                          )}
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Màu</span>
                            <select value={v.color_id} onChange={e => {const newV = [...variants]; newV[index].color_id = e.target.value; setVariants(newV);}} className="w-full text-sm border-gray-300 rounded-md p-1.5 border">
                              <option value="1">Trắng</option><option value="2">Đen</option><option value="3">Đỏ</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Size</span>
                            <select value={v.size_id} onChange={e => {const newV = [...variants]; newV[index].size_id = e.target.value; setVariants(newV);}} className="w-full text-sm border-gray-300 rounded-md p-1.5 border">
                              <option value="1">39</option><option value="2">40</option><option value="3">41</option><option value="4">42</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Giá bán</span>
                            <input type="number" value={v.price} onChange={e => {const newV = [...variants]; newV[index].price = e.target.value; setVariants(newV);}} className="w-full text-sm border-gray-300 rounded-md p-1.5 border" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Nút Submit */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end gap-4 shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl font-black text-white bg-black hover:bg-orange-600 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? "Đang xử lý..." : (editingId ? "CẬP NHẬT" : "LƯU SẢN PHẨM MỚI")}
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