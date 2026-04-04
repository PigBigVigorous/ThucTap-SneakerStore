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
  // 👇 THÊM 2 DÒNG NÀY VÀO ĐỂ NHẬN QUYỀN TỪ BACKEND
  roles?: { name: string }[];
  permissions?: { name: string }[];
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

export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  province: string;
  district: string;
  ward: string;
  address_detail: string;
  total_amount: number;
  payment_method: string; // THÊM DÒNG NÀY
  items: { variant_id: number; quantity: number; }[];
}

// Bổ sung thêm API verify
export const paymentAPI = {
  verifyVnpay: async (queryString: string) => {
    const res = await fetch(`${API_URL}/payment/vnpay-callback${queryString}`, {
      method: 'GET',
      headers: { "Accept": "application/json" }
    });
    return res.json();
  }
}

// ==========================================
// 🛒 ORDER ENDPOINTS (Customer)
// ==========================================

export const orderAPI = {
  // Tạo đơn hàng
  create: async (data: OrderPayload, token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    // Chuẩn hoá logic check token (bỏ đoạn check "null" mùi code)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const result = await res.json();

    // Thống nhất cách throw lỗi ra UI
    if (!res.ok) {
        throw new Error(result.message || "Đã xảy ra lỗi khi tạo đơn hàng.");
    }

    return result; // Thành công trả về payload
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

  // Lấy danh sách sản phẩm cho POS
  getPosProducts: async (token: string, branchId: number = 1, limit: number = 50) => {
    const res = await fetch(`${API_URL}/admin/pos/products?branch_id=${branchId}&limit=${limit}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải danh sách sản phẩm POS");
    return res.json();
  },

  // Tạo đơn hàng POS
  posCreateOrder: async (token: string, data: { items: Array<{ variant_id: number; quantity: number }>; branch_id: number }) => {
    const res = await fetch(`${API_URL}/admin/pos/orders`, {
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
};

// ==========================================
// 📦 ADMIN PRODUCT ENDPOINTS
// ==========================================

export const adminProductAPI = {
  // Lấy danh sách sản phẩm (admin)
  getAll: async (token: string) => {
      const res = await fetch(`${API_URL}/admin/products`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
      });
      return res.json();
    },
    
    // 👇 THÊM HÀM CREATE NÀY VÀO 👇
    create: async (formData: FormData, token: string) => {
      const res = await fetch(`${API_URL}/admin/products`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: formData, // Gửi nguyên cục FormData chứa cả chữ lẫn file ảnh
      });
      return res.json();
    },
    
    delete: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "DELETE",
      headers: { 
        "Authorization": `Bearer ${token}`, 
        "Accept": "application/json" 
      },
    });
    return res.json();
  },
  update: async (id: number, formData: FormData, token: string) => {
    // Thêm dòng này để đánh lừa Laravel rằng đây là phương thức PUT dù gửi bằng POST
    formData.append("_method", "PUT");

    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "POST", // Vẫn dùng POST để FormData xử lý upload File
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      },
      body: formData,
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      console.error("🚨 LỖI CHI TIẾT TỪ BACKEND:", JSON.stringify(result.errors || result, null, 2));
      return { success: false, message: result.message || "Lỗi cập nhật", errors: result.errors };
    }
    return result;
  },
};

// ==========================================
// 📦 ADMIN INVENTORY ENDPOINTS
// ==========================================

export const adminInventoryAPI = {
  // Lấy lịch sử giao dịch kho
  getTransactions: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/inventory/transactions`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải giao dịch kho");
    return res.json();
  },

  // Chuyển kho
  transferStock: async (data: { variant_id: number; from_branch_id: number; to_branch_id: number; quantity: number; note?: string }, token: string) => {
    const res = await fetch(`${API_URL}/admin/inventory/transfer`, {
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

  // Kiểm kê/Bù trừ
  adjustStock: async (data: { variant_id: number; branch_id: number; quantity_change: number; note?: string }, token: string) => {
    const res = await fetch(`${API_URL}/admin/inventory/adjust`, {
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
};
