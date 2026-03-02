<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\InventoryTransaction;
use Exception;

class InventoryService
{
    /**
     * Hàm xử lý đặt hàng và trừ kho an toàn
     */
    public function placeOrder($userId, $shippingAddress, $items)
    {
        // Bắt đầu Transaction: Nếu có bất kỳ lỗi nào (throw Exception), tự động Rollback toàn bộ DB.
        return DB::transaction(function () use ($userId, $shippingAddress, $items) {
            
            $totalAmount = 0;

            // 1. Khởi tạo đơn hàng (trạng thái Pending, tiền tính sau)
            $order = Order::create([
                'order_tracking_code' => '#ORD-' . strtoupper(Str::random(6)), // VD: #ORD-A9X2B1
                'user_id' => $userId,
                'shipping_address' => $shippingAddress,
                'total_amount' => 0, 
                'status' => 'pending',
            ]);

            // 2. Lặp qua từng sản phẩm khách mua
            foreach ($items as $item) {
                // Bước cực kỳ quan trọng: Tìm và KHÓA dòng (lockForUpdate)
                // Ngăn chặn các giao dịch khác đụng vào đôi giày này cho đến khi đặt hàng xong
                $variant = ProductVariant::where('id', $item['variant_id'])->lockForUpdate()->first();

                if (!$variant) {
                    throw new Exception("Sản phẩm (Biến thể ID: {$item['variant_id']}) không tồn tại.");
                }

                // 3. Kiểm tra tồn kho
                if ($variant->current_stock < $item['quantity']) {
                    throw new Exception("Sản phẩm {$variant->sku} không đủ số lượng. Tồn kho hiện tại: {$variant->current_stock}");
                }

                // 4. Trừ tồn kho và lưu lại
                $variant->current_stock -= $item['quantity'];
                $variant->save();

                // 5. Tính tiền
                $itemTotal = $variant->price * $item['quantity'];
                $totalAmount += $itemTotal;

                // 6. Lưu Chi tiết đơn hàng (OrderItem)
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $variant->price, // Lưu giá tại thời điểm mua
                ]);

                // 7. GHI LOG BIẾN ĐỘNG KHO (Bắt buộc)
                InventoryTransaction::create([
                    'product_variant_id' => $variant->id,
                    'transaction_type' => 'SALE',
                    'reference_id' => $order->id, // Trỏ về ID đơn hàng
                    'quantity_change' => -$item['quantity'], // Số âm vì là bán ra
                    'note' => "Xuất bán cho đơn hàng: " . $order->order_tracking_code,
                    'created_at' => now(),
                ]);
            }

            // 8. Cập nhật tổng tiền cho đơn hàng
            $order->total_amount = $totalAmount;
            $order->save();

            // Nếu chạy đến đây mà không có lỗi gì, tự động Commit vào DB.
            return $order;
        });
    }
}