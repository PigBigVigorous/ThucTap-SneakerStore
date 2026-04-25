// ===================================
// 🌐 CENTRALIZED API SERVICE LAYER
// ===================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
export const BACKEND_URL = "http://127.0.0.1:8000";

/**
 * Chuyển đổi path từ backend thành full URL
 * @param path ví dụ: /storage/avatars/abc.jpg
 */
export const getFileUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  roles?: { name: string }[];
  permissions?: { name: string }[];
  points?: number;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  phone?: string;
};

export type UserAddress = {
  id: number;
  user_id: number;
  receiver_name: string;
  phone_number: string;
  province_id: number;
  district_id: number;
  ward_id: number;
  address_detail: string;
  is_default: boolean;
  province?: { name: string; code: string };
  district?: { name: string; code: string };
  ward?: { name: string; code: string };
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
  order_tracking_code: string; // Chỉnh lại cho khớp với backend
  user_id: number;
  status: string;
  payment_status: 'pending' | 'paid' | 'failed'; // 🟢 Thêm trường này
  total_amount: number;
  shipping_fee: number; // 🟢 Thêm để hiển thị UI
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

export type Discount = {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_value?: number | null;
  max_discount_value?: number | null;
  usage_limit?: number | null;
  used_count: number;
  start_date?: string | null;
  expiration_date?: string | null;
  is_active: boolean;
  category_ids?: number[] | null;
  is_saved?: boolean; // 🟢 Thêm trạng thái đã lưu
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  children?: Category[];
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

  // Gửi OTP khôi phục mật khẩu
  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // Đổi mật khẩu mới kèm OTP
  resetPassword: async (data: { email: string; otp: string; password: string; password_confirmation: string }) => {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Cập nhật hồ sơ (FormData để hỗ trợ upload ảnh)
  updateProfile: async (formData: FormData, token: string) => {
    // Để Laravel nhận diện là PUT khi gửi qua POST
    formData.append("_method", "PUT");
    
    const res = await fetch(`${API_URL}/user/profile`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: formData,
    });
    return res.json();
  },
};

// ==========================================
// 🏠 USER ADDRESS ENDPOINTS
// ==========================================

export const addressAPI = {
  getAll: async (token: string) => {
    const res = await fetch(`${API_URL}/user/addresses`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.json();
  },

  create: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/user/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: number, data: any, token: string) => {
    const res = await fetch(`${API_URL}/user/addresses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/user/addresses/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.json();
  },

  setDefault: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/user/addresses/${id}/set-default`, {
      method: "PATCH",
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
  // Lấy danh sách sản phẩm (hỗ trợ filter theo category slug, brand name, search, giá, sort)
  getAll: async (params?: {
    category?: string;
    brand?: string;
    search?: string;
    sort_by?: string;
    price_min?: number;
    price_max?: number;
    page?: number;
  }) => {
    const url = new URL(`${API_URL}/products`);
    if (params?.category) url.searchParams.set("category", params.category);
    if (params?.brand)    url.searchParams.set("brand",    params.brand);
    if (params?.search)   url.searchParams.set("search",   params.search);
    if (params?.sort_by)  url.searchParams.set("sort_by",  params.sort_by);
    if (params?.price_min != null) url.searchParams.set("price_min", String(params.price_min));
    if (params?.price_max != null) url.searchParams.set("price_max", String(params.price_max));
    if (params?.page)     url.searchParams.set("page",     String(params.page));

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

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
  province: string;        // Lưu tên Tỉnh/Thành phố
  district: string;        // Lưu tên Quận/Huyện
  ward: string;            // Lưu tên Phường/Xã
  address_detail: string;  // Số nhà, tên đường
  total_amount: number;
  shipping_fee?: number;   // Phí ship (tuỳ chọn)
  discount_code?: string | null; // Mã giảm giá
  payment_method: string;
  items: { variant_id: number; quantity: number; }[];
  user_id?: number | null; // Thêm trường này để Backend biết đơn của user nào
  address_id?: number | null; // ID địa chỉ từ sổ địa chỉ
  points_used?: number;    // Thêm trường này để trừ điểm tích lũy
}

// ==========================================
// 🎟️ DISCOUNT ENDPOINTS (Customer)
// ==========================================

export const discountAPI = {
  // Khách hàng apply mã giảm giá
  apply: async (code: string, orderValue: number, items: { variant_id: number; quantity: number }[]) => {
    const res = await fetch(`${API_URL}/discounts/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ code, order_value: orderValue, items }),
    });
    
    // Server có thể trả về lỗi như mã giới hạn, hết hạn...
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể áp dụng mã giảm giá");
    }
    return result;
  },

  // Lấy danh sách voucher active cho trang chủ
  getActive: async (token?: string) => {
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}/discounts/active`, { headers });
    return res.json();
  },

  // Lưu voucher vào ví
  save: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/user/vouchers/${id}/save`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.json();
  },

  // Lấy ví voucher của user
  getUserVouchers: async (token: string) => {
    const res = await fetch(`${API_URL}/user/vouchers`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.json();
  },
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
// 🚚 SHIPPING ENDPOINTS (Customer)
// ==========================================

export const shippingAPI = {
  calculateFee: async (province: string, district: string, ward: string = "") => {
    const res = await fetch(`${API_URL}/shipping-fee/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ province, district, ward }),
    });
    if (!res.ok) throw new Error("Lỗi khi tính phí vận chuyển");
    return res.json();
  },
};

