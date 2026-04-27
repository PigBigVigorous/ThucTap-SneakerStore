<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$classes = [
    \App\Http\Controllers\Api\AuthController::class,
    \App\Http\Controllers\Api\ProductController::class,
    \App\Http\Controllers\Api\CategoryController::class,
    \App\Http\Controllers\Api\OrderController::class,
    \App\Http\Controllers\Api\PointController::class,
    \App\Http\Controllers\Api\UserAddressController::class,
    \App\Http\Controllers\DiscountController::class,
    \App\Http\Controllers\Api\Admin\BranchController::class,
    \App\Http\Controllers\Api\ShippingController::class,
    \App\Http\Controllers\ChatbotController::class,
    \App\Http\Controllers\Api\BrandController::class,
    \App\Http\Controllers\Api\Admin\PosController::class,
    \App\Http\Controllers\Api\Admin\StaffController::class,
    \App\Http\Controllers\Api\Admin\OrderController::class,
    \App\Http\Controllers\Api\Admin\InventoryController::class,
    \App\Http\Controllers\Api\Admin\ReportController::class,
    \App\Http\Controllers\Api\Admin\ProductCatalogController::class,
    \App\Http\Controllers\Api\ForgotPasswordController::class,
    \App\Http\Controllers\Api\PaymentController::class,
    \App\Http\Controllers\Api\ShipperTrackingController::class,
];

foreach ($classes as $class) {
    if (class_exists($class)) {
        echo "OK: $class exists.\n";
    } else {
        echo "FAIL: $class does NOT exist!\n";
    }
}
