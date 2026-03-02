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
        $table->foreignId('user_id')->constrained('users'); // Giả định bảng users đã có
        
        $table->enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])->default('pending');
        $table->decimal('total_amount', 15, 2);
        $table->text('shipping_address');
        $table->timestamps();
    });

    Schema::create('order_items', function (Blueprint $table) {
        $table->id();
        $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
        $table->foreignId('product_variant_id')->constrained('product_variants'); // Link tới Variant, không phải Product cha
        $table->integer('quantity');
        $table->decimal('unit_price', 15, 2); // Giá tại thời điểm mua
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
