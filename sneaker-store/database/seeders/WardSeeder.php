<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class WardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Đọc file JSON
        $json = File::get(database_path('seeders/data/xa_phuong.json'));
        $wards = json_decode($json, true);
        // 2. Chèn dữ liệu vào bảng wards
        foreach ($wards as $ward) {
            DB::table('wards')->insert([
                'name' => $ward['name'],
                'code' => $ward['code'],
                'district_code' => $ward['parent_code'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

    }
}
