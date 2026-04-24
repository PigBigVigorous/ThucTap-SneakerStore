"use client";

import { useState, useEffect } from "react";
import { X, MapPin, User, Phone, Check } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type LocationItem = { code: string; name: string };

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  token: string;
}

const FloatingInput = ({ label, name, type = "text", value, onChange, icon, required = true }: any) => (
  <div className="relative w-full group">
    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-800 transition-colors z-10 pointer-events-none">{icon}</div>}
    <input
      type={type} name={name} value={value} onChange={onChange}
      className={`block ${icon ? 'pl-11' : 'pl-4'} pr-4 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent peer transition-all`}
      placeholder=" " required={required}
    />
    <label className={`absolute text-sm text-gray-400 duration-200 transform -translate-y-2.5 scale-[0.80] top-4 z-10 origin-[0] ${icon ? 'left-11' : 'left-4'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.80] peer-focus:-translate-y-2.5 cursor-text pointer-events-none font-medium`}>
      {label}
    </label>
  </div>
);

const CustomSelect = ({ label, value, onChange, options, disabled, defaultOption, icon }: any) => (
  <div className="relative w-full group">
    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">{icon}</div>}
    <select
      value={value || ""} onChange={onChange} disabled={disabled}
      className={`block ${icon ? 'pl-11' : 'pl-4'} pr-10 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
      required
    >
      <option value="" disabled hidden></option>
      {defaultOption && <option value="" disabled>{defaultOption}</option>}
      {Array.isArray(options) && options.map((opt: any) => (
        <option key={opt.code} value={opt.code}>{opt.name}</option>
      ))}
    </select>
    <label className={`absolute text-sm duration-200 transform top-4 z-10 origin-[0] ${icon ? 'left-11' : 'left-4'} pointer-events-none font-medium transition-all ${value ? 'text-gray-400 scale-[0.80] -translate-y-2.5' : 'text-gray-400'}`}>
      {label}
    </label>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
);

export default function AddressModal({ isOpen, onClose, onSuccess, initialData, token }: AddressModalProps) {
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    receiver_name: "",
    phone_number: "",
    address_detail: "",
    is_default: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchProvinces();
      if (initialData) {
        setFormData({
          receiver_name: initialData.receiver_name || "",
          phone_number: initialData.phone_number || "",
          address_detail: initialData.address_detail || "",
          is_default: initialData.is_default || false
        });
        setSelectedProvinceCode(initialData.province_id?.toString() || "");
        if (initialData.province_id) fetchDistricts(initialData.province_id.toString(), initialData.district_id?.toString());
        if (initialData.district_id) fetchWards(initialData.district_id.toString(), initialData.ward_id?.toString());
      } else {
        setFormData({ receiver_name: "", phone_number: "", address_detail: "", is_default: false });
        setSelectedProvinceCode(""); setSelectedDistrictCode(""); setSelectedWardCode("");
      }
    }
  }, [isOpen, initialData]);

  const fetchProvinces = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/provinces`);
      const d = await r.json();
      setProvinces(Array.isArray(d) ? d : d.data || []);
    } catch (e) {}
  };

  const fetchDistricts = async (pCode: string, dCodeToSet?: string) => {
    try {
      const r = await fetch(`${API_BASE_URL}/districts/${pCode}`);
      const d = await r.json();
      const list = Array.isArray(d) ? d : d.data || [];
      setDistricts(list);
      if (dCodeToSet) setSelectedDistrictCode(dCodeToSet);
    } catch (e) {}
  };

  const fetchWards = async (dCode: string, wCodeToSet?: string) => {
    try {
      const r = await fetch(`${API_BASE_URL}/wards/${dCode}`);
      const d = await r.json();
      const list = Array.isArray(d) ? d : d.data || [];
      setWards(list);
      if (wCodeToSet) setSelectedWardCode(wCodeToSet);
    } catch (e) {}
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedProvinceCode(code); setSelectedDistrictCode(""); setSelectedWardCode("");
    setDistricts([]); setWards([]);
    if (code) fetchDistricts(code);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedDistrictCode(code); setSelectedWardCode("");
    setWards([]);
    if (code) fetchWards(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        province_id: parseInt(selectedProvinceCode),
        district_id: parseInt(selectedDistrictCode),
        ward_id: parseInt(selectedWardCode),
      };
      
      const method = initialData ? "PUT" : "POST";
      const url = initialData 
        ? `${API_BASE_URL}/user/addresses/${initialData.id}` 
        : `${API_BASE_URL}/user/addresses`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(initialData ? "Cập nhật thành công!" : "Thêm thành công!");
        onSuccess();
        onClose();
      } else {
        toast.error("Vui lòng điền đủ thông tin");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingInput name="receiver_name" label="Người nhận *" value={formData.receiver_name} onChange={(e: any) => setFormData({...formData, receiver_name: e.target.value})} icon={<User size={16} />} />
            <FloatingInput name="phone_number" label="Số điện thoại *" value={formData.phone_number} onChange={(e: any) => setFormData({...formData, phone_number: e.target.value})} icon={<Phone size={16} />} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={15} />} />
            <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange} options={districts} disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={(e: any) => setSelectedWardCode(e.target.value)} options={wards} disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
            <FloatingInput name="address_detail" label="Số nhà, Tên đường *" value={formData.address_detail} onChange={(e: any) => setFormData({...formData, address_detail: e.target.value})} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer group w-fit pt-2">
            <input 
              type="checkbox" 
              checked={formData.is_default} 
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Đặt làm địa chỉ mặc định</span>
          </label>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 border border-gray-200 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !selectedWardCode || !formData.address_detail || !formData.receiver_name}
              className="flex-[2] bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all disabled:bg-gray-200 disabled:text-gray-400 shadow-lg shadow-gray-900/10"
            >
              {loading ? "Đang xử lý..." : initialData ? "Lưu thay đổi" : "Thêm địa chỉ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
