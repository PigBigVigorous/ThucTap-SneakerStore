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
            return DB::transaction(function () use ($request, $id) {
                $order = Order::lockForUpdate()->find($id);
                
                if (!$order) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy đơn hàng'
                    ], 404);
                }

                $oldStatus = $order->status;
                $newStatus = $request->status;

                // Nếu chuyển sang trạng thái "cancelled" (hủy), hoàn lại kho
                if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                    $this->inventoryService->cancelOrder($order);
                }

                // 🚨 NẾU LÀ TRẢ HÀNG (RETURNED), HOÀN LẠI KHO VỚI LOGIC RETURN
                if ($newStatus === 'returned' && $oldStatus !== 'returned') {
                    $this->inventoryService->returnOrder($order);
                }

                // Cập nhật trạng thái
                $order->status = $newStatus;
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