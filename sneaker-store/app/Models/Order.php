<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_tracking_code', 'user_id', 'status', 
        'total_amount', 'shipping_address'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    // Quan hệ: Thuộc về 1 Khách hàng (User)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Quan hệ: Có nhiều chi tiết đơn hàng (Sản phẩm trong đơn)
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}