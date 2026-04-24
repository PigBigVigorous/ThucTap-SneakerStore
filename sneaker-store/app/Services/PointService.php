<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\PointTransaction;
use Illuminate\Support\Facades\DB;

class PointService
{
    /**
     * Cộng điểm cho người dùng khi đơn hàng hoàn tất
     */
    public function awardPointsForOrder(Order $order)
    {
        if (!$order->user_id || $order->points_earned <= 0) {
            return;
        }

        // Kiểm tra xem đơn hàng đã được cộng điểm chưa để tránh cộng trùng
        $exists = PointTransaction::where('order_id', $order->id)
            ->where('type', 'earn')
            ->exists();

        if ($exists) {
            return;
        }

        DB::transaction(function () use ($order) {
            $user = User::lockForUpdate()->find($order->user_id);
            if ($user) {
                $user->increment('points', $order->points_earned);
                
                PointTransaction::create([
                    'user_id' => $user->id,
                    'amount' => $order->points_earned,
                    'type' => 'earn',
                    'reason' => "Tích điểm từ đơn hàng " . $order->order_tracking_code,
                    'order_id' => $order->id
                ]);
            }
        });
    }

    /**
     * Hoàn lại điểm khi đơn hàng bị hủy
     */
    public function refundPointsForOrder(Order $order)
    {
        if (!$order->user_id || $order->points_used <= 0) {
            return;
        }

        // Kiểm tra xem đã hoàn điểm chưa
        $exists = PointTransaction::where('order_id', $order->id)
            ->where('type', 'refund')
            ->exists();

        if ($exists) {
            return;
        }

        DB::transaction(function () use ($order) {
            $user = User::lockForUpdate()->find($order->user_id);
            if ($user) {
                $user->increment('points', $order->points_used);
                
                PointTransaction::create([
                    'user_id' => $user->id,
                    'amount' => $order->points_used,
                    'type' => 'refund',
                    'reason' => "Hoàn điểm do đơn hàng bị hủy/trả: " . $order->order_tracking_code,
                    'order_id' => $order->id
                ]);
            }
        });
    }
    /**
     * Thu hồi điểm tích lũy khi đơn hàng bị trả lại
     */
    public function deductEarnedPointsForReturn(Order $order)
    {
        if (!$order->user_id || $order->points_earned <= 0) {
            return;
        }

        // Kiểm tra xem đã thu hồi điểm chưa
        $exists = PointTransaction::where('order_id', $order->id)
            ->where('type', 'deduct')
            ->exists();

        if ($exists) {
            return;
        }

        DB::transaction(function () use ($order) {
            $user = User::lockForUpdate()->find($order->user_id);
            if ($user) {
                $user->decrement('points', $order->points_earned);
                
                PointTransaction::create([
                    'user_id' => $user->id,
                    'amount' => -$order->points_earned,
                    'type' => 'deduct',
                    'reason' => "Thu hồi điểm tích lũy do trả đơn hàng: " . $order->order_tracking_code,
                    'order_id' => $order->id
                ]);
            }
        });
    }
}
