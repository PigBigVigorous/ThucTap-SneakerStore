<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\PosController;
use App\Http\Controllers\Api\AuthController;
// Đã loại bỏ AdminMiddleware cũ kỹ
use App\Http\Controllers\Api\Admin\ProductCatalogController;
use App\Http\Controllers\Api\Admin\BranchController;
use App\Models\Order;

// ==========================================
// 🌐 CÁC API CÔNG KHAI (KHÔNG CẦN ĐĂNG NHẬP)
// ==========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{tracking_code}', [OrderController::class, 'show']);


// ==========================================
// 🛡 CÁC API CẦN ĐĂNG NHẬP (CÓ TOKEN)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // --- API DÀNH CHO KHÁCH HÀNG (USER) ---
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/my-orders', [OrderController::class, 'myOrders']);
    
    // 🚨 BƯỚC 3 ĐƯỢC TÍCH HỢP Ở ĐÂY: Gửi kèm chức vụ (roles/permissions) cho Frontend
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $user->load('roles', 'permissions'); // Tải thêm "Hồ sơ chức vụ"
        return response()->json(['success' => true, 'data' => $user]);
    });


    // ==========================================
    // 🚨 KHU VỰC QUẢN TRỊ (ĐÃ ĐƯỢC PHÂN LÔ CẮM MỐC BẰNG SPATIE)
    // ==========================================
    Route::prefix('admin')->group(function () {
        
        // 📊 1. NHÓM XEM THỐNG KÊ (Chỉ Sếp tổng hoặc ai có quyền view-dashboard)
        Route::middleware(['permission:view-dashboard,sanctum'])->group(function () {
            Route::get('/statistics', function () {
                $totalRevenue = Order::where('status', 'delivered')->sum('total_amount');
                $totalOrders = Order::count();
                $pendingOrders = Order::where('status', 'pending')->count();
                $revenueByDay = Order::where('status', 'delivered')
                    ->where('created_at', '>=', now()->subDays(7))
                    ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total')
                    ->groupBy('date')
                    ->orderBy('date', 'asc')
                    ->get();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'totalRevenue' => $totalRevenue,
                        'totalOrders' => $totalOrders,
                        'pendingOrders' => $pendingOrders,
                        'revenueByDay' => $revenueByDay
                    ]
                ]);
            });
        });

        // 📦 2. NHÓM QUẢN LÝ KHO (Chỉ Thủ kho hoặc Sếp tổng)
        Route::middleware(['permission:manage-inventory,sanctum'])->group(function () {
            Route::get('/inventory/transactions', [InventoryController::class, 'index']);
            Route::post('/inventory/transfer', [InventoryController::class, 'transfer']);
            Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
        });

        // 🏷 3. NHÓM QUẢN LÝ SẢN PHẨM & CHI NHÁNH (Chỉ Quản lý kho hoặc Sếp)
        Route::middleware(['permission:manage-products,sanctum'])->group(function () {
            Route::apiResource('branches', BranchController::class);
            
            Route::get('/products', [ProductCatalogController::class, 'index']);
            Route::post('/products', [ProductCatalogController::class, 'store']);
            Route::post('/products/{id}', [ProductCatalogController::class, 'update']);
            Route::delete('/products/{id}', [ProductCatalogController::class, 'destroy']);
        });

        // 🚚 4. NHÓM QUẢN LÝ ĐƠN HÀNG (Chỉ Thu ngân hoặc Sếp)
        Route::middleware(['permission:manage-orders,sanctum'])->group(function () {
            Route::get('/orders', [AdminOrderController::class, 'index']);
            Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
        });

        // 🏪 5. NHÓM POS BÁN TẠI QUẦY (Chỉ Thu ngân)
        Route::middleware(['permission:pos-sale,sanctum'])->group(function () {
            Route::get('/pos/products', [PosController::class, 'getProducts']);
            Route::post('/pos/orders', [PosController::class, 'placeOrder']);
        });
    });
});