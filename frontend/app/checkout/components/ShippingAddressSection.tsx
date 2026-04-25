"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Phone, User, Check, Plus, Truck, Edit2, Trash2, Home, Briefcase, ChevronDown, Mail } from "lucide-react";
import { addressAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type LocationItem = { code: string; name: string };

type ShippingAddressSectionProps = {
  isLoggedIn: boolean;
  onAddressSelect: (data: {
    addressId?: number;
    manualData?: any;
    displayInfo: string;
    shippingData: { province: string; district: string; ward: string };
    contactInfo: { name: string; phone: string; email: string };
    detailAddress?: string;
  }) => void;
};

const FloatingInput = ({ label, name, type = "text", value, onChange, icon, required = true }: any) => (
  <div className="relative w-full group">
    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors z-10 pointer-events-none">{icon}</div>}
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
      <ChevronDown size={18} />
    </div>
  </div>
);

export default function ShippingAddressSection({ isLoggedIn, onAddressSelect }: ShippingAddressSectionProps) {
  const { user, token } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(isLoggedIn);
  const [viewMode, setViewMode] = useState<"selected" | "list" | "add">(isLoggedIn ? "selected" : "add");
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [orderEmail, setOrderEmail] = useState("");

  // Form State for Adding/Guest
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [formData, setFormData] = useState({
    receiver_name: "",
    phone_number: "",
    email: "",
    address_detail: "",
    is_default: false
  });

  useEffect(() => {
    if (isLoggedIn && user?.email && !orderEmail) {
      setOrderEmail(user.email);
    }
  }, [isLoggedIn, user, orderEmail]);

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await addressAPI.getAll(token);
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
  }, [token]);

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchAddresses();
    }
  }, [isLoggedIn, token, fetchAddresses]);

  const handleSelect = (addr: any) => {
    setSelectedAddress(addr);
    onAddressSelect({
      addressId: addr.id,
      displayInfo: `${addr.receiver_name} | ${addr.phone_number}\n${addr.address_detail}, ${addr.ward?.name}, ${addr.district?.name}, ${addr.province?.name}`,
      shippingData: {
        province: addr.province?.name || "",
        district: addr.district?.name || "",
        ward: addr.ward?.name || ""
      },
      contactInfo: {
        name: addr.receiver_name,
        phone: addr.phone_number,
        email: orderEmail || user?.email || ""
      },
      detailAddress: addr.address_detail
    });
    setViewMode("selected");
  };

  // Unified effect to notify parent of address changes
  useEffect(() => {
    if (isLoggedIn) {
      if (selectedAddress) {
        // Mode "selected": dùng địa chỉ đã chọn
        onAddressSelect({
          addressId: selectedAddress.id,
          displayInfo: `${selectedAddress.receiver_name} | ${selectedAddress.phone_number}\n${selectedAddress.address_detail}, ${selectedAddress.ward?.name}, ${selectedAddress.district?.name}, ${selectedAddress.province?.name}`,
          shippingData: {
            province: selectedAddress.province?.name || "",
            district: selectedAddress.district?.name || "",
            ward: selectedAddress.ward?.name || ""
          },
          contactInfo: {
            name: selectedAddress.receiver_name,
            phone: selectedAddress.phone_number,
            email: orderEmail || user?.email || ""
          },
          detailAddress: selectedAddress.address_detail
        });
      } else if (viewMode === "add") {
        // Mode "add": user đã đăng nhập đang điền form thêm địa chỉ mới - sync trực tiếp form
        const provinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || "";
        const districtName = districts.find(d => d.code === selectedDistrictCode)?.name || "";
        const wardName = wards.find(w => w.code === selectedWardCode)?.name || "";
        onAddressSelect({
          displayInfo: `${formData.receiver_name} | ${formData.phone_number}\n${formData.address_detail}, ${wardName}, ${districtName}, ${provinceName}`,
          shippingData: { province: provinceName, district: districtName, ward: wardName },
          contactInfo: {
            name: formData.receiver_name,
            phone: formData.phone_number,
            email: orderEmail || formData.email || user?.email || ""
          },
          detailAddress: formData.address_detail
        });
      }
    } else {
      // Guest mode
      const provinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || "";
      const districtName = districts.find(d => d.code === selectedDistrictCode)?.name || "";
      const wardName = wards.find(w => w.code === selectedWardCode)?.name || "";

      onAddressSelect({
        displayInfo: `${formData.receiver_name} | ${formData.phone_number}\n${formData.address_detail}, ${wardName}, ${districtName}, ${provinceName}`,
        shippingData: { province: provinceName, district: districtName, ward: wardName },
        contactInfo: { name: formData.receiver_name, phone: formData.phone_number, email: formData.email },
        detailAddress: formData.address_detail
      });
    }
  }, [
    isLoggedIn,
    viewMode,
    selectedAddress,
    orderEmail,
    formData,
    selectedProvinceCode,
    selectedDistrictCode,
    selectedWardCode,
    provinces,
    districts,
    wards,
    onAddressSelect,
    user?.email
  ]);

  useEffect(() => {
    if (viewMode === "add" || !isLoggedIn) {
      fetch(`${API_BASE_URL}/provinces`).then(r => r.json())
        .then(d => { if (Array.isArray(d)) setProvinces(d); else if (d?.data) setProvinces(d.data); })
        .catch(() => { });
    }
  }, [viewMode, isLoggedIn]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return; // Guests are handled by onChange

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

      // Enrich res with names from current state for immediate parent update
      const provinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || "";
      const districtName = districts.find(d => d.code === selectedDistrictCode)?.name || "";
      const wardName = wards.find(w => w.code === selectedWardCode)?.name || "";

      const enrichedRes = {
        ...res,
        province: { name: provinceName },
        district: { name: districtName },
        ward: { name: wardName },
        receiver_name: res.receiver_name,
        phone_number: res.phone_number,
        address_detail: res.address_detail
      };

      // Directly select the new address
      handleSelect(enrichedRes);
      setViewMode("selected");
      // Refresh list in background
      addressAPI.getAll(token!).then(setAddresses).catch(() => { });
    } catch (error) {
      toast.error("Không thể lưu địa chỉ.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-6 bg-gray-900 rounded-full"></div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin liên hệ</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FloatingInput name="receiver_name" label="Họ tên người nhận *" value={formData.receiver_name} onChange={handleInputChange} icon={<User size={18} />} />
            <FloatingInput name="phone_number" label="Số điện thoại *" value={formData.phone_number} onChange={handleInputChange} icon={<Phone size={18} />} />
          </div>
          <FloatingInput name="email" type="email" label="Email (để nhận thông báo đơn hàng) *" value={formData.email} onChange={handleInputChange} icon={<Mail size={18} />} />
        </div>

        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-6 bg-gray-900 rounded-full"></div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Địa chỉ nhận hàng</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={16} />} />
            <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange} options={districts} disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={(e: any) => setSelectedWardCode(e.target.value)} options={wards} disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
            <FloatingInput name="address_detail" label="Địa chỉ cụ thể (Số nhà, tên đường) *" value={formData.address_detail} onChange={handleInputChange} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Thông tin giao hàng</span>
        </div>
        {viewMode === "selected" && (
          <button
            onClick={() => setViewMode("list")}
            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-tighter bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all active:scale-95"
          >
            Thay đổi địa chỉ
          </button>
        )}
        {(viewMode === "list" || viewMode === "add") && (
          <button
            onClick={() => setViewMode("selected")}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase"
          >
            Quay lại
          </button>
        )}
      </div>

      {loading && viewMode === "selected" && (
        <div className="space-y-6 animate-pulse">
          <div className="p-8 rounded-[2rem] bg-gray-50 border-2 border-gray-100 flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0"></div>
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-6 bg-gray-200 rounded-lg w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded-xl w-full mt-4"></div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "selected" && selectedAddress && !loading ? (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <div className="p-1 rounded-[2rem] bg-white border-2 border-gray-900/5 shadow-xl shadow-gray-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-900/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
            <div className="p-6 relative z-10 flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-gray-900/20">
                <MapPin size={28} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-black text-gray-900 text-xl tracking-tight">{selectedAddress.receiver_name}</span>
                  {selectedAddress.is_default && (
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">Mặc định</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600 font-bold text-sm bg-gray-100 px-3 py-1.5 rounded-xl">
                    <Phone size={14} className="text-gray-400" />
                    {selectedAddress.phone_number}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter">
                    <Truck size={14} />
                    Giao hàng tiêu chuẩn
                  </div>
                </div>
                <p className="text-gray-500 leading-relaxed font-bold text-[15px]">
                  {selectedAddress.address_detail}, {selectedAddress.ward?.name}, {selectedAddress.district?.name}, {selectedAddress.province?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-blue-900/40 uppercase tracking-widest flex items-center gap-2">
                <Mail size={14} /> Xác nhận Email đơn hàng
              </label>
              <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded-md border border-blue-100">Quan trọng</span>
            </div>
            <div className="relative group">
              <input
                type="email"
                placeholder="Nhập email nhận thông báo..."
                value={orderEmail}
                onChange={(e) => setOrderEmail(e.target.value)}
                className="w-full bg-white border border-blue-100 rounded-2xl py-4 pl-5 pr-4 text-sm font-black text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all shadow-sm placeholder:text-gray-300 placeholder:font-bold"
              />
            </div>
            <p className="text-[10px] text-blue-600/70 font-bold uppercase tracking-tighter leading-tight italic">Mã vận đơn và cập nhật trạng thái sẽ được gửi qua email này để bạn tiện theo dõi.</p>
          </div>
        </div>
      ) : viewMode === "selected" && !loading && (
        <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-bold mb-4">Bạn chưa có địa chỉ nhận hàng nào</p>
          <button onClick={() => setViewMode("add")} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-gray-900/10">Thêm địa chỉ ngay</button>
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 gap-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => handleSelect(addr)}
                className={`flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'border-gray-900 bg-white shadow-lg shadow-gray-900/5' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
              >
                <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddress?.id === addr.id ? 'border-gray-900 bg-gray-900' : 'border-gray-200'}`}>
                  {selectedAddress?.id === addr.id && <Check size={14} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{addr.receiver_name}</span>
                    <span className="text-gray-400 text-sm">| {addr.phone_number}</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium line-clamp-1">
                    {addr.address_detail}, {addr.ward?.name}, {addr.district?.name}, {addr.province?.name}
                  </p>
                </div>
              </div>
            ))}
            <button
              onClick={() => setViewMode("add")}
              className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-100 rounded-2xl text-sm font-black text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-all bg-white"
            >
              <Plus size={20} /> THÊM ĐỊA CHỈ MỚI
            </button>
          </div>
        </div>
      )}

      {viewMode === "add" && (
        <form onSubmit={handleSubmitNew} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-gray-900 rounded-full"></div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin người nhận</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FloatingInput name="receiver_name" label="Người nhận *" value={formData.receiver_name} onChange={handleInputChange} icon={<User size={18} />} />
              <FloatingInput name="phone_number" label="Số điện thoại *" value={formData.phone_number} onChange={handleInputChange} icon={<Phone size={18} />} />
            </div>
            <FloatingInput name="email" type="email" label="Email (để nhận thông báo đơn hàng) *" value={formData.email} onChange={handleInputChange} icon={<Mail size={18} />} />
          </div>

          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-gray-900 rounded-full"></div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Địa chỉ chi tiết</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={16} />} />
              <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange} options={districts} disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={(e: any) => setSelectedWardCode(e.target.value)} options={wards} disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
              <FloatingInput name="address_detail" label="Số nhà, Tên đường *" value={formData.address_detail} onChange={handleInputChange} />
            </div>
          </div>

          <label className="flex items-center gap-4 cursor-pointer group w-fit ml-2">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.is_default ? 'bg-gray-900 border-gray-900' : 'border-gray-200 group-hover:border-gray-400'}`}>
              {formData.is_default && <Check size={14} className="text-white" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={formData.is_default}
              onChange={(e) => setFormData(f => ({ ...f, is_default: e.target.checked }))}
            />
            <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">Đặt làm địa chỉ mặc định</span>
          </label>
          <div className="flex gap-4 pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={loading || !selectedWardCode || !formData.address_detail}
              className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/10 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none active:scale-95"
            >
              {loading ? "Đang xử lý..." : "Lưu và sử dụng địa chỉ này"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode(addresses.length > 0 ? "list" : "selected")}
              className="px-8 py-4 border-2 border-gray-100 rounded-2xl font-bold text-sm text-gray-400 hover:bg-gray-50 transition-all active:scale-95"
            >
              HỦY
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