// ==========================================
// 🪙 POINT ENDPOINTS (Customer)
// ==========================================

export const pointAPI = {
  getHistory: async (token: string) => {
    const res = await fetch(`${API_URL}/user/points`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải lịch sử điểm");
    return res.json();
  },
};

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
  getByTrackingCode: async (tracking_code: string, token?: string | null) => {
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };

    // 🚀 ĐÂY LÀ ĐOẠN QUAN TRỌNG NHẤT BỊ THIẾU: Đính kèm Thẻ căn cước (Token) vào Request
    if (token && token !== "null") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Gửi request kèm headers
    const res = await fetch(`${API_URL}/orders/${encodeURIComponent(tracking_code)}`, {
      method: "GET",
      headers: headers, // 👈 Phải có dòng này thì Backend mới nhận được Token
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Không tìm thấy đơn hàng");
    }
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

  // Hủy đơn hàng
  cancel: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/orders/${id}/cancel`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.json();
  },

  // Trả hàng
  return: async (id: number, reason: string, token: string) => {
    const res = await fetch(`${API_URL}/orders/${id}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({ reason }),
    });
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
    if (res.status === 401) throw new Error("UNAUTHORIZED");
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
    if (res.status === 401) throw new Error("UNAUTHORIZED");
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
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Lỗi khi tải danh sách đơn hàng");
    return res.json();
  },

  // Lấy chi tiết đơn hàng (admin)
  getOrderDetails: async (orderId: number, token: string) => {
    const res = await fetch(`${API_URL}/admin/orders/${orderId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) throw new Error("Lỗi khi tải chi tiết đơn hàng");
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
    if (res.status === 401) throw new Error("UNAUTHORIZED");
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
  getAll: async (token: string, search?: string) => {
    const url = new URL(`${API_URL}/admin/products`);
    if (search) url.searchParams.set("search", search);
    
    const res = await fetch(url.toString(), {
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
    // 🚨 Bỏ đánh lừa Laravel vì trong api.php chúng ta đã khai báo Route::post('/products/{id}') để hỗ trợ upload ảnh, không cần giả lập PUT nữa.
    // formData.append("_method", "PUT");

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
  getTransactions: async (token: string, search?: string, brandId?: string) => {
    const url = new URL(`${API_URL}/admin/inventory/transactions`);
    if (search) url.searchParams.set("search", search);
    if (brandId) url.searchParams.set("brand_id", brandId);
    const res = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải giao dịch kho");
    return res.json();
  },

  // Lấy tồn kho hiện tại
  getStocks: async (token: string, branchId: string = "", search?: string, brandId?: string) => {
    const url = new URL(`${API_URL}/admin/inventory/stocks`);
    if (branchId) url.searchParams.set("branch_id", branchId);
    if (search) url.searchParams.set("search", search);
    if (brandId) url.searchParams.set("brand_id", brandId);
    const res = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi khi tải dữ liệu tồn khi");
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

// ==========================================
// 🗂️ ADMIN CATEGORY ENDPOINTS
// ==========================================

export const adminCategoryAPI = {
  getAll: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/categories`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    return res.json();
  },

  create: async (data: { name: string; parent_id?: number | null }, token: string) => {
    const res = await fetch(`${API_URL}/admin/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    return res.json();
  },
};

// ==========================================
// 🏷️ ADMIN BRAND ENDPOINTS
// ==========================================

export const adminBrandAPI = {
  getAll: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/brands`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    return res.json();
  },

  create: async (data: { name: string; description?: string; logo_url?: string }, token: string) => {
    const res = await fetch(`${API_URL}/admin/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: number, data: { name: string; description?: string; logo_url?: string }, token: string) => {
    const res = await fetch(`${API_URL}/admin/brands/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/admin/brands/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    return res.json();
  },
};

// ==========================================
// 🎟️ ADMIN DISCOUNT ENDPOINTS
// ==========================================

export const adminDiscountAPI = {
  getAll: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/discounts`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    if (!res.ok) throw new Error("Lỗi tải danh sách mã giảm giá");
    return res.json();
  },

  create: async (data: Omit<Discount, "id" | "used_count">, token: string) => {
    const res = await fetch(`${API_URL}/admin/discounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Lỗi tạo mã giảm giá");
    return result;
  },

  update: async (id: number, data: Partial<Discount>, token: string) => {
    const res = await fetch(`${API_URL}/admin/discounts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Lỗi cập nhật mã giảm giá");
    return result;
  },

  delete: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/admin/discounts/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    return res.json();
  },
};

// ==========================================
// 👥 ADMIN STAFF ENDPOINTS
// ==========================================

export const adminStaffAPI = {
  // Lấy danh sách nhân viên
  getAll: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/staff`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    if (!res.ok) throw new Error("Lỗi tải danh sách nhân viên");
    return res.json();
  },

  // Tạo mới nhân viên
  create: async (data: any, token: string) => {
    const res = await fetch(`${API_URL}/admin/staff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Lỗi tạo nhân viên");
    return result;
  },

  // Cập nhật nhân viên
  update: async (id: number, data: any, token: string) => {
    const res = await fetch(`${API_URL}/admin/staff/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Lỗi cập nhật nhân viên");
    return result;
  },

  // Khóa/Mở khóa tài khoản
  toggleStatus: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/admin/staff/${id}/toggle-status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.json();
  },

  // Xóa nhân viên
  delete: async (id: number, token: string) => {
    const res = await fetch(`${API_URL}/admin/staff/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    return res.json();
  },

  // Lấy danh sách Roles
  getRoles: async (token: string) => {
    const res = await fetch(`${API_URL}/admin/roles`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    return res.json();
  },
};

// ==========================================
// 📊 ADMIN REPORT ENDPOINTS
// ==========================================

export const adminReportAPI = {
  // Lấy dữ liệu doanh thu theo kỳ (day, month, year)
  getRevenue: async (token: string, period: 'day' | 'month' | 'year' = 'day') => {
    const res = await fetch(`${API_URL}/admin/reports/revenue?period=${period}`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    if (!res.ok) throw new Error("Lỗi tải báo cáo doanh thu");
    return res.json();
  },

  // Helper để download file Excel
  downloadExcel: async (token: string, period: string, startDate?: string, endDate?: string) => {
    let fetchUrl = `${API_URL}/admin/reports/revenue/export`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const qs = params.toString();
    if (qs) fetchUrl += `?${qs}`;

    const res = await fetch(fetchUrl, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });
    if (!res.ok) throw new Error("Lỗi xuất file báo cáo");
    
    // Server trả về Stream nên dùng blob
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-doanh-thu-sneaker-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// ==========================================
// 🚚 TRACKING ENDPOINTS
// ==========================================

export const trackingAPI = {
  // Lấy lịch sử hành trình đơn hàng (Public/Customer)
  getHistory: async (trackingCode: string) => {
    const res = await fetch(`${API_URL}/orders/${encodeURIComponent(trackingCode)}/tracking`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error("Không thể tải thông tin hành trình");
    return res.json();
  },

  // Shipper cập nhật vị trí & trạng thái
  updateLocation: async (orderId: number, data: any, token: string) => {
    const res = await fetch(`${API_URL}/shipper/orders/${orderId}/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Cập nhật hành trình thất bại");
    return result;
  },

  // Lấy danh sách đơn hàng của shipper
  getShipperOrders: async (token: string) => {
    const res = await fetch(`${API_URL}/shipper/my-orders`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) throw new Error("Lỗi tải danh sách đơn hàng shipper");
    return res.json();
  },
};

