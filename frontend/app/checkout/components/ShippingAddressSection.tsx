"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Phone, User, Check, Plus, Truck, ChevronDown, Mail } from "lucide-react";
import { addressAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type LocationItem = { code: string; name: string };

export type ShippingInfo = {
  addressId?: number;
  name: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
};

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

const FloatingInput = ({ label, name, type = "text", value, onChange, icon }: any) => (
  <div className="relative w-full group">
    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors z-10 pointer-events-none">{icon}</div>}
    <input
      type={type} name={name} value={value} onChange={onChange}
      className={`block ${icon ? 'pl-11' : 'pl-4'} pr-4 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent peer transition-all`}
      placeholder=" "
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

  // ─── STATE MEMBER ─────────────────────────────────
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"selected" | "list" | "add">(isLoggedIn ? "selected" : "add");

  // ─── STATE FORM (dùng chung cho Guest + Add new) ──
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [saving, setSaving] = useState(false);

  // ─── SINGLE SOURCE OF TRUTH ───────────────────────
  // Đây là object duy nhất chứa thông tin giao hàng. 
  // Mọi thay đổi (chọn địa chỉ / nhập tay) đều cập nhật vào đây.
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: "", phone: "", email: "", province: "", district: "", ward: "", addressDetail: ""
  });

  // ─── PUSH TO PARENT (gọi mỗi khi shippingInfo thay đổi) ──
  useEffect(() => {
    onAddressSelect({
      addressId: shippingInfo.addressId,
      displayInfo: `${shippingInfo.name} | ${shippingInfo.phone}\n${shippingInfo.addressDetail}, ${shippingInfo.ward}, ${shippingInfo.district}, ${shippingInfo.province}`,
      shippingData: {
        province: shippingInfo.province,
        district: shippingInfo.district,
        ward: shippingInfo.ward,
      },
      contactInfo: {
        name: shippingInfo.name,
        phone: shippingInfo.phone,
        email: shippingInfo.email,
      },
      detailAddress: shippingInfo.addressDetail,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingInfo]);

  // ─── LOAD PROVINCES ───────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || viewMode === "add") {
      fetch(`${API_BASE_URL}/provinces`).then(r => r.json())
        .then(d => { if (Array.isArray(d)) setProvinces(d); else if (d?.data) setProvinces(d.data); })
        .catch(() => { });
    }
  }, [isLoggedIn, viewMode]);

  // ─── LOAD ADDRESSES (MEMBER) ──────────────────────
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setLoadingAddresses(true);
    try {
      const res = await addressAPI.getAll(token);
      if (Array.isArray(res)) {
        setAddresses(res);
        if (res.length > 0) {
          const defaultAddr = res.find((a: any) => a.is_default) || res[0];
          applySelectedAddress(defaultAddr);
          setViewMode("selected");
        } else {
          setViewMode("add");
        }
      }
    } catch { } finally {
      setLoadingAddresses(false);
    }
  }, [token]);

  useEffect(() => {
    if (isLoggedIn && token) fetchAddresses();
  }, [isLoggedIn, token, fetchAddresses]);

  // ─── HELPER: Áp dụng địa chỉ đã lưu vào shippingInfo ──
  const applySelectedAddress = (addr: any) => {
    setSelectedAddress(addr);
    setShippingInfo({
      addressId: addr.id,
      name: addr.receiver_name || "",
      phone: addr.phone_number || "",
      email: user?.email || "",
      province: addr.province?.name || "",
      district: addr.district?.name || "",
      ward: addr.ward?.name || "",
      addressDetail: addr.address_detail || "",
    });
    setViewMode("selected");
  };

  // ─── HELPER: Cập nhật field trực tiếp vào shippingInfo ──
  const handleFieldChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  // ─── XỬ LÝ CHỌN TỈNH/HUYỆN/XÃ (trong form) ──────
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = provinces.find(p => p.code === code)?.name || "";
    setSelectedProvinceCode(code);
    setSelectedDistrictCode("");
    setSelectedWardCode("");
    setDistricts([]); setWards([]);
    setShippingInfo(prev => ({ ...prev, province: name, district: "", ward: "" }));
    if (code) fetch(`${API_BASE_URL}/districts/${code}`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDistricts(d); else if (d?.data) setDistricts(d.data); });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = districts.find(d => d.code === code)?.name || "";
    setSelectedDistrictCode(code);
    setSelectedWardCode("");
    setWards([]);
    setShippingInfo(prev => ({ ...prev, district: name, ward: "" }));
    if (code) fetch(`${API_BASE_URL}/wards/${code}`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWards(d); else if (d?.data) setWards(d.data); });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = wards.find(w => w.code === code)?.name || "";
    setSelectedWardCode(code);
    setShippingInfo(prev => ({ ...prev, ward: name }));
  };

  // ─── LƯU ĐỊA CHỈ MỚI (MEMBER) ───────────────────
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingInfo.name) { toast.error("Vui lòng nhập tên người nhận!"); return; }
    if (!shippingInfo.phone) { toast.error("Vui lòng nhập số điện thoại!"); return; }
    if (!selectedWardCode) { toast.error("Vui lòng chọn Phường/Xã!"); return; }
    if (!shippingInfo.addressDetail) { toast.error("Vui lòng nhập địa chỉ cụ thể!"); return; }

    setSaving(true);
    try {
      const payload = {
        receiver_name: shippingInfo.name,
        phone_number: shippingInfo.phone,
        email: shippingInfo.email,
        address_detail: shippingInfo.addressDetail,
        province_id: parseInt(selectedProvinceCode),
        district_id: parseInt(selectedDistrictCode),
        ward_id: parseInt(selectedWardCode),
        is_default: addresses.length === 0,
      };
      const res = await addressAPI.create(payload, token!);
      toast.success("Đã thêm địa chỉ mới!");

      const enriched = {
        ...res,
        province: { name: shippingInfo.province },
        district: { name: shippingInfo.district },
        ward: { name: shippingInfo.ward },
      };
      applySelectedAddress(enriched);
      addressAPI.getAll(token!).then(setAddresses).catch(() => { });
    } catch {
      toast.error("Không thể lưu địa chỉ.");
    } finally {
      setSaving(false);
    }
  };

  // ─── FORM NHẬP TAY (Guest + Member trong mode "add") ──
  const renderForm = () => (
    <form onSubmit={isLoggedIn ? handleSubmitNew : e => e.preventDefault()} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-gray-900 rounded-full"></div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin người nhận</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FloatingInput
            name="name" label="Họ tên người nhận *"
            value={shippingInfo.name}
            onChange={(e: any) => handleFieldChange("name", e.target.value)}
            icon={<User size={18} />}
          />
          <FloatingInput
            name="phone" label="Số điện thoại *"
            value={shippingInfo.phone}
            onChange={(e: any) => handleFieldChange("phone", e.target.value)}
            icon={<Phone size={18} />}
          />
        </div>
        <FloatingInput
          name="email" type="email"
          label={isLoggedIn ? "Email nhận thông báo đơn hàng" : "Email liên hệ *"}
          value={shippingInfo.email}
          onChange={(e: any) => handleFieldChange("email", e.target.value)}
          icon={<Mail size={18} />}
        />
      </div>

      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-gray-900 rounded-full"></div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Địa chỉ nhận hàng</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={16} />} />
          <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange} options={districts} disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={handleWardChange} options={wards} disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
          <FloatingInput
            name="addressDetail" label="Số nhà, Tên đường *"
            value={shippingInfo.addressDetail}
            onChange={(e: any) => handleFieldChange("addressDetail", e.target.value)}
          />
        </div>
      </div>

      {isLoggedIn && (
        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/10 disabled:bg-gray-100 disabled:text-gray-400 active:scale-95"
          >
            {saving ? "Đang lưu..." : "Lưu và sử dụng địa chỉ này"}
          </button>
          <button
            type="button"
            onClick={() => setViewMode(addresses.length > 0 ? "list" : "selected")}
            className="px-8 py-4 border-2 border-gray-100 rounded-2xl font-bold text-sm text-gray-400 hover:bg-gray-50 transition-all active:scale-95"
          >
            HỦY
          </button>
        </div>
      )}
    </form>
  );

  // ─── GUEST: Chỉ render form nhập tay ─────────────
  if (!isLoggedIn) {
    return renderForm();
  }

  // ─── MEMBER: Render theo viewMode ─────────────────
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
            onClick={() => {
              if (selectedAddress) setViewMode("selected");
              else setViewMode("selected");
            }}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase"
          >
            Quay lại
          </button>
        )}
      </div>

      {/* LOADING SKELETON */}
      {loadingAddresses && (
        <div className="space-y-4 animate-pulse">
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 flex gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0"></div>
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* SELECTED ADDRESS */}
      {viewMode === "selected" && !loadingAddresses && selectedAddress && (
        <div className="space-y-5 animate-in zoom-in-95 duration-300">
          <div className="p-1 rounded-3xl bg-white border-2 border-gray-900/5 shadow-xl shadow-gray-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-900/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
            <div className="p-6 relative z-10 flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-gray-900/20">
                <MapPin size={26} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-black text-gray-900 text-xl tracking-tight">{selectedAddress.receiver_name}</span>
                  {selectedAddress.is_default && (
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest">Mặc định</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-bold text-sm bg-gray-100 px-3 py-1.5 rounded-xl w-fit mb-3">
                  <Phone size={14} className="text-gray-400" />
                  {selectedAddress.phone_number}
                </div>
                <p className="text-gray-500 font-bold text-sm leading-relaxed">
                  {selectedAddress.address_detail}, {selectedAddress.ward?.name}, {selectedAddress.district?.name}, {selectedAddress.province?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NO ADDRESS */}
      {viewMode === "selected" && !loadingAddresses && !selectedAddress && (
        <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-bold mb-4">Bạn chưa có địa chỉ nhận hàng nào</p>
          <button onClick={() => setViewMode("add")} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold">Thêm địa chỉ ngay</button>
        </div>
      )}

      {/* LIST ADDRESSES */}
      {viewMode === "list" && (
        <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => applySelectedAddress(addr)}
              className={`flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'border-gray-900 bg-white shadow-lg' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
            >
              <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddress?.id === addr.id ? 'border-gray-900 bg-gray-900' : 'border-gray-200'}`}>
                {selectedAddress?.id === addr.id && <Check size={14} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900">{addr.receiver_name}</span>
                  <span className="text-gray-400 text-sm">| {addr.phone_number}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {addr.address_detail}, {addr.ward?.name}, {addr.district?.name}, {addr.province?.name}
                </p>
              </div>
            </div>
          ))}
          <button
            onClick={() => setViewMode("add")}
            className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-100 rounded-2xl text-sm font-black text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-all w-full bg-white"
          >
            <Plus size={20} /> THÊM ĐỊA CHỈ MỚI
          </button>
        </div>
      )}

      {/* ADD NEW ADDRESS FORM */}
      {viewMode === "add" && renderForm()}
    </div>
  );
}
