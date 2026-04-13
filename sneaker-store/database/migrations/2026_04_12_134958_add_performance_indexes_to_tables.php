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
        Schema::table('orders', function (Blueprint $table) {
            $table->index('status');
            $table->index('created_at');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['is_active', 'deleted_at']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->index('deleted_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_active', 'deleted_at']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex(['deleted_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['deleted_at']);
        });
    }
};
