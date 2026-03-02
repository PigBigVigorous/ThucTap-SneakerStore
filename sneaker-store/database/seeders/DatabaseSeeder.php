<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str; // <-- ĐÃ THÊM THƯ VIỆN STR ĐỂ XỬ LÝ TIẾNG VIỆT
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

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. TẠO USERS
        User::create([
            'name' => 'Quản trị viên',
            'email' => 'admin@sneaker.com',
            'password' => Hash::make('password123'),
        ]);

        User::create([
            'name' => 'Khách hàng VIP',
            'email' => 'khachhang@gmail.com',
            'password' => Hash::make('password123'),
        ]);

        // 2. TẠO BRANDS (Thương hiệu)
        $nike = Brand::create(['name' => 'Nike', 'description' => 'Just do it.']);
        $adidas = Brand::create(['name' => 'Adidas', 'description' => 'Impossible is nothing.']);
        $vans = Brand::create(['name' => 'Vans', 'description' => 'Off the wall.']);

        // 3. TẠO CATEGORIES (Danh mục - Có phân cấp)
        $catNam = Category::create(['name' => 'Giày Nam']);
        $catNu = Category::create(['name' => 'Giày Nữ']);
        
        $catSneakerNam = Category::create(['name' => 'Sneaker Nam', 'parent_id' => $catNam->id]);
        $catChayBo = Category::create(['name' => 'Giày Chạy Bộ', 'parent_id' => $catNam->id]);

        // 4. TẠO SIZES & COLORS (Master Data)
        $sizes = [
            Size::create(['name' => '39', 'code' => 'EU-39']),
            Size::create(['name' => '40', 'code' => 'EU-40']),
            Size::create(['name' => '41', 'code' => 'EU-41']),
            Size::create(['name' => '42', 'code' => 'EU-42']),
        ];

        $colors = [
            Color::create(['name' => 'Trắng', 'hex_code' => '#FFFFFF']),
            Color::create(['name' => 'Đen', 'hex_code' => '#000000']),
            Color::create(['name' => 'Đỏ', 'hex_code' => '#FF0000']),
        ];

        // 5. TẠO NHÀ CUNG CẤP & PHIẾU NHẬP KHO (Chuẩn bị nhập hàng)
        $supplier = Supplier::create([
            'name' => 'Tổng kho giày dép VN', 
            'contact_info' => '0909123456 - TP.HCM'
        ]);

        $purchaseOrder = PurchaseOrder::create([
            'supplier_id' => $supplier->id,
            'po_code' => 'PO-' . strtoupper(uniqid()),
            'order_date' => now(),
            'status' => 'Received',
            'total_amount' => 0, // Sẽ cộng dồn sau
        ]);

        $totalPoAmount = 0;

        // 6. TẠO SẢN PHẨM & BIẾN THỂ (Sản phẩm 1: Nike Air Force 1)
        $product1 = Product::create([
            'name' => 'Nike Air Force 1 Low',
            // slug tự động sinh nhờ EloquentSluggable
            'description' => 'Huyền thoại đường phố không bao giờ lỗi thời.',
            'brand_id' => $nike->id,
            'category_id' => $catSneakerNam->id,
            'base_image_url' => 'https://example.com/images/af1-base.jpg',
            'is_active' => true,
        ]);

        // Tạo Biến thể cho Nike AF1 (2 Màu x 2 Size = 4 SKUs)
        $af1Colors = [$colors[0], $colors[1]]; // Trắng, Đen
        $af1Sizes = [$sizes[1], $sizes[2]]; // 40, 41

        foreach ($af1Colors as $color) {
            foreach ($af1Sizes as $size) {
                // Giá bán 2.500.000đ
                $price = 2500000;
                $importQty = 50; // Nhập 50 đôi mỗi loại
                $importCost = 1500000; // Giá vốn 1.500.000đ

                // ĐÃ SỬA LỖI TIẾNG VIỆT Ở ĐÂY
                $colorSlug = Str::slug($color->name); // Sẽ biến 'Trắng' thành 'trang'
                $colorCode = strtoupper(substr($colorSlug, 0, 3)); // Biến 'trang' thành 'TRA'

                // Tạo SKU
                $variant = ProductVariant::create([
                    'product_id' => $product1->id,
                    'sku' => 'NK-AF1-' . $colorCode . '-' . $size->name, // Sẽ ra NK-AF1-TRA-40
                    'size_id' => $size->id,
                    'color_id' => $color->id,
                    'price' => $price,
                    'current_stock' => $importQty, 
                    'variant_image_url' => 'https://example.com/images/af1-' . $colorSlug . '.jpg', // Sẽ ra af1-trang.jpg
                ]);

                // Ghi vào Chi tiết phiếu nhập
                PurchaseOrderDetail::create([
                    'po_id' => $purchaseOrder->id,
                    'variant_id' => $variant->id,
                    'quantity_ordered' => $importQty,
                    'unit_cost' => $importCost,
                ]);

                // GHI LOG GIAO DỊCH KHO (Bắt buộc theo chuẩn Enterprise)
                InventoryTransaction::create([
                    'product_variant_id' => $variant->id,
                    'transaction_type' => 'IMPORT',
                    'reference_id' => $purchaseOrder->id,
                    'quantity_change' => $importQty, // Cộng 50
                    'note' => 'Nhập kho lần đầu từ PO: ' . $purchaseOrder->po_code,
                    'created_at' => now(),
                ]);

                $totalPoAmount += ($importQty * $importCost);
            }
        }

        // Cập nhật tổng tiền phiếu nhập
        $purchaseOrder->update(['total_amount' => $totalPoAmount]);
    }
}