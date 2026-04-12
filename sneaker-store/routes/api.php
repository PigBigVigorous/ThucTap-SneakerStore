<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\PosController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\ProductCatalogController;
use App\Http\Controllers\Api\Admin\BranchController;
use App\Models\Order;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\DiscountController;
use Illuminate\Support\Facades\DB;

//Route của khách hàng chưa đăng nhập
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/products', [ProductController::class, 'index']);
// ⚠️ Route tĩnh PHẢI đặt TRƯỚC route có tham số động {slug}
Route::get('/products/price-range', [ProductController::class, 'priceRange']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{tracking_code}', [OrderController::class, 'show']);
Route::post('/discounts/apply', [DiscountController::class, 'apply']);
Route::get('/payment/vnpay-ipn', [App\Http\Controllers\Api\PaymentController::class, 'vnpayIpn']);
Route::get('/payment/vnpay-callback', [PaymentController::class, 'vnpayCallback']);
// 1. Khách vãng lai cũng xem được Đánh giá (Để chung với route xem sản phẩm public)
Route::get('/products/{slug}/reviews', [ProductController::class, 'getReviews']);
// 2. Sản phẩm liên quan (public)
Route::get('/products/{slug}/related', [ProductController::class, 'getRelated']);



// Master data: Màu sắc & Size & Danh mục (public, không cần auth - để admin form dùng)
Route::get('/colors', function () {
    $colors = \App\Models\Color::orderBy('id')->get(['id', 'name', 'hex_code']);
    return response()->json(['success' => true, 'data' => $colors]);
});
Route::get('/sizes', function () {
    $sizes = \App\Models\Size::orderBy('id')->get(['id', 'name']);
    return response()->json(['success' => true, 'data' => $sizes]);
});
// Public: Danh mục (cho MegaMenu frontend)
Route::get('/categories', function () {
    $categories = \App\Models\Category::with(['children' => function ($q) {
        $q->select('id', 'name', 'slug', 'parent_id')->orderBy('id');
    }])->whereNull('parent_id')->orderBy('id')->get(['id', 'name', 'slug', 'parent_id']);
    return response()->json(['success' => true, 'data' => $categories]);
});
// Public: Thương hiệu (cho MegaMenu frontend)
Route::get('/brands', function () {
    $brands = \App\Models\Brand::orderBy('name')->get(['id', 'name', 'description', 'logo_url']);
    return response()->json(['success' => true, 'data' => $brands]);
});
// Admin tạo màu mới (cần auth)
Route::middleware(['auth:sanctum', 'permission:manage-products,sanctum'])->group(function () {
    Route::post('/colors', function (\Illuminate\Http\Request $request) {
        $request->validate(['name' => 'required|string|max:100|unique:colors,name']);
        $color = \App\Models\Color::create([
            'name'     => $request->name,
            'hex_code' => $request->hex_code ?? null,
        ]);
        return response()->json(['success' => true, 'data' => $color], 201);
    });
});

Route::get('/provinces', function () {
    $provinces = DB::table('provinces')->select('name', 'code')->get();
    return response()->json([
        'success' => true, 
        'data' => $provinces]);
});
Route::get('/districts/{province_code}', function ($province_code) {
    $districts = DB::table('districts')->where('province_code', $province_code)->select('name', 'code', 'province_code')->get();
    return response()->json([
        'success' => true, 
        'data' => $districts]);
});
Route::get('/wards/{district_code}', function ($district_code) {
    $wards = DB::table('wards')->where('district_code', $district_code)->select('name', 'code', 'district_code')->get();
    return response()->json([
        'success' => true, 
        'data' => $wards]);
});

// 2. Phải đăng nhập mới được viết Đánh giá (Bỏ vào trong nhóm auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/products/{slug}/reviews', [ProductController::class, 'storeReview']);
});

