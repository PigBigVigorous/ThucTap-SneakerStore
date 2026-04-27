<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PointController;
use App\Http\Controllers\Api\UserAddressController;
use App\Http\Controllers\Api\UserProfileController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\Api\Admin\BranchController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\Admin\PosController;
use App\Http\Controllers\Api\Admin\StaffController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\ProductCatalogController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ShipperTrackingController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetOtp']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);

// Thanh toán VNPay
Route::get('/payment/vnpay-callback', [PaymentController::class, 'vnpayCallback']);
Route::get('/payment/vnpay-ipn', [PaymentController::class, 'vnpayIpn']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/price-range', [ProductController::class, 'priceRange']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/branches', [BranchController::class, 'index']);
Route::get('/discounts', [DiscountController::class, 'getActiveVouchers']);
Route::post('/discounts/apply', [DiscountController::class, 'apply']);

// Tra cứu đơn hàng công khai
Route::get('/orders/{tracking_code}', [OrderController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // User Profile
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/profile/update', [UserProfileController::class, 'update']);

    // Cart & Checkout (Next.js uses Zustand store)
    // Route::get('/cart', [CartController::class, 'index']);
    // Route::post('/cart/add', [CartController::class, 'add']);
    // Route::post('/cart/update', [CartController::class, 'update']);
    // Route::delete('/cart/remove/{id}', [CartController::class, 'remove']);
    // Route::post('/cart/clear', [CartController::class, 'clear']);

    // Addresses
    Route::apiResource('addresses', UserAddressController::class);
    Route::post('/addresses/{id}/default', [UserAddressController::class, 'setDefault']);
    Route::post('/shipping-fee/calculate', [ShippingController::class, 'calculateFee']);

    // Customer Orders
    Route::get('/my-orders', [OrderController::class, 'index']);
    Route::get('/orders/id/{id}', [OrderController::class, 'showById']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/return', [OrderController::class, 'returnRequest']);
    Route::post('/orders', [OrderController::class, 'store']); // Place Order
    Route::post('/discounts/save/{id}', [DiscountController::class, 'saveUserVoucher']);
    Route::get('/user/vouchers', [DiscountController::class, 'getUserVouchers']);

    // Loyalty Points
    Route::get('/points/history', [PointController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Admin Routes (Prefix: admin)
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->group(function () {
        // Order Management
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
        Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
        Route::get('/shippers', [AdminOrderController::class, 'listShippers']);
        Route::post('/orders/{id}/assign-shipper', [AdminOrderController::class, 'assignShipper']);

        // Product Catalog Management
        Route::apiResource('products', ProductCatalogController::class);

        // Brand & Category Management
        Route::apiResource('brands', BrandController::class);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('discounts', DiscountController::class);
        Route::apiResource('branches', BranchController::class);

        // Inventory Management
        Route::get('/inventory/stocks', [InventoryController::class, 'getStocks']);
        Route::post('/inventory/import', [InventoryController::class, 'import']);
        Route::post('/inventory/transfer', [InventoryController::class, 'transfer']);
        Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);

        // Dashboard & Reports
        Route::get('/statistics', [AdminOrderController::class, 'getStatistics']);
        Route::get('/inventory/transactions', [InventoryController::class, 'index']);
        Route::get('/reports/revenue', [ReportController::class, 'getRevenueReport']);
        Route::get('/reports/export', [ReportController::class, 'exportRevenueCSV']);

        // POS
        Route::get('/pos/products', [PosController::class, 'getProducts']);
        Route::post('/pos', [PosController::class, 'placeOrder']);

        // Staff
        Route::get('/staff', [StaffController::class, 'index']);
        Route::get('/roles', [StaffController::class, 'getRoles']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::put('/staff/{id}', [StaffController::class, 'update']);
        Route::post('/staff/{id}/toggle', [StaffController::class, 'toggleStatus']);
        Route::delete('/staff/{id}', [StaffController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Shipper Routes (Prefix: shipper)
    |--------------------------------------------------------------------------
    */
    Route::prefix('shipper')->group(function () {
        Route::get('/my-orders', [ShipperTrackingController::class, 'myOrders']);
        Route::get('/orders/{id}', [ShipperTrackingController::class, 'showOrderById']);
        Route::post('/orders/{id}/track', [ShipperTrackingController::class, 'updateTracking']);
    });
});

// Chatbot
Route::post('/chatbot/chat', [ChatbotController::class, 'handleChat']);