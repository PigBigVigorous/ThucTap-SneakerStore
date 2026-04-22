"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getFileUrl } from "../services/api";
import { 
  User as UserIcon, 
  MapPin, 
  Lock, 
  ClipboardList, 
  Ticket, 
  Coins,
  ChevronDown,
  Camera
} from "lucide-react";

const SidebarItem = ({ 
  href, 
  icon: Icon, 
  label, 
  isActive, 
  isSubItem = false 
}: { 
  href: string; 
  icon?: any; 
  label: string; 
  isActive: boolean;
  isSubItem?: boolean;
}) => (
  <Link 
    href={href} 
    className={`flex items-center gap-3 py-2 px-4 rounded-md transition-colors ${
      isActive 
        ? "text-orange-600 font-semibold" 
        : "text-gray-700 hover:text-orange-500"
    } ${isSubItem ? "ml-8 text-sm" : "text-base"}`}
  >
    {Icon && <Icon size={isSubItem ? 16 : 20} className={isActive ? "text-orange-600" : "text-gray-500"} />}
    <span>{label}</span>
  </Link>
);

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin cá nhân.</p>
      </div>
    );
  }

  const menuItems = [
    {
      id: "account",
      label: "Tài khoản của tôi",
      icon: UserIcon,
      href: "/user/profile",
      subItems: [
        { label: "Hồ sơ", href: "/user/profile" },
        { label: "Địa chỉ", href: "/user/address" },
        { label: "Đổi mật khẩu", href: "/user/change-password" },
      ],
    },
    {
      id: "purchase",
      label: "Đơn mua",
      icon: ClipboardList,
      href: "/user/purchase",
    },
    {
      id: "vouchers",
      label: "Ví Voucher",
      icon: Ticket,
      href: "/user/vouchers",
    },
    {
      id: "points",
      label: "Điểm tích luỹ",
      icon: Coins,
      href: "/user/points",
    },
  ];

  return (
    <div className="bg-[#f5f5f5] min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="flex items-center gap-4 mb-8 px-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative border border-gray-200">
              {user.avatar ? (
                <img src={getFileUrl(user.avatar) || ""} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-2 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm truncate max-w-[140px]">{user.name}</span>
              <Link href="/user/profile" className="text-gray-500 text-xs flex items-center gap-1 hover:text-orange-500 transition-colors">
                <Camera size={12} /> Sửa hồ sơ
              </Link>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isMainActive = pathname.startsWith(item.href) || !!(item.subItems?.some(sub => pathname === sub.href));
              
              return (
                <div key={item.id} className="mb-2">
                  <SidebarItem 
                    href={item.href} 
                    icon={item.icon} 
                    label={item.label} 
                    isActive={isMainActive && (!item.subItems || pathname === item.href)} 
                  />
                  {item.subItems && (
                    <div className="mt-1 space-y-1">
                      {item.subItems.map((sub) => (
                        <SidebarItem 
                          key={sub.label} 
                          href={sub.href} 
                          label={sub.label} 
                          isActive={pathname === sub.href} 
                          isSubItem 
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 min-h-[600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
