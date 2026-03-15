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
            'manage-products',
            'manage-inventory',
            'manage-orders',
            'pos-sale',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'sanctum'); 
        }

        // 3. Tạo Vai trò (Roles) và Gắn quyền
        $cashierRole = Role::findOrCreate('cashier', 'sanctum');
        $cashierRole->syncPermissions(['pos-sale', 'manage-orders']);

        $warehouseRole = Role::findOrCreate('warehouse-manager', 'sanctum');
        $warehouseRole->syncPermissions(['manage-products', 'manage-inventory']);

        $superAdminRole = Role::findOrCreate('super-admin', 'sanctum');

        // 4. Tìm Admin và thăng chức Super Admin
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            $admin->assignRole($superAdminRole);
        }

        $this->command->info('Đã FIX xong hệ thống Phân quyền Sanctum!');
    }
}