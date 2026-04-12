<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {   
        // 1. GỌI SEEDER PHÂN QUYỀN TRƯỚC
        $this->call([
            RolesAndPermissionsSeeder::class,
        ]);

        // 2. TẠO USERS
        $this->call([
            UserSeeder::class,
        ]);

        // 3. TẠO MASTER DATA (Brands, Categories, Sizes, Colors, Branches, SalesChannels)
        $this->call([
            MasterDataSeeder::class,
        ]);

        // MỚI: TẠO DỮ LIỆU ĐỊA GIỚI HÀNH CHÍNH
        $this->call([
            ProvinceSeeder::class,
            DistrictSeeder::class,
            WardSeeder::class,
        ]);

        // 4. TẠO SẢN PHẨM & TỒN KHO MẪU
        $this->call([
            ProductSeeder::class,
        ]);
    }
}