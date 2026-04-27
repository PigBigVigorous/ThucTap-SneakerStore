<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\ProductVariant;

class ProductController extends Controller
{
    /**
     * Trả về min/max giá thực tế + các khoảng giá phân phối đều
     * để frontend xây range slider và preset chính xác.
     */
    public function priceRange()
    {
        $min = (float) ProductVariant::min('price') ?: 0;
        $max = (float) ProductVariant::max('price') ?: 0;

        // Làm tròn đẹp: floor min xuống 100k, ceil max lên 100k
        $minFloor = floor($min / 100_000) * 100_000;
        $maxCeil  = ceil($max  / 100_000) * 100_000;

        // 🚨 TRƯỜNG HỢP ĐẶC BIỆT: Giá bằng nhau (Tránh lỗi chia 0 ở range slider)
        if ($minFloor === $maxCeil) {
            $minFloor = max(0, $minFloor - 2000000);
            $maxCeil  = $maxCeil + 2000000;
        }

        // Tự sinh 4–5 khoảng preset phân phối đều theo dải giá thực
        $span     = $maxCeil - $minFloor;
        $step     = $span > 0 ? ceil($span / 4 / 100_000) * 100_000 : 1_000_000;
        $buckets  = [];
        $cur      = $minFloor;
        while ($cur < $maxCeil) {
            $next = min($cur + $step, $maxCeil);
            $buckets[] = ['min' => $cur, 'max' => $next];
            $cur = $next;
        }

        return response()->json([
            'success'    => true,
            'data'       => [
                'min'     => $minFloor,
                'max'     => $maxCeil,
                'buckets' => $buckets,
            ],
        ]);
    }

    public function index(Request $request)
    {
        $query = Product::with([
            'brand',
            'category',
            'variants' => function ($q) {
                $q->with('color')->withSum('branchStocks as total_stock', 'stock');
            },
        ])->where('is_active', true);

        // ── Lọc theo danh mục (slug) ──────────────────────────────────
        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) =>
                $q->where('slug', $request->category)
            );
        }

        // ── Lọc theo thương hiệu (tên) ────────────────────────────────
        if ($request->filled('brand')) {
            // Hỗ trợ nhiều brand cách nhau dấu phẩy: "Nike,Adidas"
            $brands = array_filter(array_map('trim', explode(',', $request->brand)));
            if (count($brands) === 1) {
                $query->whereHas('brand', fn ($q) =>
                    $q->where('name', $brands[0])
                );
            } elseif (count($brands) > 1) {
                $query->whereHas('brand', fn ($q) =>
                    $q->whereIn('name', $brands)
                );
            }
        }

        // ── Tìm kiếm theo tên sản phẩm ───────────────────────────────
        if ($request->filled('search')) {
            $kw = '%' . $request->search . '%';
            $query->where(fn ($q) =>
                $q->where('name', 'like', $kw)
                  ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', $kw))
            );
        }

        // ── Lọc giá (qua bảng variants) ──────────────────────────────
        if ($request->filled('price_min') || $request->filled('price_max')) {
            $query->whereHas('variants', function ($q) use ($request) {
                if ($request->filled('price_min')) {
                    $q->where('price', '>=', (float) $request->price_min);
                }
                if ($request->filled('price_max')) {
                    $q->where('price', '<=', (float) $request->price_max);
                }
            });
        }

        // ── Sắp xếp ──────────────────────────────────────────────────
        switch ($request->input('sort_by', 'newest')) {
            case 'price_asc':
                // Sắp theo giá variant thấp nhất của mỗi sản phẩm
                $query->orderByRaw('(SELECT MIN(price) FROM product_variants WHERE product_id = products.id) ASC');
                break;
            case 'price_desc':
                $query->orderByRaw('(SELECT MIN(price) FROM product_variants WHERE product_id = products.id) DESC');
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            default: // newest
                $query->latest();
                break;
        }

        $perPage = min((int) $request->input('per_page', 20), 48);
        $products = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $products]);
    }

    public function show($slug)
    {
        $product = Product::with([
            'brand',
            'category.parent',   // Load thêm danh mục cha cho breadcrumb
            'variants.size', 'variants.color', 'images', 'variants.branchStocks.branch',
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

    // 🚨 HÀM MỚI: Sản phẩm liên quan (cùng brand hoặc category)
    public function getRelated($slug)
    {
        $product = Product::where('slug', $slug)->where('is_active', true)->firstOrFail();

        // Ưu tiên cùng brand, fallback cùng category nếu không đủ
        $related = Product::with([
                'brand',
                'category',
                'variants' => fn($q) => $q->with('color')->withSum('branchStocks as total_stock', 'stock'),
            ])
            ->where('is_active', true)
            ->where('id', '!=', $product->id)
            ->where(function ($q) use ($product) {
                $q->where('brand_id', $product->brand_id)
                  ->orWhere('category_id', $product->category_id);
            })
            ->inRandomOrder()
            ->limit(8)
            ->get();

        return response()->json(['success' => true, 'data' => $related]);
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