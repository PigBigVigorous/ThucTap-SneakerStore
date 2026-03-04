<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('product_variants', function (Blueprint $table) {
            if (Schema::hasColumn('product_variants', 'current_stock')) {
                // Dropping columns may require doctrine/dbal installed in some environments.
                $table->dropColumn('current_stock');
            }
        });
    }

    public function down()
    {
        Schema::table('product_variants', function (Blueprint $table) {
            if (!Schema::hasColumn('product_variants', 'current_stock')) {
                $table->integer('current_stock')->default(0);
            }
        });
    }
};
