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
        // 1. Thêm xóa mềm cho bảng Sản phẩm
        Schema::table('products', function (Blueprint $table) {
            $table->softDeletes();
        });

        // 2. Thêm xóa mềm cho bảng Biến thể sản phẩm
        Schema::table('product_variants', function (Blueprint $table) {
            $table->softDeletes();
        });

        // 3. Thêm xóa mềm cho bảng Users (Bảo vệ lịch sử mua hàng nếu khách xóa tài khoản)
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};