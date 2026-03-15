<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            // Xóa ràng buộc Unique ở tầng DB để không bị xung đột với SoftDeletes
            $table->dropUnique('product_variants_sku_unique');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            // Rollback lại nếu cần
            $table->unique('sku');
        });
    }
};