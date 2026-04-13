<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;
    protected $guard_name = 'sanctum';
    
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active', // Thêm trạng thái hoạt động
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