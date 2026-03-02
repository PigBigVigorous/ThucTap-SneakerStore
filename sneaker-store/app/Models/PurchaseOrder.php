<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'supplier_id', 'po_code', 'order_date', 
        'status', 'total_amount'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'order_date' => 'date',
    ];

    // Quan hệ: Thuộc về 1 nhà cung cấp
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    // Quan hệ: Có nhiều chi tiết đơn nhập hàng
    public function details()
    {
        return $this->hasMany(PurchaseOrderDetail::class, 'po_id');
    }
}
