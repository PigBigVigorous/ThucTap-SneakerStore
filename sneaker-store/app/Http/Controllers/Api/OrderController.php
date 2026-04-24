<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request as FacadesRequest;
use Illuminate\Support\Str;
use App\Services\InventoryService;
use App\Services\OrderNotificationService;
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
    protected $notificationService;

    // Vẫn giữ lại InventoryService phòng trường hợp ngài cần dùng ở các hàm khác
    public function __construct(
        InventoryService $inventoryService,
        OrderNotificationService $notificationService
    ) {
        $this->inventoryService = $inventoryService;
        $this->notificationService = $notificationService;
    }

    /**
     * Đặt hàng (Checkout)
     * API: POST /api/orders
     */
    public function store(\App\Http\Requests\StoreOrderRequest $request)
    {
        $validatedData = $request->validated();

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
            
            // Gửi email xác nhận đơn cho COD
            $this->notificationService->sendOrderConfirmation($order);

            // XỬ LÝ COD
            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công! Email xác nhận sẽ được gửi trong giây lát.',
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

    /**
     * Xem chi tiết đơn hàng bằng tracking code
     * API: GET /api/orders/{trackingCode}
     */
    public function show($trackingCode)
    {
        $order = Order::with([
            'salesChannel', 
            'branch.province', 
            'items.variant.product', 
            'items.variant.color', 
            'items.variant.size',
            'discount'
        ])
            ->where('order_tracking_code', $trackingCode)
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng nào!'], 404);
        }

        // BẢO MẬT: Nếu đơn hàng có chủ (user_id != null), chỉ có chủ đơn hoặc Admin mới xem được
        if ($order->user_id !== null) {
            
            // 1. Lấy thông tin user hiện tại
            $currentUser = auth('sanctum')->user();

            // 🟢 BỌC LÓT: Nếu Laravel không tự nhận diện được user qua middleware, ta tự giải mã Token thủ công
            if (!$currentUser && request()->bearerToken()) {
                $tokenRecord = \Laravel\Sanctum\PersonalAccessToken::findToken(request()->bearerToken());
                if ($tokenRecord) {
                    $currentUser = $tokenRecord->tokenable;
                }
            }

            $isAdmin = false; // Tạm thời để false nếu chưa setup Role

            // 🟢 SỬA LỖI LOGIC: Dùng != (chỉ so sánh giá trị) thay vì !== (so sánh cả kiểu dữ liệu)
            if (!$currentUser || ($currentUser->id != $order->user_id && !$isAdmin)) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Bạn không có quyền xem đơn hàng này. Hiện tại: ' . ($currentUser ? $currentUser->id : 'Khách') . ' | Chủ đơn: ' . $order->user_id
                ], 403);
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
            'branch.province',
            'items.variant.product', 
            'items.variant.color', 
            'items.variant.size',
            'discount'
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

    /**
     * Hủy đơn hàng (User)
     */
    public function cancel($id)
    {
        $order = Order::where('user_id', auth()->id())->findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Chỉ có thể hủy đơn hàng đang chờ xác nhận.'], 400);
        }

        $order->status = 'cancelled';
        $order->save();

        // Hoàn kho và hoàn điểm
        $this->inventoryService->cancelOrder($order);

        return response()->json(['success' => true, 'message' => 'Đã hủy đơn hàng thành công!']);
    }

    /**
     * Trả hàng (User)
     */
    public function return(Request $request, $id)
    {
        $order = Order::where('user_id', auth()->id())->findOrFail($id);

        if ($order->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'Chỉ có thể trả hàng cho đơn hàng đã hoàn thành.'], 400);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $order->status = 'returned';
        $order->return_reason = $request->reason;
        $order->save();

        // Hoàn kho và hoàn điểm
        $this->inventoryService->returnOrder($order);

        return response()->json(['success' => true, 'message' => 'Yêu cầu trả hàng đã được xử lý!']);
    }
}