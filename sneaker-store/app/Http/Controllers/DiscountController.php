<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DiscountController extends Controller
{
    /**
     * Lấy danh sách discount (Có phân trang nếu cần, tạm thời get all)
     */
    public function index()
    {
        // Có thể áp dụng paginate
        $discounts = Discount::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $discounts,
        ]);
    }

    /**
     * Tạo mới Discount
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:discounts,code',
            'type' => 'required|in:percent,fixed',
            'value' => 'required|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'expiration_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $discount = Discount::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tạo mã giảm giá thành công!',
            'data' => $discount,
        ], 201);
    }

    /**
     * Xem chi tiết Discount
     */
    public function show($id)
    {
        $discount = Discount::find($id);

        if (!$discount) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy mã giảm giá'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $discount,
        ]);
    }

    /**
     * Cập nhật Discount
     */
    public function update(Request $request, $id)
    {
        $discount = Discount::find($id);

        if (!$discount) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy mã giảm giá'], 404);
        }

        $validated = $request->validate([
            'code' => 'string|unique:discounts,code,' . $id,
            'type' => 'in:percent,fixed',
            'value' => 'numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'expiration_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $discount->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật mã giảm giá thành công!',
            'data' => $discount,
        ]);
    }

    /**
     * Xoá Discount
     */
    public function destroy($id)
    {
        $discount = Discount::find($id);

        if (!$discount) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy mã giảm giá'], 404);
        }

        // Soft delete
        $discount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xoá mã giảm giá thành công!',
        ]);
    }

    /**
     * Kiểm tra tính hợp lệ và tính toán số tiền giảm
     * Dành cho Frontend gọi khi khách hàng nhập mã.
     */
    public function apply(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'order_value' => 'required|numeric|min:0',
        ]);

        $code = trim($request->code);
        $orderValue = $request->order_value;

        // Tìm mã giảm giá
        $discount = Discount::where('code', $code)->first();

        // 1. Kiểm tra tồn tại
        if (!$discount) {
            return response()->json(['success' => false, 'message' => 'Mã giảm giá không tồn tại.'], 404);
        }

        // 2. Kiểm tra kích hoạt
        if (!$discount->is_active) {
            return response()->json(['success' => false, 'message' => 'Mã giảm giá này hiện đang tạm khoá.'], 400);
        }

        $now = Carbon::now();

        // 3. Kiểm tra ngày bắt đầu
        if ($discount->start_date && $now->lt($discount->start_date)) {
            return response()->json(['success' => false, 'message' => 'Mã giảm giá chưa đến ngày áp dụng.'], 400);
        }

        // 4. Kiểm tra ngày kết thúc
        if ($discount->expiration_date && $now->gt($discount->expiration_date)) {
            return response()->json(['success' => false, 'message' => 'Mã giảm giá đã hết hạn.'], 400);
        }

        // 5. Kiểm tra giới hạn lượt dùng
        if ($discount->usage_limit !== null && $discount->used_count >= $discount->usage_limit) {
            return response()->json(['success' => false, 'message' => 'Mã giảm giá đã hết lượt sử dụng.'], 400);
        }

        // 6. Kiểm tra điều kiện giá trị đơn tối thiểu
        if ($discount->min_order_value !== null && $orderValue < $discount->min_order_value) {
            return response()->json([
                'success' => false, 
                'message' => 'Đơn hàng chưa đạt giá trị tối thiểu ' . number_format($discount->min_order_value, 0, ',', '.') . 'đ để sử dụng mã này.'
            ], 400);
        }

        // 7. Tính Toán Tiền Giảm
        $discountAmount = 0;

        if ($discount->type === 'fixed') {
            $discountAmount = $discount->value;
        } elseif ($discount->type === 'percent') {
            $discountAmount = ($orderValue * $discount->value) / 100;
            // Nếu có max_discount_value thì cap lại
            if ($discount->max_discount_value !== null && $discountAmount > $discount->max_discount_value) {
                $discountAmount = $discount->max_discount_value;
            }
        }

        // Đảm bảo không giảm quá giá trị đơn hàng
        if ($discountAmount > $orderValue) {
            $discountAmount = $orderValue;
        }

        return response()->json([
            'success' => true,
            'message' => 'Áp dụng mã giảm giá thành công!',
            'data' => [
                'discount_id' => $discount->id,
                'code' => $discount->code,
                'discount_amount' => $discountAmount,
            ]
        ]);
    }
}
