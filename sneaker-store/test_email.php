<?php

// test_email.php - Script để test gửi email
require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Mail;

$app = require_once 'bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

try {
    echo "Testing email configuration...\n";

    // Test gửi email đơn giản
    Mail::raw('Đây là email test từ SneakerShop!', function($message) {
        $message->to('khangvaphuc3@gmail.com') // Thay bằng email của bạn
                ->subject('Test Email - SneakerShop');
    });

    echo "✅ Email test sent successfully!\n";
    echo "📧 Check your inbox for the test email.\n";

} catch (\Exception $e) {
    echo "❌ Email test failed: " . $e->getMessage() . "\n";
    echo "🔧 Please check your Gmail credentials and App Password.\n";
}