// Route của khách hang đã đăng nhập
Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/my-orders', [OrderController::class, 'myOrders']);

    Route::get('/user', function (Request $request) {
        $user = $request->user();
        
        $user->load('roles');
        $user->setRelation('permissions', $user->getAllPermissions()); 
        
        return response()->json(['success' => true, 'data' => $user]);
    });

    // Routes for admin
    Route::prefix('admin')->group(function () {



        Route::middleware(['permission:view-dashboard,sanctum'])->group(function () {
            Route::get('/statistics', function () {
                $totalRevenue = Order::where('status', 'delivered')->sum('total_amount');
                $totalOrders = Order::where('status', 'delivered')->count();
                $pendingOrders = Order::where('status', 'pending')->count();
                // 4. Lấy data từ Database (có thể bị khuyết ngày nếu ko có đơn)
                $rawRevenueData = Order::where('status', 'delivered')
                    ->where('created_at', '>=', now()->subDays(6)->startOfDay()) // Lấy tròn 7 ngày tính cả hôm nay
                    ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total')
                    ->groupBy('date')
                    ->pluck('total', 'date');
                // 5. THUẬT TOÁN TRÁM NGÀY TRỐNG: Chủ động tạo mảng 7 ngày
                $revenueByDay = [];
                for ($i = 6; $i >= 0; $i--) {
                    $dateString = now()->subDays($i)->format('Y-m-d');
                    $revenueByDay[] = [
                        'date' => $dateString,
                        'total' => isset($rawRevenueData[$dateString]) ? (float) $rawRevenueData[$dateString] : 0
                    ];
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'totalRevenue' => (float) $totalRevenue,
                        'totalOrders' => (int) $totalOrders,
                        'pendingOrders' => (int) $pendingOrders,
                        'revenueByDay' => $revenueByDay
                    ]
                ]);
            });
        });
        // 1. CHUNG: Trả về danh sách chi nhánh (để đổ vào dropdown kho/chi nhánh)
        // Các quyền: quản lý kho, quản lý sản phẩm, hoặc thu ngân đều cần được đọc
        Route::middleware(['permission:manage-inventory|manage-products|pos-sale,sanctum'])->group(function () {
            Route::get('/branches', [BranchController::class, 'index']);
        });

        // 1.1 CHUNG 2: Các thao tác sửa, thêm, xoá chi nhánh dành cho quản trị kho / sản phẩm
        Route::middleware(['permission:manage-inventory|manage-products,sanctum'])->group(function () {
            Route::apiResource('branches', BranchController::class)->except(['index']);
        });

        // Thủ kho
        Route::middleware(['permission:manage-inventory,sanctum'])->group(function () {
            Route::get('/inventory/stocks', [InventoryController::class, 'getStocks']);
            Route::get('/inventory/transactions', [InventoryController::class, 'index']);
            Route::post('/inventory/import', [InventoryController::class, 'import']); // Nhập hàng từ NCC
            Route::post('/inventory/transfer', [InventoryController::class, 'transfer']);
            Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
        });
        // quản lý sản phẩm
        Route::middleware(['permission:manage-products,sanctum'])->group(function () {
            Route::get('/products', [ProductCatalogController::class, 'index']);
            Route::post('/products', [ProductCatalogController::class, 'store']);
            Route::post('/products/{id}', [ProductCatalogController::class, 'update']);
            Route::delete('/products/{id}', [ProductCatalogController::class, 'destroy']);

            // quản lý danh mục
            Route::get('/categories', function () {
                $categories = \App\Models\Category::with('children')->orderBy('id')->get(['id', 'name', 'slug', 'parent_id']);
                return response()->json(['success' => true, 'data' => $categories]);
            });
            Route::post('/categories', function (\Illuminate\Http\Request $request) {
                // Tên danh mục chỉ cần duy nhất trong cùng danh mục cha
                // VD: "Giày Chạy Bộ" có thể tồn tại dưới cả "Giày Nam" lẫn "Giày Nữ"
                $parentId = $request->input('parent_id'); // null = danh mục gốc

                $request->validate([
                    'name'      => [
                        'required', 'string', 'max:100',
                        \Illuminate\Validation\Rule::unique('categories', 'name')
                            ->where(fn ($q) => $parentId
                                ? $q->where('parent_id', $parentId)
                                : $q->whereNull('parent_id')
                            ),
                    ],
                    'parent_id' => 'nullable|exists:categories,id',
                ]);

                $category = \App\Models\Category::create([
                    'name'      => $request->name,
                    'parent_id' => $parentId ?? null,
                ]);
                return response()->json(['success' => true, 'data' => $category], 201);
            });

            Route::delete('/categories/{id}', function ($id) {
                $category = \App\Models\Category::findOrFail($id);
                // Gán lại danh mục con về null trước khi xóa
                \App\Models\Category::where('parent_id', $id)->update(['parent_id' => null]);
                $category->delete();
                return response()->json(['success' => true, 'message' => 'Đã xóa danh mục!']);
            });

            // quản lý thương hiệu
            Route::get('/brands', function () {
                $brands = \App\Models\Brand::withCount('products')->orderBy('name')->get(['id', 'name', 'description', 'logo_url']);
                return response()->json(['success' => true, 'data' => $brands]);
            });
            Route::post('/brands', function (\Illuminate\Http\Request $request) {
                $request->validate([
                    'name'        => 'required|string|max:100|unique:brands,name',
                    'description' => 'nullable|string|max:500',
                    'logo_url'    => 'nullable|url|max:500',
                ]);
                $brand = \App\Models\Brand::create([
                    'name'        => $request->name,
                    'description' => $request->description ?? null,
                    'logo_url'    => $request->logo_url ?? null,
                ]);
                return response()->json(['success' => true, 'data' => $brand], 201);
            });
            Route::put('/brands/{id}', function (\Illuminate\Http\Request $request, $id) {
                $brand = \App\Models\Brand::findOrFail($id);
                $request->validate([
                    'name'        => 'required|string|max:100|unique:brands,name,' . $id,
                    'description' => 'nullable|string|max:500',
                    'logo_url'    => 'nullable|url|max:500',
                ]);
                $brand->update([
                    'name'        => $request->name,
                    'description' => $request->description ?? $brand->description,
                    'logo_url'    => $request->logo_url ?? $brand->logo_url,
                ]);
                return response()->json(['success' => true, 'data' => $brand]);
            });
            Route::delete('/brands/{id}', function ($id) {
                $brand = \App\Models\Brand::findOrFail($id);
                $productCount = $brand->products()->count();
                if ($productCount > 0) {
                    return response()->json(['success' => false, 'message' => "Không thể xóa! Thương hiệu đang có {$productCount} sản phẩm."], 422);
                }
                $brand->delete();
                return response()->json(['success' => true, 'message' => 'Đã xóa thương hiệu!']);
            });
        });
        // quản lý đơn hàng
        Route::middleware(['permission:manage-orders,sanctum'])->group(function () {
            Route::get('/orders', [AdminOrderController::class, 'index']);
            Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
        });

        // Quản lý mã giảm giá (CHỈ SUPER-ADMIN)
        Route::middleware(['role:super-admin,sanctum'])->group(function () {
            Route::apiResource('discounts', DiscountController::class);
        });

        // POS bán tại quầy
        Route::middleware(['permission:pos-sale,sanctum'])->group(function () {
            Route::get('/pos/products', [PosController::class, 'getProducts']);
            Route::post('/pos/orders', [PosController::class, 'placeOrder']);
        });
    });
});