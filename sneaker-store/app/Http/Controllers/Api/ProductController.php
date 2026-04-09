<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductReview; // 🚨 Khai báo Model Review

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with([
            'brand', 
            'category', 
            // Load các variants và yêu cầu CSDL tự tính tổng sum cột 'stock' của bảng branch_stocks
            'variants' => function($query) {
                $query->withSum('branchStocks as total_stock', 'stock');
            }
        ])
        ->where('is_active', true)
        ->paginate(10); 

        // Không cần $products->getCollection()->transform(...) nữa.
        // Laravel sẽ trả về property "total_stock" tự động do query withSum.

        return response()->json(['success' => true, 'data' => $products]);
    }

    public function show($slug)
    {
        $product = Product::with([
            'brand', 'category', 'variants.size', 'variants.color', 'images', 'variants.branchStocks.branch'
        ])->where('slug', $slug)->where('is_active', true)->first();

        if (!$product) return response()->json(['success' => false, 'message' => 'Không tìm thấy sản phẩm'], 404);

        foreach ($product->variants as $variant) {
            $variant->total_stock = $variant->branchStocks->sum('stock');
        }

        return response()->json(['success' => true, 'data' => $product]);
    }

    // 🚨 HÀM MỚI: Lấy danh sách đánh giá
    public function getReviews($slug)
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        
        // Tránh tải toàn bộ db lên RAM
        $reviews = ProductReview::with('user:id,name')
            ->where('product_id', $product->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10); // Lấy 10 đánh giá mỗi trang

        // Bắt buộc query độc lập vì paginate() sẽ làm xáo trộn phép tính AVG 
        $aggregates = ProductReview::where('product_id', $product->id)
            ->selectRaw('COUNT(id) as total, AVG(rating) as average')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $reviews, // Dữ liệu trả về sẽ bao gồm "data", "current_page", "next_page_url"...
            'average_rating' => $aggregates->average ? round($aggregates->average, 1) : 0,
            'total_reviews' => $aggregates->total ?? 0
        ]);
    }

    // 🚨 HÀM MỚI: Khách hàng Gửi đánh giá
    public function storeReview(\App\Http\Requests\ReviewStoreRequest $request, $slug)
    {

        $product = Product::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        try {
            // Không cần check exists nữa, đẩy thẳng vào DB. Nếu trùng tự quăng Exception
            $review = ProductReview::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cảm ơn bạn đã gửi đánh giá!',
                'data' => $review->load('user:id,name')
            ]);
            
        } catch (\Illuminate\Database\QueryException $e) {
            // Lỗi 23000 là mã lỗi Integrity constraint violation (trùng duplicate key) của MySQL
            if ($e->getCode() == 23000) {
                return response()->json(['success' => false, 'message' => 'Bạn đã đánh giá sản phẩm này rồi!'], 400);
            }
            throw $e;
        }
    }
}