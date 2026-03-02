"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import toast from "react-hot-toast";

export type FavoriteItem = {
  product_id: number;
  product_name: string;
  category_name: string; // VD: Men's Shoes
  price: number;
  image: string;
  slug: string;
};

type FavoritesContextType = {
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => boolean; // Trả về true nếu là add, false nếu remove
  isFavorite: (product_id: number) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const isFavorite = (product_id: number) => {
    return favorites.some((item) => item.product_id === product_id);
  };

  const toggleFavorite = (item: FavoriteItem) => {
    if (isFavorite(item.product_id)) {
      setFavorites((prev) => prev.filter((i) => i.product_id !== item.product_id));
      return false; // Đã xóa
    } else {
      setFavorites((prev) => [...prev, item]);
      return true; // Đã thêm
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites phải nằm trong FavoritesProvider");
  return context;
};