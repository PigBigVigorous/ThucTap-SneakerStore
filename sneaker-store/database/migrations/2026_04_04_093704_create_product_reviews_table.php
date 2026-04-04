<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('rating')->default(5);
            $table->text('comment')->nullable();
            $table->timestamps();

            // Đặt Ràng buộc cứng tại đây luôn thay vì tách file
            $table->unique(['user_id', 'product_id'], 'user_product_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};