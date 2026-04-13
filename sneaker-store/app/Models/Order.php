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
    'shipping_fee', // 🟢 Thêm dòng này để cho phép lưu phí ship
    'customer_name',
    'customer_phone',
    'customer_email',
    'province',
    'district',
    'ward',
    'address_detail',
    'sales_channel_id',
    'branch_id',
    'cashier_id',
    'payment_status', // Nên thêm cả trường này nếu chưa có
    'transaction_id',
    'discount_id',
    'discount_amount'
];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
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

    // Quan hệ: Thuộc về 1 Mã giảm giá (nếu có áp dụng)
    public function discount()
    {
        return $this->belongsTo(Discount::class);
    }

    /**
     * Thuộc tính ảo: Địa chỉ đầy đủ
     */
    public function getFullAddressAttribute()
    {
        $addressParts = array_filter([
            $this->address_detail,
            $this->ward,
            $this->district,
            $this->province
        ]);

        return !empty($addressParts) ? implode(', ', $addressParts) : '';
    }
}