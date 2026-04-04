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
        // 1. Validate dữ liệu đầu vào
        $validatedData = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'shipping_address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            // 2. Fetch the default Web Sales Channel (online)
            $webChannel = SalesChannel::where('type', 'online')->first();
            if (!$webChannel) {
                throw new Exception('Không tìm thấy Sales Channel cho Web. Vui lòng liên hệ Admin.');
            }

            // 3. Gọi Service xử lý toàn bộ logic phức tạp (Transaction, Locking, Smart Routing)
            $order = $this->inventoryService->placeOnlineOrder(
                $validatedData['user_id'] ?? null,
                $validatedData['shipping_address'],
                $validatedData['items'],
                $webChannel->id
            );
            
            // 4. Trả về kết quả thành công
            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công!',
                'data' => $order->load(['salesChannel', 'items.variant'])
            ], 201);

        } catch (Exception $e) {
            // Xóa bỏ DB::rollBack() ở đây vì Service đã bao bọc DB::transaction rồi
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Xem chi tiết đơn hàng bằng tracking code
     * API: GET /api/orders/{trackingCode}
     */
    public function show($trackingCode)
    {
        // Dùng Eager Loading (with) để lấy luôn thông tin chi nhánh, sales channel, sản phẩm
        $order = Order::with([
            'salesChannel',
            'branch',
            'items.variant.product', 
            'items.variant.color', 
            'items.variant.size'
        ])
        ->where('order_tracking_code', $trackingCode)
        ->first();

        // Nếu khách nhập sai mã
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng nào với mã này. Vui lòng kiểm tra lại!'
            ], 404);
        }

        // Trả về thông tin đơn hàng
        return response()->json([
            'success' => true,
            'message' => 'Tra cứu đơn hàng thành công!',
            'data' => $order
        ]);
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