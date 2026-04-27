<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderTracking;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ShipperTrackingController extends Controller
{
    /**
     * Lấy danh sách đơn hàng được phân công cho shipper hiện tại
     */
    public function myOrders(Request $request)
    {
        $shipperId = $request->user()->id;
        $orders = Order::with([
            'items.variant.product', 
            'items.variant.color', 
            'items.variant.size',
            'trackings' => function($q) { $q->orderBy('created_at', 'desc'); }
        ])
        ->where('shipper_id', $shipperId)
        ->orderBy('updated_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Lấy chi tiết đơn hàng cho shipper
     */
    public function showOrderById($id)
    {
        $order = Order::with([
            'items.variant.product', 
            'items.variant.color', 
            'items.variant.size',
            'trackings' => function($q) { $q->orderBy('created_at', 'desc'); },
            'shipper:id,name,phone'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Cập nhật hành trình và trạng thái đơn hàng
     */
    public function updateTracking(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);

        // Kiểm tra quyền
        if ($order->shipper_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Bạn không được phân công giao đơn hàng này.'], 403);
        }

        // Kiểm tra trạng thái cuối
        if (in_array($order->status, ['cancelled', 'returned'])) {
            return response()->json(['success' => false, 'message' => 'Đơn hàng này đã kết thúc và không thể cập nhật thêm.'], 400);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'status' => 'required|string|in:shipped,delivering,delivered,failed,returned',
            'latitude' => 'nullable',
            'longitude' => 'nullable',
            'location_text' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:500',
            'image' => 'nullable|file|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ: ' . implode(', ', $validator->errors()->all())
            ], 422);
        }

        $validated = $validator->validated();

        if ($order->status === 'delivered' && $validated['status'] !== 'returned') {
            return response()->json(['success' => false, 'message' => 'Đơn hàng đã hoàn thành, chỉ có thể cập nhật trạng thái Trả hàng.'], 400);
        }

        return DB::transaction(function () use ($order, $request, $validated) {
            $imageUrl = null;
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('order_proofs', 'public');
                $imageUrl = '/storage/' . $path;
            }

            // Lưu checkpoint tracking
            $order->trackings()->create([
                'status' => $validated['status'],
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'location_text' => $validated['location_text'] ?? 'Cập nhật hành trình',
                'note' => $validated['note'] ?? null,
                'image_url' => $imageUrl
            ]);
            
            // Cập nhật trạng thái chính
            $order->update(['status' => $validated['status']]);
            
            // Xử lý hoàn tất đơn hàng
            if ($validated['status'] === 'delivered') {
                $order->update([
                    'payment_status' => 'paid',
                    'delivery_proof_image' => $imageUrl
                ]);
                app(PointService::class)->awardPointsForOrder($order);
            }

            // Xử lý trả hàng
            if ($validated['status'] === 'returned') {
                $order->update([
                    'payment_status' => 'refunded'
                ]);
                // Cộng ngược sản phẩm về kho & hoàn/thu hồi điểm
                app(\App\Services\InventoryService::class)->returnOrder($order);
            }

            // Trả về dữ liệu ĐỒNG BỘ với cấu trúc chuẩn
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật hành trình thành công!',
                'data' => $order->load([
                    'items.variant.product', 
                    'items.variant.color', 
                    'items.variant.size',
                    'trackings' => function($q) { $q->orderBy('created_at', 'desc'); },
                    'shipper:id,name,phone'
                ])
            ]);
        });
    }
}
