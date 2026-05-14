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

// 2. Định nghĩa các hành động của Giỏ hàng
interface CartState {
  items: CartItem[];
  syncCartWithServer: (latestItems: any[]) => void;
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

// 3. Khởi tạo Zustand Store 
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [], // Giỏ hàng ban đầu trống

      /** syncCartWithServer - Đồng bộ giá/tồn kho từ server vào giỏ hàng local / Sync price/stock from server to local cart */
      syncCartWithServer: (latestItems: any[]) => {
        set((state) => {
          const syncedItems = state.items.map(oldItem => {
            const serverItem = latestItems.find((i: any) => i.variant_id === oldItem.variant_id);
            if (serverItem) {
              return { ...oldItem, price: serverItem.price, stock: serverItem.stock };
            }
            return oldItem;
          });
          return { items: syncedItems };
        });
      },

      /** addToCart - Thêm sản phẩm vào giỏ; tự động cộng số lượng nếu đã tồn tại */
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

      /** removeFromCart - Xóa sản phẩm khỏi giỏ hàng theo variant_id */
      removeFromCart: (variant_id) => {
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variant_id),
        }));
        toast.success("Đã xóa sản phẩm khỏi giỏ!");
      },

      /** updateQuantity - Cập nhật số lượng sản phẩm, kiểm tra không vượt tồn kho */
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

      /** toggleSelect - Chọn/bỏ chọn một sản phẩm trong giỏ để thanh toán */
      toggleSelect: (variant_id) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.variant_id === variant_id ? { ...i, selected: i.selected === false ? true : false } : i
          ),
        }));
      },

      /** toggleSelectAll - Chọn/bỏ chọn tất cả sản phẩm trong giỏ */
      toggleSelectAll: (selected) => {
        set((state) => ({
          items: state.items.map((i) => ({ ...i, selected })),
        }));
      },

      /** clearCart - Xóa sạch toàn bộ giỏ hàng (dùng sau khi đặt hàng xong hoặc đăng xuất) */
      clearCart: () => set({ items: [] }),

      /** clearSelectedItems - Xóa các sản phẩm đã được chọn (sau khi thanh toán thành công) */
      clearSelectedItems: () => {
        set((state) => ({
          items: state.items.filter((i) => i.selected === false),
        }));
      },

      /** getTotalItems - Tính tổng số lượng sản phẩm */
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      /** getTotalPrice - Tính tổng tiền các sản phẩm được chọn */
      getTotalPrice: () => {
        return get().items.filter(i => i.selected !== false).reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'sneaker-cart-storage',
    }
  )
);