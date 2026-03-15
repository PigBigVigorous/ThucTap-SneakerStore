<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;
    
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Thêm role vào fillable để có thể gán giá trị khi tạo người dùng
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Quan hệ: Một người dùng có nhiều đơn hàng (as customer)
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    // Quan hệ: Một nhân viên xử lý nhiều đơn hàng POS (as cashier)
    public function posOrders()
    {
        return $this->hasMany(Order::class, 'cashier_id');
    }
}