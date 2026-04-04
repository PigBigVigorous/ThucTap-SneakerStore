<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\PosController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\ProductCatalogController;
use App\Http\Controllers\Api\Admin\BranchController;
use App\Models\Order;
use App\Http\Controllers\Api\PaymentController;

//Route của khách hàng chưa đăng nhập
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{tracking_code}', [OrderController::class, 'show']);
Route::get('/payment/vnpay-ipn', [App\Http\Controllers\Api\PaymentController::class, 'vnpayIpn']);
Route::get('/payment/vnpay-callback', [PaymentController::class, 'vnpayCallback']);
// 1. Khách vãng lai cũng xem được Đánh giá (Để chung với route xem sản phẩm public)
Route::get('/products/{slug}/reviews', [ProductController::class, 'getReviews']);

// 2. Phải đăng nhập mới được viết Đánh giá (Bỏ vào trong nhóm auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/products/{slug}/reviews', [ProductController::class, 'storeReview']);
});

// Route của khách hang đã đăng nhập
Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/my-orders', [OrderController::class, 'myOrders']);

    Route::get('/user', function (Request $request) {
        $user = $request->user();
        
        $user->load('roles');
        $user->setRelation('permissions', $user->getAllPermissions()); 
        
        return response()->json(['success' => true, 'data' => $user]);
    });

    // Routes for admin
    Route::prefix('admin')->group(function () {
        
        Route::middleware(['permission:view-dashboard,sanctum'])->group(function () {
            Route::get('/statistics', function () {
                $totalRevenue = Order::where('status', 'delivered')->sum('total_amount');
                $totalOrders = Order::where('status', 'delivered')->count();
                $pendingOrders = Order::where('status', 'pending')->count();
                // 4. Lấy data từ Database (có thể bị khuyết ngày nếu ko có đơn)
                $rawRevenueData = Order::where('status', 'delivered')
                    ->where('created_at', '>=', now()->subDays(6)->startOfDay()) // Lấy tròn 7 ngày tính cả hôm nay
                    ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total')
                    ->groupBy('date')
                    ->pluck('total', 'date');
                // 5. THUẬT TOÁN TRÁM NGÀY TRỐNG: Chủ động tạo mảng 7 ngày
                $revenueByDay = [];
                for ($i = 6; $i >= 0; $i--) {
                    $dateString = now()->subDays($i)->format('Y-m-d');
                    $revenueByDay[] = [
                        'date' => $dateString,
                        'total' => isset($rawRevenueData[$dateString]) ? (float) $rawRevenueData[$dateString] : 0
                    ];
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'totalRevenue' => (float) $totalRevenue,
                        'totalOrders' => (int) $totalOrders,
                        'pendingOrders' => (int) $pendingOrders,
                        'revenueByDay' => $revenueByDay
                    ]
                ]);
            });
        });
        // Thủ kho
        Route::middleware(['permission:manage-inventory,sanctum'])->group(function () {
            Route::apiResource('branches', BranchController::class);
            Route::get('/inventory/stocks', [InventoryController::class, 'getStocks']);
            Route::get('/inventory/transactions', [InventoryController::class, 'index']);
            Route::post('/inventory/transfer', [InventoryController::class, 'transfer']);
            Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
        });
        // quản lý sản phẩm
        Route::middleware(['permission:manage-products,sanctum'])->group(function () {
            Route::apiResource('branches', BranchController::class);
            
            Route::get('/products', [ProductCatalogController::class, 'index']);
            Route::post('/products', [ProductCatalogController::class, 'store']);
            Route::post('/products/{id}', [ProductCatalogController::class, 'update']);
            Route::delete('/products/{id}', [ProductCatalogController::class, 'destroy']);
        });
        // quản lý đơn hàng
        Route::middleware(['permission:manage-orders,sanctum'])->group(function () {
            Route::get('/orders', [AdminOrderController::class, 'index']);
            Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
        });
        // POS bán tại quầy
        Route::middleware(['permission:pos-sale,sanctum'])->group(function () {
            Route::get('/pos/products', [PosController::class, 'getProducts']);
            Route::post('/pos/orders', [PosController::class, 'placeOrder']);
        });
    });
});