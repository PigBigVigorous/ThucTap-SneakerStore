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

    public function index()
    {
        $orders = Order::with([
            'salesChannel', 'branch', 'cashier', 'user',
            'items.variant.product', 'items.variant.color', 'items.variant.size'
        ])->orderBy('created_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $orders]);
    }

    public function show($id)
    {
        $order = Order::with([
            'salesChannel', 'branch', 'cashier', 'user',
            'items.variant.product', 'items.variant.color', 'items.variant.size'
        ])->find($id);

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
        }

        return response()->json(['success' => true, 'data' => $order]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,processing,shipped,delivered,cancelled,returned'
        ]);

        try {
            return DB::transaction(function () use ($id, $request) {
                $order = Order::lockForUpdate()->find($id);
                if (!$order) {
                    throw new Exception('Không tìm thấy đơn hàng');
                }

                $oldStatus = $order->status;
                $newStatus = $request->status;

                if (in_array($oldStatus, ['cancelled', 'returned']) && $newStatus !== $oldStatus) {
                    throw new Exception('Đơn hàng đã hoàn kho, không thể đổi trạng thái!');
                }

                if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                    $this->inventoryService->cancelOrder($order);
                }

                if ($newStatus === 'returned' && $oldStatus !== 'returned') {
                    $this->inventoryService->returnOrder($order);
                }

                $order->status = $newStatus;
                
                if ($newStatus === 'delivered') {
                    $order->payment_status = 'paid';
                    if ($oldStatus !== 'delivered') {
                        app(\App\Services\PointService::class)->awardPointsForOrder($order);
                    }
                }

                $order->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Cập nhật thành công',
                    'data' => $order
                ]);
            });
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function assignShipper(Request $request, $id)
    {
        $request->validate([
            'shipper_id' => 'required|exists:users,id'
        ]);

        $order = Order::findOrFail($id);
        
        if (in_array($order->status, ['delivered', 'cancelled', 'returned'])) {
            return response()->json(['success' => false, 'message' => 'Trạng thái đơn hàng không phù hợp'], 400);
        }

        $order->update(['shipper_id' => $request->shipper_id]);

        return response()->json([
            'success' => true,
            'message' => 'Đã gán shipper thành công!',
            'data' => $order->load('shipper:id,name,phone')
        ]);
    }
}