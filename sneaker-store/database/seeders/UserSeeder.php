<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@sneaker.com'],
            ['name' => 'Quản trị viên', 'password' => Hash::make('password123')]
        );
        $admin->assignRole('super-admin');

        $customer = User::firstOrCreate(
            ['email' => 'khachhang@gmail.com'],
            ['name' => 'Khách hàng VIP', 'password' => Hash::make('password123')]
        );
        $customer->assignRole('customer');
        
        $cashier = User::firstOrCreate(
            ['email' => 'thungan@gmail.com'],
            ['name' => 'Thu ngân', 'password' => Hash::make('password123')]
        );
        $cashier->assignRole('cashier');

        $warehouse = User::firstOrCreate(
            ['email' => 'thukho@gmail.com'],
            ['name' => 'Thủ kho', 'password' => Hash::make('password123')]
        );
        $warehouse->assignRole('warehouse-manager');

        // MỚI: Thêm Quản lý cửa hàng (Store Manager)
        $manager = User::firstOrCreate(
            ['email' => 'quanly@gmail.com'],
            ['name' => 'Quản lý Cửa hàng', 'password' => Hash::make('password123')]
        );
        $manager->assignRole('store-manager');
    }
}
