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
        Schema::create('orders', function (Blueprint $table) {
        $table->bigIncrements('id'); // ID nội bộ (Dùng để Join)
        $table->string('order_tracking_code')->unique(); // Mã đơn khách hàng thấy (#ORD-99X8)
        $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();        
        $table->enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])->default('pending');
        $table->unsignedBigInteger('total_amount');
        $table->string('customer_name')->nullable();
        $table->string('customer_phone')->nullable();
        $table->string('customer_email')->nullable();
        $table->string('province')->nullable();
        $table->string('district')->nullable();
        $table->string('ward')->nullable();
        $table->string('address_detail')->nullable();
        $table->timestamps();
        
    });

    Schema::create('order_items', function (Blueprint $table) {
        $table->id();
        $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
        $table->foreignId('product_variant_id')->constrained('product_variants'); // Link tới Variant, không phải Product cha
        $table->integer('quantity');
        $table->unsignedBigInteger('unit_price');
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Xóa bảng con trước
        Schema::dropIfExists('order_items');
        // Xóa bảng cha sau
        Schema::dropIfExists('orders');
    }
};
