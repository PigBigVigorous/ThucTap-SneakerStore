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
    public function index()
    {
        // 🚀 SỬA Ở ĐÂY: Bổ sung 'variants.color' và 'variants.size' vào hàm with() 
        // để Backend bốc kèm Tên Màu và Tên Size gửi lên cho Frontend!
        $products = Product::with([
            'brand', 
            'category', 
            'variants.color', // Thêm mới
            'variants.size',  // Thêm mới
            'images'
        ])->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'description' => 'nullable|string',
            'base_image' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
            'gallery_images' => 'nullable|array',
            'variants' => 'required|string', 
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $imageUrl = null;
            if ($request->hasFile('base_image')) {
                $path = $request->file('base_image')->store('products', 'public');
                $imageUrl = asset('storage/' . $path);
            }

            $product = \App\Models\Product::create([
                'name' => $request->name,
                'slug' => \Illuminate\Support\Str::slug($request->name) . '-' . time(),
                'category_id' => $request->category_id,
                'brand_id' => $request->brand_id,
                'description' => $request->description,
                'base_image_url' => $imageUrl,
                'is_active' => true,
            ]);

            $galleryFiles = $request->file('gallery_images');
            if (!empty($galleryFiles)) {
                foreach ($galleryFiles as $colorId => $images) {
                    $validColorId = is_numeric($colorId) ? (int)$colorId : null;
                    foreach ($images as $index => $image) {
                        $galleryPath = $image->store('products/gallery', 'public');
                        \App\Models\ProductImage::create([
                            'product_id' => $product->id,
                            'color_id'   => $validColorId,
                            'image_url'  => asset('storage/' . $galleryPath),
                            'sort_order' => $index,
                        ]);
                    }
                }
            }

            // 🚀 BẮT ĐẦU ĐỒNG BỘ TỒN KHO TỰ ĐỘNG KHI TẠO MỚI
            $allBranches = \App\Models\Branch::all();
            $mainBranch = $allBranches->where('is_main', true)->first() ?? $allBranches->first();
            $variants = json_decode($request->variants, true);
            $now = now();

            foreach ($variants as $v) {
                $variant = \App\Models\ProductVariant::create([
                    'product_id' => $product->id,
                    'color_id' => $v['color_id'],
                    'size_id' => $v['size_id'],
                    'sku' => $v['sku'] ?? strtoupper(\Illuminate\Support\Str::random(8)),
                    'price' => $v['price'],
                ]);

                // Lấy số lượng tồn kho đầu kỳ do Admin nhập trên giao diện
                $initialStock = isset($v['stock']) ? (int)$v['stock'] : 0;

                foreach ($allBranches as $branch) {
                    \App\Models\VariantBranchStock::create([
                        'variant_id' => $variant->id,
                        'branch_id'  => $branch->id,
                        // Nếu là Kho Tổng -> Gán số lượng đầu kỳ. Các kho khác = 0
                        'stock'      => ($branch->id === $mainBranch->id) ? $initialStock : 0, 
                    ]);
                }

                // Ghi vào Lịch sử biến động kho nếu có hàng
                if ($initialStock > 0 && $mainBranch) {
                    \App\Models\InventoryTransaction::create([
                        'product_variant_id' => $variant->id, // 🛑 SỬA LẠI KEY NÀY
                        'to_branch_id'       => $mainBranch->id, // 🛑 SỬA LẠI KEY NÀY
                        'transaction_type'   => 'IMPORT',
                        'quantity_change'    => $initialStock,
                        'note'               => 'Khởi tạo tồn kho ban đầu khi tạo sản phẩm'
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Thêm sản phẩm thành công!']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    public function show(Product $product)
    {
        $product->load(['brand', 'category', 'variants.color', 'variants.size', 'variants.branchStocks.branch', 'images']);
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function update(Request $request, $id)
    {
        $product = \App\Models\Product::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'description' => 'nullable|string',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $product->update($request->only(['name', 'category_id', 'brand_id', 'description']));

            if ($request->hasFile('base_image')) {
                $path = $request->file('base_image')->store('products', 'public');
                $product->base_image_url = asset('storage/' . $path);
                $product->save();
            }

            $galleryFiles = $request->file('gallery_images');
            if (!empty($galleryFiles)) {
                foreach ($galleryFiles as $colorId => $images) {
                    $validColorId = is_numeric($colorId) ? (int)$colorId : null;
                    \App\Models\ProductImage::where('product_id', $product->id)->where('color_id', $validColorId)->delete();
                    foreach ($images as $index => $image) {
                        $galleryPath = $image->store('products/gallery', 'public');
                        \App\Models\ProductImage::create(['product_id' => $product->id, 'color_id' => $validColorId, 'image_url' => asset('storage/' . $galleryPath), 'sort_order' => $index]);
                    }
                }
            }

            // 🚀 ĐỒNG BỘ TỒN KHO TỰ ĐỘNG KHI CẬP NHẬT BIẾN THỂ
            if ($request->has('variants')) {
                $variants = json_decode($request->variants, true);
                $existingVariantIds = $product->variants()->pluck('id')->toArray();
                $receivedVariantIds = []; 

                $allBranches = \App\Models\Branch::all();
                $mainBranch = $allBranches->where('is_main', true)->first() ?? $allBranches->first();
                $now = now();

                foreach ($variants as $v) {
                    if (isset($v['id'])) {
                        \App\Models\ProductVariant::where('id', $v['id'])->update([
                            'color_id' => $v['color_id'], 'size_id' => $v['size_id'], 'price' => $v['price']
                        ]);
                        $receivedVariantIds[] = $v['id'];
                    } else {
                        // NẾU LÀ BIẾN THỂ MỚI (Ví dụ: Thêm size 42)
                        $newVariant = \App\Models\ProductVariant::create([
                            'product_id' => $product->id, 'color_id' => $v['color_id'], 'size_id' => $v['size_id'], 'sku' => $v['sku'] ?? strtoupper(\Illuminate\Support\Str::random(8)), 'price' => $v['price'],
                        ]);
                        $receivedVariantIds[] = $newVariant->id;

                        // Lấy số lượng nhập ban đầu
                        $initialStock = isset($v['stock']) ? (int)$v['stock'] : 0;

                        foreach ($allBranches as $branch) {
                            \App\Models\VariantBranchStock::create([
                                'variant_id' => $newVariant->id, 'branch_id' => $branch->id,
                                'stock' => ($branch->id === $mainBranch->id) ? $initialStock : 0, 
                            ]);
                        }

                        if ($initialStock > 0 && $mainBranch) {
                            \App\Models\InventoryTransaction::create([
                                'product_variant_id' => $newVariant->id, // 🛑 SỬA LẠI KEY NÀY
                                'to_branch_id'       => $mainBranch->id, // 🛑 SỬA LẠI KEY NÀY
                                'transaction_type'   => 'IMPORT',
                                'quantity_change'    => $initialStock,
                                'note'               => 'Khởi tạo tồn kho ban đầu khi bổ sung Size/Màu'
                            ]);
                        }
                    }
                }

                $variantsToDelete = array_diff($existingVariantIds, $receivedVariantIds);
                if (!empty($variantsToDelete)) {
                    \App\Models\ProductVariant::whereIn('id', $variantsToDelete)->delete();
                }
            }

            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['success' => true, 'message' => 'Đã cập nhật sản phẩm thành công.']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Lỗi khi cập nhật: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);
            $product->delete();
            ProductVariant::where('product_id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Đã đưa sản phẩm vào thùng rác!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Lỗi khi xóa: ' . $e->getMessage()], 500);
        }
    }
}