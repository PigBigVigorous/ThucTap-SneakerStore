<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('brands', function (Blueprint $table) {
            $table->id(); // BigInt tự động
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique(); // SEO URL
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->timestamps();
        });

        // Master data cho Size và Color
        Schema::create('sizes', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // VD: 40, 41, 42
            $table->string('code')->nullable(); // VD: EU-40
        });

        Schema::create('colors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // 🚨 THÊM DÒNG NÀY VÀO (Cho phép null nếu có màu không cần base_color)
            $table->string('base_color')->nullable(); 
            $table->string('hex_code')->nullable();
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('colors');
        Schema::dropIfExists('sizes');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('brands');
    }
};
