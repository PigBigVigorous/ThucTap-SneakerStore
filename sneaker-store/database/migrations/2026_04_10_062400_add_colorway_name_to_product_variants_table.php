<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Thêm cột colorway_name vào bảng product_variants.
     * Lưu trữ tên phối màu đầy đủ của đôi giày.
     * VD: "Neutral Grey/Summit White/Infrared 23/Black"
     * 
     * Cột này là nullable để đảm bảo backward-compatible
     * với tất cả biến thể đã tồn tại trong DB.
     */
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            // Thêm sau cột color_id để dễ quản lý
            $table->string('colorway_name')->nullable()->after('color_id');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('colorway_name');
        });
    }
};
