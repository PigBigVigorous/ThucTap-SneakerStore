<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Size;
use App\Models\Color;
use App\Models\Branch;
use App\Models\SalesChannel;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. TẠO CHI NHÁNH / KHO HÀNG
        Branch::create([
            'name' => 'Kho Tổng TP.HCM',
            'address' => '35 Lý Văn Phức, Tân Định, Hồ Chí Minh',
            'phone' => '0909123456',
            'is_active' => true,
            'is_main' => true
        ]);
        Branch::create([
            'name' => 'Kho Tổng Ha Nội',
            'address' => '54 P. Lý Quốc Sư, Hàng Trống, Hoàn Kiếm, Hà Nội',
            'phone' => '0909123456',
            'is_active' => true,
            'is_main' => false
        ]);

        // 2. TẠO KÊNH BÁN HÀNG
        SalesChannel::create([
            'name' => 'Website Chính Thức',
            'type' => 'online',
            'is_active' => true
        ]);
        SalesChannel::create([
            'name' => 'POS - Cửa Hàng Quận 1',
            'type' => 'offline',
            'is_active' => true
        ]);

        // 3. TẠO BRANDS
        Brand::create(['name' => 'Nike', 'description' => 'Just do it.']);
        Brand::create(['name' => 'Adidas', 'description' => 'Impossible is nothing.']);
        Brand::create(['name' => 'Vans', 'description' => 'Off the wall.']);

        // 4. TẠO CATEGORIES
        $catNam = Category::create(['name' => 'Giày Nam']);
        Category::create(['name' => 'Giày Nữ']);
        Category::create(['name' => 'Sneaker Nam', 'parent_id' => $catNam->id]);
        Category::create(['name' => 'Giày Chạy Bộ', 'parent_id' => $catNam->id]);

        // 5. TẠO SIZES
        Size::create(['name' => '39', 'code' => 'EU-39']);
        Size::create(['name' => '40', 'code' => 'EU-40']);
        Size::create(['name' => '41', 'code' => 'EU-41']);
        Size::create(['name' => '42', 'code' => 'EU-42']);

        // 6. TẠO COLORS
        Color::create(['name' => 'Trắng', 'base_color' => 'Trắng', 'hex_code' => '#FFFFFF']);
        Color::create(['name' => 'Đen', 'base_color' => 'Đen', 'hex_code' => '#000000']);
        Color::create(['name' => 'Đỏ', 'base_color' => 'Đỏ', 'hex_code' => '#FF0000']);
    }
}
