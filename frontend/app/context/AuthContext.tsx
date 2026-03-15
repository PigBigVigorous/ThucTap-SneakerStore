"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import toast from "react-hot-toast";

// Khai báo kiểu dữ liệu cho User
export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  roles?: { name: string }[];
  permissions?: { name: string }[];
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  // 👇 THÊM 2 HÀM NÀY VÀO TYPE
  hasRole: (roleName: string) => boolean;
  hasPermission: (permissionName: string) => boolean;
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
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success("Đã đăng xuất thành công!");
    window.location.href = "/"; 
  };

  // 🚨 HÀM KIỂM TRA ROLE
  const hasRole = (roleName: string) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.name === roleName);
  };

  // 🚨 HÀM KIỂM TRA QUYỀN (PERMISSION)
  const hasPermission = (permissionName: string) => {
    if (!user) return false;
    // Kim bài miễn tử: Nếu là super-admin thì luôn đúng
    if (hasRole("super-admin")) return true; 
    
    if (!user.permissions) return false;
    return user.permissions.some((p) => p.name === permissionName);
  };

  return (
    // Đẩy 2 hàm này ra ngoài để các Component khác dùng
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider");
  return context;
};