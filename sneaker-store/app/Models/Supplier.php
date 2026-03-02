<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = ['name', 'contact_info'];

    // Quan hệ: Một nhà cung cấp có nhiều đơn nhập hàng
    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
