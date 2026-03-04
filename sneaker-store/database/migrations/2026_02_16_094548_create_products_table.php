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
    // Bảng Sản phẩm cha
    Schema::create('products', function (Blueprint $table) {
        $table->bigIncrements('id'); // BigInt
        $table->string('name');
        $table->string('slug')->unique(); // SEO: giay-nike-jordan-1
        $table->text('description')->nullable();
        $table->foreignId('brand_id')->constrained('brands');
        $table->foreignId('category_id')->constrained('categories');
        $table->string('base_image_url')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    // Bảng Biến thể (SKU)
    Schema::create('product_variants', function (Blueprint $table) {
        $table->bigIncrements('id'); // BigInt
        $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
        $table->string('sku')->unique(); // Barcode quản lý kho
        $table->foreignId('size_id')->constrained('sizes');
        $table->foreignId('color_id')->constrained('colors');
        $table->decimal('price', 15, 2); // Giá bán
        $table->integer('current_stock')->default(0); // Cache tồn kho
        
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Phải xóa bảng con (product_variants) trước
        Schema::dropIfExists('product_variants');
        // Sau đó mới xóa bảng cha
        Schema::dropIfExists('products');
    }
};
