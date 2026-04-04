<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_tracking_code',
        'user_id',
        'status',
        'total_amount',
        // Xóa 'shipping_address', thêm các trường bên dưới:
        'customer_name',
        'customer_phone',
        'customer_email',
        'province',
        'district',
        'ward',
        'address_detail',
        'sales_channel_id',
        'branch_id',
        'cashier_id'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    // Quan hệ: Thuộc về 1 Khách hàng (User)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Quan hệ: Thuộc về 1 Sales Channel
    public function salesChannel()
    {
        return $this->belongsTo(SalesChannel::class, 'sales_channel_id');
    }

    // Quan hệ: Thuộc về 1 Chi nhánh (Branch)
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    // Quan hệ: Thuộc về 1 Nhân viên (Cashier)
    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    // Quan hệ: Có nhiều chi tiết đơn hàng (Sản phẩm trong đơn)
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}