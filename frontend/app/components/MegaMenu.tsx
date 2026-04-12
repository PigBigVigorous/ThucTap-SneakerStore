"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, Tag, Grid3x3, ArrowRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  children?: Category[];
};

type Brand = {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

/** Thời gian (ms) trước khi đóng menu sau khi chuột rời khỏi */
const CLOSE_DELAY_MS = 120;

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function NavSkeleton() {
  return (
    <div className="flex items-center gap-6 h-full px-4 animate-pulse">
      {[80, 100, 72, 90].map((w, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

// ─── Brand Card ──────────────────────────────────────────────────────────────

function BrandCard({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  return (
    <Link
      href={`/?brand=${encodeURIComponent(brand.name)}`}
      onClick={onClose}
      className="flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-xl bg-white
                 hover:border-gray-900 hover:shadow-md transition-all duration-200 group/brand"
    >
      {brand.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logo_url}
          alt={brand.name}
          className="h-6 w-auto object-contain flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span className="text-sm font-bold text-gray-700 group-hover/brand:text-black transition-colors">
        {brand.name}
      </span>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref để quản lý timer đóng menu (tránh flicker khi di chuột nhanh)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Data Fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`${API}/categories`).then((r) => r.json()).catch(() => ({ success: false })),
      fetch(`${API}/brands`).then((r) => r.json()).catch(() => ({ success: false })),
    ]).then(([catRes, brandRes]) => {
      if (cancelled) return;
      if (catRes.success) setRootCategories(catRes.data ?? []);
      if (brandRes.success) setBrands(brandRes.data ?? []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // ── Hover helpers ─────────────────────────────────────────────────────────

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setActiveMenu(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  const openMenu = useCallback((id: string) => {
    cancelClose();
    setActiveMenu(id);
  }, [cancelClose]);

  const closeMenu = useCallback(() => {
    setActiveMenu(null);
    cancelClose();
  }, [cancelClose]);

  // ── Render ────────────────────────────────────────────────────────────────

  const hasBrands = brands.length > 0;
  const hasData = !loading;

  return (
    <div
      ref={menuRef}
      className="flex items-center h-full"
      onMouseLeave={scheduleClose}
      onMouseEnter={cancelClose}
    >
      {/* ══════════════════════════════════════════
          1. NAV BUTTONS
      ══════════════════════════════════════════ */}
      {loading ? (
        <NavSkeleton />
      ) : (
        <div className="flex items-center gap-1 h-full px-2">
          {/* Tất cả sản phẩm */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center px-4 text-gray-800 font-bold uppercase text-sm
                       tracking-wide hover:text-black transition-colors h-full
                       border-b-2 border-transparent hover:border-black"
          >
            Tất cả
          </Link>

          {/* Thương Hiệu */}
          {hasBrands && (
            <NavButton
              id="brands"
              label="Thương Hiệu"
              active={activeMenu === "brands"}
              onEnter={() => openMenu("brands")}
              icon={<Tag size={13} />}
            />
          )}

          {/* Danh mục gốc từ DB */}
          {rootCategories.map((cat) => (
            <NavButton
              key={cat.id}
              id={`cat-${cat.id}`}
              label={cat.name}
              active={activeMenu === `cat-${cat.id}`}
              onEnter={() => openMenu(`cat-${cat.id}`)}
              hasChildren={(cat.children?.length ?? 0) > 0}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
          2. BACKDROP
      ══════════════════════════════════════════ */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 top-16 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 z-40
          ${activeMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeMenu}
      />

      {/* ══════════════════════════════════════════
          3. DROPDOWN PANEL
      ══════════════════════════════════════════ */}
      {hasData && (
        <div
          className={`absolute left-0 top-full w-full bg-white z-50 border-t border-gray-100
                      shadow-2xl transition-all duration-250 ease-out overflow-hidden
                      ${activeMenu ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"}`}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="relative min-h-[200px]">
            {/* === PANEL: THƯƠNG HIỆU === */}
            {hasBrands && (
              <MenuPanel visible={activeMenu === "brands"}>
                <div className="max-w-6xl mx-auto px-10 py-9 flex gap-14">
                  {/* Cột trái — mô tả */}
                  <div className="flex flex-col justify-between min-w-[200px] border-r border-gray-100 pr-10">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">
                        Danh mục
                      </span>
                      <h3 className="text-2xl font-black text-gray-900 leading-tight mb-3">
                        Thương Hiệu
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Khám phá {brands.length} thương hiệu giày chính hãng hàng đầu thế giới.
                      </p>
                    </div>
                    <Link
                      href="/?brand=all"
                      onClick={closeMenu}
                      className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-gray-900
                                 hover:text-red-600 transition-colors group/all"
                    >
                      Xem tất cả
                      <ArrowRight size={14} className="group-hover/all:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  {/* Cột phải — brand grid */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2.5">
                      {brands.map((brand) => (
                        <BrandCard key={brand.id} brand={brand} onClose={closeMenu} />
                      ))}
                    </div>
                  </div>
                </div>
              </MenuPanel>
            )}

            {/* === PANEL: DANH MỤC ĐỘNG === */}
            {rootCategories.map((cat) => {
              const children: Category[] = cat.children ?? [];
              return (
                <MenuPanel key={cat.id} visible={activeMenu === `cat-${cat.id}`}>
                  <div className="max-w-6xl mx-auto px-10 py-9 flex gap-14">
                    {/* Cột trái — tên danh mục */}
                    <div className="flex flex-col justify-between min-w-[200px] border-r border-gray-100 pr-10">
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">
                          Danh mục
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 leading-tight mb-3">
                          {cat.name}
                        </h3>
                        {children.length > 0 && (
                          <p className="text-sm text-gray-500">
                            {children.length} danh mục con
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/?category=${cat.slug}`}
                        onClick={closeMenu}
                        className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-gray-900
                                   hover:text-red-600 transition-colors group/viewall"
                      >
                        Xem tất cả {cat.name}
                        <ArrowRight size={14} className="group-hover/viewall:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    {/* Cột giữa — danh mục con */}
                    {children.length > 0 && (
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-1.5 mb-4">
                          <Grid3x3 size={13} className="text-gray-400" />
                          <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                            Danh mục con
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/?category=${child.slug}`}
                                onClick={closeMenu}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-600
                                           hover:text-black transition-colors group/child"
                              >
                                <span className="w-0 group-hover/child:w-2 h-[2px] bg-black transition-all duration-200 rounded-full" />
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cột phải — promo card */}
                    <div className="flex-1 flex justify-end">
                      <div
                        className="w-56 h-full min-h-[140px] rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
                                    flex flex-col justify-end p-5 relative overflow-hidden cursor-pointer group/promo"
                        onClick={() => {
                          closeMenu();
                          window.location.href = `/?category=${cat.slug}`;
                        }}
                      >
                        {/* nền gradient động */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent
                                        opacity-0 group-hover/promo:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10 text-xs font-black uppercase tracking-widest text-red-400 mb-1">
                          Khuyến mãi
                        </span>
                        <p className="relative z-10 text-white font-black text-base leading-snug">
                          Sale đến<br />
                          <span className="text-2xl text-red-400">50%</span>
                        </p>
                        <p className="relative z-10 text-gray-400 text-xs mt-1">
                          {cat.name} &amp; nhiều hơn nữa
                        </p>
                      </div>
                    </div>
                  </div>
                </MenuPanel>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Nút nav trên thanh header */
function NavButton({
  id,
  label,
  active,
  onEnter,
  hasChildren = true,
  icon,
}: {
  id: string;
  label: string;
  active: boolean;
  onEnter: () => void;
  hasChildren?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      aria-expanded={active}
      aria-haspopup="true"
      className={`flex items-center gap-1.5 px-4 cursor-pointer h-full font-bold uppercase text-sm
                  tracking-wide transition-colors border-b-2 bg-transparent outline-none
                  ${active
                    ? "text-black border-black"
                    : "text-gray-600 border-transparent hover:text-black hover:border-gray-300"
                  }`}
    >
      {icon}
      {label}
      {hasChildren && (
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${active ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );
}

/** Wrapper cho từng panel — dùng CSS opacity+pointer-events thay vì mount/unmount */
function MenuPanel({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`transition-opacity duration-200 ${
        visible ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 z-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
}