<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

interface ShippingServiceInterface
{
    /**
     * Tính toán phí giao hàng dựa trên địa chỉ.
     * 
     * @param string $province Tỉnh/Thành
     * @param string $district Quận/Huyện
     * @param string $ward Phường/Xã (Tùy chọn)
     * @return float
     */
    public function calculateFee(string $province, string $district, string $ward = ''): float;
}

class ShippingService implements ShippingServiceInterface
{
    /**
     * Logic tính phí (Mock hoặc Real dựa trên config)
     */
    public function calculateFee(string $province, string $district, string $ward = ''): float
    {
        $mode = env('SHIPPING_API_MODE', 'mock');

        if ($mode === 'real') {
            return $this->calculateRealFee($province, $district, $ward);
        }

        return $this->calculateMockFee($province, $district, $ward);
    }

    /**
     * GIẢ LẬP PHÍ SHIP (Mock Service)
     */
    private function calculateMockFee(string $province, string $district, string $ward): float
    {
        // Mô phỏng độ trễ API 500ms
        usleep(500000);

        $province = mb_strtolower($province);
        $district = mb_strtolower($district);

        // Logic giả lập theo địa lý (Ví dụ: Nội thành rẻ hơn ngoại thành)
        $isHCM = Str::contains($province, 'hồ chí minh');
        $isHN = Str::contains($province, 'hà nội');
        $isDN = Str::contains($province, 'đà nẵng');

        if ($isHCM || $isHN || $isDN) {
            // Nội thành/Thành phố lớn: 25,000 - 35,000
            return (float) random_int(25, 35) * 1000;
        }

        // Tỉnh xa: 40,000 - 50,000
        return (float) random_int(40, 50) * 1000;
    }

    /**
     * Dàn khung cho tích hợp GHN/GHTK thật sau này
     */
    private function calculateRealFee(string $province, string $district, string $ward): float
    {
        // TODO: Gắn logic call Guzzle/Http client tới GHN API ở đây
        // Hiện tại fallback về mock nếu chưa có Token
        return $this->calculateMockFee($province, $district, $ward);
    }
}
