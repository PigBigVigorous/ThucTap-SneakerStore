<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
    Schema::table('orders', function (Blueprint $table) {
        $table->string('payment_method')->default('cod')->after('status'); // cod, vnpay, momo
        $table->string('payment_status')->default('pending')->after('payment_method'); // pending, paid, failed, refunded
        $table->string('transaction_id')->nullable()->after('payment_status'); // Mã giao dịch từ cổng thanh toán
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            //
        });
    }
};
