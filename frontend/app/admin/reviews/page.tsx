"use client";

import { useEffect, useState } from "react";
import { adminReviewAPI, getFileUrl } from "../../services/api";
import { Search, CheckCircle, XCircle, Trash2, ExternalLink, Star } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminReviewPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await adminReviewAPI.getAll(token, { page, status: statusFilter, search });
      if (res.success) {
        setReviews(res.data.data);
        setPagination({
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          total: res.data.total
        });
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await adminReviewAPI.updateStatus(id, status, token);
      if (res.success) {
        toast.success(res.message);
        setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này vĩnh viễn?")) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await adminReviewAPI.delete(id, token);
      if (res.success) {
        toast.success(res.message);
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (error) {
      toast.error("Lỗi xóa đánh giá");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">Chờ duyệt</span>;
      case 'approved': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Đã duyệt</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">Đã từ chối</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kiểm duyệt Đánh giá</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Tìm theo SP, người dùng, nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
        <button onClick={() => fetchReviews()} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
          Lọc
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-600">Khách hàng</th>
                <th className="px-6 py-4 font-medium text-gray-600">Sản phẩm</th>
                <th className="px-6 py-4 font-medium text-gray-600">Đánh giá</th>
                <th className="px-6 py-4 font-medium text-gray-600">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Không có đánh giá nào.</td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{review.user?.name || "Khách ẩn danh"}</div>
                      <div className="text-sm text-gray-500">{review.user?.email || "Không có email"}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="flex items-center gap-3">
                        <img src={getFileUrl(review.product?.base_image_url)} alt="Sp" className="w-10 h-10 object-cover rounded-md border" />
                        <div>
                          <div className="font-medium text-sm line-clamp-2" title={review.product?.name}>{review.product?.name}</div>
                          <a href={`/product/${review.product?.slug}`} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                            Xem SP <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[300px]">
                      <div className="flex items-center text-yellow-400 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-gray-300"} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-700 italic break-words line-clamp-3" title={review.comment}>"{review.comment}"</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(review.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {review.status !== 'approved' && (
                          <button onClick={() => handleUpdateStatus(review.id, 'approved')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Duyệt">
                            <CheckCircle size={20} />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button onClick={() => handleUpdateStatus(review.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Từ chối">
                            <XCircle size={20} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(review.id)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-lg transition-colors" title="Xóa">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">
              Tổng số {pagination.total} đánh giá
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchReviews(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-4 py-2 border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => fetchReviews(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-4 py-2 border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
