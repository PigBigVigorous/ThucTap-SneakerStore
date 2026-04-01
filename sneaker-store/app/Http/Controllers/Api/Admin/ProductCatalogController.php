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
        // 1. BỎ validate branch_id vì ta không cần nó nữa
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'description' => 'nullable|string',
            'base_image' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg,avif|max:5120',
            'gallery_images' => 'nullable|array',
            'gallery_images.*' => 'file|mimes:jpeg,png,jpg,webp,gif,svg,avif|max:5120',
            'variants' => 'required|string', 
        ]);

        DB::beginTransaction();
        try {
            $imageUrl = null;
            if ($request->hasFile('base_image')) {
                $path = $request->file('base_image')->store('products', 'public');
                $imageUrl = asset('storage/' . $path);
            }

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
                // Laravel tự động gom nhóm mảng file thành dạng: [ '1' => [file1, file2], '2' => [file3] ]
                $galleryImagesByColor = $request->file('gallery_images');
                
                foreach ($galleryImagesByColor as $colorId => $images) {
                    foreach ($images as $index => $image) {
                        $galleryPath = $image->store('products/gallery', 'public');
                        ProductImage::create([
                            'product_id' => $product->id,
                            'color_id'   => $colorId, // 🔑 Gắn color_id tương ứng vào đây
                            'image_url'  => asset('storage/' . $galleryPath),
                            'sort_order' => $index, 
                        ]);
                    }
                }
            }

            // 🚨 LẤY TẤT CẢ CHI NHÁNH ĐỂ RẢI KHO = 0
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

                // Rải kho = 0 cho biến thể này ở TẤT CẢ chi nhánh
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

            // Chèn hàng loạt tồn kho 1 lần cho tối ưu hiệu suất
            if (!empty($stockData)) {
                VariantBranchStock::insert($stockData);
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Thêm sản phẩm và rải mã kho thành công!', 'data' => $product]);

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
        // ĐẶT BẪY LOG Ở ĐÂY
        \Illuminate\Support\Facades\Log::info('--- BẮT ĐẦU TEST UPLOAD ẢNH ---');
        \Illuminate\Support\Facades\Log::info('Dữ liệu Files nhận được: ', $request->allFiles());
        \Illuminate\Support\Facades\Log::info('Dữ liệu chữ nhận được: ', $request->all());

        $product = Product::findOrFail($id);

        // 1. Validate dữ liệu
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'description' => 'nullable|string',
            'base_image' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif,svg,avif|max:5120',
            // Thêm validate cho mảng gallery
            'gallery_images' => 'nullable|array',
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

            // 3. Xử lý Ảnh Đại Diện
            if ($request->hasFile('base_image')) {
                $path = $request->file('base_image')->store('products', 'public');
                $product->base_image_url = asset('storage/' . $path);
                $product->save();
            }

            // 4. 🚀 [VÁ LỖI Ở ĐÂY] - BẮT VÀ LƯU ẢNH GALLERY KHI CẬP NHẬT
            if ($request->hasFile('gallery_images')) {
                $galleryFiles = $request->file('gallery_images');

                // Kiểm tra xem frontend đang gửi dạng mảng phân màu hay mảng phẳng chung
                $isNested = is_array(reset($galleryFiles));

                if ($isNested) {
                    // Xử lý nếu Frontend gửi ảnh theo từng Color ID (Phương án Tối ưu nhất)
                    foreach ($galleryFiles as $colorId => $images) {
                        foreach ($images as $index => $image) {
                            $galleryPath = $image->store('products/gallery', 'public');
                            ProductImage::create([
                                'product_id' => $product->id,
                                'color_id'   => $colorId,
                                'image_url'  => asset('storage/' . $galleryPath),
                                'sort_order' => $index, 
                            ]);
                        }
                    }
                } else {
                    // Xử lý nếu Frontend gửi ảnh chung 1 cục (Code cũ của bạn)
                    foreach ($galleryFiles as $index => $image) {
                        $galleryPath = $image->store('products/gallery', 'public');
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image_url'  => asset('storage/' . $galleryPath),
                            'sort_order' => $index, 
                        ]);
                    }
                }
            }

            // 5. Cập nhật Giá cho các phân loại (Màu/Size)
            if ($request->has('variants')) {
                $variants = json_decode($request->variants, true);
                foreach ($variants as $v) {
                    if (isset($v['id'])) {
                        ProductVariant::where('id', $v['id'])->update([
                            'price' => $v['price']
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json([
                'success' => true, 
                'message' => 'Tuyệt vời! Đã cập nhật sản phẩm và ảnh Gallery thành công.'
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