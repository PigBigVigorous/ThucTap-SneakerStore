<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule; // 🚨 Phải có dòng import này

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 🚨 Lên lịch chạy lệnh dọn dẹp mỗi phút 1 lần
Schedule::command('orders:release-pending')->everyMinute();