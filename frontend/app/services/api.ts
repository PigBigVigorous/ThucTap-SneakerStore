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
const getAuthHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getFileUrl = (path: string | null | undefined) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// --- API Modules ---

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post('/login', { email, password });
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/register', data);
    return res.data;
  },
  getCurrentUser: async (token: string) => {
    const res = await api.get('/user', getAuthHeaders(token));
    return res.data;
  },
  updateProfile: async (data: any, token: string) => {
    const res = await api.post('/profile/update', data, getAuthHeaders(token));
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post('/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data: any) => {
    const res = await api.post('/reset-password', data);
    return res.data;
  }
};

export const productAPI = {
  getAll: async (params?: any) => {
    const res = await api.get('/products', { params });
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await api.get(`/products/${slug}`);
    return res.data;
  },
  getPriceRange: async () => {
    const res = await api.get('/products/price-range');
    return res.data;
  },
  getReviews: async (slug: string) => {
    const res = await api.get(`/products/${slug}/reviews`);
    return res.data;
  },
  getRelated: async (slug: string) => {
    const res = await api.get(`/products/${slug}/related`);
    return res.data;
  },
  storeReview: async (slug: string, data: { rating: number; comment: string }, token: string) => {
    const res = await api.post(`/products/${slug}/reviews`, data, getAuthHeaders(token));
    return res.data;
  }
};

export const categoryAPI = {
  getAll: async () => {
    const res = await api.get('/categories');
    return res.data;
  }
};

export const brandAPI = {
  getAll: async () => {
    const res = await api.get('/brands');
    return res.data;
  }
};

export const cartAPI = {
  getCart: async (token: string) => {
    const res = await api.get('/cart', getAuthHeaders(token));
    return res.data;
  },
  addToCart: async (data: { variant_id: number; quantity: number }, token: string) => {
    const res = await api.post('/cart/add', data, getAuthHeaders(token));
    return res.data;
  },
  updateQuantity: async (id: number, quantity: number, token: string) => {
    const res = await api.post('/cart/update', { id, quantity }, getAuthHeaders(token));
    return res.data;
  },
  removeFromCart: async (id: number, token: string) => {
    const res = await api.delete(`/cart/remove/${id}`, getAuthHeaders(token));
    return res.data;
  },
  clearCart: async (token: string) => {
    const res = await api.post('/cart/clear', {}, getAuthHeaders(token));
    return res.data;
  }
};

