<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;

class OrderController extends Controller
{
    /**
     * Lấy danh sách toàn bộ đơn hàng
     * API: GET /api/admin/orders
     */
    public function index()
    {
        $orders = Order::with(['items.variant.product', 'items.variant.color', 'items.variant.size'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Cập nhật trạng thái đơn hàng
     * API: PUT /api/admin/orders/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        $order = Order::find($id);
        
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
        }

        $order->status = $request->status;
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công!'
        ]);
    }
}