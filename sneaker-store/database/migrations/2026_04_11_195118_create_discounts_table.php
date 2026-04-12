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
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['percent', 'fixed']);
            $table->decimal('value', 12, 2); // % or fix money
            $table->decimal('min_order_value', 15, 2)->nullable();
            $table->decimal('max_discount_value', 15, 2)->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('used_count')->default(0);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('expiration_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
