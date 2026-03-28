<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    
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


    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function fromBranch()
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch()
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }
}