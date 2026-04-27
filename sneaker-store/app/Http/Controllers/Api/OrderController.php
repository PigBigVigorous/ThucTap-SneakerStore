<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\InventoryService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class OrderController extends Controller
{
    protected $inventoryService;
    protected $notificationService;

    public function __construct(InventoryService $inventoryService, NotificationService $notificationService)
    {
        $this->inventoryService = $inventoryService;
        $this->notificationService = $notificationService;
    }

    /**
     * Lấy danh sách đơn hàng của tôi
     */
    public function index()
    {
        $user = auth()->user();
        $orders = Order::with(['items.variant.product', 'items.variant.color', 'items.variant.size', 'salesChannel', 'branch'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Đặt hàng online
     */
    public function store(Request $request)
    {
        $userId = auth()->id();
        $validatedData = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email|max:255',
            'province' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'ward' => 'required|string|max:100',
            'address_detail' => 'required|string|max:255',
            'payment_method' => 'required|string|in:cod,vnpay',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'discount_code' => 'nullable|string|exists:discounts,code',
            'shipping_fee' => 'nullable|numeric|min:0',
            'points_used' => 'nullable|integer|min:0',
            'note' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        try {
            $webChannelId = \App\Models\SalesChannel::where('type', 'online')->value('id') ?? 1;

            $order = $this->inventoryService->placeOrder(
                $userId,
                $validatedData,
                $validatedData['items'],
                $webChannelId
            );

            if ($validatedData['payment_method'] === 'vnpay') {
                $paymentUrl = $this->createVnpayUrl($order);
                return response()->json([
                    'success' => true, 
                    'message' => 'Chuyển hướng đến cổng thanh toán...', 
                    'data' => [
                        'order_tracking_code' => $order->order_tracking_code,
                        'payment_url' => $paymentUrl 
                    ]
                ], 201);
            }
            
            $this->notificationService->sendOrderConfirmation($order);

            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công!',
                'data' => ['order_tracking_code' => $order->order_tracking_code]
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Xem chi tiết đơn hàng bằng tracking code (Public)
     */
    public function show($tracking_code)
    {
        $order = Order::with(['items.variant.product', 'items.variant.color', 'items.variant.size', 'trackings' => function($q) {
                $q->orderBy('created_at', 'desc');
            }, 'shipper:id,name,phone_number', 'salesChannel', 'branch.province', 'discount'])
            ->where('order_tracking_code', $tracking_code)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Xem chi tiết đơn hàng bằng ID (Auth required)
     */
    public function showById($id)
    {
        $order = Order::with(['items.variant.product', 'items.variant.color', 'items.variant.size', 'trackings' => function($q) {
                $q->orderBy('created_at', 'desc');
            }, 'shipper:id,name,phone_number', 'salesChannel', 'branch.province', 'discount'])
            ->findOrFail($id);

        // Security check
        if ($order->user_id && auth()->id() !== $order->user_id && !auth()->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem đơn hàng này.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Hủy đơn hàng
     */
    public function cancel($id)
    {
        $order = Order::findOrFail($id);
        
        if ($order->user_id !== auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền hủy đơn hàng này.'], 403);
        }

        if ($order->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Chỉ có thể hủy đơn hàng đang chờ xác nhận.'], 400);
        }

        try {
            $this->inventoryService->cancelOrder($order);
            $order->update(['status' => 'cancelled']);

            return response()->json(['success' => true, 'message' => 'Đã hủy đơn hàng thành công!']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Yêu cầu trả hàng
     */
    public function returnRequest(Request $request, $id)
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $order = Order::findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền thực hiện thao tác này.'], 403);
        }

        if ($order->status !== 'delivered') {
            return response()->json(['success' => false, 'message' => 'Chỉ có thể trả hàng sau khi đã nhận hàng thành công.'], 400);
        }

        try {
            $this->inventoryService->returnOrder($order);
            $order->update(['status' => 'returned', 'note' => $order->note . "\nLý do trả hàng: " . $request->reason]);

            return response()->json(['success' => true, 'message' => 'Đã gửi yêu cầu trả hàng thành công!']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    private function createVnpayUrl($order)
    {
        // VNPay logic here (simplified)
        return "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?order=" . $order->order_tracking_code;
    }
}