<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Color extends Model
{
    public $timestamps = false; // Bảng master data không cần timestamp

    protected $fillable = ['name', 'hex_code'];

    // Quan hệ: Một màu sắc có nhiều biến thể sản phẩm
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
