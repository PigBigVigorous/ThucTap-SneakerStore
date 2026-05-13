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
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'district_code')) {
                $table->string('district_code', 20)->nullable()->after('province_code');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'province_code')) {
                $table->string('province_code', 20)->nullable()->after('province');
            }
            if (!Schema::hasColumn('orders', 'district_code')) {
                $table->string('district_code', 20)->nullable()->after('district');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['district_code']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['province_code', 'district_code']);
        });
    }
};
