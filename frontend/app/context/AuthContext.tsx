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
      // 1. Tải ngay user cũ từ LocalStorage để giao diện hiển thị mượt mà
      setUser(JSON.parse(storedUser));
      setToken(storedToken);

      // 2. 🚨 NÂNG CẤP ENTERPRISE: Gọi ngầm API để đồng bộ Quyền hạn mới nhất
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      fetch(`${API_URL}/user`, {
        headers: {
          "Authorization": `Bearer ${storedToken}`,
          "Accept": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            // Cập nhật lại State và LocalStorage với dữ liệu mới (có chứa Roles & Permissions)
            setUser(data.data);
            localStorage.setItem("user", JSON.stringify(data.data));
          }
        })
        .catch((err) => console.error("Lỗi đồng bộ dữ liệu User:", err));
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

  // Hàm kiểm tra Role
  const hasRole = (roleName: string) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.name === roleName);
  };

  // Hàm kiểm tra Quyền (Permission)
  const hasPermission = (permissionName: string) => {
    if (!user) return false;
    // Kim bài miễn tử cho Sếp tổng
    if (hasRole("super-admin")) return true; 

    if (!user.permissions) return false;
    return user.permissions.some((p) => p.name === permissionName);
  };

  return (
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