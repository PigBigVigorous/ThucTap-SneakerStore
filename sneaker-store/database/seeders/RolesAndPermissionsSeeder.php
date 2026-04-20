<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Dọn dẹp Cache và Xóa sạch dữ liệu phân quyền cũ (Tránh rác)
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Schema::disableForeignKeyConstraints();
        DB::table('model_has_permissions')->truncate();
        DB::table('model_has_roles')->truncate();
        DB::table('role_has_permissions')->truncate();
        DB::table('permissions')->truncate();
        DB::table('roles')->truncate();
        Schema::enableForeignKeyConstraints();

        // 2. Tạo quyền (Permissions) với guard 'sanctum'
        $permissions = [
            'view-dashboard',
            'manage-products',     // Tạo, sửa sản phẩm, danh mục, thương hiệu
            'manage-inventory',    // Nhập/xuất/chuyển kho, quản lý chi nhánh
            'manage-orders',       // Xử lý đơn hàng, hoàn trả
            'pos-sale',            // Truy cập máy tính tiền POS
            'manage-users',        // Quản lý nhân viên (Admin duy nhất)
            'view-staff',          // Xem danh sách nhân viên (Dành cho Manager & Admin)
            'manage-discounts',    // Quản lý mã giảm giá, khuyến mãi
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'sanctum'); 
        }

        // 3. Tạo Vai trò (Roles) và Gắn quyền
        
        // Thu ngân (Chỉ bán và xem đơn)
        $cashierRole = Role::findOrCreate('cashier', 'sanctum');
        $cashierRole->syncPermissions(['pos-sale', 'manage-orders']);

        // Phụ trách kho (Quản lý hàng vật lý, ko xem doanh thu)
        $warehouseRole = Role::findOrCreate('warehouse-manager', 'sanctum');
        $warehouseRole->syncPermissions(['manage-products', 'manage-inventory']);

        // Quản lý cửa hàng (Xem báo cáo, đổi kho, bán hàng, xử lý khiếu nại - KHÔNG quản lý System Admin)
        $managerRole = Role::findOrCreate('store-manager', 'sanctum');
        $managerRole->syncPermissions([
            'view-dashboard', 'manage-products', 'manage-inventory', 'manage-orders', 'pos-sale', 'view-staff', 'manage-discounts'
        ]);

        // Super Admin (Trùm cuối)
        $superAdminRole = Role::findOrCreate('super-admin', 'sanctum');
        $superAdminRole->syncPermissions($permissions);

        // Khách thường
        $customerRole = Role::findOrCreate('customer', 'sanctum');
        
        // 4. Tìm Admin cũ và thăng chức Super Admin bảo vệ data
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            $admin->assignRole($superAdminRole);
        }

        $this->command->info('✅ Đã định nghĩa và gắn các nhóm quyền (Roles & Permissions) E-Commerce hoàn chỉnh!');
    }
}