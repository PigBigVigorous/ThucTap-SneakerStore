<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    // Bảng này ta thiết kế chỉ dùng created_at, không cần updated_at
    public $timestamps = false; 

    protected $fillable = [
        'product_variant_id', 'transaction_type', 
        'reference_id', 'quantity_change', 'note',
        'from_branch_id', 'to_branch_id'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'quantity_change' => 'integer',
    ];

    // Quan hệ: Thuộc về 1 biến thể (SKU) cụ thể
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}