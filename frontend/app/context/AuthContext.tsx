"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "../store/useCartStore";
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
  rank?: {
    name: string;
    color: string;
    icon: string;
  };
  created_at?: string;
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
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** AuthProvider - Context Provider quản lý trạng thái xác thực toàn ứng dụng */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** initAuth - Khởi tạo xác thực từ localStorage khi ứng dụng load */
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        // Gọi refresh để đồng bộ data mới nhất từ server
        await refreshUser(storedToken);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /** refreshUser - Làm mới thông tin user từ server (đồng bộ điểm, rank, quyền...) */
  const refreshUser = async (passedToken?: string) => {
    const storedToken = passedToken || token || localStorage.getItem("token");
    if (!storedToken) return;

    try {
      const data = await authAPI.getCurrentUser(storedToken);
      if (data && data.success && data.data) {
        setUser(data.data);
        localStorage.setItem("user", JSON.stringify(data.data));
      }
    } catch (err: any) {
      console.warn("Làm mới dữ liệu user thất bại:", err.message);
    }
  };

  /** login - Đăng nhập: lưu user/token, gộp giỏ hàng & danh sách yêu thích */
  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);

    // XỬ LÝ GIỎ HÀNG
    const savedCartStr = localStorage.getItem(`saved_cart_user_${userData.id}`);
    if (savedCartStr) {
      const oldCart = JSON.parse(savedCartStr);
      useCartStore.setState({ items: oldCart });
    }
    const currentGuestFavs = useFavoritesStore.getState().favorites;
    const savedFavsStr = localStorage.getItem(`saved_favs_user_${userData.id}`);
    let mergedFavs = savedFavsStr ? JSON.parse(savedFavsStr) : [];

    // Trộn đồ khách vãng lai vừa thả tim vào state
    currentGuestFavs.forEach((guestItem: any) => {
      if (!mergedFavs.find((i: any) => i.product_id === guestItem.product_id)) {
        mergedFavs.push(guestItem);
      }
    });
    useFavoritesStore.setState({ favorites: mergedFavs });
  };

  //Cất cả Giỏ Hàng lẫn Yêu Thích vào két
  /** logout - Đăng xuất: cất giỏ hàng, yêu thích vào localStorage rồi xóa session */
  const logout = () => {
    if (user) {
      // 1. Cất Giỏ Hàng
      const currentCart = useCartStore.getState().items;
      localStorage.setItem(`saved_cart_user_${user.id}`, JSON.stringify(currentCart));
      // 2. Cất Yêu Thích
      const currentFavs = useFavoritesStore.getState().favorites;
      localStorage.setItem(`saved_favs_user_${user.id}`, JSON.stringify(currentFavs));
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    useCartStore.getState().clearCart();
    useFavoritesStore.getState().clearFavorites();
    toast.success("Đã đăng xuất thành công!");
    window.location.href = "/";
  };

  /** hasRole - Kiểm tra user có vai trò (role) chỉ định không */
  const hasRole = (roleName: string) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.name === roleName);
  };

  /** hasPermission - Kiểm tra user có quyền (permission) chỉ định không */
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
      isLoading,
      isAuthenticated: !!user && !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/** useAuth - Custom hook để truy cập AuthContext trong bất kỳ component nào */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider");
  return context;
};