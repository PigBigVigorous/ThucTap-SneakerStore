"use client";

import { useState, useEffect } from "react";
import { MapPin, Phone, User, Check, Plus, X, ChevronDown, Star } from "lucide-react";
import { addressAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type LocationItem = { id: number; code: string; name: string };

type Address = {
  id: number;
  receiver_name: string;
  phone_number: string;
  address_detail: string;
  is_default: boolean;
  province?: { name: string };
  district?: { name: string };
  ward?: { name: string };
};

type AddressSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
  selectedId?: number | null;
};

const FloatingInput = ({ label, name, type = "text", value, onChange, icon }: any) => (
  <div className="relative w-full group">
    {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors z-10 pointer-events-none">{icon}</div>}
    <input
      type={type} name={name} value={value} onChange={onChange}
      className={`block ${icon ? 'pl-10' : 'pl-3.5'} pr-3.5 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent peer transition-all`}
      placeholder=" "
    />
    <label className={`absolute text-xs text-gray-400 duration-200 transform -translate-y-2 scale-[0.85] top-3.5 z-10 origin-[0] ${icon ? 'left-10' : 'left-3.5'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.85] peer-focus:-translate-y-2 cursor-text pointer-events-none font-medium`}>
      {label}
    </label>
  </div>
);

const CustomSelect = ({ label, value, onChange, options, disabled, defaultOption }: any) => (
  <div className="relative w-full">
    <select
      value={value || ""} onChange={onChange} disabled={disabled}
      className={`block pl-3.5 pr-8 pb-2 pt-6 w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
    >
      <option value="" disabled hidden></option>
      {defaultOption && <option value="" disabled>{defaultOption}</option>}
      {Array.isArray(options) && options.map((opt: any) => (
        <option key={opt.code} value={opt.code}>{opt.name}</option>
      ))}
    </select>
    <label className={`absolute text-xs duration-200 transform top-3.5 left-3.5 z-10 pointer-events-none font-medium transition-all ${value ? 'text-gray-400 scale-[0.85] -translate-y-2' : 'text-gray-400'}`}>
      {label}
    </label>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
      <ChevronDown size={16} />
    </div>
  </div>
);

export default function AddressSelectorModal({ isOpen, onClose, onSelect, selectedId }: AddressSelectorModalProps) {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"list" | "add">("list");
  const [tempSelected, setTempSelected] = useState<number | null>(selectedId || null);

  // Form thêm địa chỉ mới
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");
  const [newForm, setNewForm] = useState({
    receiver_name: "", phone_number: "", address_detail: "", is_default: false
  });

  useEffect(() => {
    if (isOpen && token) {
      fetchAddresses();
      setTempSelected(selectedId || null);
      setView("list");
    }
  }, [isOpen, token, selectedId]);

  useEffect(() => {
    if (view === "add") {
      fetch(`${API_BASE_URL}/provinces`).then(r => r.json())
        .then(d => setProvinces(Array.isArray(d) ? d : d?.data || []))
        .catch(() => { });
    }
  }, [view]);

  const fetchAddresses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await addressAPI.getAll(token);
      if (Array.isArray(res)) setAddresses(res);
    } catch { } finally { setLoading(false); }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedProvinceCode(code); setSelectedDistrictCode(""); setSelectedWardCode("");
    setDistricts([]); setWards([]);
    if (code) fetch(`${API_BASE_URL}/districts/${code}`).then(r => r.json())
      .then(d => setDistricts(Array.isArray(d) ? d : d?.data || []));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedDistrictCode(code); setSelectedWardCode(""); setWards([]);
    if (code) fetch(`${API_BASE_URL}/wards/${code}`).then(r => r.json())
      .then(d => setWards(Array.isArray(d) ? d : d?.data || []));
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.receiver_name) { toast.error("Vui lòng nhập tên người nhận!"); return; }
    if (!newForm.phone_number) { toast.error("Vui lòng nhập số điện thoại!"); return; }
    if (!selectedWardCode) { toast.error("Vui lòng chọn Phường/Xã!"); return; }
    if (!newForm.address_detail) { toast.error("Vui lòng nhập địa chỉ cụ thể!"); return; }

    setSaving(true);
    try {
      const province = provinces.find(p => p.code === selectedProvinceCode);
      const district = districts.find(d => d.code === selectedDistrictCode);
      const ward = wards.find(w => w.code === selectedWardCode);

      const createdAddr = await addressAPI.create({
        receiver_name: newForm.receiver_name,
        phone_number: newForm.phone_number,
        address_detail: newForm.address_detail,
        province_id: province?.id,
        district_id: district?.id,
        ward_id: ward?.id,
        is_default: newForm.is_default,
      }, token!);
      toast.success("Đã thêm địa chỉ mới!");
      
      // Tự động chọn địa chỉ mới và đóng modal
      onSelect(createdAddr);
      onClose();

      // Reset form (dù đã đóng nhưng reset cho lần sau)
      setNewForm({ receiver_name: "", phone_number: "", address_detail: "", is_default: false });
      setSelectedProvinceCode(""); setSelectedDistrictCode(""); setSelectedWardCode("");
    } catch {
      toast.error("Không thể lưu địa chỉ.");
    } finally { setSaving(false); }
  };

  const handleConfirm = () => {
    const addr = addresses.find(a => a.id === tempSelected);
    if (addr) { onSelect(addr); onClose(); }
    else { toast.error("Vui lòng chọn một địa chỉ!"); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-black text-gray-900">
            {view === "list" ? "Chọn địa chỉ giao hàng" : "Thêm địa chỉ mới"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {view === "list" ? (
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10">
                  <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold mb-4">Bạn chưa có địa chỉ nào</p>
                </div>
              ) : (
                addresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => setTempSelected(addr.id)}
                    className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${tempSelected === addr.id ? 'border-orange-400 bg-orange-50/30' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${tempSelected === addr.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                      {tempSelected === addr.id && <Check size={11} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">{addr.receiver_name}</span>
                        <span className="text-gray-400 text-xs">|</span>
                        <span className="text-gray-600 text-sm">{addr.phone_number}</span>
                        {addr.is_default && (
                          <span className="flex items-center gap-0.5 text-[10px] font-black text-orange-600 border border-orange-200 bg-orange-50 px-1.5 py-0.5 rounded">
                            <Star size={8} fill="currentColor" /> Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {addr.address_detail}, {addr.ward?.name}, {addr.district?.name}, {addr.province?.name}
                      </p>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={() => setView("add")}
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all"
              >
                <Plus size={18} /> Thêm địa chỉ mới
              </button>
            </div>
          ) : (
            <form id="new-address-form" onSubmit={handleSaveNew} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput name="receiver_name" label="Họ tên *" value={newForm.receiver_name}
                  onChange={(e: any) => setNewForm(f => ({ ...f, receiver_name: e.target.value }))}
                  icon={<User size={15} />} />
                <FloatingInput name="phone_number" label="Số điện thoại *" value={newForm.phone_number}
                  onChange={(e: any) => setNewForm(f => ({ ...f, phone_number: e.target.value }))}
                  icon={<Phone size={15} />} />
              </div>
              <CustomSelect label="Tỉnh / Thành phố *" value={selectedProvinceCode}
                onChange={handleProvinceChange} options={provinces} defaultOption="Chọn Tỉnh/Thành phố" />
              <CustomSelect label="Quận / Huyện *" value={selectedDistrictCode}
                onChange={handleDistrictChange} options={districts}
                disabled={!selectedProvinceCode} defaultOption={selectedProvinceCode ? "Chọn Quận/Huyện" : "Chọn Tỉnh trước"} />
              <div className="grid grid-cols-2 gap-3">
                <CustomSelect label="Phường / Xã *" value={selectedWardCode}
                  onChange={(e: any) => setSelectedWardCode(e.target.value)} options={wards}
                  disabled={!selectedDistrictCode} defaultOption={selectedDistrictCode ? "Chọn Phường/Xã" : "Chọn Huyện trước"} />
                <FloatingInput name="address_detail" label="Số nhà, Tên đường *" value={newForm.address_detail}
                  onChange={(e: any) => setNewForm(f => ({ ...f, address_detail: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                <div className={`w-4.5 h-4.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${newForm.is_default ? 'bg-orange-500 border-orange-500' : 'border-gray-300 group-hover:border-orange-400'}`}>
                  {newForm.is_default && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={newForm.is_default}
                  onChange={e => setNewForm(f => ({ ...f, is_default: e.target.checked }))} />
                <span className="text-sm font-medium text-gray-600">Đặt làm địa chỉ mặc định</span>
              </label>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          {view === "list" ? (
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">
                Hủy
              </button>
              <button onClick={handleConfirm}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-orange-500/20 active:scale-95">
                Xác nhận
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button type="button" onClick={() => setView("list")}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">
                Quay lại
              </button>
              <button type="submit" form="new-address-form" disabled={saving}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 active:scale-95">
                {saving ? "Đang lưu..." : "Lưu địa chỉ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
