<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\VariantBranchStock;
use App\Models\ProductImage;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductCatalogController extends Controller
{
    /**
     * Display a listing of products
     */
    public function index()
    {
        $products = Product::with(['brand', 'category', 'variants', 'images'])->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request)
    {
        // 1. Validate dữ liệu khắt khe
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'description' => 'nullable|string',
            'base_image' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg,avif|max:5120',// Cấm up file độc hại, tối đa 2MB
            'gallery_images' => 'nullable|array',
            'gallery_images.*' => 'file|mimes:jpeg,png,jpg,webp,gif,svg,avif|max:5120',
            'variants' => 'required|string', // Chuỗi JSON chứa danh sách biến thể (Màu, Size, Giá, Tồn kho)
            'branch_id' => 'required|exists:branches,id' // Chi nhánh nhập kho mặc định
        ]);

        DB::beginTransaction();
        try {
            // 2. Xử lý Upload Ảnh (Lưu vào thư mục ổ cứng server)
            $imageUrl = null;
            if ($request->hasFile('base_image')) {
                // Lưu vào storage/app/public/products
                $path = $request->file('base_image')->store('products', 'public');
                $imageUrl = asset('storage/' . $path);
            }

            

            // 3. Tạo Sản phẩm gốc
            $product = Product::create([
                'name' => $request->name,
                'slug' => Str::slug($request->name) . '-' . time(),
                'category_id' => $request->category_id,
                'brand_id' => $request->brand_id,
                'description' => $request->description,
                'base_image_url' => $imageUrl,
                'is_active' => true,
            ]);

            if ($request->hasFile('gallery_images')) {
                foreach ($request->file('gallery_images') as $index => $image) {
                    $galleryPath = $image->store('products/gallery', 'public');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => asset('storage/' . $galleryPath),
                        'sort_order' => $index, // Sắp xếp theo thứ tự up
                    ]);
                }
            }

            // 4. Giải mã JSON biến thể từ Frontend gửi lên và Lưu
            $variants = json_decode($request->variants, true);
            foreach ($variants as $v) {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'color_id' => $v['color_id'],
                    'size_id' => $v['size_id'],
                    'sku' => $v['sku'] ?? strtoupper(Str::random(8)),
                    'price' => $v['price'],
                ]);

                // 5. Khởi tạo tồn kho ban đầu cho chi nhánh
                VariantBranchStock::create([
                    'variant_id' => $variant->id,
                    'branch_id' => $request->branch_id,
                    'stock' => $v['stock'] ?? 0,
                ]);

                // 6. Ghi log nhập kho (Nghiệp vụ kế toán bắt buộc)
                if (($v['stock'] ?? 0) > 0) {
                    \App\Models\InventoryTransaction::create([
                        'product_variant_id' => $variant->id,
                        'transaction_type' => 'IMPORT',
                        'to_branch_id' => $request->branch_id,
                        'quantity_change' => $v['stock'],
                        'note' => 'Nhập kho khởi tạo sản phẩm mới.',
                        'created_at' => now(),
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Thêm sản phẩm thành công!', 'data' => $product]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified product
     */
    public function show(Product $product)
    {
        $product->load(['brand', 'category', 'variants.color', 'variants.size', 'variants.branchStocks.branch', 'images']);

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    // API Sửa (Cập nhật) Sản phẩm
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // 1. Validate dữ liệu (Tương tự lúc thêm, nhưng base_image không bắt buộc)
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'description' => 'nullable|string',
            'base_image' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg,avif|max:5120',
        ]);

        DB::beginTransaction();
        try {
            // 2. Cập nhật thông tin chữ (Text)
            $product->update([
                'name' => $request->name,
                'category_id' => $request->category_id,
                'brand_id' => $request->brand_id,
                'description' => $request->description,
            ]);

            // 3. Xử lý Ảnh Đại Diện: NẾU có up ảnh mới thì mới đè lên ảnh cũ
            if ($request->hasFile('base_image')) {
                $path = $request->file('base_image')->store('products', 'public');
                $product->base_image_url = asset('storage/' . $path);
                $product->save();
            }

            // 4. Cập nhật Giá cho các phân loại (Màu/Size)
            // Vì tồn kho là nghiệp vụ riêng, ở form Sửa này ta chỉ cho phép sửa Giá.
            if ($request->has('variants')) {
                $variants = json_decode($request->variants, true);
                foreach ($variants as $v) {
                    if (isset($v['id'])) {
                        // Tìm và update giá cho từng biến thể
                        ProductVariant::where('id', $v['id'])->update([
                            'price' => $v['price']
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json([
                'success' => true, 
                'message' => 'Tuyệt vời! Đã cập nhật sản phẩm thành công.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false, 
                'message' => 'Lỗi khi cập nhật: ' . $e->getMessage()
            ], 500);
        }
    }

    // API Xóa (Xóa mềm) Sản phẩm
    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);
            
            // Xóa mềm sản phẩm (Chỉ đánh dấu deleted_at nhờ SoftDeletes)
            $product->delete();
            
            // Xóa mềm luôn các biến thể (variants) của nó để khách không nhặt được vào giỏ
            ProductVariant::where('product_id', $id)->delete();

            return response()->json([
                'success' => true, 
                'message' => 'Đã đưa sản phẩm vào thùng rác an toàn!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Lỗi khi xóa: ' . $e->getMessage()
            ], 500);
        }
    }
}