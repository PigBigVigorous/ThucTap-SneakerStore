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
    Schema::create('suppliers', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('contact_info')->nullable();
        $table->timestamps();
    });

    Schema::create('purchase_orders', function (Blueprint $table) {
        $table->bigIncrements('id');
        $table->foreignId('supplier_id')->constrained('suppliers');
        $table->string('po_code')->unique();
        $table->date('order_date');
        $table->enum('status', ['Draft', 'Received', 'Cancelled'])->default('Draft');
        $table->decimal('total_amount', 15, 2)->default(0);
        $table->timestamps();
    });

    Schema::create('purchase_order_details', function (Blueprint $table) {
        $table->bigIncrements('id');
        $table->foreignId('po_id')->constrained('purchase_orders')->onDelete('cascade');
        $table->foreignId('variant_id')->constrained('product_variants');
        $table->integer('quantity_ordered');
        $table->decimal('unit_cost', 15, 2);
    });
}

    public function down()
{
    Schema::dropIfExists('purchase_order_details');
    Schema::dropIfExists('purchase_orders');
    Schema::dropIfExists('suppliers');
}
};
