"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { addressAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, MapPin, Check, Loader2, Edit2, Trash2, Home, Briefcase, Info } from "lucide-react";
import AddressModal from "./components/AddressModal";

export default function AddressPage() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await addressAPI.getAll(token);
      setAddresses(Array.isArray(response) ? response : []);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách địa chỉ");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSetDefault = async (id: number) => {
    if (!token) return;
    try {
      await addressAPI.setDefault(id, token);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default: addr.id === id
      })));
      toast.success("Đã thiết lập địa chỉ mặc định");
    } catch (error) {
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await addressAPI.delete(id, token);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success("Đã xóa địa chỉ");
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: any) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <MapPin className="text-gray-900" size={24} />
            Địa chỉ của tôi
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Quản lý các địa điểm nhận hàng của bạn</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-gray-900/10 transition-all active:scale-95"
        >
          <Plus size={18} /> Thêm địa chỉ mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="animate-spin text-gray-900 mb-4" size={40} />
            <p className="text-gray-400 font-medium">Đang tải địa chỉ...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin size={40} className="text-gray-200" />
            </div>
            <p className="text-gray-900 font-bold text-lg">Bạn chưa có địa chỉ nào</p>
            <p className="text-gray-400 text-sm mt-1 mb-8">Hãy thêm địa chỉ để thanh toán nhanh hơn!</p>
            <button 
              onClick={openAddModal}
              className="text-gray-900 font-bold flex items-center gap-1 mx-auto hover:underline"
            >
              <Plus size={16} /> Thêm ngay
            </button>
          </div>
        ) : (
          addresses.map((address) => (
            <div 
              key={address.id} 
              className={`group relative p-6 bg-white rounded-3xl border transition-all duration-300 ${address.is_default ? 'border-gray-900 shadow-xl shadow-gray-900/5' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${address.is_default ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'}`}>
                      {address.address_detail.toLowerCase().includes('văn phòng') || address.address_detail.toLowerCase().includes('cty') ? <Briefcase size={20} /> : <Home size={20} />}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-lg">{address.receiver_name}</span>
                        {address.is_default && (
                          <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-tighter">Mặc định</span>
                        )}
                      </div>
                      <span className="text-gray-500 text-sm font-medium">{address.phone_number}</span>
                    </div>
                  </div>
                  
                  <div className="pl-13 md:pl-13 space-y-1">
                    <p className="text-gray-600 leading-relaxed font-medium">
                      {address.address_detail}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {address.ward?.name}, {address.district?.name}, {address.province?.name}
                    </p>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(address)}
                      className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={18} />
                    </button>
                    {!address.is_default && (
                      <button 
                        onClick={() => handleDelete(address.id)}
                        className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  {!address.is_default && (
                    <button 
                      onClick={() => handleSetDefault(address.id)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-900 border border-gray-100 hover:border-gray-900 px-4 py-2 rounded-xl transition-all"
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3 items-start">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-700 leading-relaxed">
          <strong>Mẹo:</strong> Địa chỉ mặc định sẽ được ưu tiên chọn khi bạn thanh toán sản phẩm tại cửa hàng.
        </p>
      </div>

      <AddressModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAddresses}
        initialData={editingAddress}
        token={token || ""}
      />
    </div>
  );
}
