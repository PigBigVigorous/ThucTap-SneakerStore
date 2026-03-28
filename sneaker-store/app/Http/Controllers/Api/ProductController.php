<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
// 🚨 THÊM CÁC MODEL NÀY ĐỂ XỬ LÝ MA TRẬN KHO
use App\Models\ProductVariant;
use App\Models\Branch;
use App\Models\VariantBranchStock;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    /**
     * Lấy danh sách sản phẩm (Có phân trang)
     * API: GET /api/products
     */
    public function index()
    {
        // Lấy các sản phẩm đang active, kèm theo thông tin Brand, Category và Số lượng Variants
        $products = Product::with(['brand', 'category', 'variants'])
            ->where('is_active', true)
            ->paginate(10); // Phân trang 10 sản phẩm/trang

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách sản phẩm thành công',
            'data' => $products
        ]);
    }

    /**
     * Lấy chi tiết 1 sản phẩm dựa vào Slug (Phục vụ SEO)
     * API: GET /api/products/{slug}
     */
    public function show($slug)
    {
        // Lấy chi tiết sản phẩm, load luôn thông tin Size và Color của từng Variant
        $product = Product::with([
            'brand', 
            'category', 
            'variants.size', // Load bảng Size qua Variant
            'variants.color', // Load bảng Color qua Variant
            'images', // Load ảnh sản phẩm
            'variants.branchStocks.branch' // Load luôn tồn kho ở các chi nhánh nếu cần
        ])
        ->where('slug', $slug)
        ->where('is_active', true)
        ->first();

        // Nếu không tìm thấy sản phẩm
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy sản phẩm'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết sản phẩm thành công',
            'data' => $product
        ]);
    }

    /**
     * 🚨 TẠO SẢN PHẨM MỚI (CHUẨN LOGIC ĐA CHI NHÁNH)
     * API: POST /api/products
     */
    public function store(Request $request)
    {
        // 1. Validate dữ liệu đầu vào
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:products,slug',
            'brand_id' => 'required|exists:brands,id',
            'category_id' => 'required|exists:categories,id',
            'variants' => 'required|array', // Phải truyền lên mảng các biến thể (Size, Màu)
            'variants.*.sku' => 'required|string|unique:product_variants,sku',
            'variants.*.size_id' => 'required|exists:sizes,id',
            'variants.*.color_id' => 'required|exists:colors,id',
            'variants.*.price' => 'required|numeric|min:0',
        ]);

        // Sử dụng Transaction để nếu lỗi ở đâu thì rollback lại toàn bộ (Không bị rác Database)
        DB::beginTransaction();
        try {
            // 2. Tạo thông tin Sản phẩm Gốc
            $product = Product::create($request->only([
                'name', 'slug', 'description', 'brand_id', 'category_id', 'base_image_url'
            ]));

            // 3. Kéo ID của tất cả Chi nhánh hiện có
            $branches = Branch::pluck('id');
            $stockData = [];
            $now = now();

            // 4. Vòng lặp: Lưu từng biến thể và chuẩn bị dữ liệu tồn kho
            foreach ($request->variants as $v) {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $v['sku'],
                    'size_id' => $v['size_id'],
                    'color_id' => $v['color_id'],
                    'price' => $v['price'],
                ]);

                // 🌟 ĐỈNH CAO Ở ĐÂY: Gắn Biến thể này vào tất cả Chi nhánh (Tồn kho = 0)
                foreach ($branches as $branchId) {
                    $stockData[] = [
                        'variant_id' => $variant->id,
                        'branch_id' => $branchId,
                        'stock' => 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            // 5. Chèn hàng loạt tồn kho vào bảng variant_branch_stocks
            if (!empty($stockData)) {
                foreach (array_chunk($stockData, 500) as $chunk) {
                    VariantBranchStock::insert($chunk);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo sản phẩm và rải mã tồn kho đa chi nhánh thành công!',
                'data' => $product->load('variants')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo sản phẩm: ' . $e->getMessage()
            ], 500);
        }
    }
}