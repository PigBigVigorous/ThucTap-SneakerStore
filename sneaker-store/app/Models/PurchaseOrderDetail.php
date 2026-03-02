<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderDetail extends Model
{
    public $timestamps = false; // Bảng chi tiết không cần timestamp

    protected $table = 'purchase_order_details';

    protected $fillable = [
        'po_id', 'variant_id', 'quantity_ordered', 'unit_cost'
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'quantity_ordered' => 'integer',
    ];

    // Quan hệ: Thuộc về 1 đơn nhập hàng
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    // Quan hệ: Liên kết đến biến thể sản phẩm
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
