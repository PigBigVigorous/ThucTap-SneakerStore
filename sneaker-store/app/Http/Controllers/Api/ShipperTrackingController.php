<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderTracking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\PointService;

class ShipperTrackingController extends Controller
{
    /**
     * Cập nhật vị trí/trạng thái đơn hàng (Dành cho Shipper)
     */
    public function updateTracking(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);

        // Authorization: Đảm bảo user hiện tại là shipper của đơn này
        // Nếu shipper_id chưa được gán, có thể cho phép shipper tự nhận đơn (tùy logic business)
        // Ở đây giả sử admin đã gán shipper_id
        if ($order->shipper_id !== $request->user()->id) {
            return response()->json(['message' => 'Bạn không được phân công giao đơn hàng này.'], 403);
        }

        if (in_array($order->status, ['delivered', 'cancelled', 'returned'])) {
            return response()->json(['message' => 'Đơn hàng này đã kết thúc, không thể cập nhật thêm.'], 400);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:picked_up,in_transit,delivering,delivered,failed',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'location_text' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:500',
            'image' => 'nullable|image|max:5120', // Max 5MB
        ]);

        return DB::transaction(function () use ($order, $request, $validated) {
            $imageUrl = null;
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('order_proofs', 'public');
                $imageUrl = '/storage/' . $path;
            }

            // Lưu checkpoint tracking
            $trackingData = array_merge($validated, ['image_url' => $imageUrl]);
            $order->trackings()->create($trackingData);
            
            // Cập nhật trạng thái chính của đơn hàng
            $order->update(['status' => $validated['status']]);
            
            // Nếu trạng thái là 'delivered', kích hoạt cộng điểm loyalty và đánh dấu đã thanh toán
            if ($validated['status'] === 'delivered') {
                $order->update(['payment_status' => 'paid']);
                app(PointService::class)->awardPointsForOrder($order);
            }

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật hành trình thành công',
                'data' => $order->load(['trackings', 'shipper'])
            ]);
        });
    }

    /**
     * Lấy lịch sử hành trình đơn hàng (Dành cho Khách hàng & Shipper)
     */
    public function getTracking(Request $request, $orderTrackingCode)
    {
        $order = Order::where('order_tracking_code', $orderTrackingCode)
            ->with(['trackings', 'shipper:id,name,phone_number'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'order_status' => $order->status,
            'customer_info' => [
                'name' => $order->customer_name,
                'province' => $order->province,
                'district' => $order->district,
                'ward' => $order->ward,
                'address_detail' => $order->address_detail,
            ],
            'shipper' => $order->shipper,
            'trackings' => $order->trackings
        ]);
    }

    /**
     * Danh sách đơn hàng được phân công cho Shipper hiện tại
     */
    public function myAssignedOrders(Request $request)
    {
        $orders = Order::where('shipper_id', $request->user()->id)
            ->whereNotIn('status', ['delivered', 'cancelled', 'returned'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }
}
