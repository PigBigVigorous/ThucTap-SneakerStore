<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Services\InventoryService;
use Illuminate\Support\Facades\Log;

class ReleasePendingOrders extends Command
{
    // Tên lệnh để chạy trên terminal
    protected $signature = 'orders:release-pending';

    // Mô tả lệnh
    protected $description = 'Tự động hủy các đơn hàng pending quá 15 phút và nhả hàng lại kho';

    protected $inventoryService;

    // Nhúng Service quản lý kho vào
    public function __construct(InventoryService $inventoryService)
    {
        parent::__construct();
        $this->inventoryService = $inventoryService;
    }

    public function handle()
    {
        $this->info("Đang quét các đơn hàng treo (Pending > 15 phút)...");

        // 1. Tìm đơn hàng trạng thái 'pending' được tạo cách đây hơn 15 phút
        $timeLimit = now()->subMinutes(15);
        $orders = Order::where('status', 'pending')
                       ->where('created_at', '<=', $timeLimit)
                       ->get();

        if ($orders->isEmpty()) {
            $this->info("Không có đơn hàng treo nào cần xử lý.");
            return;
        }

        $count = 0;
        foreach ($orders as $order) {
            try {
                // 2. Gọi hàm hủy đơn (đã có sẵn DB::transaction & lockForUpdate bên trong)
                $this->inventoryService->cancelOrder($order);
                
                // 3. Đổi trạng thái đơn thành 'cancelled'
                $order->update(['status' => 'cancelled']);
                
                $count++;
                $this->info("✅ Đã giải phóng kho đơn hàng: {$order->order_tracking_code}");
                Log::info("Auto-cancelled pending order: {$order->order_tracking_code}");

            } catch (\Exception $e) {
                $this->error("❌ Lỗi giải phóng đơn {$order->order_tracking_code}: " . $e->getMessage());
                Log::error("Auto-cancel failed for order {$order->order_tracking_code}: " . $e->getMessage());
            }
        }

        $this->info("🎉 Quét hoàn tất! Đã giải phóng {$count} đơn hàng.");
    }
}