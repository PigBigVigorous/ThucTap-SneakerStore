<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\InventoryService;
use App\Models\SalesChannel;
use App\Models\Branch;
use App\Models\Order;
use Exception;

class OrderController extends Controller
{
    protected $inventoryService;

    // Inject InventoryService vào Controller
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
            'user_id' => 'nullable|exists:users,id', // Cho phép null nếu khách không đăng nhập
            'shipping_address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            // 2. Fetch the default Web Sales Channel (online)
            $webChannel = SalesChannel::where('type', 'online')->first();
            if (!$webChannel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy Sales Channel cho Web. Vui lòng liên hệ Admin.'
                ], 400);
            }

            // 3. Fetch the default Fulfillment Branch
            $defaultBranch = Branch::where('is_active', true)->first();
            if (!$defaultBranch) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy chi nhánh hợp lệ để giao hàng. Vui lòng liên hệ Admin.'
                ], 400);
            }

            // 4. Gọi Service xử lý đặt hàng với sales_channel_id và branch_id
            $order = $this->inventoryService->placeOrder(
                $validatedData['user_id'],
                $validatedData['shipping_address'],
                $validatedData['items'],
                $webChannel->id,
                $defaultBranch->id
            );

            // 5. Trả về kết quả thành công
            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công!',
                'data' => $order->load(['salesChannel', 'branch', 'items.variant'])
            ], 201);

        } catch (Exception $e) {
            // 6. Trả về thông báo lỗi (ví dụ: Hết hàng)
            return response()->json([
                'success' => false,
                'message' => 'Lỗi đặt hàng: ' . $e->getMessage()
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