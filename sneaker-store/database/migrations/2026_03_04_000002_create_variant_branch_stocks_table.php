<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('variant_branch_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->integer('stock')->default(0);
            $table->timestamps();
            $table->unique(['variant_id', 'branch_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('variant_branch_stocks');
    }
};
