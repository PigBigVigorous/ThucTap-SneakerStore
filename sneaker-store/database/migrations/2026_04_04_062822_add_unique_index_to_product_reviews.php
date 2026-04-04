<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('product_reviews', function (Blueprint $table) {
        // Ràng buộc cứng tại Tầng Cơ Sở Dữ Liệu
        $table->unique(['user_id', 'product_id'], 'user_product_unique');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_reviews', function (Blueprint $table) {
            //
        });
    }
};
