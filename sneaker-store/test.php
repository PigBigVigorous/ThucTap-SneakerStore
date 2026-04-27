<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Http\Controllers\DiscountController;

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

// Bind a dummy HTTP request to Laravel container
$request = \Illuminate\Http\Request::create('/api/discounts', 'GET');
$app->instance('request', $request);

try {
    $controller = new DiscountController();
    $response = $controller->getActiveVouchers();
    echo "SUCCESS: " . json_encode($response->getData()) . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
