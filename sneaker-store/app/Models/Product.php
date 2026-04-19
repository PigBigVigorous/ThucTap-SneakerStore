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
        'is_active' => 'boolean',
    ];
    
    protected static function booted()
    {
        static::deleting(function ($product) {
            if ($product->isForceDeleting()) {
                $product->variants()->forceDelete();
                $product->images()->forceDelete();
                $product->reviews()->forceDelete();
            } else {
                $product->variants()->delete();
            }
        });

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

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function reviews()
    {
        return $this->hasMany(\App\Models\Review::class);
    }

    /**
     * Scope tìm kiếm cho Chatbot Claude (tool: search_shoe_inventory).
     * Hỗ trợ lọc theo: product_name, category, color, gender, sizes.
     */
    public function scopeSearchInventory($query, array $params = [])
    {
        $query->where('is_active', true)
              ->with([
                  'brand',
                  'category.parent',
                  'images',
                  'variants' => function ($q) {
                      $q->with(['color', 'size', 'branchStocks'])->orderBy('price');
                  },
              ]);

        // Lọc theo tên sản phẩm
        if (!empty($params['product_name'])) {
            $name = $params['product_name'];
            $query->where('name', 'like', '%' . $name . '%');
        }

        // Lọc theo danh mục
        if (!empty($params['category'])) {
            $cat = $params['category'];
            $query->whereHas('category', function ($q) use ($cat) {
                $q->where('name', 'like', '%' . $cat . '%');
            })->orWhereHas('category.parent', function ($q) use ($cat) {
                $q->where('name', 'like', '%' . $cat . '%');
            });
        }

        // Lọc theo giới tính (qua tên danh mục)
        if (!empty($params['gender'])) {
            $gender = $params['gender'];
            $query->where(function ($q) use ($gender) {
                $q->whereHas('category', function ($q2) use ($gender) {
                    $q2->where('name', 'like', '%' . $gender . '%');
                })->orWhereHas('category.parent', function ($q2) use ($gender) {
                    $q2->where('name', 'like', '%' . $gender . '%');
                });
            });
        }

        // Lọc theo màu sắc
        if (!empty($params['color'])) {
            $color = $params['color'];
            $query->whereHas('variants.color', function ($q) use ($color) {
                $q->where('name', 'like', '%' . $color . '%');
            });
        }

        // Lọc theo size (mảng)
        if (!empty($params['sizes']) && is_array($params['sizes'])) {
            $sizes = $params['sizes'];
            $query->whereHas('variants.size', function ($q) use ($sizes) {
                $q->whereIn('name', $sizes);
            });
        }

        return $query->limit(6);
    }
}