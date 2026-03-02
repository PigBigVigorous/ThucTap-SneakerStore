// ===================================
// 🌐 CENTRALIZED API SERVICE LAYER
// ===================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  [key: string]: any;
};

export type Order = {
  id: number;
  tracking_code: string;
  user_id: number;
  status: string;
  total_amount: number;
  items: OrderItem[];
  [key: string]: any;
};

export type OrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  [key: string]: any;
};

// ==========================================
// 🔐 AUTHENTICATION ENDPOINTS
// ==========================================

export const authAPI = {
  // Đăng ký
  register: async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json() as Promise<AuthResponse>;
  },

  // Đăng nhập
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    return res.json() as Promise<AuthResponse>;
  },

  // Đăng xuất
  logout: async (token: string) => {
    const res = await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.json();
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async (token: string) => {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.json();
  },
};

// ==========================================
// 📦 PRODUCT ENDPOINTS
// ==========================================

export const productAPI = {
  // Lấy danh sách sản phẩm
  // Lấy danh sách sản phẩm
  getAll: async () => {
    const res = await fetch(`${API_URL}/products`, {
      cache: "no-store",
    });
    
    // NẾU CÓ LỖI, IN THẲNG LỖI ĐÓ RA TERMINAL ĐỂ BẮT BỆNH
    if (!res.ok) {
      const errorDetails = await res.text();
      console.error("🚨 CHI TIẾT LỖI TỪ LARAVEL 🚨:", errorDetails);
      throw new Error("Lỗi không thể tải dữ liệu");
    }
    
    return res.json();
  },

  // Lấy chi tiết sản phẩm
  getBySlug: async (slug: string) => {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Sản phẩm không tồn tại");
    return res.json();
  },
};

// ==========================================
// 🛒 ORDER ENDPOINTS (Customer)
// ==========================================

export const orderAPI = {
  // Tạo đơn hàng
  create: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Lấy chi tiết đơn hàng theo tracking code
  getByTrackingCode: async (tracking_code: string) => {
    const res = await fetch(`${API_URL}/orders/${tracking_code}`);
    if (!res.ok) throw new Error("Không tìm thấy đơn hàng");
    return res.json();
  },

  // Lấy danh sách đơn hàng của user
  getMyOrders: async (token: string) => {
    const res = await fetch(`${API_URL}/my-orders`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải đơn hàng");
    return res.json();
  },
};

// ==========================================
// 👨‍💼 ADMIN ENDPOINTS
// ==========================================

export const adminAPI = {
  // Lấy thống kê
  getStatistics: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/statistics`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải thống kê");
    return res.json();
  },

  // Lấy giao dịch kho
  getInventoryTransactions: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/inventory/transactions`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải giao dịch kho");
    return res.json();
  },

  // Lấy danh sách đơn hàng (admin)
  getOrders: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/orders`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải danh sách đơn hàng");
    return res.json();
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId: number, status: string, token: string) => {
    const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
};
