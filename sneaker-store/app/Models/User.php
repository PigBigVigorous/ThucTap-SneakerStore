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
        'points',
        'avatar',
        'gender',
        'dob',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = ['rank'];

    public function getRankAttribute()
    {
        $totalEarned = $this->pointTransactions()
            ->where('type', 'earn')
            ->sum('amount');

        if ($totalEarned >= 500) {
            return ['name' => 'Kim Cương', 'color' => '#7dd3fc', 'icon' => '💎'];
        } elseif ($totalEarned >= 200) {
            return ['name' => 'Vàng', 'color' => '#fbbf24', 'icon' => '🥇'];
        } elseif ($totalEarned >= 50) {
            return ['name' => 'Bạc', 'color' => '#94a3b8', 'icon' => '🥈'];
        } else {
            return ['name' => 'Đồng', 'color' => '#b87333', 'icon' => '🥉'];
        }
    }

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

    public function pointTransactions()
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function vouchers()
    {
        return $this->belongsToMany(Discount::class, 'discount_user')->withPivot('is_used')->withTimestamps();
    }
}