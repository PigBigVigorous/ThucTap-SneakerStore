<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\PosController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Middleware\AdminMiddleware;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{tracking_code}', [OrderController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    
    // ==========================================
    // 1. CÁC API DÀNH CHO KHÁCH HÀNG (USER)
    // ==========================================
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/user', function (Request $request) {
        return response()->json(['success' => true, 'data' => $request->user()]);
    });

    Route::get('/my-orders', [OrderController::class, 'myOrders']);


    // ==========================================
    // 2. 🚨 KHU VỰC DÀNH RIÊNG CHO ADMIN
    // ==========================================
    Route::middleware(AdminMiddleware::class)->prefix('admin')->group(function () {
        
        // --- API THỐNG KÊ DOANH THU (Dành cho Dashboard) ---
        Route::get('/statistics', function () {
            $totalRevenue = \App\Models\Order::where('status', 'delivered')->sum('total_amount');
            $totalOrders = \App\Models\Order::count();
            $pendingOrders = \App\Models\Order::where('status', 'pending')->count();
            $revenueByDay = \App\Models\Order::where('status', 'delivered')
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

        // --- API QUẢN LÝ KHO ---
        Route::get('/inventory/transactions', [InventoryController::class, 'index']);
        Route::post('/inventory/transfer', [InventoryController::class, 'transfer']);
        Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
        
        // --- API QUẢN LÝ CHI NHÁNH ---
        Route::apiResource('branches', \App\Http\Controllers\Api\Admin\BranchController::class);
        
        // --- API QUẢN LÝ SẢN PHẨM ---
        Route::apiResource('products', \App\Http\Controllers\Api\Admin\ProductCatalogController::class);
        
        // --- API QUẢN LÝ ĐƠN HÀNG (Đã được khôi phục) ---
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

        // --- API QUẢN LÝ HỆ THỐNG BÁN HÀNG TẠI QUẦY (POS) ---
        Route::get('/pos/products', [PosController::class, 'getProducts']);
        Route::post('/pos/orders', [PosController::class, 'placeOrder']);
    });

});