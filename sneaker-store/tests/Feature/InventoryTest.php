<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\ProductVariant;
use App\Models\Branch;

// [TEST CODE] Class test việc Nhập hàng / Chuyển kho của hệ thống Inventory
class InventoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // [TEST CODE] Setup môi trường bằng DatabaseSeeder
        $this->seed(\Database\Seeders\DatabaseSeeder::class); 
    }

    // [TEST CODE] Hàm test quyền của Thủ kho khi xem tồn kho
    public function test_warehouse_manager_can_view_stocks()
    {
        // [TEST CODE] Lấy tài khoản Thủ kho (warehouse-manager)
        $user = User::where('email', 'thukho@gmail.com')->first();
        $this->actingAs($user, 'sanctum');

        // [TEST CODE] Gọi API lấy tồn kho
        $response = $this->getJson('/api/admin/inventory/stocks');

        // [TEST CODE] Kiểm tra trả về thành công 200
        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'data']);
    }

    // [TEST CODE] Hàm test Thủ kho nhập hàng
    public function test_warehouse_manager_can_import_stock()
    {
        $user = User::where('email', 'thukho@gmail.com')->first();
        $this->actingAs($user, 'sanctum');

        $variant = ProductVariant::first();
        $branch = Branch::first();

        // [TEST CODE] Payload nhập hàng từ nhà cung cấp
        $payload = [
            'branch_id' => $branch->id,
            'variant_id' => $variant->id,
            'quantity' => 10,
            'note' => 'Nhập hàng test'
        ];

        // [TEST CODE] POST lên api nhập hàng
        $response = $this->postJson('/api/admin/inventory/import', $payload);

        // [TEST CODE] Kiểm tra phản hồi
        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
    }
}
