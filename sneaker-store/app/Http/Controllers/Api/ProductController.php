<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;

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
            'images' // Load ảnh sản phẩm
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
}