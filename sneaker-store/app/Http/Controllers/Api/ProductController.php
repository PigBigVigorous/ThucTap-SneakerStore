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
        $products = Product::with(['brand', 'category', 'variants.branchStocks'])
            ->where('is_active', true)
            ->paginate(10); 

        $products->getCollection()->transform(function ($product) {
            foreach ($product->variants as $variant) {
                $variant->total_stock = $variant->branchStocks->sum('stock');
            }
            return $product;
        });

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
        
        $reviews = ProductReview::with('user:id,name') // Kéo theo tên người user
            ->where('product_id', $product->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'average_rating' => $reviews->avg('rating') ? round($reviews->avg('rating'), 1) : 0,
            'total_reviews' => $reviews->count()
        ]);
    }

    // 🚨 HÀM MỚI: Khách hàng Gửi đánh giá
    public function storeReview(Request $request, $slug)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000'
        ]);

        $product = Product::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        // Kiểm tra chống spam: Mỗi user chỉ đánh giá 1 lần / 1 sản phẩm
        $exists = ProductReview::where('product_id', $product->id)->where('user_id', $user->id)->exists();
        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Bạn đã đánh giá sản phẩm này rồi!'], 400);
        }

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
    }
}