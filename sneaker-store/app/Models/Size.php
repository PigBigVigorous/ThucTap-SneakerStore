<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Size extends Model
{
    public $timestamps = false; // Bảng master data không cần timestamp

    protected $fillable = ['name', 'code'];

    // Quan hệ: Một size có nhiều biến thể sản phẩm
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
