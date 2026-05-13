"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Phone, User, ChevronDown, Mail, Star, PenLine } from "lucide-react";
import { addressAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AddressSelectorModal from "./AddressSelectorModal";

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

  // ── MEMBER STATE ──────────────────────────────────────────
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(isLoggedIn);

  // ── GUEST / ADD FORM STATE ────────────────────────────────
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");

  // ── SINGLE SOURCE OF TRUTH ────────────────────────────────
  const [shippingInfo, setShippingInfo] = useState({
    name: "", phone: "", email: user?.email || "", province: "", district: "", ward: "", addressDetail: ""
  });

  // ── Helper: áp dụng địa chỉ đã chọn lên shippingInfo ─────
  // (định nghĩa TRƯỚC useEffect để tránh reference issues)
  const applyAddress = useCallback((addr: any) => {
    setSelectedAddress(addr);
    setShippingInfo({
      name: addr.receiver_name || "",
      phone: addr.phone_number || "",
      email: user?.email || "",
      province: addr.province?.name || "",
      district: addr.district?.name || "",
      ward: addr.ward?.name || "",
      addressDetail: addr.address_detail || "",
    });
  }, [user?.email]);

  // ── Load provinces (guest) ────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      fetch(`${API_BASE_URL}/provinces`).then(r => r.json())
        .then(d => setProvinces(Array.isArray(d) ? d : d?.data || []))
        .catch(() => { });
    }
  }, [isLoggedIn]);

  // ── Load default address (member) ─────────────────────────
  useEffect(() => {
    if (isLoggedIn && token) {
      setLoadingDefault(true);
      addressAPI.getAll(token)
        .then(res => {
          if (Array.isArray(res) && res.length > 0) {
            const def = res.find((a: any) => a.is_default) || res[0];
            applyAddress(def);
          } else {
            // Nếu là member mà chưa có địa chỉ nào, tự động mở modal thêm mới
            setIsModalOpen(true);
          }
        })
        .catch(() => { })
        .finally(() => setLoadingDefault(false));
    }
  }, [isLoggedIn, token, applyAddress]);

  // ── Sync email when user context is ready ──────────────────
  useEffect(() => {
    if (user?.email && !shippingInfo.email) {
      setShippingInfo(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email, shippingInfo.email]);

  // ── Push to parent whenever shippingInfo changes ──────────
  // Chỉ push khi có name để tránh push empty state lúc mount
  useEffect(() => {
    if (!shippingInfo.name && isLoggedIn) return; // Member: chờ load xong
    onAddressSelect({
      addressId: selectedAddress?.id,
      displayInfo: `${shippingInfo.name} | ${shippingInfo.phone}\n${shippingInfo.addressDetail}, ${shippingInfo.ward}, ${shippingInfo.district}, ${shippingInfo.province}`,
      shippingData: { province: shippingInfo.province, district: shippingInfo.district, ward: shippingInfo.ward },
      contactInfo: { name: shippingInfo.name, phone: shippingInfo.phone, email: shippingInfo.email },
      detailAddress: shippingInfo.addressDetail,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingInfo]);

  // ── Province/district/ward change handlers (guest) ────────
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = provinces.find(p => p.code === code)?.name || "";
    setSelectedProvinceCode(code); setSelectedDistrictCode(""); setSelectedWardCode("");
    setDistricts([]); setWards([]);
    setShippingInfo(prev => ({ ...prev, province: name, district: "", ward: "" }));
    if (code) fetch(`${API_BASE_URL}/districts/${code}`).then(r => r.json())
      .then(d => setDistricts(Array.isArray(d) ? d : d?.data || []));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = districts.find(d => d.code === code)?.name || "";
    setSelectedDistrictCode(code); setSelectedWardCode(""); setWards([]);
    setShippingInfo(prev => ({ ...prev, district: name, ward: "" }));
    if (code) fetch(`${API_BASE_URL}/wards/${code}`).then(r => r.json())
      .then(d => setWards(Array.isArray(d) ? d : d?.data || []));
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = wards.find(w => w.code === code)?.name || "";
    setSelectedWardCode(code);
    setShippingInfo(prev => ({ ...prev, ward: name }));
  };

  // ── Modal confirm ─────────────────────────────────────────
  const handleModalSelect = (addr: any) => {
    applyAddress(addr);
  };

  // ══════════════════════════════════════════════════════════
  // MEMBER UI
  // ══════════════════════════════════════════════════════════
  if (isLoggedIn) {
    return (
      <>
        {/* Shopee-style address banner */}
        <div className="relative">
          {/* Orange bottom border — đặc trưng Shopee */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 rounded-full" />

          {loadingDefault ? (
            <div className="flex items-center gap-4 py-3 animate-pulse">
              <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ) : selectedAddress ? (
            <div className="flex items-start justify-between gap-4 pb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <MapPin size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-black text-gray-900">{selectedAddress.receiver_name}</span>
                    <span className="text-gray-400 text-xs">|</span>
                    <span className="text-gray-600 text-sm font-medium">{selectedAddress.phone_number}</span>
                    {selectedAddress.is_default && (
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-orange-600 border border-orange-200 bg-orange-50 px-1.5 py-0.5 rounded">
                        <Star size={8} fill="currentColor" /> Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {selectedAddress.address_detail}, {selectedAddress.ward?.name}, {selectedAddress.district?.name}, {selectedAddress.province?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-black text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-100 transition-all active:scale-95 shrink-0"
              >
                <PenLine size={13} /> Thay đổi
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-300" />
                <p className="text-sm text-gray-400 font-medium">Chưa có địa chỉ giao hàng</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-black text-orange-500 hover:text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-all"
              >
                + Thêm địa chỉ
              </button>
            </div>
          )}
        </div>

        {/* Email input for member */}
        <div className="mt-5">
          <FloatingInput
            name="email" type="email"
            label="Email nhận xác nhận đơn hàng"
            value={shippingInfo.email}
            onChange={(e: any) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
            icon={<Mail size={18} />}
          />
        </div>

        {/* Modal */}
        <AddressSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleModalSelect}
          selectedId={selectedAddress?.id}
        />
      </>
    );
  }

  // ══════════════════════════════════════════════════════════
  // GUEST UI — form nhập tay
  // ══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Thông tin người nhận</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FloatingInput name="name" label="Họ tên người nhận *"
            value={shippingInfo.name}
            onChange={(e: any) => setShippingInfo(prev => ({ ...prev, name: e.target.value }))}
            icon={<User size={18} />}
          />
          <FloatingInput name="phone" label="Số điện thoại *"
            value={shippingInfo.phone}
            onChange={(e: any) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
            icon={<Phone size={18} />}
          />
        </div>
        <FloatingInput name="email" type="email"
          label="Email liên hệ *"
          value={shippingInfo.email}
          onChange={(e: any) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
          icon={<Mail size={18} />}
        />
      </div>

      <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Địa chỉ nhận hàng</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode} onChange={handleProvinceChange}
            options={provinces} defaultOption="Chọn Tỉnh/Thành phố" icon={<MapPin size={16} />} />
          <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode} onChange={handleDistrictChange}
            options={districts} disabled={!selectedProvinceCode}
            defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CustomSelect label="Phường / Xã *" value={selectedWardCode} onChange={handleWardChange}
            options={wards} disabled={!selectedDistrictCode}
            defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
          <FloatingInput name="addressDetail" label="Số nhà, Tên đường *"
            value={shippingInfo.addressDetail}
            onChange={(e: any) => setShippingInfo(prev => ({ ...prev, addressDetail: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}
