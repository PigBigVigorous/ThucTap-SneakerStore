<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Size;
use App\Models\Color;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderDetail;
use App\Models\InventoryTransaction;
use App\Models\Branch;
use App\Models\VariantBranchStock;
use App\Models\SalesChannel;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. TẠO USERS
        $admin = User::create([
            'name' => 'Quản trị viên',
            'email' => 'admin@sneaker.com',
            'password' => Hash::make('password123'),
        ]);

        $customer = User::create([
            'name' => 'Khách hàng VIP',
            'email' => 'khachhang@gmail.com',
            'password' => Hash::make('password123'),
        ]);

        // 2. TẠO CHI NHÁNH / KHO HÀNG
        $mainBranch = Branch::create([
            'name' => 'Kho Tổng TP.HCM',
            'address' => '123 Đường ABC, Quận 1, TP.HCM',
            'phone' => '0909123456',
            'is_active' => true
        ]);

        //  3. TẠO KÊNH BÁN HÀNG (PHASE 2 - OMNICHANNEL)
        $webChannel = SalesChannel::create([
            'name' => 'Website Chính Thức',
            'type' => 'online',
            'is_active' => true
        ]);

        $posChannel = SalesChannel::create([
            'name' => 'POS - Cửa Hàng Quận 1',
            'type' => 'offline',
            'is_active' => true
        ]);

        // 4. TẠO BRANDS
        $nike = Brand::create(['name' => 'Nike', 'description' => 'Just do it.']);
        $adidas = Brand::create(['name' => 'Adidas', 'description' => 'Impossible is nothing.']);
        $vans = Brand::create(['name' => 'Vans', 'description' => 'Off the wall.']);

        // 5. TẠO CATEGORIES
        $catNam = Category::create(['name' => 'Giày Nam']);
        $catNu = Category::create(['name' => 'Giày Nữ']);
        
        $catSneakerNam = Category::create(['name' => 'Sneaker Nam', 'parent_id' => $catNam->id]);
        $catChayBo = Category::create(['name' => 'Giày Chạy Bộ', 'parent_id' => $catNam->id]);

        // 6. TẠO SIZES & COLORS
        $sizes = [
            Size::create(['name' => '39', 'code' => 'EU-39']),
            Size::create(['name' => '40', 'code' => 'EU-40']),
            Size::create(['name' => '41', 'code' => 'EU-41']),
            Size::create(['name' => '42', 'code' => 'EU-42']),
        ];

        $colors = [
            Color::create(['name' => 'Trắng', 'base_color' => 'Trắng', 'hex_code' => '#FFFFFF']),
            Color::create(['name' => 'Đen', 'base_color' => 'Đen', 'hex_code' => '#000000']),
            Color::create(['name' => 'Đỏ', 'base_color' => 'Đỏ', 'hex_code' => '#FF0000']),
        ];

        // 7. TẠO NHÀ CUNG CẤP & PHIẾU NHẬP KHO
        $supplier = Supplier::create([
            'name' => 'Tổng kho giày dép VN', 
            'contact_info' => '0909123456 - TP.HCM'
        ]);

        $purchaseOrder = PurchaseOrder::create([
            'supplier_id' => $supplier->id,
            'po_code' => 'PO-' . strtoupper(uniqid()),
            'order_date' => now(),
            'status' => 'Received',
            'total_amount' => 0,
        ]);

        $totalPoAmount = 0;

        // 8. TẠO SẢN PHẨM & BIẾN THỂ
        $product1 = Product::create([
            'name' => 'Nike Air Force 1 Low',
            'description' => 'Huyền thoại đường phố không bao giờ lỗi thời.',
            'brand_id' => $nike->id,
            'category_id' => $catSneakerNam->id,
            'base_image_url' => 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/AIR+FORCE+1+%2707.png',
            'is_active' => true,
        ]);

        $af1Colors = [$colors[0], $colors[1]]; 
        $af1Sizes = [$sizes[1], $sizes[2]]; 

        foreach ($af1Colors as $color) {
            foreach ($af1Sizes as $size) {
                $price = 2500000;
                $importQty = 50; 
                $importCost = 1500000; 

                $colorSlug = Str::slug($color->name); 
                $colorCode = strtoupper(substr($colorSlug, 0, 3)); 

                $variant = ProductVariant::create([
                    'product_id' => $product1->id,
                    'sku' => 'NK-AF1-' . $colorCode . '-' . $size->name, 
                    'size_id' => $size->id,
                    'color_id' => $color->id,
                    'price' => $price,
                ]);

                // LƯU TỒN KHO
                VariantBranchStock::create([
                    'variant_id' => $variant->id,
                    'branch_id' => $mainBranch->id,
                    'stock' => $importQty,
                ]);

                // CHI TIẾT NHẬP
                PurchaseOrderDetail::create([
                    'po_id' => $purchaseOrder->id,
                    'variant_id' => $variant->id,
                    'quantity_ordered' => $importQty,
                    'unit_cost' => $importCost,
                ]);

                // LOG GIAO DỊCH KHO 
                InventoryTransaction::create([
                    'product_variant_id' => $variant->id,
                    'transaction_type' => 'IMPORT',
                    'to_branch_id' => $mainBranch->id, 
                    'reference_id' => $purchaseOrder->id,
                    'quantity_change' => $importQty, 
                    'note' => 'Nhập kho lần đầu vào Kho Tổng từ PO: ' . $purchaseOrder->po_code,
                    'created_at' => now(),
                ]);

                $totalPoAmount += ($importQty * $importCost);
            }
        }

        $purchaseOrder->update(['total_amount' => $totalPoAmount]);
    }
}