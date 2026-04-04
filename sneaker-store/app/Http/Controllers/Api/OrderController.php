<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        // Xóa 'user_id' khỏi rule validate
        $validatedData = $request->validate([
            'shipping_address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            // Lấy ID người dùng thực sự từ Sanctum Token (Nếu là khách vãng lai thì = null)
            $userId = auth('sanctum')->check() ? auth('sanctum')->id() : null;

            // Cache lại Sales Channel để đỡ truy vấn DB liên tục
            $webChannelId = cache()->rememberForever('sales_channel_online', function() {
                return SalesChannel::where('type', 'online')->value('id');
            });

            if (!$webChannelId) {
                throw new Exception('Không tìm thấy Sales Channel cho Web.');
            }

            $order = $this->inventoryService->placeOnlineOrder(
                $userId, // Gửi userId chuẩn xuống Service
                $validatedData['shipping_address'],
                $validatedData['items'],
                $webChannelId
            );
            
            return response()->json(['success' => true, 'message' => 'Đặt hàng thành công!', 'data' => $order], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
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