<?php

namespace App\Services;

use App\Models\Order;
use App\Mail\OrderConfirmation;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class OrderNotificationService
{
    /**
     * Send order confirmation email to customer
     *
     * @param Order $order
     * @return bool
     */
    public function sendOrderConfirmation(Order $order): bool
    {
        try {
            // Validate order has required data
            if (!$order->customer_email || !$order->customer_name) {
                Log::warning('Order confirmation email not sent: Missing customer email or name', [
                    'order_id' => $order->id,
                    'tracking_code' => $order->order_tracking_code
                ]);
                return false;
            }

            // Send email via queue
            Mail::to($order->customer_email)->send(new OrderConfirmation($order));

            Log::info('Order confirmation email sent successfully', [
                'order_id' => $order->id,
                'tracking_code' => $order->order_tracking_code,
                'customer_email' => $order->customer_email
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send order confirmation email', [
                'order_id' => $order->id,
                'tracking_code' => $order->order_tracking_code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Don't throw exception to prevent breaking payment flow
            return false;
        }
    }

    /**
     * Send order status update notification
     *
     * @param Order $order
     * @param string $oldStatus
     * @param string $newStatus
     * @return bool
     */
    public function sendOrderStatusUpdate(Order $order, string $oldStatus, string $newStatus): bool
    {
        // Future implementation for status updates
        // For now, just log
        Log::info('Order status updated', [
            'order_id' => $order->id,
            'tracking_code' => $order->order_tracking_code,
            'old_status' => $oldStatus,
            'new_status' => $newStatus
        ]);

        return true;
    }
}