<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class DistrictSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Đọc file JSON
        $json = File::get(database_path('seeders/data/quan_huyen.json'));
        $districts = json_decode($json, true);

        // 2. Chèn dữ liệu vào bảng districts
        foreach ($districts as $district) {
            DB::table('districts')->insert([
                'name' => $district['name'],
                'code' => $district['code'],
                'province_code' => $district['parent_code'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

    }
}
