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
     * Đặt hàng (Checkout) có tích hợp SMART ROUTING
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

        DB::beginTransaction();
        try {
            // 2. Fetch the default Web Sales Channel (online)
            $webChannel = SalesChannel::where('type', 'online')->first();
            if (!$webChannel) {
                throw new Exception('Không tìm thấy Sales Channel cho Web. Vui lòng liên hệ Admin.');
            }

            // 3. Tạo mã đơn hàng độc nhất
            $orderCode = '#ORD-' . strtoupper(Str::random(6));
            $totalAmount = 0;

            // 4. Khởi tạo Đơn hàng (Chưa có tổng tiền, KHÔNG gán branch_id cứng nữa)
            $order = Order::create([
                'order_tracking_code' => $orderCode,
                'user_id' => $validatedData['user_id'] ?? null,
                'status' => 'pending',
                'total_amount' => 0, 
                'shipping_address' => $validatedData['shipping_address'],
                'sales_channel_id' => $webChannel->id,
            ]);

            // 5. Lặp qua từng sản phẩm để áp dụng thuật toán SMART ROUTING
            foreach ($validatedData['items'] as $item) {
                $variantId = $item['variant_id'];
                $qtyNeeded = $item['quantity'];

                $variant = ProductVariant::with(['product', 'size', 'color'])->findOrFail($variantId);
                $price = $variant->price;
                $totalAmount += ($price * $qtyNeeded);

                // 🚨 THUẬT TOÁN TÌM KHO (SMART ROUTING)
                $stockRecord = VariantBranchStock::where('variant_id', $variantId)
                    ->where('stock', '>=', $qtyNeeded) // Phải có ĐỦ số lượng
                    ->join('branches', 'variant_branch_stocks.branch_id', '=', 'branches.id')
                    ->where('branches.is_active', true)
                    ->orderBy('branches.is_main', 'desc') // Ưu tiên 1: Kho Tổng
                    ->orderBy('variant_branch_stocks.stock', 'desc') // Ưu tiên 2: Kho nào có nhiều hàng nhất
                    ->select('variant_branch_stocks.*') 
                    ->first();

                // Nếu quét sạch mạng lưới mà không có kho nào đủ hàng
                if (!$stockRecord) {
                    $productName = $variant->product->name ?? 'Sản phẩm';
                    $colorName = $variant->color->name ?? '';
                    $sizeName = $variant->size->name ?? '';
                    throw new Exception("Rất tiếc, '$productName' (Màu $colorName, Size $sizeName) không đủ số lượng tại bất kỳ kho nào để giao hàng!");
                }

                // Trừ tồn kho tại kho đã tìm thấy
                $stockRecord->decrement('stock', $qtyNeeded);

                // Lưu chi tiết sản phẩm vào Order
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variantId,
                    'quantity' => $qtyNeeded,
                    'unit_price' => $price
                ]);

                // Ghi Log Lịch sử Kho chuẩn xác
                InventoryTransaction::create([
                    'product_variant_id' => $variantId,
                    'transaction_type' => 'SALE',
                    'reference_id' => $order->id,
                    'quantity_change' => -$qtyNeeded,
                    'from_branch_id' => $stockRecord->branch_id, // Ghi nhận ID kho tự động chọn
                    'note' => "Khách đặt Online. Hệ thống tự động xuất kho từ: " . $stockRecord->branch->name
                ]);
            }

            // 6. Cập nhật lại tổng tiền thực tế của đơn hàng
            $order->update(['total_amount' => $totalAmount]);

            DB::commit();
            
            // Trả về kết quả thành công
            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công!',
                'data' => $order->load(['salesChannel', 'items.variant'])
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
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