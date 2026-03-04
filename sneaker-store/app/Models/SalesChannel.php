<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesChannel extends Model
{
    protected $table = 'sales_channels';

    protected $fillable = [
        'name', 'type', 'is_active'
    ];

    public function orders()
    {
        return $this->hasMany(Order::class, 'sales_channel_id');
    }
}
