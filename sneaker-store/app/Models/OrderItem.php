<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    // Không cần dùng timestamps cho bảng trung gian này (do migration không có)
    public $timestamps = false;

    protected $fillable = [
        'order_id', 'product_variant_id', 'quantity', 'unit_price'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Liên kết thẳng đến Variant (SKU được mua)
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}