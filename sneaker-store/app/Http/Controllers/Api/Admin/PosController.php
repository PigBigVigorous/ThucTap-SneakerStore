<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\InventoryService;
use App\Models\ProductVariant;
use App\Models\SalesChannel;
use App\Models\Order;
use App\Models\User;
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


    /**
     * Tìm kiếm khách hàng thân thiết tại quầy theo tên, SĐT, hoặc email
     * API: GET /api/admin/pos/customers?search=...
     */
    public function searchCustomers(Request $request)
    {
        $request->validate([
            'search' => 'required|string|min:2|max:100',
        ]);

        $search = $request->input('search');

        try {
            $customers = User::with('roles')
                ->whereHas('roles', function ($q) {
                    $q->where('name', 'customer');
                })
                ->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('phone', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
                })
                ->select('id', 'name', 'phone', 'email', 'points', 'avatar')
                ->limit(10)
                ->get()
                ->map(function ($user) {
                    // Tính hạng thành viên dựa trên tổng điểm tích lũy
                    $totalEarned = \App\Models\PointTransaction::where('user_id', $user->id)
                        ->where('type', 'earn')
                        ->sum('amount');

                    $rank = $this->getMemberRank($totalEarned);

                    return [
                        'id'         => $user->id,
                        'name'       => $user->name,
                        'phone'      => $user->phone,
                        'email'      => $user->email,
                        'points'     => (int) $user->points,
                        'rank'       => $rank['name'],
                        'rank_color' => $rank['color'],
                        'rank_icon'  => $rank['icon'],
                    ];
                });

            return response()->json([
                'success' => true,
                'data'    => $customers,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi tìm kiếm khách hàng: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Xác định hạng thành viên dựa trên tổng điểm đã tích lũy
     */
    private function getMemberRank(int $totalEarned): array
    {
        if ($totalEarned >= 500) {
            return ['name' => 'Kim Cương', 'color' => '#7dd3fc', 'icon' => '💎'];
        } elseif ($totalEarned >= 200) {
            return ['name' => 'Vàng', 'color' => '#fbbf24', 'icon' => '🥇'];
        } elseif ($totalEarned >= 50) {
            return ['name' => 'Bạc', 'color' => '#94a3b8', 'icon' => '🥈'];
        } else {
            return ['name' => 'Đồng', 'color' => '#b87333', 'icon' => '🥉'];
        }
    }

    public function placeOrder(Request $request)
    {
        $validatedData = $request->validate([
            'items'          => 'required|array|min:1',
            'items.*.variant_id' => 'required|integer|exists:product_variants,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'branch_id'      => 'nullable|integer|exists:branches,id',
            'user_id'        => 'nullable|integer|exists:users,id',
            'discount_code'  => 'nullable|string|exists:discounts,code',
            'points_used'    => 'nullable|integer|min:0',
        ]);

        try {
            return DB::transaction(function () use ($validatedData, $request) {
                // 1. Fetch the POS Sales Channel (offline)
                $posChannel = SalesChannel::where('type', 'pos')->first();
                if (!$posChannel) {
                $posChannel = SalesChannel::create([
                    'name' => 'Bán tại quầy (POS)',
                    'type' => 'pos'
                    ]);
                }
                // 2. Set branch ID (default to 1, or from request)
                $branchId = $validatedData['branch_id'] ?? 1;
                $userId   = $validatedData['user_id'] ?? null;

                // 3. Chuẩn bị dữ liệu khách (POS flag là mảng với is_pos = true)
                $customerData = [
                    'is_pos'        => true,
                    'discount_code' => $validatedData['discount_code'] ?? null,
                    'points_used'   => $validatedData['points_used'] ?? 0,
                ];

                // 4. Place order using InventoryService
                $order = $this->inventoryService->placeOrder(
                    $userId,
                    $customerData,
                    $validatedData['items'],
                    $posChannel->id,
                    $branchId
                );

                // 4. Update order status to 'delivered' (immediate payment at counter)
                $order->update([
                    'status' => 'delivered',
                    'payment_status' => 'paid',
                    'cashier_id' => $request->user()->id,
                ]);

                // 5. CỘNG ĐIỂM NGAY LẬP TỨC CHO ĐƠN POS
                if ($order->user_id) {
                    app(\App\Services\PointService::class)->awardPointsForOrder($order);
                }

                // 6. Reload with relationships for response
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
