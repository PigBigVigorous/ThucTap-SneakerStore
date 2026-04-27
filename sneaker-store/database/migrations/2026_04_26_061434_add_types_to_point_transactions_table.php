<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE point_transactions MODIFY COLUMN type ENUM('earn', 'spend', 'refund', 'deduct')");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE point_transactions MODIFY COLUMN type ENUM('earn', 'spend')");
    }
};
