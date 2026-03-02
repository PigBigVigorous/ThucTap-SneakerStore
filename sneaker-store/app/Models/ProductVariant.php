<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    protected $table = 'product_variants';
    
    protected $fillable = [
        'product_id', 'sku', 'size_id', 'color_id', 
        'price', 'current_stock', 'variant_image_url'
    ];

    // Ép kiểu dữ liệu để đảm bảo an toàn khi tính toán
    protected $casts = [
        'price' => 'decimal:2',
        'current_stock' => 'integer',
    ];

    // Quan hệ: Thuộc về 1 Sản phẩm cha
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Quan hệ: Thuộc về 1 Size
    public function size()
    {
        return $this->belongsTo(Size::class);
    }

    // Quan hệ: Thuộc về 1 Màu sắc
    public function color()
    {
        return $this->belongsTo(Color::class);
    }

    // Quan hệ: Có nhiều lịch sử biến động kho
    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    // Quan hệ: Có nhiều chi tiết đơn nhập hàng
    public function purchaseOrderDetails()
    {
        return $this->hasMany(PurchaseOrderDetail::class, 'variant_id');
    }
}