export const addressAPI = {
  getAll: async (token: string) => {
    const res = await api.get('/addresses', getAuthHeaders(token));
    return res.data;
  },
  create: async (data: any, token: string) => {
    const res = await api.post('/addresses', data, getAuthHeaders(token));
    return res.data;
  },
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/addresses/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/addresses/${id}`, getAuthHeaders(token));
    return res.data;
  },
  setDefault: async (id: number, token: string) => {
    const res = await api.post(`/addresses/${id}/default`, {}, getAuthHeaders(token));
    return res.data;
  }
};

export const shippingAPI = {
  calculateFee: async (data: { province: string, district: string, ward?: string }, token?: string) => {
    const config = token ? getAuthHeaders(token) : {};
    const res = await api.post('/shipping-fee/calculate', data, config);
    return res.data;
  }
};

export const orderAPI = {
  getMyOrders: async (token: string) => {
    const res = await api.get('/my-orders', getAuthHeaders(token));
    return res.data;
  },
  getDetail: async (id: number, token: string) => {
    const res = await api.get(`/orders/id/${id}`, getAuthHeaders(token));
    return res.data;
  },
  create: async (data: any, token: string) => {
    const res = await api.post('/orders', data, getAuthHeaders(token));
    return res.data;
  },
  cancel: async (id: number, token: string) => {
    const res = await api.post(`/orders/${id}/cancel`, {}, getAuthHeaders(token));
    return res.data;
  },
  return: async (id: number, reason: string, token: string) => {
    const res = await api.post(`/orders/${id}/return`, { reason }, getAuthHeaders(token));
    return res.data;
  },
  getByTrackingCode: async (trackingCode: string, token?: string | null) => {
    const config = token ? getAuthHeaders(token) : {};
    const res = await api.get(`/orders/${trackingCode}`, config);
    return res.data;
  }
};

export const discountAPI = {
  getActive: async (token?: string) => {
    const config = token ? getAuthHeaders(token) : {};
    const res = await api.get('/discounts', config);
    return res.data;
  },
  apply: async (code: string, order_value: number, items: any[] = [], token?: string) => {
    const config = token ? getAuthHeaders(token) : {};
    const res = await api.post('/discounts/apply', { code, order_value, items }, config);
    return res.data;
  },
  save: async (id: number, token: string) => {
    const res = await api.post(`/discounts/save/${id}`, {}, getAuthHeaders(token));
    return res.data;
  },
  getUserVouchers: async (token: string) => {
    const res = await api.get('/user/vouchers', getAuthHeaders(token));
    return res.data;
  }
};

export const paymentAPI = {
  verifyVnpay: async (queryString: string) => {
    const res = await api.get(`/payment/vnpay-callback${queryString}`);
    return res.data;
  }
};

export const pointAPI = {
  getHistory: async (token: string) => {
    const res = await api.get('/points/history', getAuthHeaders(token));
    return res.data;
  }
};

export const adminAPI = {
  getOrders: async (token: string, params?: { page?: number; per_page?: number; status?: string; search?: string }) => {
    const res = await api.get('/admin/orders', { params, ...getAuthHeaders(token) });
    return res.data;
  },
  getOrderDetail: async (id: number, token: string) => {
    const res = await api.get(`/admin/orders/${id}`, getAuthHeaders(token));
    return res.data;
  },
  updateOrderStatus: async (id: number, status: string, token: string) => {
    const res = await api.put(`/admin/orders/${id}/status`, { status }, getAuthHeaders(token));
    return res.data;
  },
  getShippers: async (token: string) => {
    const res = await api.get('/admin/shippers', getAuthHeaders(token));
    return res.data;
  },
  assignShipper: async (orderId: number, shipperId: number, token: string) => {
    const res = await api.post(`/admin/orders/${orderId}/assign-shipper`, { shipper_id: shipperId }, getAuthHeaders(token));
    return res.data;
  },
  getInventoryTransactions: async (token: string) => {
    const res = await api.get('/admin/inventory/transactions', getAuthHeaders(token));
    return res.data;
  },
  getStatistics: async (token: string) => {
    const res = await api.get('/admin/statistics', getAuthHeaders(token));
    return res.data;
  },
  getPosProducts: async (token: string, branchId: number, per_page = 100) => {
    const res = await api.get(`/admin/pos/products?branch_id=${branchId}&per_page=${per_page}`, getAuthHeaders(token));
    return res.data;
  },
  posCreateOrder: async (token: string, data: any) => {
    const res = await api.post('/admin/pos', data, getAuthHeaders(token));
    return res.data;
  },
  posSearchCustomers: async (token: string, search: string) => {
    const res = await api.get(`/admin/pos/customers?search=${encodeURIComponent(search)}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminBrandAPI = {
  getAll: async (token: string) => {
    const res = await api.get('/admin/brands', getAuthHeaders(token));
    return res.data;
  },
  create: async (data: any, token: string) => {
    const res = await api.post('/admin/brands', data, getAuthHeaders(token));
    return res.data;
  },
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/admin/brands/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/brands/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminCategoryAPI = {
  getAll: async (token: string) => {
    const res = await api.get('/admin/categories', getAuthHeaders(token));
    return res.data;
  },
  create: async (data: any, token: string) => {
    const res = await api.post('/admin/categories', data, getAuthHeaders(token));
    return res.data;
  },
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/admin/categories/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/categories/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminBranchAPI = {
  getAll: async (token: string) => {
    const res = await api.get('/admin/branches', getAuthHeaders(token));
    return res.data;
  }
};

export const adminProductAPI = {
  getAll: async (token: string, params?: any) => {
    const res = await api.get('/admin/products', { params, ...getAuthHeaders(token) });
    return res.data;
  },
  getDetail: async (id: number, token: string) => {
    const res = await api.get(`/admin/products/${id}`, getAuthHeaders(token));
    return res.data;
  },
  create: async (formData: FormData, token: string) => {
    const res = await api.post('/admin/products', formData, {
      headers: {
        ...getAuthHeaders(token).headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  update: async (id: number, formData: FormData, token: string) => {
    // 💡 Mẹo Laravel: Để gửi FormData với PUT, ta thường dùng POST kèm _method=PUT
    if (formData instanceof FormData) {
        formData.append('_method', 'PUT');
    }
    const res = await api.post(`/admin/products/${id}`, formData, {
      headers: {
        ...getAuthHeaders(token).headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/products/${id}`, getAuthHeaders(token));
    return res.data;
  },
  toggleStatus: async (id: number, token: string) => {
    const res = await api.patch(`/admin/products/${id}/toggle-status`, {}, getAuthHeaders(token));
    return res.data;
  }
};

export const adminInventoryAPI = {
  getStocks: async (token: string, branchId = "", search = "", brandId = "") => {
    const res = await api.get(`/admin/inventory/stocks?branch_id=${branchId}&search=${search}&brand_id=${brandId}`, getAuthHeaders(token));
    return res.data;
  },
  getTransactions: async (token: string, search = "", brandId = "") => {
    const res = await api.get(`/admin/inventory/transactions?search=${search}&brand_id=${brandId}`, getAuthHeaders(token));
    return res.data;
  },
  importStock: async (data: any, token: string) => {
    const res = await api.post('/admin/inventory/import', data, getAuthHeaders(token));
    return res.data;
  },
  transferStock: async (data: any, token: string) => {
    const res = await api.post('/admin/inventory/transfer', data, getAuthHeaders(token));
    return res.data;
  },
  adjustStock: async (data: any, token: string) => {
    const res = await api.post('/admin/inventory/adjust', data, getAuthHeaders(token));
    return res.data;
  }
};

export const adminDiscountAPI = {
  getAll: async (token: string) => {
    const res = await api.get('/admin/discounts', getAuthHeaders(token));
    return res.data;
  },
  create: async (data: any, token: string) => {
    const res = await api.post('/admin/discounts', data, getAuthHeaders(token));
    return res.data;
  },
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/admin/discounts/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/discounts/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export const adminReportAPI = {
  getRevenue: async (token: string, period: 'day' | 'month' | 'year') => {
    const res = await api.get(`/admin/reports/revenue?period=${period}`, getAuthHeaders(token));
    return res.data;
  },
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
  getMyOrders: async (token: string) => {
    const res = await api.get('/shipper/my-orders', getAuthHeaders(token));
    return res.data;
  },
  getOrderDetail: async (id: number, token: string) => {
    const res = await api.get(`/shipper/orders/${id}`, getAuthHeaders(token));
    return res.data;
  },
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
  getAll: async (token: string) => {
    const res = await api.get('/admin/staff', getAuthHeaders(token));
    return res.data;
  },
  getRoles: async (token: string) => {
    const res = await api.get('/admin/roles', getAuthHeaders(token));
    return res.data;
  },
  create: async (data: any, token: string) => {
    const res = await api.post('/admin/staff', data, getAuthHeaders(token));
    return res.data;
  },
  update: async (id: number, data: any, token: string) => {
    const res = await api.put(`/admin/staff/${id}`, data, getAuthHeaders(token));
    return res.data;
  },
  toggleStatus: async (id: number, token: string) => {
    const res = await api.post(`/admin/staff/${id}/toggle`, {}, getAuthHeaders(token));
    return res.data;
  },
  delete: async (id: number, token: string) => {
    const res = await api.delete(`/admin/staff/${id}`, getAuthHeaders(token));
    return res.data;
  }
};

export default api;
