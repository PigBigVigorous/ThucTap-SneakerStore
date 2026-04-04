<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ProvinceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Đọc file JSON
        $json = File::get(database_path('seeders/data/tinh_tp.json'));
        $provinces = json_decode($json, true);

        // 2. Chèn dữ liệu vào bảng provinces
        foreach ($provinces as $province) {
            DB::table('provinces')->insert([
                'name' => $province['name'],
                'code' => $province['code'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
