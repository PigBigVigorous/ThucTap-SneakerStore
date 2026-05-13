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
            'payment_method' => 'required|string|in:cod,vnpay,qr',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'discount_codes' => 'nullable|array|max:2',
            'discount_codes.*' => 'string|exists:discounts,code',
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
            }, 'shipper:id,name,phone', 'salesChannel', 'branch.province', 'discount'])
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
            }, 'shipper:id,name,phone', 'salesChannel', 'branch.province', 'discount'])
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
        $vnp_Url = config('services.vnpay.url');
        $vnp_Returnurl = config('services.vnpay.return_url');
        $vnp_TmnCode = config('services.vnpay.tmn_code');
        $vnp_HashSecret = config('services.vnpay.hash_secret');
        $vnp_TxnRef = $order->order_tracking_code; // Mã đơn hàng 
        $vnp_OrderInfo = "Thanh toan don hang " . $order->order_tracking_code;
        $vnp_OrderType = 'billpayment';
        $vnp_Amount = (int) ($order->total_amount * 100); // VNPay bắt buộc là số nguyên
        $vnp_Locale = 'vn';
        $vnp_BankCode = ''; // Để trống để khách chọn tại cổng VNPay
        $vnp_IpAddr = $_SERVER['REMOTE_ADDR'];
        $inputData = array(
            "vnp_Version" => "2.1.0",
            "vnp_TmnCode" => $vnp_TmnCode,
            "vnp_Amount" => $vnp_Amount,
            "vnp_Command" => "pay",
            "vnp_CreateDate" => date('YmdHis'),
            "vnp_CurrCode" => "VND",
            "vnp_IpAddr" => $vnp_IpAddr,
            "vnp_Locale" => $vnp_Locale,
            "vnp_OrderInfo" => $vnp_OrderInfo,
            "vnp_OrderType" => $vnp_OrderType,
            "vnp_ReturnUrl" => $vnp_Returnurl,
            "vnp_TxnRef" => $vnp_TxnRef,
        );
        ksort($inputData);
        $query = "";
        $i = 0;
        $hashdata = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashdata .= urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
            $query .= urlencode($key) . "=" . urlencode($value) . '&';
        }
        $vnp_Url = $vnp_Url . "?" . $query;
        if (isset($vnp_HashSecret)) {
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
            $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
        }
        return $vnp_Url;
    }
}