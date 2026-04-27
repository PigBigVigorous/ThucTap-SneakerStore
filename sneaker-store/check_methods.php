<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$mappings = [
    [\App\Http\Controllers\Api\AuthController::class, 'register'],
    [\App\Http\Controllers\Api\AuthController::class, 'login'],
    [\App\Http\Controllers\Api\ForgotPasswordController::class, 'sendResetOtp'],
    [\App\Http\Controllers\Api\ForgotPasswordController::class, 'resetPassword'],
    [\App\Http\Controllers\Api\PaymentController::class, 'vnpayCallback'],
    [\App\Http\Controllers\Api\PaymentController::class, 'vnpayIpn'],
    [\App\Http\Controllers\Api\ProductController::class, 'index'],
    [\App\Http\Controllers\Api\ProductController::class, 'priceRange'],
    [\App\Http\Controllers\Api\ProductController::class, 'show'],
    [\App\Http\Controllers\Api\CategoryController::class, 'index'],
    [\App\Http\Controllers\Api\BrandController::class, 'index'],
    [\App\Http\Controllers\Api\Admin\BranchController::class, 'index'],
    [\App\Http\Controllers\DiscountController::class, 'getActiveVouchers'],
    [\App\Http\Controllers\DiscountController::class, 'apply'],
    [\App\Http\Controllers\Api\OrderController::class, 'show'],
    [\App\Http\Controllers\Api\AuthController::class, 'me'],
    [\App\Http\Controllers\Api\AuthController::class, 'logout'],
    [\App\Http\Controllers\Api\AuthController::class, 'updateProfile'],
    [\App\Http\Controllers\Api\UserAddressController::class, 'setDefault'],
    [\App\Http\Controllers\Api\ShippingController::class, 'calculateFee'],
    [\App\Http\Controllers\Api\OrderController::class, 'index'],
    [\App\Http\Controllers\Api\OrderController::class, 'showById'],
    [\App\Http\Controllers\Api\OrderController::class, 'cancel'],
    [\App\Http\Controllers\Api\OrderController::class, 'returnRequest'],
    [\App\Http\Controllers\Api\OrderController::class, 'store'],
    [\App\Http\Controllers\DiscountController::class, 'saveUserVoucher'],
    [\App\Http\Controllers\DiscountController::class, 'getUserVouchers'],
    [\App\Http\Controllers\Api\PointController::class, 'index'],
    [\App\Http\Controllers\Api\Admin\OrderController::class, 'index'],
    [\App\Http\Controllers\Api\Admin\OrderController::class, 'show'],
    [\App\Http\Controllers\Api\Admin\OrderController::class, 'updateStatus'],
    [\App\Http\Controllers\Api\Admin\OrderController::class, 'listShippers'],
    [\App\Http\Controllers\Api\Admin\OrderController::class, 'assignShipper'],
    [\App\Http\Controllers\Api\Admin\OrderController::class, 'getStatistics'],
    [\App\Http\Controllers\Api\Admin\InventoryController::class, 'index'],
    [\App\Http\Controllers\Api\Admin\ReportController::class, 'getRevenueReport'],
    [\App\Http\Controllers\Api\Admin\ReportController::class, 'exportRevenueCSV'],
    [\App\Http\Controllers\Api\Admin\PosController::class, 'getProducts'],
    [\App\Http\Controllers\Api\Admin\PosController::class, 'placeOrder'],
    [\App\Http\Controllers\Api\Admin\StaffController::class, 'index'],
    [\App\Http\Controllers\Api\Admin\StaffController::class, 'getRoles'],
    [\App\Http\Controllers\Api\ShipperTrackingController::class, 'myOrders'],
    [\App\Http\Controllers\Api\ShipperTrackingController::class, 'showOrderById'],
    [\App\Http\Controllers\Api\ShipperTrackingController::class, 'updateTracking'],
    [\App\Http\Controllers\ChatbotController::class, 'chat'],
];

foreach ($mappings as $map) {
    list($class, $method) = $map;
    if (class_exists($class)) {
        $reflection = new ReflectionClass($class);
        if ($reflection->hasMethod($method)) {
            echo "OK: $class@$method exists.\n";
        } else {
            echo "FAIL: $class@$method does NOT exist!\n";
        }
    } else {
        echo "FAIL: Class $class does NOT exist!\n";
    }
}
