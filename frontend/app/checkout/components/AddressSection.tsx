"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Phone, User, Check, Plus, ChevronRight, Truck, Landmark, Edit2, Trash2 } from "lucide-react";
import { addressAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type LocationItem = { code: string; name: string };

type AddressSectionProps = {
  isLoggedIn: boolean;
  onAddressSelect: (data: {
    addressId?: number;
    manualData?: any;
    displayInfo: string;
    shippingData: { province: string; district: string; ward: string };
  }) => void;
};

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

export default function AddressSection({ isLoggedIn, onAddressSelect }: AddressSectionProps) {
  const { user, token } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"selected" | "list" | "add">(isLoggedIn ? "selected" : "add");
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  // Form State for Adding New Address
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [formData, setFormData] = useState({
    shipping_name: "",
    shipping_phone: "",
    address_detail: "",
    is_default: false
  });

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchAddresses();
    }
  }, [isLoggedIn, token]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressAPI.getAll(token!);
      if (Array.isArray(res)) {
        setAddresses(res);
        if (res.length > 0) {
          const defaultAddr = res.find((a: any) => a.is_default) || res[0];
          handleSelect(defaultAddr);
          setViewMode("selected");
        } else {
          setViewMode("add");
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (addr: any) => {
    setSelectedAddress(addr);
    onAddressSelect({
      addressId: addr.id,
      displayInfo: `${addr.shipping_name} | ${addr.shipping_phone}\n${addr.address_detail}, ${addr.ward?.name}, ${addr.district?.name}, ${addr.province?.name}`,
      shippingData: {
        province: addr.province?.name || "",
        district: addr.district?.name || "",
        ward: addr.ward?.name || ""
      },
      // @ts-ignore
      contactInfo: { name: addr.shipping_name, phone: addr.shipping_phone, email: "" },
      // @ts-ignore
      detailAddress: addr.address_detail
    });
    setViewMode("selected");
  };

  // Load provinces
  useEffect(() => {
    if (viewMode === "add") {
      fetch(`${API_BASE_URL}/provinces`).then(r => r.json())
        .then(d => { if (Array.isArray(d)) setProvinces(d); else if (d?.data) setProvinces(d.data); })
        .catch(() => { });
    }
  }, [viewMode]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedProvinceCode(code); setSelectedDistrictCode(""); setSelectedWardCode("");
    setDistricts([]); setWards([]);
    if (code) fetch(`${API_BASE_URL}/districts/${code}`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDistricts(d); else if (d?.data) setDistricts(d.data); });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedDistrictCode(code); setSelectedWardCode("");
    setWards([]);
    if (code) fetch(`${API_BASE_URL}/wards/${code}`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWards(d); else if (d?.data) setWards(d.data); });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  // useEffect thay thế form onChange để tránh stale closure
  const syncGuestDataToParent = useCallback(() => {
    if (isLoggedIn) return;
    const provinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || "";
    const districtName = districts.find(d => d.code === selectedDistrictCode)?.name || "";
    const wardName = wards.find(w => w.code === selectedWardCode)?.name || "";
    onAddressSelect({
      manualData: { ...formData, province: provinceName, district: districtName, ward: wardName },
      displayInfo: `${formData.shipping_name} | ${formData.shipping_phone}\n${formData.address_detail}, ${wardName}, ${districtName}, ${provinceName}`,
      shippingData: { province: provinceName, district: districtName, ward: wardName },
      // @ts-ignore
      contactInfo: { name: formData.shipping_name, phone: formData.shipping_phone, email: "" },
      // @ts-ignore
      detailAddress: formData.address_detail
    });
  }, [isLoggedIn, formData, selectedProvinceCode, selectedDistrictCode, selectedWardCode, provinces, districts, wards, onAddressSelect]);

  useEffect(() => {
    syncGuestDataToParent();
  }, [syncGuestDataToParent]);

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      // Guest logic: just pass data to parent
      const provinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || "";
      const districtName = districts.find(d => d.code === selectedDistrictCode)?.name || "";
      const wardName = wards.find(w => w.code === selectedWardCode)?.name || "";

      onAddressSelect({
        manualData: {
          ...formData,
          province: provinceName,
          district: districtName,
          ward: wardName
        },
        displayInfo: `${formData.shipping_name} | ${formData.shipping_phone}\n${formData.address_detail}, ${wardName}, ${districtName}, ${provinceName}`,
        shippingData: { province: provinceName, district: districtName, ward: wardName }
      });
      return;
    }

    // Member logic: Save to DB then select
    setLoading(true);
    try {
      const payload = {
        ...formData,
        province_id: parseInt(selectedProvinceCode),
        district_id: parseInt(selectedDistrictCode),
        ward_id: parseInt(selectedWardCode),
        is_default: formData.is_default || addresses.length === 0
      };
      const res = await addressAPI.create(payload, token!);
      toast.success("Đã thêm địa chỉ mới!");
      // Re-fetch or add to list
      const newAddr = res; // Assuming backend returns the object with relationships
      // We might need to fetch again to get the nested province/district/ward names
      fetchAddresses();
    } catch (error) {
      toast.error("Không thể lưu địa chỉ.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
          Địa chỉ giao hàngr
        </h2>
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FloatingInput name="shipping_name" label="Người nhận *" value={formData.shipping_name} onChange={handleInputChange} icon={<User size={16} />} />
            <FloatingInput name="shipping_phone" label="Số điện thoại *" value={formData.shipping_phone} onChange={handleInputChange} icon={<Phone size={16} />} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={15} />} />
            <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange} options={districts} disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={(e: any) => setSelectedWardCode(e.target.value)} options={wards} disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
            <FloatingInput name="address_detail" label="Số nhà, Tên đường *" value={formData.address_detail} onChange={handleInputChange} />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
          Địa chỉ giao hàng
        </h2>
        {viewMode === "selected" && (
          <button
            onClick={() => setViewMode("list")}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            Thay đổi
          </button>
        )}
        {(viewMode === "list" || viewMode === "add") && (
          <button
            onClick={() => setViewMode("selected")}
            className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            Quay lại
          </button>
        )}
      </div>

      {viewMode === "selected" && selectedAddress && (
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 relative group transition-all hover:border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
              <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-900">{selectedAddress.shipping_name}</span>
                <span className="text-gray-400 text-xs">|</span>
                <span className="text-gray-600 text-sm">{selectedAddress.shipping_phone}</span>
                {selectedAddress.is_default && (
                  <span className="text-[10px] font-bold bg-gray-900 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Mặc định</span>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed truncate sm:whitespace-normal">
                {selectedAddress.address_detail}, {selectedAddress.ward?.name}, {selectedAddress.district?.name}, {selectedAddress.province?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 gap-2.5">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => handleSelect(addr)}
                className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddress?.id === addr.id ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                  {selectedAddress?.id === addr.id && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900">{addr.shipping_name}</span>
                    <span className="text-gray-500 text-xs">| {addr.shipping_phone}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {addr.address_detail}, {addr.ward?.name}, {addr.district?.name}, {addr.province?.name}
                  </p>
                </div>
              </div>
            ))}
            <button
              onClick={() => setViewMode("add")}
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all bg-white"
            >
              <Plus size={18} /> Thêm địa chỉ mới
            </button>
          </div>
        </div>
      )}

      {viewMode === "add" && (
        <form onSubmit={handleSubmitNew} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingInput name="shipping_name" label="Người nhận *" value={formData.shipping_name} onChange={handleInputChange} icon={<User size={16} />} />
            <FloatingInput name="shipping_phone" label="Số điện thoại *" value={formData.shipping_phone} onChange={handleInputChange} icon={<Phone size={16} />} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={15} />} />
            <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange} options={districts} disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={(e: any) => setSelectedWardCode(e.target.value)} options={wards} disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
            <FloatingInput name="address_detail" label="Số nhà, Tên đường *" value={formData.address_detail} onChange={handleInputChange} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer group w-fit">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData(f => ({ ...f, is_default: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Đặt làm địa chỉ mặc định</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !selectedWardCode || !formData.address_detail}
              className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:bg-gray-200 disabled:text-gray-400"
            >
              {loading ? "Đang lưu..." : "Lưu địa chỉ này"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode(addresses.length > 0 ? "list" : "selected")}
              className="px-6 py-3.5 border border-gray-200 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
