<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Models\OrderTracking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class OrderController extends Controller
{
    /**
     * Danh sách đơn hàng dành cho Admin
     */
    public function index()
    {
        $orders = Order::with([
            'items.variant.product', 
            'items.variant.color', 
            'items.variant.size', 
            'shipper:id,name,phone',
            'salesChannel',
            'branch.province'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Chi tiết đơn hàng
     */
    public function show($id)
    {
        $order = Order::with([
            'items.variant.product', 
            'items.variant.color', 
            'items.variant.size', 
            'trackings' => function($q) { $q->orderBy('created_at', 'desc'); },
            'shipper:id,name,phone',
            'salesChannel',
            'branch.province',
            'discount'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Cập nhật trạng thái đơn hàng (Dành cho Admin)
     */
    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $oldStatus = $order->status;
        
        $order->update(['status' => $request->status]);
        
        // 🚀 ĐỒNG BỘ KHO: Hoàn hàng/Thu hồi điểm an toàn khi Admin chuyển sang Hủy/Trả
        if ($oldStatus !== $request->status) {
            if ($request->status === 'cancelled') {
                app(\App\Services\InventoryService::class)->cancelOrder($order);
            } elseif ($request->status === 'returned') {
                app(\App\Services\InventoryService::class)->returnOrder($order);
            }

            $order->trackings()->create([
                'status' => $request->status,
                'location_text' => 'Cập nhật bởi Admin',
                'note' => "Trạng thái đơn hàng được chuyển sang: " . $request->status
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công',
            'data' => $order
        ]);
    }

    /**
     * Lấy danh sách Shipper
     */
    public function listShippers()
    {
        $shippers = User::where('role', 'shipper')->get(['id', 'name', 'phone']);
        return response()->json([
            'success' => true,
            'data' => $shippers
        ]);
    }

    /**
     * Giao đơn hàng cho Shipper
     */
    public function assignShipper(Request $request, $id)
    {
        $request->validate([
            'shipper_id' => 'required|exists:users,id'
        ]);

        $order = Order::findOrFail($id);
        $shipper = User::findOrFail($request->shipper_id);

        DB::transaction(function () use ($order, $shipper) {
            $order->update([
                'shipper_id' => $shipper->id,
                'status' => 'shipped' 
            ]);

            $order->trackings()->create([
                'status' => 'shipped',
                'location_text' => 'Tại kho hàng',
                'note' => "Đã bàn giao đơn hàng cho nhân viên: {$shipper->name}"
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Đã giao đơn hàng cho Shipper {$shipper->name} thành công!"
        ]);
    }

    /**
     * Lấy thống kê tổng quan cho Dashboard
     */
    public function getStatistics()
    {
        $data = Cache::remember('admin_dashboard_stats', 600, function () {
            $totalRevenue = Order::where('status', 'delivered')->sum('total_amount');
            $totalOrders = Order::count();
            $pendingOrders = Order::where('status', 'pending')->count();

            $revenueByDay = Order::where('status', 'delivered')
                ->where('created_at', '>=', now()->subDays(7))
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            $topVariantSales = DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 'delivered')
                ->select('order_items.product_variant_id', DB::raw('SUM(order_items.quantity) as total_sold'))
                ->groupBy('order_items.product_variant_id')
                ->orderBy('total_sold', 'desc')
                ->limit(5)
                ->get();

            $variantIds = $topVariantSales->pluck('product_variant_id');

            if ($variantIds->isEmpty()) {
                $topProducts = collect();
            } else {
                $stocks = DB::table('variant_branch_stocks')
                    ->whereIn('variant_id', $variantIds)
                    ->select('variant_id', DB::raw('SUM(stock) as total_stock'))
                    ->groupBy('variant_id')
                    ->get()
                    ->pluck('total_stock', 'variant_id');

                $topProducts = DB::table('product_variants')
                    ->join('products', 'products.id', '=', 'product_variants.product_id')
                    ->leftJoin('colors', 'colors.id', '=', 'product_variants.color_id')
                    ->leftJoin('sizes', 'sizes.id', '=', 'product_variants.size_id')
                    ->whereIn('product_variants.id', $variantIds)
                    ->select(
                        'product_variants.id as variant_id',
                        'products.name as product_name',
                        'colors.name as color',
                        'sizes.name as size',
                        'product_variants.sku'
                    )
                    ->get()
                    ->map(function($item) use ($topVariantSales, $stocks) {
                        $sale = $topVariantSales->firstWhere('product_variant_id', $item->variant_id);
                        $item->total_sold = $sale ? (int)$sale->total_sold : 0;
                        $item->current_stock = (int) ($stocks[$item->variant_id] ?? 0);
                        return $item;
                    })
                    ->sortByDesc('total_sold')
                    ->values();
            }

            $lowStockAlerts = DB::table('variant_branch_stocks')
                ->join('product_variants', 'product_variants.id', '=', 'variant_branch_stocks.variant_id')
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->leftJoin('colors', 'colors.id', '=', 'product_variants.color_id')
                ->leftJoin('sizes', 'sizes.id', '=', 'product_variants.size_id')
                ->join('branches', 'branches.id', '=', 'variant_branch_stocks.branch_id')
                ->where('variant_branch_stocks.stock', '>', 0)
                ->where('variant_branch_stocks.stock', '<', 10)
                ->select(
                    'variant_branch_stocks.variant_id',
                    'products.name as product_name',
                    'colors.name as color',
                    'sizes.name as size',
                    'product_variants.sku',
                    'variant_branch_stocks.stock as stock',
                    'branches.name as branch_name'
                )
                ->orderBy('variant_branch_stocks.stock', 'asc')
                ->limit(10)
                ->get();

            return [
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
                'pendingOrders' => $pendingOrders,
                'revenueByDay' => $revenueByDay,
                'topProducts' => $topProducts,
                'lowStockAlerts' => $lowStockAlerts
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}