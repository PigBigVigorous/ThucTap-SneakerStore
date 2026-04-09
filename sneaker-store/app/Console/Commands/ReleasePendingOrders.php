<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ReleasePendingOrders extends Command
{
    // Tên lệnh để chạy trong terminal
    protected $signature = 'orders:release-pending';

    protected $description = 'Tự động hủy các đơn hàng VNPAY chưa thanh toán sau 30 phút và hoàn lại tồn kho';

    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        parent::__construct();
        $this->inventoryService = $inventoryService;
    }

    public function handle()
    {
        $this->info("Bắt đầu quét các đơn hàng VNPAY bị treo...");

        // Tìm các đơn VNPAY đang pending và tạo cách đây hơn 30 phút
        $expiredOrders = Order::where('status', 'pending')
            ->where('payment_status', 'pending')
            ->where('payment_method', 'vnpay') // 🟢 Rất quan trọng: Chỉ quét đơn VNPAY (đơn COD thì vẫn giao bình thường)
            ->where('created_at', '<', Carbon::now()->subMinutes(30))
            ->get();

        $count = 0;

        foreach ($expiredOrders as $order) {
            try {
                // 1. Gọi hàm cancelOrder (bạn đã viết sẵn cực chuẩn trong InventoryService) để cộng lại tồn kho
                $this->inventoryService->cancelOrder($order);

                // 2. Cập nhật trạng thái đơn hàng thành Thất bại/Đã hủy
                $order->update([
                    'status' => 'cancelled',
                    'payment_status' => 'failed'
                ]);

                $count++;
                Log::info("Cronjob: Đã hủy tự động và hoàn kho đơn " . $order->order_tracking_code);
            } catch (\Exception $e) {
                Log::error("Cronjob Lỗi khi hủy đơn " . $order->order_tracking_code . ": " . $e->getMessage());
            }
        }

        $this->info("Hoàn tất! Đã xử lý {$count} đơn hàng hết hạn.");
    }
}