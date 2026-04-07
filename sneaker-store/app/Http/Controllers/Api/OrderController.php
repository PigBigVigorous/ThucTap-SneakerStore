<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request as FacadesRequest;
use Illuminate\Support\Str;
use App\Services\InventoryService;
use App\Models\SalesChannel;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\VariantBranchStock;
use App\Models\InventoryTransaction;
use App\Models\ProductVariant;
use Exception;

class OrderController extends Controller
{
    protected $inventoryService;

    // Vẫn giữ lại InventoryService phòng trường hợp ngài cần dùng ở các hàm khác
    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Đặt hàng (Checkout)
     * API: POST /api/orders
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'required|email|max:255',
            'province' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'ward' => 'required|string|max:255',
            'address_detail' => 'required|string|max:255',
            'shipping_fee' => 'required|numeric|min:0', // 🚀 ĐÃ BẮT BUỘC NHẬN PHÍ SHIP
            'payment_method' => 'required|string', // VNPAY hoặc COD
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $userId = auth('sanctum')->check() ? auth('sanctum')->id() : null;

        try {
            // Lấy ID Kênh Web
            $webChannelId = \App\Models\SalesChannel::where('type', 'online')->value('id') ?? 1;

            // 🚀 CHỈ GỌI 1 SERVICE DUY NHẤT LÀ ĐỦ
            $order = $this->inventoryService->placeOrder(
                $userId,
                $validatedData, // Truyền nguyên mảng để dò tìm khoảng cách
                $validatedData['items'],
                $webChannelId
            );

            // XỬ LÝ THANH TOÁN VNPAY
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
            
            // XỬ LÝ COD
            return response()->json([
                'success' => true, 
                'message' => 'Đặt hàng thành công!', 
                'data' => ['order_tracking_code' => $order->order_tracking_code]
            ], 201);
            
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

private function createVnpayUrl($order)
    {
        $vnp_Url = env('VNP_URL');
        $vnp_Returnurl = env('VNP_RETURN_URL');
        $vnp_TmnCode = env('VNP_TMN_CODE');
        $vnp_HashSecret = env('VNP_HASH_SECRET');

        $vnp_TxnRef = $order->order_tracking_code; 
        $vnp_OrderInfo = "Thanh toan don hang " . $order->order_tracking_code;
        $vnp_OrderType = 'billpayment';
        $vnp_Amount = $order->total_amount * 100; 
        $vnp_Locale = 'vn';
        $vnp_IpAddr = FacadesRequest::ip();

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
            "vnp_TxnRef" => $vnp_TxnRef
        );

        ksort($inputData);
        $query = "";
        $i = 0;
        $hashdata = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) { $hashdata .= '&' . urlencode($key) . "=" . urlencode($value); } 
            else { $hashdata .= urlencode($key) . "=" . urlencode($value); $i = 1; }
            $query .= urlencode($key) . "=" . urlencode($value) . '&';
        }

        $vnp_Url = $vnp_Url . "?" . $query;
        if (isset($vnp_HashSecret)) {
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
            $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
        }

        return $vnp_Url;
    }

    /**
     * Xem chi tiết đơn hàng bằng tracking code
     * API: GET /api/orders/{trackingCode}
     */
    public function show($trackingCode)
    {
        $order = Order::with(['salesChannel', 'branch', 'items.variant.product', 'items.variant.color', 'items.variant.size'])
            ->where('order_tracking_code', $trackingCode)
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng nào!'], 404);
        }

        // BẢO MẬT: Nếu đơn hàng có chủ (user_id != null), chỉ có chủ đơn hoặc Admin mới xem được
        if ($order->user_id !== null) {
            $currentUser = auth('sanctum')->user();

            // Giả sử có check role admin (hoặc bỏ qua nếu API này không dùng cho admin)
            $isAdmin = false; // Temporarily set to false since hasRole method is undefined

            if (!$currentUser || ($currentUser->id !== $order->user_id && !$isAdmin)) {
                return response()->json(['success' => false, 'message' => 'Bạn không có quyền xem đơn hàng này.'], 403);
            }
        }

        return response()->json(['success' => true, 'data' => $order]);
    }

    /**
     * Lấy danh sách đơn hàng của User đang đăng nhập
     * API: GET /api/my-orders
     */
    public function myOrders(Request $request)
    {
        // Lấy các đơn hàng có user_id trùng với ID của người dùng đang giữ Token
        $orders = Order::with([
            'salesChannel',
            'branch',
            'items.variant.product', 
            'items.variant.color', 
            'items.variant.size'
        ])
        ->where('user_id', $request->user()->id)
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đơn hàng thành công!',
            'data' => $orders
        ]);
    }
}