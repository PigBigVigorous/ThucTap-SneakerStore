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
use App\Http\Requests\ProductStoreRequest;
use App\Http\Requests\ProductUpdateRequest;

class ProductCatalogController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with([
            'brand', 
            'category', 
            'variants.color',
            'variants.size',
            'images'
        ]);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('slug', 'LIKE', "%{$search}%")
                  ->orWhereHas('brand', function($bq) use ($search) {
                      $bq->where('name', 'LIKE', "%{$search}%");
                  })
                  ->orWhereHas('category', function($cq) use ($search) {
                      $cq->where('name', 'LIKE', "%{$search}%");
                  });
            });
        }

        $products = $query->paginate(30); // Tăng số lượng lên 30 cho admin dễ nhìn

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    public function store(ProductStoreRequest $request)
    {
        // Validate file ảnh thủ công vì Laravel không xử lý đúng nested file array trong FormRequest
        $fileError = $this->validateUploadedImages($request);
        if ($fileError) {
            return response()->json(['success' => false, 'message' => $fileError], 422);
        }

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
                    'color_id'   => $v['color_id'],
                    'size_id'    => $v['size_id'],
                    'sku'        => $v['sku'] ?? strtoupper(\Illuminate\Support\Str::random(8)),
                    'price'      => $v['price'],
                    'colorway_name' => $v['colorway_name'] ?? null, // 🎨 Tên phối màu
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

    public function update(ProductUpdateRequest $request, $id)
    {
        $product = \App\Models\Product::findOrFail($id);

        // Validate file ảnh thủ công vì Laravel không xử lý đúng nested file array trong FormRequest
        $fileError = $this->validateUploadedImages($request);
        if ($fileError) {
            return response()->json(['success' => false, 'message' => $fileError], 422);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Tự động cập nhật slug khi tên sản phẩm thay đổi
            $updateData = $request->only(['name', 'category_id', 'brand_id', 'description']);
            if (!empty($updateData['name']) && $updateData['name'] !== $product->name) {
                $updateData['slug'] = \Illuminate\Support\Str::slug($updateData['name']) . '-' . time();
            }
            $product->update($updateData);

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
                            'color_id'      => $v['color_id'],
                            'size_id'       => $v['size_id'],
                            'price'         => $v['price'],
                            'colorway_name' => $v['colorway_name'] ?? null, // 🎨 Cập nhật phối màu
                        ]);
                        $receivedVariantIds[] = $v['id'];
                    } else {
                        // NẾU LÀ BIẾN THỂ MỚI (Ví dụ: Thêm size 42)
                        $newVariant = \App\Models\ProductVariant::create([
                            'product_id'   => $product->id,
                            'color_id'     => $v['color_id'],
                            'size_id'      => $v['size_id'],
                            'sku'          => $v['sku'] ?? strtoupper(\Illuminate\Support\Str::random(8)),
                            'price'        => $v['price'],
                            'colorway_name'=> $v['colorway_name'] ?? null, // 🎨 Tên phối màu
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
            return response()->json([
                'success' => true,
                'message' => 'Đã cập nhật sản phẩm thành công.',
                'data' => ['slug' => $product->fresh()->slug] // Trả về slug mới để frontend redirect
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Lỗi khi cập nhật: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Toggle trạng thái kinh doanh (Đang bán <-> Ngừng bán).
     * PATCH /admin/products/{id}/toggle-status
     */
    public function toggleStatus($id)
    {
        try {
            $product = Product::findOrFail($id);
            $product->is_active = !$product->is_active;
            $product->save();

            $statusLabel = $product->is_active ? 'Đang bán' : 'Ngừng bán';

            return response()->json([
                'success'   => true,
                'is_active' => $product->is_active,
                'message'   => "Đã cập nhật trạng thái: {$statusLabel}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);
            $product->is_active = false;
            $product->save();
            
            return response()->json([
                'success' => true, 
                'message' => 'Đã tạm ngưng kinh doanh sản phẩm này (is_active = false)!'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Lỗi khi cập nhật trạng thái: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Validate file ảnh thủ công bằng PHP native (pathinfo + getimagesize).
     * Không dùng FormRequest vì PHP không convert đúng nested file array
     * (gallery_images[colorId][]) thành UploadedFile object cho các rule 'mimes'/'image'.
     *
     * @return string|null Error message hoặc null nếu hợp lệ
     */
    private function validateUploadedImages($request): ?string
    {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
        $maxSizeBytes = 5 * 1024 * 1024; // 5MB

        // Kiểm tra ảnh đại diện
        if ($request->hasFile('base_image')) {
            $file = $request->file('base_image');
            $ext = strtolower($file->getClientOriginalExtension());
            if (!in_array($ext, $allowedExtensions)) {
                return 'Ảnh đại diện chỉ chấp nhận định dạng: JPG, JPEG, PNG, WEBP, AVIF.';
            }
            if ($file->getSize() > $maxSizeBytes) {
                return 'Ảnh đại diện không được vượt quá 5MB.';
            }
        }

        // Kiểm tra gallery (nested: gallery_images[colorId][])
        $galleryFiles = $request->file('gallery_images');
        if (!empty($galleryFiles)) {
            foreach ($galleryFiles as $colorId => $images) {
                if (!is_array($images)) continue;
                foreach ($images as $index => $image) {
                    if (!$image) continue;
                    $ext = strtolower($image->getClientOriginalExtension());
                    if (!in_array($ext, $allowedExtensions)) {
                        return "Gallery ảnh (màu #{$colorId}, ảnh #{$index}) chỉ chấp nhận: JPG, JPEG, PNG, WEBP, AVIF.";
                    }
                    if ($image->getSize() > $maxSizeBytes) {
                        return "Gallery ảnh (màu #{$colorId}, ảnh #{$index}) không được vượt quá 5MB.";
                    }
                }
            }
        }

        return null; // Hợp lệ
    }
}