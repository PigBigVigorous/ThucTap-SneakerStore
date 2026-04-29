# Báo cáo Phân tích & Tối ưu hóa Database

Tài liệu này tổng hợp các điểm mạnh của kiến trúc Database hiện tại và các gợi ý tối ưu thêm để bạn tự tin báo cáo trước hội đồng tốt nghiệp/thực tập.

## 1. Các điểm mạnh cốt lõi (Nên nhấn mạnh khi bảo vệ)

### Chuẩn hóa Dữ liệu (Normalization)
- Database được thiết kế đạt **Chuẩn 3NF**, tách biệt rõ ràng các thực thể:
  - Danh mục (`categories`), Thương hiệu (`brands`).
  - Thuộc tính sản phẩm: Màu sắc (`colors`), Kích cỡ (`sizes`).
  - Đơn vị quản lý: Chi nhánh (`branches`), Kênh bán hàng (`sales_channels`).

### Tính toàn vẹn dữ liệu (Data Integrity)
- **Foreign Keys (Khóa ngoại):** Sử dụng đầy đủ ràng buộc khóa ngoại (`constrained`) với các hành vi `onDelete('cascade')` hoặc `nullOnDelete()` hợp lý.
- **Soft Deletes (Xóa mềm):** Áp dụng cho `products`, `product_variants`, `users` giúp giữ lại lịch sử đơn hàng khi xóa sản phẩm/khách hàng.

### Hiệu suất & Khả năng mở rộng
- **Multi-Branch & Omnichannel:** Bảng `variant_branch_stocks` cho phép quản lý tồn kho riêng biệt cho từng chi nhánh, sẵn sàng cho chuỗi cửa hàng.
- **Indexes (Chỉ mục):** Đã tối ưu tốc độ tìm kiếm bằng Composite Index và Single Index tại các cột truy vấn nhiều:
  - `orders`: `status`, `created_at`.
  - `products`: `['is_active', 'deleted_at']`.
  - `variant_branch_stocks`: Unique index `['variant_id', 'branch_id']`.

---

## 2. Các điểm đã tối ưu hóa gần đây (Điểm cộng lớn)

- **Sửa lỗi N+1 Query:** Gộp các câu lệnh `SUM(stock)` trong dashboard thành truy vấn `whereIn` duy nhất.
- **Áp dụng Caching:** Sử dụng `Cache::remember` cho Danh mục, Thương hiệu, Khoảng giá để giảm tải Database.

---

## 3. Đề xuất bổ sung (Nếu hội đồng hỏi thêm)

- **Database Transactions:** Đã áp dụng tại các luồng thanh toán và xử lý kho để đảm bảo nguyên tắc ACID (Atomic, Consistent, Isolated, Durable).
