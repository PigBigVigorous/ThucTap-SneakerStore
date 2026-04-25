"use client";

import { useState, useEffect, useCallback } from "react";
import { X, MapPin, User, Phone, Check, ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type LocationItem = { id: number; code: string; name: string };

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  token: string;
}

const FloatingInput = ({ label, name, type = "text", value, onChange, icon, required = true }: any) => (
  <div className="relative w-full group">
    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors z-10 pointer-events-none">{icon}</div>}
    <input
      type={type} name={name} value={value} onChange={onChange}
      className={`block ${icon ? 'pl-11' : 'pl-4'} pr-4 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent peer transition-all`}
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
      className={`block ${icon ? 'pl-11' : 'pl-4'} pr-10 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
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
      <ChevronDown size={18} />
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
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const [formData, setFormData] = useState({
    receiver_name: "",
    phone_number: "",
    address_detail: "",
    is_default: false
  });

  const fetchDistricts = useCallback(async (pCode: string, dCodeToSet?: string) => {
    try {
      const r = await fetch(`${API_BASE_URL}/districts/${pCode}`);
      const d = await r.json();
      const list = Array.isArray(d) ? d : d.data || [];
      setDistricts(list);
      if (dCodeToSet) setSelectedDistrictCode(dCodeToSet);
    } catch (e) {}
  }, []);

  const fetchWards = useCallback(async (dCode: string, wCodeToSet?: string) => {
    try {
      const r = await fetch(`${API_BASE_URL}/wards/${dCode}`);
      const d = await r.json();
      const list = Array.isArray(d) ? d : d.data || [];
      setWards(list);
      if (wCodeToSet) setSelectedWardCode(wCodeToSet);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchProvinces = async () => {
        setFetchingLocations(true);
        try {
          const r = await fetch(`${API_BASE_URL}/provinces`);
          const d = await r.json();
          const pList = Array.isArray(d) ? d : d.data || [];
          setProvinces(pList);

          if (initialData) {
            setFormData({
              receiver_name: initialData.receiver_name || "",
              phone_number: initialData.phone_number || "",
              address_detail: initialData.address_detail || "",
              is_default: initialData.is_default || false
            });
            const pCode = initialData.province_id?.toString() || "";
            setSelectedProvinceCode(pCode);
            
            if (pCode) {
              await fetchDistricts(pCode, initialData.district_id?.toString());
              if (initialData.district_id) {
                await fetchWards(initialData.district_id.toString(), initialData.ward_id?.toString());
              }
            }
          } else {
            setFormData({ receiver_name: "", phone_number: "", address_detail: "", is_default: false });
            setSelectedProvinceCode(""); setSelectedDistrictCode(""); setSelectedWardCode("");
            setDistricts([]); setWards([]);
          }
        } catch (e) {
          toast.error("Không thể tải thông tin khu vực");
        } finally {
          setFetchingLocations(false);
        }
      };
      fetchProvinces();
    }
  }, [isOpen, initialData, fetchDistricts, fetchWards]);

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
    if (!selectedWardCode) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Huyện/Xã");
      return;
    }
    setLoading(true);
    try {
      // Tìm ID thực sự từ code đã chọn
      const province = provinces.find(p => p.code === selectedProvinceCode);
      const district = districts.find(d => d.code === selectedDistrictCode);
      const ward = wards.find(w => w.code === selectedWardCode);

      const payload = {
        ...formData,
        province_id: province?.id,
        district_id: district?.id,
        ward_id: ward?.id,
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

      const result = await res.json();

      if (res.ok) {
        toast.success(initialData ? "Cập nhật địa chỉ thành công!" : "Đã thêm địa chỉ mới!");
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || "Vui lòng kiểm tra lại thông tin");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {initialData ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {fetchingLocations ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu khu vực...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FloatingInput 
                name="receiver_name" 
                label="Họ tên người nhận *" 
                value={formData.receiver_name} 
                onChange={(e: any) => setFormData({...formData, receiver_name: e.target.value})} 
                icon={<User size={18} />} 
              />
              <FloatingInput 
                name="phone_number" 
                label="Số điện thoại *" 
                value={formData.phone_number} 
                onChange={(e: any) => setFormData({...formData, phone_number: e.target.value})} 
                icon={<Phone size={18} />} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <CustomSelect 
                label="Tỉnh / Thành phố *" 
                value={selectedProvinceCode} 
                onChange={handleProvinceChange} 
                options={provinces} 
                defaultOption="Chọn Tỉnh/Thành phố" 
                icon={<MapPin size={16} />} 
              />
              <CustomSelect 
                label="Quận / Huyện *" 
                value={selectedDistrictCode} 
                onChange={handleDistrictChange} 
                options={districts} 
                disabled={!selectedProvinceCode} 
                defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <CustomSelect 
                label="Phường / Xã *" 
                value={selectedWardCode} 
                onChange={(e: any) => setSelectedWardCode(e.target.value)} 
                options={wards} 
                disabled={!selectedDistrictCode} 
                defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} 
              />
              <FloatingInput 
                name="address_detail" 
                label="Số nhà, Tên đường *" 
                value={formData.address_detail} 
                onChange={(e: any) => setFormData({...formData, address_detail: e.target.value})} 
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group w-fit pt-2">
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.is_default ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20' : 'border-gray-200 group-hover:border-orange-200'}`}>
                {formData.is_default && <Check size={14} className="text-white" strokeWidth={4} />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={formData.is_default} 
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
              <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">Đặt làm địa chỉ mặc định</span>
            </label>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-sm text-gray-400 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95"
              >
                HỦY BỎ
              </button>
              <button
                type="submit"
                disabled={loading || !selectedWardCode || !formData.address_detail || !formData.receiver_name}
                className="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all disabled:bg-gray-100 disabled:text-gray-300 shadow-xl shadow-gray-900/10 active:scale-95"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    <span>ĐANG XỬ LÝ...</span>
                  </div>
                ) : (
                  initialData ? "LƯU THAY ĐỔI" : "THÊM ĐỊA CHỈ"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
