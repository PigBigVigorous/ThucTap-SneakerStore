<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\InventoryService;
use App\Models\ProductVariant;
use App\Models\SalesChannel;
use App\Models\Order;
use Exception;

class PosController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Fetch products available for POS with real-time stock info
     * API: GET /api/admin/pos/products
     * Query params: ?search=SKU_or_name&branch_id=1&limit=50
     */
    public function getProducts(Request $request)
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $branchId = $request->input('branch_id', 1); 
        $search = $request->input('search');
        $limit = $request->input('limit', 50);

        try {
            $query = ProductVariant::with([
                'product.images',
                'color',
                'size',
                'branchStocks' => function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                }
            ])
            ->whereHas('branchStocks', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->where('stock', '>', 0);
            });

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('sku', 'like', '%' . $search . '%')
                      ->orWhereHas('product', function ($subQ) use ($search) {
                          $subQ->where('name', 'like', '%' . $search . '%');
                      });
                });
            }

            $products = $query->limit($limit)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($variant) {
                    $branchStock = $variant->branchStocks->first();
                    return [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'price' => $variant->price,
                        'image_url' => $variant->product->images->where('color_id', $variant->color_id)->first()->image_url 
                                       ?? $variant->product->base_image_url,
                        'product' => [
                            'id' => $variant->product->id,
                            'name' => $variant->product->name,
                            'description' => $variant->product->description,
                        ],
                        'color' => $variant->color ? ['id' => $variant->color->id, 'name' => $variant->color->name] : null,
                        'size' => $variant->size ? ['id' => $variant->size->id, 'name' => $variant->size->name] : null,
                        'stock' => $branchStock ? $branchStock->stock : 0,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $products,
                'count' => $products->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi lấy danh sách sản phẩm: ' . $e->getMessage()
            ], 400);
        }
    }

    
    public function placeOrder(Request $request)
    {
        $validatedData = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        try {
            return DB::transaction(function () use ($validatedData, $request) {
                // 1. Fetch the POS Sales Channel (offline)
                $posChannel = SalesChannel::where('type', 'offline')->first();
                if (!$posChannel) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy Sales Channel cho POS. Vui lòng liên hệ Admin.'
                    ], 400);
                }

                // 2. Set branch ID (default to 1, or from request)
                $branchId = $validatedData['branch_id'] ?? 1;

                // 3. Place order using InventoryService (user_id is null for walk-in guests)
                $order = $this->inventoryService->placeOrder(
                    null, // Walk-in customer (no user account)
                    'Khách mua tại quầy', // Fixed address for POS
                    $validatedData['items'],
                    $posChannel->id,
                    $branchId
                );

                // 4. Update order status to 'delivered' (immediate payment at counter)
                // and set cashier_id to the logged-in admin/staff
                $order->update([
                    'status' => 'delivered',
                    'cashier_id' => $request->user()->id,
                ]);

                // 5. Reload with relationships for response
                $order->load(['salesChannel', 'branch', 'cashier', 'items.variant.product']);

                return response()->json([
                    'success' => true,
                    'message' => 'Bán hàng thành công tại quầy!',
                    'data' => $order
                ], 201);
            });
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi xử lý đơn hàng POS: ' . $e->getMessage()
            ], 400);
        }
    }
}
