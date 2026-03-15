<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;
class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Reset lại cache của thư viện để tránh lỗi
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Tạo danh sách các Quyền (Permissions) cụ thể
        $permissions = [
            'view-dashboard',   // Xem thống kê doanh thu
            'manage-products',  // Thêm sửa xóa sản phẩm
            'manage-inventory', // Chuyển kho, kiểm kê
            'manage-orders',    // Xác nhận, hủy, trả đơn hàng
            'pos-sale',         // Bán hàng tại quầy POS
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'api'); // Lưu ý guard là 'api'
        }

        // 3. Tạo Vai trò (Roles) và Gắn quyền cho Vai trò đó
        
        // --- THU NGÂN (Cashier) ---
        $cashierRole = Role::findOrCreate('cashier', 'api');
        $cashierRole->syncPermissions(['pos-sale', 'manage-orders']);

        // --- QUẢN LÝ KHO (Warehouse Manager) ---
        $warehouseRole = Role::findOrCreate('warehouse-manager', 'api');
        $warehouseRole->syncPermissions(['manage-products', 'manage-inventory']);

        // --- SẾP TỔNG (Super Admin) ---
        $superAdminRole = Role::findOrCreate('super-admin', 'api');
        // Super Admin không cần sync quyền, vì lát nữa ta sẽ cấu hình cho nó tự động pass mọi quyền.

        // 4. Tìm User admin cũ trong hệ thống và phong tước "Super Admin" cho họ
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            $admin->assignRole($superAdminRole);
        }

        $this->command->info('Đã khởi tạo xong Hệ thống Phân quyền RBAC!');
    }
}