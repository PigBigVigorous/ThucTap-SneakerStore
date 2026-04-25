<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ShipperSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Tạo tài khoản Shipper 1
        $shipper = User::updateOrCreate(
            ['email' => 'shipper@gmail.com'],
            [
                'name' => 'Nguyễn Văn Giao',
                'password' => Hash::make('123456'),
                'role' => 'shipper',
                'phone' => '0987654321',
            ]
        );

        // Tạo tài khoản Shipper 2
        User::updateOrCreate(
            ['email' => 'shipper2@gmail.com'],
            [
                'name' => 'Trần Thị Ship',
                'password' => Hash::make('123456'),
                'role' => 'shipper',
                'phone' => '0123456789',
            ]
        );

        $this->command->info('Đã tạo tài khoản Shipper mẫu thành công!');
    }
}
