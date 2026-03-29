<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $table = 'branches';

    protected $fillable = [
        'name', 'address', 'phone', 'is_active', 'is_main'
    ];

    public function variantStocks()
    {
        return $this->hasMany(VariantBranchStock::class, 'branch_id');
    }

    public function inventoryTransactionsFrom()
    {
        return $this->hasMany(InventoryTransaction::class, 'from_branch_id');
    }

    public function inventoryTransactionsTo()
    {
        return $this->hasMany(InventoryTransaction::class, 'to_branch_id');
    }

    public function inventoryTransactions()
    {
        return InventoryTransaction::where('from_branch_id', $this->id)
            ->orWhere('to_branch_id', $this->id);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'branch_id');
    }
}
