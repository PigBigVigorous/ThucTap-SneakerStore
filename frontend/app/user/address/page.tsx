"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { addressAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, MapPin, Check, Loader2, Edit2, Trash2, Home, Briefcase, Star, Info, ChevronRight, Phone, User } from "lucide-react";
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
      toast.error("Không thể tải danh sách địa chỉ");
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
      toast.error("Không thể cập nhật địa chỉ mặc định");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await addressAPI.delete(id, token);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success("Đã xóa địa chỉ thành công");
    } catch (error) {
      toast.error("Không thể xóa địa chỉ");
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
    <div className="max-w-5xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <MapPin size={22} />
            </div>
            Địa chỉ của tôi
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium ml-13">Quản lý các địa điểm nhận hàng để có trải nghiệm mua sắm tốt nhất</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black shadow-xl shadow-gray-900/10 transition-all active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
          Thêm địa chỉ mới
        </button>
      </div>

      {/* Address List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="relative">
              <Loader2 className="animate-spin text-orange-500" size={48} strokeWidth={3} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-ping" />
              </div>
            </div>
            <p className="text-gray-400 font-bold mt-6 tracking-wide uppercase text-xs">Đang tải dữ liệu...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 group hover:border-orange-200 transition-colors">
            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
              <MapPin size={48} className="text-gray-200" />
            </div>
            <h3 className="text-gray-900 font-black text-xl">Sổ địa chỉ còn trống</h3>
            <p className="text-gray-400 text-sm mt-2 mb-10 max-w-xs mx-auto font-medium">Hãy thêm địa chỉ nhận hàng đầu tiên của bạn để Shopee có thể giao hàng nhanh nhất!</p>
            <button 
              onClick={openAddModal}
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-95"
            >
              Thêm ngay
            </button>
          </div>
        ) : (
          addresses.map((address, index) => (
            <div 
              key={address.id} 
              className={`group relative p-8 bg-white rounded-[2rem] border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-900/5 animate-in fade-in slide-in-from-bottom-4`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Status Ribbon for Default */}
              {address.is_default && (
                <div className="absolute -top-3 left-8 px-4 py-1.5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/30 flex items-center gap-1.5">
                  <Star size={10} fill="currentColor" /> Mặc định
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                <div className="flex-1 space-y-6">
                  {/* Contact Info Header */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${address.is_default ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
                      {address.address_detail.toLowerCase().includes('văn phòng') || address.address_detail.toLowerCase().includes('cty') ? <Briefcase size={24} /> : <Home size={24} />}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-gray-900 text-xl tracking-tight">{address.receiver_name}</span>
                        {!address.is_default && (
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 font-bold text-sm mt-0.5">
                        <Phone size={14} className="text-gray-300" />
                        {address.phone_number}
                      </div>
                    </div>
                  </div>
                  
                  {/* Address Details */}
                  <div className="pl-18 space-y-2 border-l-2 border-gray-50 group-hover:border-orange-100 transition-colors py-1">
                    <p className="text-gray-700 leading-relaxed font-bold text-base">
                      {address.address_detail}
                    </p>
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                      <MapPin size={14} className="text-gray-300" />
                      <span>{address.ward?.name}, {address.district?.name}, {address.province?.name}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 shrink-0 lg:pt-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(address)}
                      className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all duration-300 group/btn"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    {!address.is_default && (
                      <button 
                        onClick={() => handleDelete(address.id)}
                        className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 group/btn"
                        title="Xóa"
                      >
                        <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>
                  
                  {!address.is_default && (
                    <button 
                      onClick={() => handleSetDefault(address.id)}
                      className="text-xs font-black text-gray-400 hover:text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-2xl border-2 border-transparent hover:border-orange-100 transition-all duration-300 uppercase tracking-widest"
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

      {/* Helper Info */}
      <div className="mt-12 p-6 rounded-[2rem] bg-orange-50/50 border border-orange-100 flex gap-4 items-start animate-in fade-in duration-1000 delay-500">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
          <Info className="text-orange-500" size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-orange-900 font-black text-sm uppercase tracking-wide">Bạn có biết?</h4>
          <p className="text-sm text-orange-700/80 leading-relaxed font-medium">
            Việc duy trì sổ địa chỉ chính xác giúp hệ thống tính toán phí vận chuyển và thời gian giao hàng dự kiến một cách tối ưu nhất cho bạn.
          </p>
        </div>
      </div>

      {/* Address Modal */}
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
