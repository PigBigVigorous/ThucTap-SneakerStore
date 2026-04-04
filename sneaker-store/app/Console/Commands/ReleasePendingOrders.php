<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Services\InventoryService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\VariantBranchStock;
use App\Models\InventoryTransaction;

class ReleasePendingOrders extends Command
{
    // Tên lệnh để chạy trên terminal
    protected $signature = 'orders:release-pending';

    // Mô tả lệnh
    protected $description = 'Hoàn tồn kho cho các đơn hàng online thanh toán thất bại hoặc quá hạn 15 phút';
    protected $inventoryService;

    // Nhúng Service quản lý kho vào
    public function __construct(InventoryService $inventoryService)
    {
        parent::__construct();
        $this->inventoryService = $inventoryService;
    }

    public function handle()
    {
        // Lấy đơn hàng Online, trạng thái thanh toán 'failed' hoặc 'pending' quá 15 phút
        $expiredOrders = Order::with('items')
            ->where('payment_method', 'vnpay')
            ->where('status', 'pending')
            ->where(function($query) {
                $query->where('payment_status', 'failed')
                      ->orWhere(function($q) {
                          $q->where('payment_status', 'pending')
                            ->where('created_at', '<=', now()->subMinutes(15));
                      });
            })
            ->get();

        foreach ($expiredOrders as $order) {
            DB::transaction(function () use ($order) {
                foreach ($order->items as $item) {
                    // 1. Hoàn lại tồn kho tại đúng chi nhánh đã trừ
                    $stock = VariantBranchStock::where('product_variant_id', $item->variant_id)
                        ->where('branch_id', $order->branch_id)
                        ->first();

                    if ($stock) {
                        $stock->increment('stock_quantity', $item->quantity);

                        // 2. Ghi log giao dịch kho (Nhập lại do hủy đơn)
                        InventoryTransaction::create([
                            'product_variant_id' => $item->variant_id,
                            'branch_id' => $order->branch_id,
                            'quantity' => $item->quantity,
                            'type' => 'in',
                            'note' => "Hoàn tồn kho từ đơn hàng: {$order->order_tracking_code} (Thanh toán thất bại/Quá hạn)"
                        ]);
                    }
                }

                // 3. Cập nhật trạng thái đơn hàng thành Hủy
                $order->update([
                    'status' => 'cancelled',
                    'payment_status' => $order->payment_status === 'pending' ? 'failed' : $order->payment_status
                ]);
            });

            $this->info("Đã giải phóng kho cho đơn hàng: {$order->order_tracking_code}");
        }

        return Command::SUCCESS;
    }
}
