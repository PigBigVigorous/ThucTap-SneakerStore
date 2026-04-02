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
        $products = Product::with(['brand', 'category', 'variants', 'images'])->paginate(15);
        return response()->json(['success' => true, 'data' => $products]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'description' => 'nullable|string',
            'base_image' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg,avif|max:5120',
            'gallery_images' => 'nullable|array',
            'variants' => 'required|string', 
        ]);

        DB::beginTransaction();
        try {
            $imageUrl = null;
            if ($request->hasFile('base_image')) {
                $path = $request->file('base_image')->store('products', 'public');
                $imageUrl = asset('storage/' . $path);
            }

            // Tạo sản phẩm cha
            $product = Product::create([
                'name' => $request->name,
                'slug' => Str::slug($request->name) . '-' . time(),
                'category_id' => $request->category_id,
                'brand_id' => $request->brand_id,
                'description' => $request->description,
                'base_image_url' => $imageUrl,
                'is_active' => true,
            ]);

            // Xử lý ảnh Gallery lồng theo màu
            $galleryFiles = $request->file('gallery_images');
            if (!empty($galleryFiles)) {
                foreach ($galleryFiles as $colorId => $images) {
                    $validColorId = is_numeric($colorId) ? (int)$colorId : null;

                    // 🧹 THÊM DÒNG NÀY: Quét sạch ảnh cũ của màu này trước khi up ảnh mới để chống lặp 3 lần!
                        ProductImage::where('product_id', $product->id)
                                            ->where('color_id', $validColorId)
                                            ->delete();

                    foreach ($images as $index => $image) {
                        $galleryPath = $image->store('products/gallery', 'public');
                        ProductImage::create([
                            'product_id' => $product->id,
                            'color_id'   => $validColorId,
                            'image_url'  => asset('storage/' . $galleryPath),
                            'sort_order' => $index,
                        ]);
                    }
                }
            }

            // Rải kho cho TẤT CẢ chi nhánh
            $allBranches = Branch::pluck('id');
            $variants = json_decode($request->variants, true);
            $stockData = [];
            $now = now();

            foreach ($variants as $v) {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'color_id' => $v['color_id'],
                    'size_id' => $v['size_id'],
                    'sku' => $v['sku'] ?? strtoupper(Str::random(8)),
                    'price' => $v['price'],
                ]);

                foreach ($allBranches as $branchId) {
                    $stockData[] = [
                        'variant_id' => $variant->id,
                        'branch_id' => $branchId,
                        'stock' => 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            // Bulk insert tối ưu DB
            if (!empty($stockData)) {
                VariantBranchStock::insert($stockData);
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Thêm sản phẩm thành công!', 'data' => $product]);

        } catch (\Exception $e) {
            DB::rollBack();
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
        $product = Product::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'description' => 'nullable|string',
            'base_image' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg,avif|max:5120',
            'gallery_images' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            // Cập nhật text
            $product->update([
                'name' => $request->name,
                'category_id' => $request->category_id,
                'brand_id' => $request->brand_id,
                'description' => $request->description,
            ]);

            // Cập nhật ảnh đại diện
            if ($request->hasFile('base_image')) {
                $path = $request->file('base_image')->store('products', 'public');
                $product->base_image_url = asset('storage/' . $path);
                $product->save();
            }

            // Cập nhật ảnh Gallery (Hỗ trợ chia theo màu)
            $galleryFiles = $request->file('gallery_images');
            if (!empty($galleryFiles)) {
                foreach ($galleryFiles as $colorId => $images) {
                    foreach ($images as $index => $image) {
                        $galleryPath = $image->store('products/gallery', 'public');
                        ProductImage::create([
                            'product_id' => $product->id,
                            'color_id'   => is_numeric($colorId) ? (int)$colorId : null,
                            'image_url'  => asset('storage/' . $galleryPath),
                            'sort_order' => $index,
                        ]);
                    }
                }
            }

            // Cập nhật giá biến thể
            if ($request->has('variants')) {
                $variants = json_decode($request->variants, true);
                
                // Lấy danh sách ID các biến thể cũ đang có trong DB
                $existingVariantIds = $product->variants()->pluck('id')->toArray();
                $receivedVariantIds = []; // Mảng chứa các ID gửi lên từ Client

                $allBranches = Branch::pluck('id');
                $now = now();

                foreach ($variants as $v) {
                    if (isset($v['id'])) {
                        // 1. Nếu là biến thể CŨ -> Cập nhật thông tin
                        ProductVariant::where('id', $v['id'])->update([
                            'color_id' => $v['color_id'],
                            'size_id'  => $v['size_id'],
                            'price'    => $v['price']
                        ]);
                        $receivedVariantIds[] = $v['id'];
                    } else {
                        // 2. Nếu là biến thể MỚI (Ngài vừa bấm "Thêm màu Đỏ") -> Tạo mới
                        $newVariant = ProductVariant::create([
                            'product_id' => $product->id,
                            'color_id'   => $v['color_id'],
                            'size_id'    => $v['size_id'],
                            'sku'        => $v['sku'] ?? strtoupper(Str::random(8)),
                            'price'      => $v['price'],
                        ]);
                        $receivedVariantIds[] = $newVariant->id;

                        // Rải kho = 0 cho biến thể mới để không bị lỗi màn hình Tồn Kho
                        $stockData = [];
                        foreach ($allBranches as $branchId) {
                            $stockData[] = [
                                'variant_id' => $newVariant->id,
                                'branch_id'  => $branchId,
                                'stock'      => 0,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }
                        if (!empty($stockData)) {
                            VariantBranchStock::insert($stockData);
                        }
                    }
                }

                // 3. Xóa những biến thể mà ngài đã bấm nút (X) trên giao diện Admin
                $variantsToDelete = array_diff($existingVariantIds, $receivedVariantIds);
                if (!empty($variantsToDelete)) {
                    ProductVariant::whereIn('id', $variantsToDelete)->delete();
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Đã cập nhật sản phẩm thành công.']);

        } catch (\Exception $e) {
            DB::rollBack();
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