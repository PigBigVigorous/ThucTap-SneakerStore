<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_transactions', 'from_branch_id')) {
                $table->foreignId('from_branch_id')->nullable()->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('inventory_transactions', 'to_branch_id')) {
                $table->foreignId('to_branch_id')->nullable()->constrained('branches')->nullOnDelete();
            }

            if (!Schema::hasColumn('inventory_transactions', 'type')) {
                $table->string('type')->default('import');
            } else {
                try {
                    DB::statement('ALTER TABLE inventory_transactions MODIFY `type` VARCHAR(50) NOT NULL');
                } catch (\Exception $e) {
                    // If the DB driver doesn't support MODIFY or permission denied, ignore.
                }
            }
        });
    }

    public function down()
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_transactions', 'from_branch_id')) {
                $table->dropForeign(["from_branch_id"]);
                $table->dropColumn('from_branch_id');
            }

            if (Schema::hasColumn('inventory_transactions', 'to_branch_id')) {
                $table->dropForeign(["to_branch_id"]);
                $table->dropColumn('to_branch_id');
            }

            // We won't drop or revert `type` to avoid data loss.
        });
    }
};
