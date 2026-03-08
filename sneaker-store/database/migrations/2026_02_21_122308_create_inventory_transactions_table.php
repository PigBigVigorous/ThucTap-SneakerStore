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
        Schema::create('inventory_transactions', function (Blueprint $table) {
        $table->bigIncrements('id'); // BigInt: Chuẩn bị cho hàng triệu record
        $table->foreignId('product_variant_id')->constrained('product_variants');
        
        // Loại giao dịch: Nhập hàng, Bán hàng, Trả hàng, Kiểm kê, Chuyển kho
        $table->enum('transaction_type', ['IMPORT', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER']);
        
        $table->unsignedBigInteger('reference_id')->nullable(); // ID của Order hoặc Purchase Order
        $table->integer('quantity_change'); // Số âm hoặc dương (+10, -1)
        $table->text('note')->nullable();
        
        $table->timestamp('created_at')->useCurrent(); // Quan trọng: Thời điểm phát sinh
        
        // Đánh Index để truy vấn lịch sử nhanh
        $table->index(['product_variant_id', 'created_at']);
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
