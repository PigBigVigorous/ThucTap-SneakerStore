<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\VariantBranchStock;
use App\Models\InventoryTransaction;
use Exception;

class InventoryService
{
    /**
     * Hàm xử lý đặt hàng và trừ kho an toàn (Multi-warehouse support)
     * 
     * @param int $userId
     * @param string $shippingAddress
     * @param array $items
     * @param int $saleschannelId
     * @param int $branchId
     * @return Order
     */
    public function placeOrder($userId, $shippingAddress, $items, $saleschannelId = null, $branchId = null)
    {
        // Bắt đầu Transaction: Nếu có bất kỳ lỗi nào (throw Exception), tự động Rollback toàn bộ DB.
        return DB::transaction(function () use ($userId, $shippingAddress, $items, $saleschannelId, $branchId) {
            
            $totalAmount = 0;

            // 1. Khởi tạo đơn hàng (trạng thái Pending, tiền tính sau)
            $order = Order::create([
                'order_tracking_code' => '#ORD-' . strtoupper(Str::random(6)), // VD: #ORD-A9X2B1
                'user_id' => $userId,
                'shipping_address' => $shippingAddress,
                'total_amount' => 0, 
                'status' => 'pending',
                'sales_channel_id' => $saleschannelId,
                'branch_id' => $branchId,
            ]);

            // 2. Lặp qua từng sản phẩm khách mua
            foreach ($items as $item) {
                // Bước cực kỳ quan trọng: Tìm và KHÓA dòng (lockForUpdate)
                // Ngăn chặn các giao dịch khác đụng vào đôi giày này cho đến khi đặt hàng xong
                $variant = ProductVariant::where('id', $item['variant_id'])->lockForUpdate()->first();

                if (!$variant) {
                    throw new Exception("Sản phẩm (Biến thể ID: {$item['variant_id']}) không tồn tại.");
                }

                // 3. Kiểm tra tồn kho tại chi nhánh
                $branchStock = VariantBranchStock::where('variant_id', $variant->id)
                    ->where('branch_id', $branchId)
                    ->lockForUpdate()
                    ->first();

                if (!$branchStock) {
                    throw new Exception("Sản phẩm {$variant->sku} không có tồn kho tại chi nhánh này.");
                }

                if ($branchStock->stock < $item['quantity']) {
                    throw new Exception("Sản phẩm {$variant->sku} không đủ số lượng. Tồn kho tại chi nhánh: {$branchStock->stock}");
                }

                // 4. Trừ tồn kho chi nhánh
                $branchStock->stock -= $item['quantity'];
                $branchStock->save();

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
                    'from_branch_id' => $branchId, // Xuất từ chi nhánh này
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

    /**
     * Hàm xử lý hủy đơn hàng và nhập stock lại
     * 
     * @param Order $order
     * @return void
     */
    public function cancelOrder(Order $order)
    {
        return DB::transaction(function () use ($order) {
            // Lặp qua các sản phẩm trong đơn hàng
            foreach ($order->items as $item) {
                // Tăng lại stock tại chi nhánh
                $branchStock = VariantBranchStock::where('variant_id', $item->product_variant_id)
                    ->where('branch_id', $order->branch_id)
                    ->lockForUpdate()
                    ->first();

                if ($branchStock) {
                    $branchStock->stock += $item->quantity;
                    $branchStock->save();
                }

                // Log giao dịch hoàn kho
                InventoryTransaction::create([
                    'product_variant_id' => $item->product_variant_id,
                    'transaction_type' => 'RESTOCK',
                    'to_branch_id' => $order->branch_id, // Nhập lại vào chi nhánh này
                    'reference_id' => $order->id,
                    'quantity_change' => $item->quantity, // Số dương vì nhập lại
                    'note' => "Hoàn kho do hủy đơn hàng: " . $order->order_tracking_code,
                    'created_at' => now(),
                ]);
            }

            return true;
        });
    }

    /**
     * Transfer stock between branches
     *
     * @param int $variantId
     * @param int $fromBranchId
     * @param int $toBranchId
     * @param int $quantity
     * @param string $note
     * @return void
     * @throws Exception
     */
    public function transferStock($variantId, $fromBranchId, $toBranchId, $quantity, $note)
    {
        return DB::transaction(function () use ($variantId, $fromBranchId, $toBranchId, $quantity, $note) {
            // Find and lock the source branch stock
            $fromStock = VariantBranchStock::where('variant_id', $variantId)
                ->where('branch_id', $fromBranchId)
                ->lockForUpdate()
                ->first();

            if (!$fromStock || $fromStock->stock < $quantity) {
                throw new Exception("Insufficient stock in source branch. Available: " . ($fromStock ? $fromStock->stock : 0));
            }

            // Decrement stock from source branch
            $fromStock->stock -= $quantity;
            $fromStock->save();

            // Find or create and lock the destination branch stock
            $toStock = VariantBranchStock::where('variant_id', $variantId)
                ->where('branch_id', $toBranchId)
                ->lockForUpdate()
                ->first();

            if (!$toStock) {
                $toStock = VariantBranchStock::create([
                    'variant_id' => $variantId,
                    'branch_id' => $toBranchId,
                    'stock' => 0,
                ]);
                $toStock = VariantBranchStock::where('variant_id', $variantId)
                    ->where('branch_id', $toBranchId)
                    ->lockForUpdate()
                    ->first();
            }

            // Increment stock in destination branch
            $toStock->stock += $quantity;
            $toStock->save();

            // Log the transaction
            InventoryTransaction::create([
                'product_variant_id' => $variantId,
                'transaction_type' => 'TRANSFER',
                'from_branch_id' => $fromBranchId,
                'to_branch_id' => $toBranchId,
                'quantity_change' => $quantity,
                'note' => $note,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Adjust stock (positive for found items, negative for damaged/lost)
     *
     * @param int $variantId
     * @param int $branchId
     * @param int $quantityChange
     * @param string $note
     * @return void
     * @throws Exception
     */
    public function adjustStock($variantId, $branchId, $quantityChange, $note)
    {
        return DB::transaction(function () use ($variantId, $branchId, $quantityChange, $note) {
            // Find and lock the branch stock
            $stock = VariantBranchStock::where('variant_id', $variantId)
                ->where('branch_id', $branchId)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                $stock = VariantBranchStock::create([
                    'variant_id' => $variantId,
                    'branch_id' => $branchId,
                    'stock' => 0,
                ]);
                $stock = VariantBranchStock::where('variant_id', $variantId)
                    ->where('branch_id', $branchId)
                    ->lockForUpdate()
                    ->first();
            }

            $newStock = $stock->stock + $quantityChange;
            if ($newStock < 0) {
                throw new Exception("Adjustment would result in negative stock. Current: {$stock->stock}, Change: {$quantityChange}");
            }

            // Update the stock
            $stock->stock = $newStock;
            $stock->save();

            // Log the transaction
            InventoryTransaction::create([
                'product_variant_id' => $variantId,
                'transaction_type' => 'ADJUSTMENT',
                'from_branch_id' => $branchId,
                'quantity_change' => $quantityChange,
                'note' => $note,
                'created_at' => now(),
            ]);
        });
    }
}