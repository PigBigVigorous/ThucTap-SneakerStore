<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\InventoryService;
use App\Models\Order;
use Exception;

class OrderController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Lấy danh sách toàn bộ đơn hàng
     * API: GET /api/admin/orders
     */
    public function index()
    {
        $orders = Order::with([
            'salesChannel',
            'branch',
            'cashier',
            'user',
            'items.variant.product',
            'items.variant.color',
            'items.variant.size'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Xem chi tiết một đơn hàng
     * API: GET /api/admin/orders/{id}
     */
    public function show($id)
    {
        $order = Order::with([
            'salesChannel',
            'branch',
            'cashier',
            'user',
            'items.variant.product',
            'items.variant.color',
            'items.variant.size'
        ])
        ->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Cập nhật trạng thái đơn hàng
     * API: PUT /api/admin/orders/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,processing,shipped,delivered,cancelled,returned'
        ]);

        try {
            return DB::transaction(function () use ($id, $request) {
                // 1. SỬA LỖI CÚ PHÁP Ở ĐÂY: Chỉ dùng find($id)
                $order = Order::lockForUpdate()->find($id);
                
                if (!$order) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy đơn hàng'
                    ], 404);
                }

                $oldStatus = $order->status;
                $newStatus = $request->status;

                // 2. CHẶN HỒI SINH ĐƠN HÀNG (Tránh thất thoát tồn kho)
                if (in_array($oldStatus, ['cancelled', 'returned']) && $newStatus !== $oldStatus) {
                    return response()->json([
                        'success' => false,
                        'message' => 'LỖI KẾ TOÁN: Đơn hàng này đã được hoàn kho (Hủy/Trả). Không thể đổi ngược lại trạng thái khác! Vui lòng tạo đơn mới.'
                    ], 400);
                }

                // 3. KHÔI PHỤC LẠI LOGIC CỘNG KHO (Bạn đã lỡ tay xóa mất)
                // Nếu chuyển sang trạng thái "cancelled" (hủy), hoàn lại kho
                if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                    $this->inventoryService->cancelOrder($order);
                }

                // Nếu là TRẢ HÀNG (RETURNED), hoàn lại kho với logic return
                if ($newStatus === 'returned' && $oldStatus !== 'returned') {
                    $this->inventoryService->returnOrder($order);
                }

                // 4. Cập nhật trạng thái mới
                $order->status = $newStatus;
                
                // Tự động mark Đã thanh toán khi Đã giao hàng thành công
                if ($newStatus === 'delivered') {
                    $order->payment_status = 'paid';

                    // CỘNG ĐIỂM TÍCH LŨY KHI GIAO HÀNG THÀNH CÔNG
                    if ($order->user_id && $order->points_earned > 0 && $oldStatus !== 'delivered') {
                        $user = \App\Models\User::find($order->user_id);
                        if ($user) {
                            $user->increment('points', $order->points_earned);
                            \App\Models\PointTransaction::create([
                                'user_id' => $user->id,
                                'amount' => $order->points_earned,
                                'type' => 'earn',
                                'reason' => "Tích điểm từ đơn hàng " . $order->order_tracking_code,
                                'order_id' => $order->id
                            ]);
                        }
                    }
                }

                $order->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Cập nhật trạng thái thành công!',
                    'data' => $order
                ]);
            });
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi cập nhật trạng thái: ' . $e->getMessage()
            ], 400);
        }
    }
}