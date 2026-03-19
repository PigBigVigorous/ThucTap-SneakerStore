import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Định nghĩa cấu trúc 1 món hàng Yêu thích
export type FavoriteItem = {
  product_id: number;
  product_name: string;
  category_name: string;
  price: number;
  image: string;
  slug: string;
};

// 2. Định nghĩa các hành động
interface FavoritesState {
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => boolean; // Trả về true nếu thêm, false nếu xóa
  clearFavorites: () => void;
}

// 3. Khởi tạo Zustand Store (Tự động lưu LocalStorage)
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      // Thêm hoặc Xóa khỏi danh sách yêu thích
      toggleFavorite: (newItem) => {
        const currentFavorites = get().favorites;
        const existingIndex = currentFavorites.findIndex((i) => i.product_id === newItem.product_id);

        if (existingIndex >= 0) {
          // Đã có -> Xóa đi
          set({ favorites: currentFavorites.filter((i) => i.product_id !== newItem.product_id) });
          return false;
        } else {
          // Chưa có -> Thêm vào
          set({ favorites: [...currentFavorites, newItem] });
          return true;
        }
      },

      // Xóa sạch (Dùng khi Đăng xuất)
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'sneaker-favorites-storage', // Tên két sắt chung
    }
  )
);