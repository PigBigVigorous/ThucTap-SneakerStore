<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\InventoryService;
use Exception;
use App\Models\Order;
class OrderController extends Controller
{
    protected $inventoryService;

    // Inject InventoryService vào Controller
    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Đặt hàng
     * API: POST /api/orders
     */
    public function store(Request $request)
    {
        // 1. Validate dữ liệu đầu vào
        $validatedData = $request->validate([
            'user_id' => 'required|exists:users,id',
            'shipping_address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            // 2. Gọi Service xử lý đặt hàng
            $order = $this->inventoryService->placeOrder(
                $validatedData['user_id'],
                $validatedData['shipping_address'],
                $validatedData['items']
            );

            // 3. Trả về kết quả thành công
            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công!',
                'data' => $order
            ], 201);

        } catch (Exception $e) {
            // 4. Trả về thông báo lỗi (ví dụ: Hết hàng)
            return response()->json([
                'success' => false,
                'message' => 'Lỗi đặt hàng: ' . $e->getMessage()
            ], 400);
        }
    }
    public function show($trackingCode)
    {
        // Dùng Eager Loading (with) để lấy luôn thông tin Sản phẩm, Màu sắc, Size trong OrderItem
        // Điều này giúp tránh lỗi N+1 Query làm chậm database
        $order = Order::with([
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