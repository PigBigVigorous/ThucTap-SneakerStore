<?php

namespace App\Services;

use App\Models\Order;
use App\Mail\OrderConfirmation;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Gửi email xác nhận đơn hàng
     */
    public function sendOrderConfirmation(Order $order)
    {
        try {
            if (!$order->customer_email) {
                Log::warning("⚠️ Không thể gửi email xác nhận cho đơn hàng {$order->order_tracking_code}: Thiếu địa chỉ email khách hàng.");
                return false;
            }

            // Gửi email xác nhận (đã được queue trong Mailable)
            Mail::to($order->customer_email)->send(new OrderConfirmation($order));
            
            Log::info("📧 Lệnh gửi email xác nhận đã được đẩy vào hàng đợi cho đơn hàng: {$order->order_tracking_code}");
            return true;
        } catch (\Exception $e) {
            Log::error("❌ Lỗi khi gửi email xác nhận đơn hàng {$order->order_tracking_code}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Gửi thông báo thay đổi trạng thái đơn hàng
     */
    public function sendStatusUpdateNotification(Order $order)
    {
        Log::info("🔔 Thông báo: Đơn hàng {$order->order_tracking_code} đã chuyển sang trạng thái: {$order->status}");
        // Có thể bổ sung gửi Mail thông báo trạng thái tại đây sau này
        return true;
    }
}
