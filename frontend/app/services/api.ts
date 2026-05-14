import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// --- Interfaces ---
export interface Product {
  id: number;
  name: string;
  slug: string;
  base_image_url: string;
  price: number;
  original_price?: number;
  description?: string;
  stock_quantity?: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  variants?: any[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  children?: Category[];
}

export interface Discount {
  id: number;
  code: string;
  type: 'percent' | 'fixed'; // backend trả về 'percent', không phải 'percentage'
  value: number;
  min_order_value: number | null;
  max_discount_value: number | null;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  used_count: number;
  category_ids: number[] | null;
  start_date: string | null;
  expiration_date: string | null;
  description: string | null;
  is_active: boolean;
  is_saved?: boolean;
}

// --- Helpers ---

/** getAuthHeaders - Tạo header xác thực Bearer Token cho mỗi request */
const getAuthHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

/** getFileUrl - Chuyển đổi đường dẫn file tương đối thành URL tuyệt đối */
export const getFileUrl = (path: string | null | undefined) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// --- API Modules ---

export const authAPI = {
  /** login - Đăng nhập tài khoản */
  login: async (email: string, password: string) => {
    const res = await api.post('/login', { email, password });
    return res.data;
  },
  /** register - Đăng ký tài khoản mới */
  register: async (data: any) => {
    const res = await api.post('/register', data);
    return res.data;
  },
  /** getCurrentUser - Lấy thông tin người dùng hiện tại từ server */
  getCurrentUser: async (token: string) => {
    const res = await api.get('/user', getAuthHeaders(token));
    return res.data;
  },
  /** updateProfile - Cập nhật thông tin hồ sơ cá nhân */
  updateProfile: async (data: any, token: string) => {
    const res = await api.post('/profile/update', data, getAuthHeaders(token));
    return res.data;
  },
  /** forgotPassword - Gửi email đặt lại mật khẩu */
  forgotPassword: async (email: string) => {
    const res = await api.post('/forgot-password', { email });
    return res.data;
  },
  /** resetPassword - Đặt lại mật khẩu mới bằng token từ email */
  resetPassword: async (data: any) => {
    const res = await api.post('/reset-password', data);
    return res.data;
  }
};

export const productAPI = {
  /** getAll - Lấy danh sách sản phẩm (có thể lọc theo params) */
  getAll: async (params?: any) => {
    const res = await api.get('/products', { params });
    return res.data;
  },
  /** getBySlug - Lấy chi tiết sản phẩm theo slug */
  getBySlug: async (slug: string) => {
    const res = await api.get(`/products/${slug}`);
    return res.data;
  },
  /** getPriceRange - Lấy khoảng giá min/max của tất cả sản phẩm */
  getPriceRange: async () => {
    const res = await api.get('/products/price-range');
    return res.data;
  },
  /** getReviews - Lấy danh sách đánh giá của sản phẩm */
  getReviews: async (slug: string) => {
    const res = await api.get(`/products/${slug}/reviews`);
    return res.data;
  },
  /** getRelated - Lấy danh sách sản phẩm liên quan */
  getRelated: async (slug: string) => {
    const res = await api.get(`/products/${slug}/related`);
    return res.data;
  },
  /** storeReview - Gửi đánh giá sản phẩm (yêu cầu đăng nhập) */
  storeReview: async (slug: string, data: { rating: number; comment: string }, token: string) => {
    const res = await api.post(`/products/${slug}/reviews`, data, getAuthHeaders(token));
    return res.data;
  }
};

export const categoryAPI = {
  /** getAll - Lấy toàn bộ danh mục sản phẩm */
  getAll: async () => {
    const res = await api.get('/categories');
    return res.data;
  }
};

export const brandAPI = {
  /** getAll - Lấy toàn bộ thương hiệu */
  getAll: async () => {
    const res = await api.get('/brands');
    return res.data;
  }
};

export const cartAPI = {
  /** getCart - Lấy giỏ hàng của người dùng từ server */
  getCart: async (token: string) => {
    const res = await api.get('/cart', getAuthHeaders(token));
    return res.data;
  },
  /** addToCart - Thêm sản phẩm vào giỏ hàng */
  addToCart: async (data: { variant_id: number; quantity: number }, token: string) => {
    const res = await api.post('/cart/add', data, getAuthHeaders(token));
    return res.data;
  },
  /** updateQuantity - Cập nhật số lượng sản phẩm trong giỏ */
  updateQuantity: async (id: number, quantity: number, token: string) => {
    const res = await api.post('/cart/update', { id, quantity }, getAuthHeaders(token));
    return res.data;
  },
  /** removeFromCart - Xóa sản phẩm khỏi giỏ hàng */
  removeFromCart: async (id: number, token: string) => {
    const res = await api.delete(`/cart/remove/${id}`, getAuthHeaders(token));
    return res.data;
  },
  /** clearCart - Xóa toàn bộ giỏ hàng */
  clearCart: async (token: string) => {
    const res = await api.post('/cart/clear', {}, getAuthHeaders(token));
    return res.data;
  }
};

export const addressAPI = {
  /** getAll - Lấy danh sách địa chỉ của người dùng */
  getAll: async (token: string) => {
    const res = await api.get('/addresses', getAuthHeaders(token));
    return res.data;
  },
  /** create - Tạo địa chỉ mới */
  create: async (data: any, token: string) => {
    const res = await api.post('/addresses', data, getAuthHeaders(token));
    return res.data;
  },
  /** update - Cập nhật địa chỉ theo ID */
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/addresses/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  /** delete - Xóa địa chỉ theo ID */
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/addresses/${id}`, getAuthHeaders(token));
    return res.data;
  },
  /** setDefault - Đặt địa chỉ làm mặc định */
  setDefault: async (id: number, token: string) => {
    const res = await api.post(`/addresses/${id}/default`, {}, getAuthHeaders(token));
    return res.data;
  }
};

export const shippingAPI = {
  /** calculateFee - Tính phí vận chuyển theo tỉnh/huyện/xã */
  calculateFee: async (data: { province: string, district: string, ward?: string }, token?: string) => {
    const config = token ? getAuthHeaders(token) : {};
    const res = await api.post('/shipping-fee/calculate', data, config);
    return res.data;
  }
};

export const orderAPI = {
  /** getMyOrders - Lấy danh sách đơn hàng của người dùng */
  getMyOrders: async (token: string) => {
    const res = await api.get('/my-orders', getAuthHeaders(token));
    return res.data;
  },
  /** getDetail - Lấy chi tiết đơn hàng theo ID */
  getDetail: async (id: number, token: string) => {
    const res = await api.get(`/orders/id/${id}`, getAuthHeaders(token));
    return res.data;
  },
  /** create - Tạo đơn hàng mới (đặt hàng) */
  create: async (data: any, token: string) => {
    const res = await api.post('/orders', data, getAuthHeaders(token));
    return res.data;
  },
  /** cancel - Hủy đơn hàng theo ID */
  cancel: async (id: number, token: string) => {
    const res = await api.post(`/orders/${id}/cancel`, {}, getAuthHeaders(token));
    return res.data;
  },
  /** return - Yêu cầu trả hàng/hoàn tiền */
  return: async (id: number, reason: string, token: string) => {
    const res = await api.post(`/orders/${id}/return`, { reason }, getAuthHeaders(token));
    return res.data;
  },
  /** getByTrackingCode - Tra cứu đơn hàng theo mã vận đơn */
  getByTrackingCode: async (trackingCode: string, token?: string | null) => {
    const config = token ? getAuthHeaders(token) : {};
    const res = await api.get(`/orders/${encodeURIComponent(trackingCode)}`, config);
    return res.data;
  }
};

export const discountAPI = {
  /** getActive - Lấy danh sách mã giảm giá đang hoạt động */
  getActive: async (token?: string) => {
    const config = token ? getAuthHeaders(token) : {};
    const res = await api.get('/discounts', config);
    return res.data;
  },
  /** apply - Áp dụng mã giảm giá vào đơn hàng */
  apply: async (code: string, order_value: number, items: any[] = [], token?: string) => {
    const config = token ? getAuthHeaders(token) : {};
    const res = await api.post('/discounts/apply', { code, order_value, items }, config);
    return res.data;
  },
  /** save - Lưu voucher vào ví của người dùng */
  save: async (id: number, token: string) => {
    const res = await api.post(`/discounts/save/${id}`, {}, getAuthHeaders(token));
    return res.data;
  },
  /** getUserVouchers - Lấy danh sách voucher trong ví người dùng */
  getUserVouchers: async (token: string) => {
    const res = await api.get('/user/vouchers', getAuthHeaders(token));
    return res.data;
  }
};

export const paymentAPI = {
  /** verifyVnpay - Xác minh kết quả giao dịch VNPay sau khi redirect */
  verifyVnpay: async (queryString: string) => {
    const res = await api.get(`/payment/vnpay-callback${queryString}`);
    return res.data;
  }
};

export const pointAPI = {
  /** getHistory - Lấy lịch sử điểm tích lũy của người dùng */
  getHistory: async (token: string) => {
    const res = await api.get('/points/history', getAuthHeaders(token));
    return res.data;
  }
};

export const adminAPI = {
  /** getOrders - Lấy danh sách đơn hàng (Admin) */
  getOrders: async (token: string, params?: { page?: number; per_page?: number; status?: string; search?: string }) => {
    const res = await api.get('/admin/orders', { params, ...getAuthHeaders(token) });
    return res.data;
  },
  /** getOrderDetail - Lấy chi tiết đơn hàng (Admin) */
  getOrderDetail: async (id: number, token: string) => {
    const res = await api.get(`/admin/orders/${id}`, getAuthHeaders(token));
    return res.data;
  },
  /** updateOrderStatus - Cập nhật trạng thái đơn hàng */
  updateOrderStatus: async (id: number, status: string, token: string) => {
    const res = await api.put(`/admin/orders/${id}/status`, { status }, getAuthHeaders(token));
    return res.data;
  },
  /** getShippers - Lấy danh sách nhân viên giao hàng */
  getShippers: async (token: string) => {
    const res = await api.get('/admin/shippers', getAuthHeaders(token));
    return res.data;
  },
  /** assignShipper - Phân công shipper cho đơn hàng */
  assignShipper: async (orderId: number, shipperId: number, token: string) => {
    const res = await api.post(`/admin/orders/${orderId}/assign-shipper`, { shipper_id: shipperId }, getAuthHeaders(token));
    return res.data;
  },
  /** getInventoryTransactions - Lấy lịch sử biến động kho hàng */
  getInventoryTransactions: async (token: string) => {
    const res = await api.get('/admin/inventory/transactions', getAuthHeaders(token));
    return res.data;
  },
  /** getStatistics - Lấy thống kê tổng quan dashboard */
  getStatistics: async (token: string) => {
    const res = await api.get('/admin/statistics', getAuthHeaders(token));
    return res.data;
  },
  /** getPosProducts - Lấy danh sách sản phẩm cho màn hình POS */
  getPosProducts: async (token: string, branchId: number, per_page = 100) => {
    const res = await api.get(`/admin/pos/products?branch_id=${branchId}&per_page=${per_page}`, getAuthHeaders(token));
    return res.data;
  },
  /** posCreateOrder - Tạo đơn hàng trực tiếp tại quầy (POS) */
  posCreateOrder: async (token: string, data: any) => {
    const res = await api.post('/admin/pos', data, getAuthHeaders(token));
    return res.data;
  },
  /** posSearchCustomers - Tìm kiếm khách hàng cho POS */
  posSearchCustomers: async (token: string, search: string) => {
    const res = await api.get(`/admin/pos/customers?search=${encodeURIComponent(search)}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminBrandAPI = {
  /** getAll - Lấy danh sách thương hiệu (Admin) */
  getAll: async (token: string) => {
    const res = await api.get('/admin/brands', getAuthHeaders(token));
    return res.data;
  },
  /** create - Tạo thương hiệu mới */
  create: async (data: any, token: string) => {
    const res = await api.post('/admin/brands', data, getAuthHeaders(token));
    return res.data;
  },
  /** update - Cập nhật thông tin thương hiệu */
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/admin/brands/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  /** delete - Xóa thương hiệu */
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/brands/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminCategoryAPI = {
  /** getAll - Lấy danh sách danh mục (Admin) */
  getAll: async (token: string) => {
    const res = await api.get('/admin/categories', getAuthHeaders(token));
    return res.data;
  },
  /** create - Tạo danh mục mới */
  create: async (data: any, token: string) => {
    const res = await api.post('/admin/categories', data, getAuthHeaders(token));
    return res.data;
  },
  /** update - Cập nhật thông tin danh mục */
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/admin/categories/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  /** delete - Xóa danh mục */
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/categories/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminBranchAPI = {
  /** getAll - Lấy danh sách chi nhánh */
  getAll: async (token: string) => {
    const res = await api.get('/admin/branches', getAuthHeaders(token));
    return res.data;
  }
};

export const adminProductAPI = {
  /** getAll - Lấy danh sách sản phẩm (Admin, có phân trang & lọc) */
  getAll: async (token: string, params?: any) => {
    const res = await api.get('/admin/products', { params, ...getAuthHeaders(token) });
    return res.data;
  },
  /** getDetail - Lấy chi tiết sản phẩm theo ID (Admin) */
  getDetail: async (id: number, token: string) => {
    const res = await api.get(`/admin/products/${id}`, getAuthHeaders(token));
    return res.data;
  },
  /** create - Tạo sản phẩm mới (upload ảnh bằng multipart/form-data) */
  create: async (formData: FormData, token: string) => {
    const res = await api.post('/admin/products', formData, {
      headers: {
        ...getAuthHeaders(token).headers,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
    });
    return res.data;
  },
  /** update - Cập nhật sản phẩm (dùng POST + _method=PUT vì FormData không hỗ trợ PUT) */
  update: async (id: number, formData: FormData, token: string) => {
    // 💡 Mẹo Laravel: Để gửi FormData với PUT, ta thường dùng POST kèm _method=PUT
    if (formData instanceof FormData) {
      formData.append('_method', 'PUT');
    }
    const res = await api.post(`/admin/products/${id}`, formData, {
      headers: {
        ...getAuthHeaders(token).headers,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
    });
    return res.data;
  },
  /** delete - Xóa sản phẩm theo ID */
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/products/${id}`, getAuthHeaders(token));
    return res.data;
  },
  /** toggleStatus - Bật/tắt trạng thái hiển thị của sản phẩm */
  toggleStatus: async (id: number, token: string) => {
    const res = await api.patch(`/admin/products/${id}/toggle-status`, {}, getAuthHeaders(token));
    return res.data;
  }
};

export const adminInventoryAPI = {
  /** getStocks - Lấy tồn kho theo chi nhánh, tìm kiếm và thương hiệu */
  getStocks: async (token: string, branchId = "", search = "", brandId = "") => {
    const res = await api.get(`/admin/inventory/stocks?branch_id=${branchId}&search=${search}&brand_id=${brandId}`, getAuthHeaders(token));
    return res.data;
  },
  /** getTransactions - Lấy lịch sử giao dịch nhập/xuất kho */
  getTransactions: async (token: string, search = "", brandId = "") => {
    const res = await api.get(`/admin/inventory/transactions?search=${search}&brand_id=${brandId}`, getAuthHeaders(token));
    return res.data;
  },
  /** importStock - Nhập hàng vào kho */
  importStock: async (data: any, token: string) => {
    const res = await api.post('/admin/inventory/import', data, getAuthHeaders(token));
    return res.data;
  },
  /** transferStock - Chuyển hàng giữa các chi nhánh */
  transferStock: async (data: any, token: string) => {
    const res = await api.post('/admin/inventory/transfer', data, getAuthHeaders(token));
    return res.data;
  },
  /** adjustStock - Điều chỉnh số lượng tồn kho (kiểm kê) */
  adjustStock: async (data: any, token: string) => {
    const res = await api.post('/admin/inventory/adjust', data, getAuthHeaders(token));
    return res.data;
  }
};

export const adminDiscountAPI = {
  /** getAll - Lấy danh sách mã giảm giá (Admin) */
  getAll: async (token: string) => {
    const res = await api.get('/admin/discounts', getAuthHeaders(token));
    return res.data;
  },
  /** create - Tạo mã giảm giá mới */
  create: async (data: any, token: string) => {
    const res = await api.post('/admin/discounts', data, getAuthHeaders(token));
    return res.data;
  },
  /** update - Cập nhật thông tin mã giảm giá */
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/admin/discounts/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  /** delete - Xóa mã giảm giá */
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/discounts/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminReportAPI = {
  /** getRevenue - Lấy báo cáo doanh thu theo kỳ (ngày/tháng/năm) */
  getRevenue: async (token: string, period: 'day' | 'month' | 'year') => {
    const res = await api.get(`/admin/reports/revenue?period=${period}`, getAuthHeaders(token));
    return res.data;
  },
  /** downloadExcel - Xuất báo cáo doanh thu ra file Excel và tự động tải về */
  downloadExcel: async (token: string, period: string, start?: string, end?: string) => {
    const url = `${API_BASE_URL}/admin/reports/export?period=${period}&start_date=${start || ''}&end_date=${end || ''}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Tải file thất bại');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Bao_cao_doanh_thu_${period}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      return { success: true };
    } catch (error: any) {
      throw error;
    }
  }
};

export const shipperAPI = {
  /** getMyOrders - Lấy danh sách đơn hàng được giao cho shipper */
  getMyOrders: async (token: string) => {
    const res = await api.get('/shipper/my-orders', getAuthHeaders(token));
    return res.data;
  },
  /** getOrderDetail - Lấy chi tiết đơn hàng (Shipper) */
  getOrderDetail: async (id: number, token: string) => {
    const res = await api.get(`/shipper/orders/${id}`, getAuthHeaders(token));
    return res.data;
  },
  /** updateTracking - Cập nhật trạng thái giao hàng và ảnh xác nhận */
  updateTracking: async (id: number, formData: FormData, token: string) => {
    const res = await axios.post(`${API_BASE_URL}/shipper/orders/${id}/track`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }
};

export const adminStaffAPI = {
  /** getAll - Lấy danh sách nhân viên */
  getAll: async (token: string) => {
    const res = await api.get('/admin/staff', getAuthHeaders(token));
    return res.data;
  },
  /** getRoles - Lấy danh sách vai trò/quyền hạn */
  getRoles: async (token: string) => {
    const res = await api.get('/admin/roles', getAuthHeaders(token));
    return res.data;
  },
  /** create - Tạo tài khoản nhân viên mới */
  create: async (data: any, token: string) => {
    const res = await api.post('/admin/staff', data, getAuthHeaders(token));
    return res.data;
  },
  /** update - Cập nhật thông tin nhân viên */
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/admin/staff/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  /** toggleStatus - Kích hoạt/vô hiệu hóa tài khoản nhân viên */
  toggleStatus: async (id: number, token: string) => {
    const res = await api.post(`/admin/staff/${id}/toggle`, {}, getAuthHeaders(token));
    return res.data;
  },
  /** delete - Xóa tài khoản nhân viên */
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/staff/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminReviewAPI = {
  /** getAll - Lấy danh sách đánh giá sản phẩm (Admin, có lọc trạng thái) */
  getAll: async (token: string, params?: { status?: string; search?: string; per_page?: number; page?: number }) => {
    const res = await api.get('/admin/reviews', { params, ...getAuthHeaders(token) });
    return res.data;
  },
  /** updateStatus - Duyệt/từ chối đánh giá (approved/rejected/pending) */
  updateStatus: async (id: number, status: 'approved' | 'rejected' | 'pending', token: string) => {
    const res = await api.put(`/admin/reviews/${id}/status`, { status }, getAuthHeaders(token));
    return res.data;
  },
  /** delete - Xóa đánh giá sản phẩm */
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/reviews/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export default api;
