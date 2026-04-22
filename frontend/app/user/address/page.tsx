"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { addressAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, MapPin, Check, Loader2, MoreVertical } from "lucide-react";

export default function AddressPage() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) return;
      try {
        const response = await addressAPI.getAll(token);
        setAddresses(response || []);
      } catch (error) {
        toast.error("Lỗi khi tải danh sách địa chỉ");
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, [token]);

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

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center border-b border-gray-100 pb-5 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Địa chỉ của tôi</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý địa chỉ giao hàng của bạn</p>
        </div>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-sm flex items-center gap-2 text-sm shadow-sm transition-colors">
          <Plus size={18} /> Thêm địa chỉ mới
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-600" size={32} />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <MapPin size={48} className="mx-auto mb-4 text-gray-200" />
            <p>Bạn chưa có địa chỉ nào.</p>
          </div>
        ) : (
          addresses.map((address) => (
            <div key={address.id} className="flex justify-between items-start border-b border-gray-100 pb-6 last:border-0">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold border-r border-gray-300 pr-3">{address.receiver_name}</span>
                  <span className="text-gray-500">{address.phone_number}</span>
                </div>
                <div className="text-sm text-gray-500">
                  <p>{address.address_detail}</p>
                  <p>
                    {address.ward?.name}, {address.district?.name}, {address.province?.name}
                  </p>
                </div>
                {address.is_default && (
                  <span className="inline-block border border-orange-600 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-sm uppercase font-medium">
                    Mặc định
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-4 text-sm text-blue-600 font-medium">
                  <button className="hover:opacity-70">Cập nhật</button>
                  {!address.is_default && (
                    <button onClick={() => handleDelete(address.id)} className="hover:opacity-70">Xóa</button>
                  )}
                </div>
                {!address.is_default && (
                  <button 
                    onClick={() => handleSetDefault(address.id)}
                    className="border border-gray-300 px-3 py-1 text-xs rounded hover:bg-gray-50 transition-colors"
                  >
                    Thiết lập mặc định
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
