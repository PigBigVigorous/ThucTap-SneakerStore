<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Cviebrock\EloquentSluggable\Sluggable;

class Product extends Model
{
    use Sluggable;

    protected $fillable = [
        'name', 'slug', 'description', 'brand_id', 
        'category_id', 'base_image_url', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean', // Ép kiểu về true/false thay vì 1/0
    ];

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
}