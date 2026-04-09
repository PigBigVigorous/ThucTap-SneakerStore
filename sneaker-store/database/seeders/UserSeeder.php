<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Quản trị viên',
            'email' => 'admin@sneaker.com',
            'password' => Hash::make('password123'),
        ]);
        $admin->assignRole('super-admin');

        $customer = User::create([
            'name' => 'Khách hàng VIP',
            'email' => 'khachhang@gmail.com',
            'password' => Hash::make('password123'),
        ]);
        $customer->assignRole('customer');
        
        $cashier = User::create([
            'name' => 'Thu ngân',
            'email' => 'thungan@gmail.com',
            'password' => Hash::make('password123'),
        ]);
        $cashier->assignRole('cashier');

        $warehouse = User::create([
            'name' => 'Thủ kho',
            'email' => 'thukho@gmail.com',
            'password' => Hash::make('password123'),
        ]);
        $warehouse->assignRole('warehouse-manager');
    }
}
