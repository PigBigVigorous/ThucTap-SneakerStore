<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Kiểm tra xem cột color_id đã tồn tại chưa
        if (!Schema::hasColumn('product_images', 'color_id')) {
            Schema::table('product_images', function (Blueprint $table) {
                $table->unsignedBigInteger('color_id')->nullable()->after('product_id');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('product_images', 'color_id')) {
            Schema::table('product_images', function (Blueprint $table) {
                $table->dropColumn('color_id');
            });
        }
    }
};