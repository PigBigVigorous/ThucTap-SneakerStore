<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use App\Models\ProductVariant;
use App\Models\VariantBranchStock;

class BranchController extends Controller
{
    /**
     * Display a listing of branches
     */
    public function index()
    {
        $branches = Branch::all();

        return response()->json([
            'success' => true,
            'data' => $branches
        ]);
    }

    /**
     * Store a newly created branch
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        // 1. Tạo chi nhánh mới
        $branch = Branch::create($request->all());

        // 2. Kéo tất cả ID của các biến thể sản phẩm hiện có trong hệ thống
        $variantIds = ProductVariant::pluck('id');

        // 3. Chuẩn bị mảng dữ liệu để insert hàng loạt (tối ưu hiệu suất)
        $stockData = [];
        $now = now();
        
        foreach ($variantIds as $variantId) {
            $stockData[] = [
                'variant_id' => $variantId,
                'branch_id' => $branch->id,
                'stock' => 0, // Khởi tạo tồn kho mặc định là 0
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 4. Insert vào bảng trung gian variant_branch_stocks
        if (!empty($stockData)) {
            // Sử dụng chunk(500) để chống lỗi sập DB nếu có quá nhiều sản phẩm
            foreach (array_chunk($stockData, 500) as $chunk) {
                VariantBranchStock::insert($chunk);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Tạo chi nhánh mới và khởi tạo mã tồn kho thành công!',
            'data' => $branch
        ], 201);
    }

    /**
     * Display the specified branch
     */
    public function show(Branch $branch)
    {
        return response()->json([
            'success' => true,
            'data' => $branch
        ]);
    }

    /**
     * Update the specified branch
     */
    public function update(Request $request, Branch $branch)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $branch->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Branch updated successfully',
            'data' => $branch
        ]);
    }

    /**
     * Remove the specified branch
     */
    public function destroy(Branch $branch)
    {
        // Khi xóa chi nhánh, các bản ghi trong variant_branch_stocks cũng sẽ tự động bị xóa 
        // nhờ tính năng ON DELETE CASCADE ngài đã cài đặt ở Database.
        $branch->delete();

        $maxId = Branch::max('id') ?? 0; // Lấy ID lớn nhất hiện tại (nếu hết sạch chi nhánh thì là 0)
        DB::statement("ALTER TABLE branches AUTO_INCREMENT = " . ($maxId + 1));

        return response()->json([
            'success' => true,
            'message' => 'Branch deleted successfully'
        ]);
    }
}