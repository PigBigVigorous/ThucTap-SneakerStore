"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getFileUrl } from "../services/api";
import { useCartStore } from "../store/useCartStore";
import { useFavoritesStore } from "../store/useFavoritesStore";
import MegaMenu from "./MegaMenu";
import AdminLinks from "./AdminLinks";
import {
  ShoppingBag, Heart, Search, User, LogOut, Package,
  LogIn, UserPlus, X, Menu,
} from "lucide-react";

// ─── Search overlay ───────────────────────────────────────────────────────────

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router   = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/?search=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed top-0 left-0 right-0 z-[91] bg-white shadow-xl px-4 sm:px-8 py-5
                      animate-in slide-in-from-top-2 duration-200">
        <form onSubmit={submit} className="max-w-2xl mx-auto flex items-center gap-3">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm giày, thương hiệu..."
            className="flex-1 text-[17px] font-medium text-gray-900 outline-none placeholder:text-gray-300"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="bg-gray-900 text-white px-5 py-2 rounded-full text-[13px] font-bold
                       hover:bg-gray-700 transition-colors shrink-0"
          >
            Tìm
          </button>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors ml-1">
            <X size={20} />
          </button>
        </form>
      </div>
    </>
  );
}

// ─── User dropdown ────────────────────────────────────────────────────────────

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-600
                     hover:text-gray-900 transition-colors px-3 py-1.5 rounded-full hover:bg-gray-50"
        >
          <LogIn size={16} /> Đăng nhập
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 bg-gray-900 text-white text-[13px] font-bold
                     px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
        >
          <UserPlus size={15} /> Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
      >
        {/* Avatar initials */}
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center
                        text-[12px] font-black uppercase shrink-0 overflow-hidden border border-gray-100">
          {user.avatar ? (
            <img src={getFileUrl(user.avatar) || ""} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name?.[0] ?? "U"
          )}
        </div>
        <span className="text-[13px] font-semibold text-gray-700 max-w-[100px] truncate hidden sm:block">
          {user.name}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[61]
                          animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-[13px] font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/user/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-gray-700
                           hover:bg-gray-50 hover:text-orange-600 transition-colors"
              >
                <User size={15} /> Hồ sơ của tôi
              </Link>
              <Link
                href="/favorites"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-gray-700
                           hover:bg-gray-50 hover:text-rose-600 transition-colors"
              >
                <Heart size={15} /> Yêu thích
              </Link>
              <Link
                href="/user/purchase"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-gray-700
                           hover:bg-gray-50 hover:text-blue-600 transition-colors"
              >
                <Package size={15} /> Đơn hàng của tôi
              </Link>
              <div className="border-t border-gray-50 mt-1 pt-1">
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-red-500
                             hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut size={15} /> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Cart icon ────────────────────────────────────────────────────────────────

function CartIcon() {
  const [mounted, setMounted] = useState(false);
  const items      = useCartStore((s) => s.items);
  const totalItems = items.reduce((t, i) => t + i.quantity, 0);
  const favorites  = useFavoritesStore((s) => s.favorites);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="flex items-center gap-1">
      {/* Favorites */}
      <Link
        href="/favorites"
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600"
        title="Yêu thích"
      >
        <Heart size={20} strokeWidth={2} />
        {mounted && favorites.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black
                           rounded-full flex items-center justify-center">
            {favorites.length > 9 ? "9+" : favorites.length}
          </span>
        )}
      </Link>

      {/* Cart */}
      <Link
        href="/cart"
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600"
        title="Giỏ hàng"
      >
        <ShoppingBag size={20} strokeWidth={2} />
        {mounted && totalItems > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-gray-900 text-white text-[9px] font-black
                           rounded-full flex items-center justify-center animate-in zoom-in duration-200">
            {totalItems > 9 ? "9+" : totalItems}
          </span>
        )}
      </Link>
    </div>
  );
}

// ─── Main Header ─────────────────────────────────────────────────────────────

export default function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  // ⚠️ ALL hooks MUST be called before any early return (Rules of Hooks)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hiển thị header cho tất cả các quyền
  const { user } = useAuth();
  const isAdmin = pathname?.startsWith("/admin");
  
  // Chỉ ẩn nếu ở trang admin (tùy chọn, nhưng thường admin có layout riêng)
  // Nếu bạn muốn admin cũng thấy header này thì xóa nốt dòng dưới
  if (isAdmin || user?.role === 'shipper') return null;

  return (
    <>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      <header
        className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300
          ${scrolled ? "shadow-md" : "shadow-sm border-b border-gray-100"}`}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center h-[60px] gap-4 lg:gap-8">

            {/* ── LOGO ── */}
            <Link href="/" className="flex items-center shrink-0">
              <span className="font-black text-[22px] tracking-tighter text-gray-900 select-none">
                SHOES<span className="text-red-500">.</span>
              </span>
            </Link>

            {/* ── NAV (desktop) ── */}
            <nav className="hidden lg:flex flex-1 items-center h-full gap-1">
              <MegaMenu />
              <AdminLinks />
            </nav>

            {/* ── RIGHT ACTIONS ── */}
            <div className="flex items-center gap-0.5 ml-auto">
              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50
                           transition-colors text-gray-600"
                title="Tìm kiếm"
              >
                <Search size={20} strokeWidth={2} />
              </button>

              {/* Cart + Favorites icons */}
              <CartIcon />

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block" />

              {/* User */}
              <UserMenu />
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
