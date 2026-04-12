"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, ClipboardList, Package, Layers,
  Tag, Store, ArrowRightLeft, ShoppingCart, Ticket,
  LogOut, ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin",           label: "Tổng quan",    icon: LayoutDashboard, perm: "view-dashboard" },
  { href: "/admin/orders",    label: "Đơn hàng",     icon: ClipboardList,   perm: "manage-orders" },
  { href: "/admin/products",  label: "Sản phẩm",     icon: Package,         perm: "manage-products" },
  { href: "/admin/categories",label: "Danh mục",     icon: Layers,          perm: "manage-products" },
  { href: "/admin/brands",    label: "Thương hiệu",  icon: Tag,             perm: "manage-products" },
  { href: "/admin/discounts", label: "Mã giảm giá",  icon: Ticket,          reqRole: "super-admin" },
  { href: "/admin/branches",  label: "Chi nhánh",    icon: Store,           perm: "manage-inventory" },
  { href: "/admin/inventory", label: "Kho hàng",     icon: ArrowRightLeft,  perm: "manage-inventory" },
  { href: "/admin/pos",       label: "POS",          icon: ShoppingCart,    perm: "pos-sale" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const { user, hasPermission, hasRole, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#0f172a] text-white">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
              S
            </div>
            <div>
              <p className="font-black text-[15px] leading-none">SHOES</p>
              <p className="text-[10px] text-white/40 font-medium tracking-widest uppercase">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, perm, reqRole }) => {
            if (reqRole && !hasRole(reqRole)) return null;
            if (perm && !hasPermission(perm)) return null;
            
            const exact = href === "/admin";
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all
                  ${active
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 pb-5 border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[13px] font-black text-white uppercase shrink-0">
              {user?.name?.[0] ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold
                       text-white/50 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            ← Về trang chủ
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold
                       text-red-400 hover:bg-red-400/10 transition-all w-full"
          >
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 bg-[#0f172a] text-white px-4 py-3 sticky top-0 z-40">
          <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center font-black text-sm">S</div>
          <span className="font-black text-[15px]">Admin Panel</span>
          <div className="ml-auto flex gap-2 overflow-x-auto scrollbar-hide">
            {NAV.map(({ href, label, icon: Icon, perm, reqRole }) => {
              if (reqRole && !hasRole(reqRole)) return null;
              if (perm && !hasPermission(perm)) return null;
              
              const exact = href === "/admin";
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap shrink-0 transition-all
                    ${active ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}
                >
                  <Icon size={13} /> {label}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
