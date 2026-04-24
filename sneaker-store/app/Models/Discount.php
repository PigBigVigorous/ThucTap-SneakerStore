<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Discount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'type', // 'percent' or 'fixed'
        'value',
        'min_order_value',
        'max_discount_value',
        'usage_limit',
        'usage_limit_per_user',
        'used_count',
        'start_date',
        'expiration_date',
        'is_active',
        'category_ids',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'expiration_date' => 'datetime',
        'is_active' => 'boolean',
        'category_ids' => 'array',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'discount_user')->withPivot('is_used')->withTimestamps();
    }
}
