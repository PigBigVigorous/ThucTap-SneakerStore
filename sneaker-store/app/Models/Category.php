<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Cviebrock\EloquentSluggable\Sluggable;

class Category extends Model
{
    use Sluggable;

    protected $fillable = ['name', 'slug', 'parent_id'];

    // Cấu hình tự động sinh Slug từ trường 'name'
    public function sluggable(): array
    {
        return [
            'slug' => ['source' => 'name']
        ];
    }

    // Quan hệ: Danh mục cha
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // Quan hệ: Các danh mục con
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    // Quan hệ: Sản phẩm thuộc danh mục này
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
