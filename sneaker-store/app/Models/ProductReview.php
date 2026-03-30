<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductReview extends Model
{
    protected $fillable = ['product_id', 'user_id', 'rating', 'comment'];

    // Liên kết 1 đánh giá thuộc về 1 khách hàng
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}