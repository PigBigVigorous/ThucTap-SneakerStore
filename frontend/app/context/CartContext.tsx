"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import toast from "react-hot-toast";

type CartItem = {
  variant_id: number;
  product_id?: number;
  product_name: string;
  color_name: string;
  size_name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variant_id: number) => void;
  updateQuantity: (variant_id: number, quantity: number) => void;
  clearCart: () => void; // 🚨 HÀM MỚI: Dọn sạch giỏ hàng
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variant_id === item.variant_id);
      if (existing) {
        return prev.map((i) => i.variant_id === item.variant_id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (variant_id: number) => {
    setCart((prev) => prev.filter((item) => item.variant_id !== variant_id));
    toast.success("Đã xóa khỏi Giỏ hàng");
  };

  const updateQuantity = (variant_id: number, quantity: number) => {
    setCart((prev) => prev.map((item) => item.variant_id === variant_id ? { ...item, quantity } : item));
  };

  // 🚨 HÀM DỌN SẠCH GIỎ HÀNG (Dùng khi đặt hàng xong)
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart phải nằm trong CartProvider");
  return context;
};