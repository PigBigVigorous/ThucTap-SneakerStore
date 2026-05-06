"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
  Search, Plus, Minus, ShoppingCart, X, Store, Printer, CheckCircle2,
  DollarSign, User, Star, Tag, ChevronRight, BadgePercent
} from "lucide-react";

interface Product {
  id: number;
  sku: string;
  price: number;
  image_url: string;
  product: { id: number; name: string; description: string; };
  color: { id: number; name: string; hex_code?: string; } | null;
  size: { id: number; name: string; } | null;
  stock: number;
}

interface CartItem {
  variant_id: number;
  quantity: number;
  product: Product;
}

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string;
  points: number;
  rank: string;
  rank_color: string;
  rank_icon: string;
}

const fmt = (n: number) => Number(n).toLocaleString("vi-VN") + " ₫";

export default function PosPage() {
  const { token, user } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [currentOrderCode, setCurrentOrderCode] = useState<string | null>(null);

  // Customer Search
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Discount Code
  const [discountCode, setDiscountCode]     = useState("");
  const [discountInput, setDiscountInput]   = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError]   = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Payment Calculation
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [customerCashStr, setCustomerCashStr] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  // ─── Fetch Branches ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/admin/branches`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
          const branchArray = Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.data) ? data.data.data : []);
          setBranches(branchArray);
          if (branchArray.length > 0) setBranchId(branchArray[0].id);
        }
      } catch (error) { console.error("Lỗi lấy chi nhánh", error); }
    })();
  }, [token, baseUrl]);

  // ─── Fetch Products ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || branchId === "") {
      setProducts([]);
      setLoading(false);
      return;
    }
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await adminAPI.getPosProducts(token, branchId as number, 100);
        if (response.success) setProducts(response.data || []);
        else toast.error("Lỗi tải danh sách sản phẩm!");
      } catch (error: any) {
        if (error.message === "UNAUTHORIZED") {
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        } else {
          toast.error("Lỗi kết nối API!");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    setCart([]); // Xóa giỏ hàng khi đổi chi nhánh
  }, [token, branchId]);

  // ─── Filter ──────────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => p.sku.toLowerCase().includes(q) || p.product.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  // ─── Cart Logic ──────────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return toast.error("Hết hàng!");
    setCart(prev => {
      const exist = prev.find(i => i.variant_id === product.id);
      if (exist) {
        if (exist.quantity >= product.stock) { toast.error("Tồn kho không đủ!"); return prev; }
        return prev.map(i => i.variant_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { variant_id: product.id, quantity: 1, product }];
    });
  };

  const updateQuantity = (variantId: number, qty: number) => {
    if (qty <= 0) return setCart(prev => prev.filter(i => i.variant_id !== variantId));
    const maxStock = products.find(p => p.id === variantId)?.stock || 0;
    if (qty > maxStock) return toast.error("Vượt quá tồn kho!");
    setCart(prev => prev.map(i => i.variant_id === variantId ? { ...i, quantity: qty } : i));
  };

  // ─── Math ────────────────────────────────────────────────────────────────────
  const subtotal    = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalItems  = cart.reduce((sum, item) => sum + item.quantity, 0);
  const customerCash = Number(customerCashStr.replace(/\D/g, '')) || 0;
  const change = customerCash - totalAmount;

  // ─── Customer Search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (customerQuery.trim().length < 2) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setCustomerSearching(true);
      try {
        const res = await adminAPI.posSearchCustomers(token!, customerQuery.trim());
        if (res.success) {
          setCustomerResults(res.data || []);
          setShowCustomerDropdown(true);
        }
      } catch {
        // ignore
      } finally {
        setCustomerSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [customerQuery, token]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerQuery("");
    setShowCustomerDropdown(false);
    setCustomerResults([]);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery("");
  };

  // Điểm sẽ tích được sau giao dịch này (tính gần đúng phía client)
  const pointsWillEarn = Math.floor(totalAmount / 100000);

  // ─── Apply Discount ──────────────────────────────────────────────────────────
  const handleApplyDiscount = async () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    if (!cart.length) { setDiscountError("Vui lòng thêm sản phẩm trước khi áp dụng mã."); return; }
    setApplyingDiscount(true);
    setDiscountError("");
    try {
      const items = cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity }));
      const res = await fetch(`${baseUrl}/discounts/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, order_value: subtotal, items }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscountCode(code);
        setDiscountAmount(data.data?.discount_amount ?? 0);
        toast.success(`Áp dụng mã "${code}" thành công!`);
      } else {
        setDiscountError(data.message || "Mã không hợp lệ.");
        setDiscountCode("");
        setDiscountAmount(0);
      }
    } catch {
      setDiscountError("Lỗi kết nối máy chủ.");
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountInput("");
    setDiscountAmount(0);
    setDiscountError("");
  };

  // ─── Checkout ────────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!cart.length) return toast.error("Giỏ hàng trống!");
    if (!branchId) return toast.error("Chọn chi nhánh!");
    if (paymentMethod === 'cash' && customerCash > 0 && change < 0) return toast.error("Khách đưa chưa đủ tiền!");

    setProcessing(true);
    try {
      const items = cart.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }));
      const response = await adminAPI.posCreateOrder(token!, {
        items,
        branch_id: branchId as number,
        user_id: selectedCustomer?.id ?? undefined,
        discount_code: discountCode || undefined,
      });
      if (response.success) {
        toast.success("Thanh toán thành công!", { icon: "✅" });

        // Lấy mã đơn hàng từ API (hoặc tạo mã dự phòng)
        const orderCode = response.data?.order_tracking_code || response.data?.code || response.data?.order_code || `POS-${Date.now()}`;
        setCurrentOrderCode(orderCode);

        // Tự động in hóa đơn & Xuất PDF sau khi DOM render mã đơn
        setTimeout(async () => {
          try {
            const printElement = document.getElementById("pos-print-invoice");
            if (printElement) {
              const canvas = await toCanvas(printElement, {
                pixelRatio: 2, // Tăng chất lượng ảnh
                backgroundColor: "#ffffff",
              });

              const pdfWidth = 80; // Khổ giấy 80mm
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

              const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [pdfWidth, pdfHeight]
              });

              const imgData = canvas.toDataURL("image/png");
              pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
              const pdfBlob = pdf.output("blob");

              // Gắn file PDF vào FormData để sẵn sàng gọi API
              const formData = new FormData();
              formData.append("pdf_file", pdfBlob, `${orderCode}.pdf`);
              formData.append("order_code", orderCode);

              // TODO: Thay thế bằng hàm gọi API thực tế của bạn
              // await adminAPI.uploadInvoicePdf(token!, formData);
            }
          } catch (err) {
            console.error("Lỗi tạo PDF hóa đơn:", err);
          }

          // Xong xuôi mới gọi in cho khách
          window.print();

          // Sau khi tắt form in -> Clear dữ liệu
          setCart([]);
          setCustomerCashStr("");
          setCurrentOrderCode(null);
          setShowQrModal(false);
          handleRemoveDiscount();
          if (selectedCustomer) {
            // Refresh điểm khách hàng sau khi mua
            const refreshed = await adminAPI.posSearchCustomers(token!, selectedCustomer.phone || selectedCustomer.email);
            if (refreshed.success && refreshed.data?.length > 0) {
              setSelectedCustomer(refreshed.data[0]);
            }
          }
        }, 300);

        // Reload products quietly
        const reload = await adminAPI.getPosProducts(token!, branchId as number, 100);
        if (reload.success) setProducts(reload.data || []);
        searchRef.current?.focus();
      } else {
        toast.error(response.message || "Lỗi thanh toán!");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    } finally {
      setProcessing(false);
    }
  };

  // Nhanh tiền mặt
  const addCash = (amount: number) => {
    const current = Number(customerCashStr.replace(/\D/g, '')) || 0;
    setCustomerCashStr((current + amount).toString());
  };

  return (
    <>
      <div className="h-[calc(100vh-80px)] flex gap-4 overflow-hidden -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8 bg-[#f4f6fb] print:hidden">

        {/* ════════════════════════════════════════════════════
          BÊN TRÁI: SẢN PHẨM (MÁY POS)
      ════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-w-0">

          {/* Header POS */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <ShoppingCart size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 leading-tight">POS Bán Hàng</h1>
                <p className="text-xs font-semibold text-gray-400">Chọn sản phẩm để thêm vào hóa đơn</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Store className="text-gray-400" size={16} />
              <select
                value={branchId}
                onChange={(e) => setBranchId(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="" disabled>-- Chọn chi nhánh --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} {b.is_main ? "(Kho Tổng)" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Khung Tìm kiếm */}
          <div className="p-6 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchRef}
                autoFocus
                type="text"
                placeholder="Quét mã vạch hoặc nhập tên sản phẩm, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-gray-900 outline-none transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Lưới Sản phẩm (Có thể scroll) */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <p className="text-sm font-bold text-gray-400">Đang tải kho hàng...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">Không tìm thấy sản phẩm</p>
                <p className="text-xs text-gray-400 mt-1">Thử thay đổi từ khóa hoặc chọn chi nhánh khác</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                {filteredProducts.map((p) => {
                  const outOfStock = p.stock <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !outOfStock && addToCart(p)}
                      className={`group bg-white rounded-2xl border ${outOfStock ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-indigo-500 hover:shadow-lg hover:-translate-y-1'} overflow-hidden transition-all cursor-pointer flex flex-col`}
                    >
                      {/* Hình ảnh */}
                      <div className="aspect-square bg-[#f8f9fa] relative overflow-hidden shrink-0">
                        <img
                          src={p.image_url || "/placeholder.png"}
                          alt={p.product.name}
                          className="w-full h-full object-contain mix-blend-multiply p-4 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${outOfStock ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                            {outOfStock ? "HẾT HÀNG" : `Kho: ${p.stock}`}
                          </span>
                        </div>
                      </div>
                      {/* Thông tin */}
                      <div className="p-3.5 flex flex-col flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{p.sku}</p>
                        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-1.5">{p.product.name}</h3>

                        <div className="flex items-center gap-1.5 mt-auto mb-2 text-[11px] font-semibold text-gray-500">
                          {p.color && (
                            <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                              <span className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: p.color.hex_code || '#ccc' }} />
                              {p.color.name}
                            </span>
                          )}
                          {p.size && <span className="bg-gray-50 px-1.5 py-0.5 rounded">{p.size.name}</span>}
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-sm font-black text-indigo-600">{fmt(p.price)}</span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${outOfStock ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'} transition-colors`}>
                            <Plus size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
          BÊN PHẢI: HÓA ĐƠN & THANH TOÁN (BILLING)
      ════════════════════════════════════════════════════ */}
        <div className="w-[380px] xl:w-[420px] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden shrink-0">

          {/* Header Giỏ */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-widest">Chi tiết đơn</h2>
            <span className="bg-gray-900 text-white text-xs font-black px-2.5 py-1 rounded-full">
              {totalItems} MÓN
            </span>
          </div>

          {/* ── Khu vực Khách hàng thân thiết ── */}
          <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50/40 shrink-0">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <User size={11} /> Khách hàng thân thiết
            </p>

            {selectedCustomer ? (
              /* Card khách đã chọn */
              <div className="flex items-center gap-3 bg-white border border-indigo-200 rounded-2xl px-3 py-2.5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{selectedCustomer.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">{selectedCustomer.phone || selectedCustomer.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: selectedCustomer.rank_color + '22', color: selectedCustomer.rank_color }}>
                    {selectedCustomer.rank_icon} {selectedCustomer.rank}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600">{selectedCustomer.points.toLocaleString('vi-VN')} điểm</span>
                </div>
                <button onClick={handleClearCustomer} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                  <X size={15} />
                </button>
              </div>
            ) : (
              /* Ô tìm kiếm */
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Tên, SĐT hoặc email..."
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                  className="w-full bg-white border border-gray-200 focus:border-indigo-400 rounded-xl pl-8 pr-3 py-2 text-sm font-medium text-gray-800 outline-none transition-all"
                />
                {customerSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                )}

                {/* Dropdown kết quả */}
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{c.phone || c.email}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[9px] font-black" style={{ color: c.rank_color }}>{c.rank_icon} {c.rank}</span>
                          <span className="text-[9px] text-amber-500 font-bold">{c.points.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showCustomerDropdown && customerResults.length === 0 && !customerSearching && customerQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 px-4 py-3 text-xs text-gray-400 text-center">
                    Không tìm thấy khách hàng
                  </div>
                )}
              </div>
            )}

            {/* Thông tin điểm sẽ tích */}
            {selectedCustomer && pointsWillEarn > 0 && (
              <p className="text-[10px] text-indigo-500 font-bold mt-2 flex items-center gap-1">
                <Star size={10} className="fill-indigo-400" />
                Giao dịch này tích thêm <span className="text-indigo-700">+{pointsWillEarn} điểm</span>
              </p>
            )}
          </div>

          {/* Danh sách items */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <ShoppingCart size={40} className="mb-3 opacity-50" />
                <p className="text-sm font-bold">Chưa có sản phẩm</p>
              </div>
            ) : (
              <div className="space-y-1">
                {cart.map((item) => (
                  <div key={item.variant_id} className="group flex gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors relative pr-8">
                    {/* Icon Xóa góc phải */}
                    <button
                      onClick={() => updateQuantity(item.variant_id, 0)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>

                    <div className="w-14 h-14 bg-white rounded-lg border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                      <img src={item.product.image_url || "/placeholder.png"} className="w-full h-full object-contain mix-blend-multiply p-1" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.product.product.name}</p>
                      <div className="flex items-center gap-1.5 my-1 text-[10px] text-gray-500 font-medium">
                        <span>{item.product.color?.name}</span> • <span>Size {item.product.size?.name}</span>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-black text-indigo-600">{fmt(item.product.price)}</span>

                        {/* Bộ đếm số lượng thông minh */}
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                          <button onClick={() => updateQuantity(item.variant_id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-gray-600">
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.variant_id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-gray-600">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Khối tính tiền - Sticky Bottom */}
          <div className="mt-auto bg-white border-t border-gray-100 p-5 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">

            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentMethod === 'cash' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tiền mặt
              </button>
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentMethod === 'qr' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mã QR
              </button>
            </div>

            {/* ── Mã giảm giá ── */}
            <div className="mb-4">
              {discountCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-green-600" />
                    <div>
                      <p className="text-xs font-black text-green-700">{discountCode}</p>
                      <p className="text-[10px] text-green-500">Giảm {fmt(discountAmount)}</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveDiscount} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <BadgePercent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá..."
                      value={discountInput}
                      onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(""); }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyDiscount()}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-400 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-gray-800 uppercase outline-none transition-all placeholder:normal-case placeholder:font-normal"
                    />
                  </div>
                  <button
                    onClick={handleApplyDiscount}
                    disabled={!discountInput.trim() || applyingDiscount}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1 shrink-0"
                  >
                    {applyingDiscount
                      ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><ChevronRight size={13} /> Áp dụng</>}
                  </button>
                </div>
              )}
              {discountError && <p className="text-[10px] text-red-500 font-bold mt-1.5">{discountError}</p>}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold">Tạm tính</span>
                <span className="font-bold text-gray-900">{fmt(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 font-bold flex items-center gap-1"><Tag size={12} /> Giảm giá ({discountCode})</span>
                  <span className="font-black text-green-600">-{fmt(discountAmount)}</span>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <>
                  {/* Thu tiền khách */}
                  <div className={`flex justify-between items-center p-3 rounded-xl border ${change < 0 && customerCash > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><DollarSign size={16} /> Khách đưa</span>
                    <input
                      type="text"
                      value={customerCashStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCustomerCashStr(val ? Number(val).toLocaleString('vi-VN') : "");
                      }}
                      placeholder="Nhập số tiền..."
                      className="w-28 text-right bg-transparent text-sm font-black outline-none text-gray-900 placeholder:text-gray-300"
                    />
                  </div>

                  {/* Trả lại */}
                  {customerCash > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className={`font-bold ${change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {change < 0 ? 'Còn thiếu' : 'Tiền thừa trả khách'}
                      </span>
                      <span className={`font-black ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fmt(Math.abs(change))}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {paymentMethod === 'cash' && (
              <div className="flex gap-2 mb-4">
                {[500000, 1000000, 2000000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => addCash(amt)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 text-xs font-black text-gray-600 transition-colors"
                  >
                    +{amt / 1000}k
                  </button>
                ))}
                <button
                  onClick={() => setCustomerCashStr(totalAmount.toString())}
                className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg py-2 text-xs font-black text-green-700 transition-colors"
              >
                  Vừa đủ
                </button>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 mb-4 flex justify-between items-end">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Tổng tiền hóa đơn</span>
              <span className="text-3xl font-black text-indigo-600 leading-none">{fmt(totalAmount)}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                disabled={!cart.length}
                className="w-14 h-14 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0 disabled:opacity-50"
              >
                <Printer size={20} />
              </button>
              <button
                onClick={() => paymentMethod === 'qr' ? setShowQrModal(true) : handleCheckout()}
                disabled={!cart.length || processing || (paymentMethod === 'cash' && customerCash > 0 && change < 0)}
                className="flex-1 h-14 bg-indigo-600 disabled:bg-gray-300 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-indigo-700 hover:shadow-lg transition-all"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Đang xử lý
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} /> {paymentMethod === 'qr' ? 'TẠO MÃ QR' : 'THANH TOÁN'}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* POS QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thanh toán QR</h2>
            <p className="text-sm text-gray-500 text-center mb-6">Đưa mã QR này cho khách hàng quét để thanh toán.</p>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 shadow-inner border border-gray-100 flex items-center justify-center">
              <img
                src={`/maqrck.png`}
                alt="QR Code"
                className="w-full max-w-[220px] h-auto object-contain"
              />
            </div>

            <div className="w-full bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center space-y-1 mb-6">
              <div className="text-xs text-indigo-400 uppercase tracking-widest font-semibold">Cần thu</div>
              <div className="text-3xl font-black text-indigo-600">{(totalAmount).toLocaleString('vi-VN')} ₫</div>
            </div>

            <button
              onClick={() => {
                handleCheckout();
              }}
              disabled={processing}
              className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-black rounded-2xl transition-colors shadow-lg shadow-green-600/30 flex items-center justify-center gap-2"
            >
              {processing ? "Đang xử lý..." : <><CheckCircle2 size={20} /> XÁC NHẬN ĐÃ NHẬN TIỀN</>}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          KHU VỰC ẨN: TEMPLATE HÓA ĐƠN IN FORMAT 80mm
      ════════════════════════════════════════════════════ */}
      <style>{`
        @media print {
          body {
            visibility: hidden;
            background-color: #fff;
            margin: 0;
            padding: 0;
          }
          #pos-print-invoice {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 5mm;
            color: #000;
            font-family: monospace, sans-serif;
          }
          #pos-print-invoice * {
            visibility: visible;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
      
      {(() => {
        const currentBranch = branches.find(b => b.id === branchId);
        return (
          <div id="pos-print-invoice" className="absolute top-[-9999px] left-[-9999px] w-[80mm] bg-white print:static print:block text-black p-[5mm]">
            <div className="text-center mb-4">
              <h2 className="text-[18px] font-bold uppercase tracking-widest leading-none text-black">Sneaker Store</h2>
              <p className="text-[11px] mt-1 text-black">Đ/c: {currentBranch?.address || '123 Đường Cầu Giấy, Hà Nội'}</p>
              <p className="text-[11px] text-black">SĐT: {currentBranch?.phone || '0987 654 321'}</p>
              <h3 className="text-[14px] font-bold mt-3 border-y border-black border-dashed py-1 text-black">HÓA ĐƠN BÁN LẺ</h3>
              {currentOrderCode && (
                <p className="text-[12px] font-bold mt-1 text-black uppercase">Mã Đơn: {currentOrderCode}</p>
              )}
            </div>

            <div className="flex justify-between text-[11px] mb-2 font-semibold text-black">
              <span>{new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>NV: {user?.name || 'Thu Ngân'}</span>
            </div>

            <div className="border-b border-black border-dashed mb-2 pb-1 text-[11px] font-bold flex justify-between text-black">
              <span className="w-1/2">Tên SP</span>
              <span className="w-1/4 text-center">SL</span>
              <span className="w-1/4 text-right">TTiền</span>
            </div>

            <div className="text-[11px] space-y-1 mb-2 border-b border-black border-dashed pb-2 text-black">
              {cart.map((c, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div className="w-1/2 pr-1">
                    <span className="block leading-tight font-semibold text-black">{c.product.product.name}</span>
                    <span className="text-[9px] text-gray-800 block">{c.product.color?.name}/{c.product.size?.name}</span>
                  </div>
                  <span className="w-1/4 text-center flex items-center justify-center font-bold">{c.quantity}</span>
                  <span className="w-1/4 text-right flex items-center justify-end font-bold text-black">{fmt(c.product.price * c.quantity)}</span>
                </div>
              ))}
            </div>

        <div className="text-[11px] space-y-1 text-black">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{fmt(totalAmount)}</span>
          </div>
          {change < 0 ? null : (
            <>
              <div className="flex justify-between">
                <span>Khách đưa:</span>
                <span>{fmt(customerCash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiền thừa:</span>
                <span>{fmt(Math.abs(change))}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-[14px] font-black pt-1 border-t border-black border-dashed mt-1">
            <span>TỔNG CỘNG:</span>
            <span>{fmt(totalAmount)}</span>
          </div>
        </div>

        <div className="text-center mt-6 text-[11px] italic font-semibold text-black">
          Cảm ơn quý khách và hẹn gặp lại!
        </div>
      </div>
      );
    })()}

    </>
  );
}