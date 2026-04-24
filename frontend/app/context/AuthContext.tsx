"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "../store/useCartStore"; // 🚨 Đã móc nối với Giỏ hàng
import { useFavoritesStore } from "../store/useFavoritesStore";
import { authAPI } from "../services/api";

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  roles?: { name: string }[];
  permissions?: { name: string }[];
  points?: number;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  phone?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (roleName: string) => boolean;
  hasPermission: (permissionName: string) => boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      // Gọi refresh để đồng bộ data mới nhất từ server (ví dụ: điểm vừa được cộng)
      refreshUser();
    }
  }, []);

  const refreshUser = async () => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;

    try {
      const data = await authAPI.getCurrentUser(storedToken);
      if (data && data.success && data.data) {
        setUser(data.data);
        localStorage.setItem("user", JSON.stringify(data.data));
      }
    } catch (err: any) {
      console.warn("Làm mới dữ liệu user thất bại:", err.message);
      // Nếu là lỗi 'Failed to fetch', có thể do server backend chưa khởi động
    }
  };

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);

    // --- 1. XỬ LÝ GIỎ HÀNG (GIỮ NGUYÊN) ---
    const savedCartStr = localStorage.getItem(`saved_cart_user_${userData.id}`);
    if (savedCartStr) {
      const oldCart = JSON.parse(savedCartStr);
      // Gộp thông minh nếu muốn, hoặc đơn giản là đập đè lên (ở đây tôi viết logic đập đè lại két sắt cũ)
      // Nếu ngài muốn giữ nguyên code trộn giỏ hàng cũ thì cứ giữ nhé.
      useCartStore.setState({ items: oldCart }); 
    }

    // --- 2. XỬ LÝ YÊU THÍCH (MỚI) ---
    const currentGuestFavs = useFavoritesStore.getState().favorites;
    const savedFavsStr = localStorage.getItem(`saved_favs_user_${userData.id}`);
    let mergedFavs = savedFavsStr ? JSON.parse(savedFavsStr) : [];

    // Trộn đồ khách vãng lai vừa thả tim vào két sắt cũ
    currentGuestFavs.forEach((guestItem: any) => {
      if (!mergedFavs.find((i: any) => i.product_id === guestItem.product_id)) {
        mergedFavs.push(guestItem);
      }
    });

    // Bơm lại vào Zustand
    useFavoritesStore.setState({ favorites: mergedFavs });
  };

  //Cất cả Giỏ Hàng lẫn Yêu Thích vào két
  const logout = () => {
    if (user) {
      // 1. Cất Giỏ Hàng
      const currentCart = useCartStore.getState().items;
      localStorage.setItem(`saved_cart_user_${user.id}`, JSON.stringify(currentCart));

      // 2. Cất Yêu Thích (MỚI)
      const currentFavs = useFavoritesStore.getState().favorites;
      localStorage.setItem(`saved_favs_user_${user.id}`, JSON.stringify(currentFavs));
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Xóa trắng trên màn hình
    useCartStore.getState().clearCart();
    useFavoritesStore.getState().clearFavorites(); // Xóa trắng tim

    toast.success("Đã đăng xuất thành công!");
    window.location.href = "/";
  };

  const hasRole = (roleName: string) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.name === roleName);
  };

  const hasPermission = (permissionName: string) => {
    if (!user) return false;
    if (hasRole("super-admin")) return true;

    if (!user.permissions) return false;
    return user.permissions.some((p) => p.name === permissionName);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      refreshUser,
      hasRole, 
      hasPermission,
      isAuthenticated: !!user && !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider");
  return context;
};