<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\ProductVariant;

// [TEST CODE] Đây là class phụ trách chạy unit test cho dự án backend.
class OrderTest extends TestCase
{
    // [TEST CODE] RefreshDatabase giúp xoá toàn bộ dữ liệu mẫu sinh ra mỗi khi chạy xong một hàm test
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // [TEST CODE] Chạy Seeder tổng để tạo sẵn sản phẩm, tồn kho, và người dùng phục vụ cho test
        $this->seed(\Database\Seeders\DatabaseSeeder::class); 
    }

    // [TEST CODE] Hàm test việc tạo một đơn hàng COD mới bằng API
    public function test_can_create_an_order_with_cod()
    {
        // [TEST CODE] Lấy 1 tài khoản khách hàng từ DB mẫu (ví dụ: customer)
        $user = User::where('email', 'khachhang@gmail.com')->first();
        
        // [TEST CODE] Đăng nhập tài khoản bằng Sanctum
        $this->actingAs($user, 'sanctum');

        // [TEST CODE] Lấy 1 biến thể sản phẩm đầu tiên sinh ra từ Seeder
        $variant = ProductVariant::first();

        // [TEST CODE] Giả lập dữ liệu json payload gửi lến POST /api/orders
        $payload = [
            'customer_name' => 'Nguyễn Văn Phục Vụ Test',
            'customer_phone' => '0123456789',
            'customer_email' => 'test@example.com',
            'province' => 'Thành phố Hồ Chí Minh',
            'district' => 'Quận 10',
            'ward' => 'Phường 14',
            'address_detail' => 'So 10 HCM',
            'shipping_fee' => 0,
            'payment_method' => 'cod',
            'items' => [
                [
                    'variant_id' => $variant->id,
                    'quantity' => 1
                ]
            ]
        ];

        // [TEST CODE] Thực hiện lệnh POST đến Backend
        $response = $this->postJson('/api/orders', $payload);

        // [TEST CODE] Assert kì vọng API trả về status 201 Created và kèm các trường nhất định
        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'success', 
                     'message', 
                     'data' => [
                         'order_tracking_code'
                     ]
                 ]);
    }
}
