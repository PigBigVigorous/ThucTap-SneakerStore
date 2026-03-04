<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VariantBranchStock extends Model
{
    protected $table = 'variant_branch_stocks';

    protected $fillable = [
        'variant_id', 'branch_id', 'stock'
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
