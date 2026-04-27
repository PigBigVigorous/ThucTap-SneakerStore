<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Gửi email xác nhận đơn hàng
     */
    public function sendOrderConfirmation(Order $order)
    {
        // Hiện tại chúng ta sẽ ghi Log để giả lập việc gửi email
        // Bạn có thể tích hợp Mail::to($order->customer_email)->send(new OrderConfirmed($order)); sau này
        Log::info("📧 Email xác nhận đã được gửi cho đơn hàng: #{$order->order_tracking_code}");
        return true;
    }

    /**
     * Gửi thông báo thay đổi trạng thái đơn hàng
     */
    public function sendStatusUpdateNotification(Order $order)
    {
        Log::info("🔔 Thông báo: Đơn hàng #{$order->order_tracking_code} đã chuyển sang trạng thái: {$order->status}");
        return true;
    }
}
