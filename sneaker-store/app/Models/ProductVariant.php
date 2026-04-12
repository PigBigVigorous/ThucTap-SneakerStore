<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use SoftDeletes;

    protected $table = 'product_variants';
    
    // Đã bỏ variant_image_url để tránh lỗi Column not found
    protected $fillable = [
        'product_id', 'sku', 'size_id', 'color_id', 'colorway_name', 'price'
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    protected $appends = ['total_stock'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function size()
    {
        return $this->belongsTo(Size::class);
    }

    public function color()
    {
        return $this->belongsTo(Color::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    public function purchaseOrderDetails()
    {
        return $this->hasMany(PurchaseOrderDetail::class, 'variant_id');
    }

    public function branchStocks()
    {
        return $this->hasMany(VariantBranchStock::class, 'variant_id');
    }

    // Tối ưu hóa tính tổng tồn kho để chống lỗi N+1 Query
    public function getTotalStockAttribute()
    {
        if ($this->relationLoaded('branchStocks')) {
            return (int) $this->branchStocks->sum('stock');
        }
        return (int) $this->branchStocks()->sum('stock');
    }
}