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
        Schema::create('discount_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('discount_id')->constrained()->onDelete('cascade');
            $table->boolean('is_used')->default(false);
            $table->timestamps();
            
            // Một user chỉ lưu 1 voucher 1 lần
            $table->unique(['user_id', 'discount_id']);
        });

        Schema::table('branches', function (Blueprint $table) {
            // Thêm province_code để link với bảng provinces (dùng eager load branch.province)
            $table->string('province_code')->nullable()->after('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_user');
        
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('province_code');
        });
    }
};
