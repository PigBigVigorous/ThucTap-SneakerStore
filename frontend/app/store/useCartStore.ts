import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

// 1. Định nghĩa kiểu dữ liệu cho 1 món hàng trong giỏ
export type CartItem = {
  variant_id: number;
  product_id: number;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
  stock: number;
  slug: string;
  selected?: boolean;
};

// 2. Định nghĩa các hành động (Actions) của Giỏ hàng
interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variant_id: number) => void;
  updateQuantity: (variant_id: number, quantity: number) => void;
  toggleSelect: (variant_id: number) => void;
  toggleSelectAll: (selected: boolean) => void;
  clearCart: () => void;
  clearSelectedItems: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// 3. Khởi tạo Zustand Store (Đã tích hợp sẵn Persist để tự động lưu LocalStorage)
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [], // Giỏ hàng ban đầu trống

      // THÊM VÀO GIỎ
      addToCart: (newItem) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.variant_id === newItem.variant_id);
          if (existingItem) {
            if (existingItem.quantity + newItem.quantity > existingItem.stock) {
              toast.error("Vượt quá số lượng tồn kho!");
              return state;
            }
            return {
              items: state.items.map((i) =>
                i.variant_id === newItem.variant_id
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...newItem, selected: true }] };
        });
      },

      // XÓA KHỎI GIỎ
      removeFromCart: (variant_id) => {
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variant_id),
        }));
        toast.success("Đã xóa sản phẩm khỏi giỏ!");
      },

      // CẬP NHẬT SỐ LƯỢNG (Dấu + / -)
      updateQuantity: (variant_id, quantity) => {
        set((state) => {
          const item = state.items.find((i) => i.variant_id === variant_id);
          if (item && quantity > item.stock) {
            toast.error("Vượt quá số lượng tồn kho!");
            return state;
          }
          if (quantity < 1) return state; // Không cho giảm dưới 1

          return {
            items: state.items.map((i) =>
              i.variant_id === variant_id ? { ...i, quantity } : i
            ),
          };
        });
      },

      // TOGGLE CHỌN SẢN PHẨM
      toggleSelect: (variant_id) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.variant_id === variant_id ? { ...i, selected: i.selected === false ? true : false } : i
          ),
        }));
      },

      // CHỌN / BỎ CHỌN TẤT CẢ
      toggleSelectAll: (selected) => {
        set((state) => ({
          items: state.items.map((i) => ({ ...i, selected })),
        }));
      },

      // XÓA SẠCH GIỎ (Dùng khi đặt hàng xong)
      clearCart: () => set({ items: [] }),

      // XÓA CÁC SẢN PHẨM ĐÃ CHỌN (Sau khi thanh toán thành công)
      clearSelectedItems: () => {
        set((state) => ({
          items: state.items.filter((i) => i.selected === false),
        }));
      },

      // TÍNH TỔNG SỐ LƯỢNG HÀNG (Dùng cho icon cái túi)
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // TÍNH TỔNG TIỀN (Dùng cho trang Checkout, chỉ tính sản phẩm được chọn)
      getTotalPrice: () => {
        return get().items.filter(i => i.selected !== false).reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'sneaker-cart-storage', 
    }
  )
);