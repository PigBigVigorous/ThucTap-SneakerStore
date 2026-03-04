<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'sales_channel_id')) {
                $table->foreignId('sales_channel_id')->nullable()->constrained('sales_channels')->nullOnDelete();
            }

            if (!Schema::hasColumn('orders', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('orders', 'cashier_id')) {
                $table->foreignId('cashier_id')->nullable()->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'sales_channel_id')) {
                $table->dropForeign(['sales_channel_id']);
                $table->dropColumn('sales_channel_id');
            }

            if (Schema::hasColumn('orders', 'branch_id')) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            }

            if (Schema::hasColumn('orders', 'cashier_id')) {
                $table->dropForeign(['cashier_id']);
                $table->dropColumn('cashier_id');
            }
        });
    }
};
