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
    public function placeOrder($userId, $customerData, $items, $salesChannelId = null, $branchId = null)
    {
        return DB::transaction(function () use ($userId, $customerData, $items, $salesChannelId, $branchId) {
            
            $orderCode = '#ORD-' . strtoupper(Str::random(6));
            $totalAmount = 0;
            $chosenBranchId = $branchId; // Nếu là POS thì có sẵn ID Kho

            // 🚀 NẾU ĐƠN ONLINE (Không có ID Kho) -> KÍCH HOẠT SMART ROUTING DÒ KHOẢNG CÁCH
            if (!$chosenBranchId) {
                $custProvince = mb_strtolower($customerData['province'] ?? '');
                $custDistrict = mb_strtolower($customerData['district'] ?? '');

                $allBranches = \App\Models\Branch::all();
                $eligibleBranches = [];

                // VÒNG 1: Lọc tồn kho
                foreach ($allBranches as $branch) {
                    $canFulfill = true;
                    foreach ($items as $item) {
                        $stock = \App\Models\VariantBranchStock::where('branch_id', $branch->id)
                            ->where('variant_id', $item['variant_id'])
                            ->first();
                        if (!$stock || $stock->stock < $item['quantity']) {
                            $canFulfill = false; break;
                        }
                    }
                    if ($canFulfill) { $eligibleBranches[] = $branch; }
                }

                if (empty($eligibleBranches)) {
                    throw new Exception("Rất tiếc, hiện tại không có một kho nào đủ hàng để giao trọn vẹn đơn này. Vui lòng giảm số lượng hoặc tách đơn.");
                }

                // VÒNG 2: Chấm điểm khoảng cách
                $bestBranch = null;
                $maxScore = -1;
                foreach ($eligibleBranches as $branch) {
                    $score = 0;
                    $branchAddress = mb_strtolower(($branch->name ?? '') . ' ' . ($branch->address ?? ''));
                    if (\Illuminate\Support\Str::contains($branchAddress, $custProvince)) {
                        if (\Illuminate\Support\Str::contains($branchAddress, $custDistrict)) {
                            $score = 100; // Cùng Quận -> Hỏa Tốc
                        } else {
                            $score = 50;  // Cùng Tỉnh -> Trong Ngày
                        }
                    } else { $score = 10; }
                    
                    if ($branch->is_main) { $score += 5; } // Ưu tiên Kho Tổng nếu bằng điểm

                    if ($score > $maxScore) {
                        $maxScore = $score;
                        $bestBranch = $branch;
                    }
                }
                $chosenBranchId = $bestBranch->id;
            }

            // KIỂM TRA LẠI KIỂU DỮ LIỆU ĐỂ TƯƠNG THÍCH POS CŨ (Truyền chuỗi)
            $isPos = is_string($customerData);

            // 🚀 BẢO MẬT: TÍNH PHÍ SHIP TỰ ĐỘNG TỪ BACKEND
            $shippingFee = 0;
            if (!$isPos) {
                $shippingFee = $this->calculateShippingFee($customerData['province'] ?? '', $customerData['district'] ?? '');
            }

            // 1. TẠO ĐƠN HÀNG
            $order = Order::create([
                'order_tracking_code' => $orderCode,
                'user_id' => $userId,
                'status' => 'pending',
                'payment_status' => 'pending', 
                'payment_method' => $isPos ? 'cash' : ($customerData['payment_method'] ?? 'cod'), // 🟢 Lưu lại phương thức thanh toán
                'total_amount' => 0,
                'shipping_fee' => $shippingFee, // 🟢 Gán phí ship chuẩn
                'customer_name' => $isPos ? 'Khách lẻ' : ($customerData['customer_name'] ?? null),
                'customer_phone' => $isPos ? null : ($customerData['customer_phone'] ?? null),
                'customer_email' => $isPos ? null : ($customerData['customer_email'] ?? null),
                'province' => $isPos ? null : ($customerData['province'] ?? null),
                'district' => $isPos ? null : ($customerData['district'] ?? null),
                'ward' => $isPos ? null : ($customerData['ward'] ?? null),
                'address_detail' => $isPos ? null : ($customerData['address_detail'] ?? null),
                'sales_channel_id' => $salesChannelId,
                'branch_id' => $chosenBranchId, 
            ]);

                

            // 2. LẶP TRỪ KHO & LƯU ORDER_ITEMS (Có Lock Hàng)
            foreach ($items as $item) {
                $variant = ProductVariant::lockForUpdate()->findOrFail($item['variant_id']);
                $price = $variant->price;
                $totalAmount += ($price * $item['quantity']);

                $stockRecord = VariantBranchStock::where('variant_id', $variant->id)
                    ->where('branch_id', $chosenBranchId)
                    ->lockForUpdate()
                    ->first();
                
                if (!$stockRecord || $stockRecord->stock < $item['quantity']) {
                    throw new Exception("Sản phẩm (SKU: {$variant->sku}) vừa hết hàng tại kho xuất. Vui lòng thử lại.");
                }

                $stockRecord->stock -= $item['quantity'];
                $stockRecord->save();

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $price
                ]);

                InventoryTransaction::create([
                    'product_variant_id' => $variant->id,
                    'transaction_type' => 'SALE',
                    'from_branch_id' => $chosenBranchId,
                    'reference_id' => $order->id,
                    'quantity_change' => -$item['quantity'],
                    'note' => "Xuất bán (ID Kho: {$chosenBranchId}) - Đơn: " . $orderCode,
                    'created_at' => now(),
                ]);
            }

            // 3. CẬP NHẬT TIỀN (BAO GỒM PHÍ SHIP NẾU CÓ)
            $shippingFee = $isPos ? 0 : ($customerData['shipping_fee'] ?? 0);
            $order->update(['total_amount' => $totalAmount + $shippingFee]);

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
                    'transaction_type' => 'RETURN',
                    'to_branch_id' => $order->branch_id,
                    'reference_id' => $order->id,
                    'quantity_change' => $item->quantity, 
                    'note' => "Hoàn kho do hủy đơn hàng: " . $order->order_tracking_code,
                    'created_at' => now(),
                ]);
            }

            return true;
        });
    }

    /**
     * 
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
            
            $fromStock = VariantBranchStock::where('variant_id', $variantId)
                ->where('branch_id', $fromBranchId)
                ->lockForUpdate()
                ->first();

            if (!$fromStock || $fromStock->stock < $quantity) {
                throw new Exception("Insufficient stock in source branch. Available: " . ($fromStock ? $fromStock->stock : 0));
            }

            $fromStock->stock -= $quantity;
            $fromStock->save();

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

            $toStock->stock += $quantity;
            $toStock->save();

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
     *
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

    public function importStock($variantId, $branchId, $quantity, $note)
    {
        return DB::transaction(function () use ($variantId, $branchId, $quantity, $note) {
            // 1. Tìm tồn kho chi nhánh, khóa dòng (lockForUpdate) để tránh ghi đè dữ liệu
            $stock = VariantBranchStock::where('variant_id', $variantId)
                ->where('branch_id', $branchId)
                ->lockForUpdate()
                ->first();

            // Nếu biến thể này chưa từng có ở chi nhánh này thì tạo mới dòng tồn kho
            if (!$stock) {
                $stock = VariantBranchStock::create([
                    'variant_id' => $variantId,
                    'branch_id' => $branchId,
                    'stock' => 0,
                ]);
            }

            // 2. Cộng số lượng lô hàng mới vào kho
            $stock->stock += $quantity;
            $stock->save();

            // 3. Ghi Lịch sử biến động chuẩn quy trình Kế toán
            InventoryTransaction::create([
                'product_variant_id' => $variantId,
                'transaction_type' => 'IMPORT', // 🛑 Gắn nhãn chuẩn là IMPORT
                'to_branch_id' => $branchId,    // 🛑 Ghi rõ hàng chạy VÀO kho nào
                'quantity_change' => $quantity,
                'note' => $note,
                'created_at' => now(),
            ]);
        });
    }
    
    /**
     * Nghiệp vụ Trả Hàng
     */
    public function returnOrder($order)
    {
        
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                // 1. Tìm tồn kho của biến thể tại chi nhánh đã mua (có lock)
                $branchStock = VariantBranchStock::where('variant_id', $item->variant_id)
                    ->where('branch_id', $order->branch_id)
                    ->lockForUpdate()
                    ->first();

                if ($branchStock) {
                    // 2. Cộng lại số lượng giày vào kho
                    $branchStock->stock += $item->quantity;
                    $branchStock->save();

                    // 3. Ghi lịch sử biến động là RETURN để kế toán kiểm tra
                    InventoryTransaction::create([
                        'product_variant_id' => $item->variant_id,
                        'transaction_type' => 'RETURN', 
                        'reference_id' => $order->id,
                        'quantity_change' => $item->quantity, // Số dương (cộng vào)
                        'note' => 'Khách trả hàng (Mã đơn: ' . $order->order_tracking_code . ')',
                        'to_branch_id' => $order->branch_id, // Hàng chạy thẳng vào chi nhánh
                        'created_at' => now(),
                    ]);
                }
            }
        });
    }
    /**
     * Thuật toán định vị nội thành để tính phí ship
     */
    private function calculateShippingFee($province, $district)
    {
        $province = mb_strtolower($province ?? '');
        $district = mb_strtolower($district ?? '');

        $innerHCM = ["quận 1", "quận 3", "quận 4", "quận 5", "quận 6", "quận 7", "quận 8", "quận 10", "quận 11", "tân bình", "tân phú", "phú nhuận", "gò vấp", "bình thạnh"];
        $innerHN = ["ba đình", "hoàn kiếm", "tây hồ", "long biên", "cầu giấy", "đống đa", "hai bà trưng", "hoàng mai", "thanh xuân", "nam từ liêm", "bắc từ liêm", "hà đông"];
        $innerDN = ["hải châu", "thanh khê", "sơn trà", "cẩm lệ"];

        $isInnerCity = false;

        // Str::contains hỗ trợ truyền mảng để dò tìm
        if (\Illuminate\Support\Str::contains($province, "hồ chí minh") && \Illuminate\Support\Str::contains($district, $innerHCM)) {
            $isInnerCity = true;
        } elseif (\Illuminate\Support\Str::contains($province, "hà nội") && \Illuminate\Support\Str::contains($district, $innerHN)) {
            $isInnerCity = true;
        } elseif (\Illuminate\Support\Str::contains($province, "đà nẵng") && \Illuminate\Support\Str::contains($district, $innerDN)) {
            $isInnerCity = true;
        }

        return $isInnerCity ? 0 : 30000;
    }
}