<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Cviebrock\EloquentSluggable\Sluggable;
use Illuminate\Database\Eloquent\SoftDeletes; 

class Product extends Model
{
    use Sluggable;
    use SoftDeletes; 
    protected $fillable = [
        'name', 'slug', 'description', 'brand_id', 
        'category_id', 'base_image_url', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean', // Ép kiểu về true/false thay vì 1/0
    ];
    
    protected static function booted()
    {
        // Khi product bị xóa
        static::deleting(function ($product) {
            if ($product->isForceDeleting()) {
                // Xóa cứng: xóa sạch dữ liệu liên quan
                $product->variants()->forceDelete();
                $product->images()->forceDelete();
                $product->reviews()->forceDelete();
            } else {
                // Xóa mềm: xóa mềm các variants
                $product->variants()->delete();
            }
        });

        // Khi product được khôi phục
        static::restoring(function ($product) {
            $product->variants()->restore();
        });
    }

    public function sluggable(): array
    {
        return ['slug' => ['source' => 'name']];
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Một sản phẩm có nhiều biến thể (SKU)
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        // Lấy danh sách ảnh và sắp xếp theo thứ tự sort_order
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function reviews()
    {
        return $this->hasMany(\App\Models\Review::class);
    }

    /**
     * Scope tìm kiếm sản phẩm cho Chatbot AI.
     * Lọc theo thương hiệu (tên) và giá tối đa (từ variants).
     */
    public function scopeChatbotSearch($query, $brand = null, $maxPrice = null)
    {
        $query->where('is_active', true)
              ->with([
                  'brand',
                  // Eager-load variants kèm branchStocks để tính tồn kho chính xác
                  'variants' => function ($q) use ($maxPrice) {
                      if ($maxPrice) {
                          $q->where('price', '<=', $maxPrice);
                      }
                      $q->with('branchStocks')->orderBy('price');
                  },
                  'images',
              ]);

        if ($brand) {
            $query->whereHas('brand', function ($q) use ($brand) {
                $q->where('name', 'like', '%' . $brand . '%');
            });
        }

        if ($maxPrice) {
            $query->whereHas('variants', function ($q) use ($maxPrice) {
                $q->where('price', '<=', $maxPrice)
                  ->whereHas('branchStocks', function ($sq) {
                      $sq->where('stock', '>', 0);
                  });
            });
        }

        return $query->limit(6);
    }
}