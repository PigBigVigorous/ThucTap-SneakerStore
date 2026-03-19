"use client";

import { AuthProvider } from "./context/AuthContext";

// 🚨 ĐÃ XÓA CartProvider VÌ ZUSTAND KHÔNG CẦN BỌC

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}