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
    public function index()
    {
        return response()->json(['success' => true, 'data' => Branch::all()]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_main' => 'boolean',
        ]);

        // 🚀 BẢO MẬT: Nếu tạo Kho này là Kho Tổng, hãy hạ bệ các Kho Tổng cũ xuống thành Kho Phụ (Chỉ cho phép 1 Kho Tổng)
        if ($request->is_main) {
            Branch::where('is_main', true)->update(['is_main' => false]);
        }

        $branch = Branch::create($request->all());
        $variantIds = ProductVariant::pluck('id');
        $stockData = [];
        $now = now();
        
        foreach ($variantIds as $variantId) {
            $stockData[] = [
                'variant_id' => $variantId,
                'branch_id' => $branch->id,
                'stock' => 0, 
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($stockData)) {
            foreach (array_chunk($stockData, 500) as $chunk) {
                VariantBranchStock::insert($chunk);
            }
        }

        return response()->json(['success' => true, 'message' => 'Tạo chi nhánh thành công!', 'data' => $branch], 201);
    }

    public function show(Branch $branch)
    {
        return response()->json(['success' => true, 'data' => $branch]);
    }

    public function update(Request $request, Branch $branch)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_main' => 'boolean', // 🚀 ĐÃ BỔ SUNG ĐỂ NHẬN is_main
        ]);

        // 🚀 BẢO MẬT: Nếu sửa Kho này thành Kho Tổng, hạ bệ các kho khác
        if ($request->has('is_main') && $request->is_main) {
            Branch::where('id', '!=', $branch->id)->update(['is_main' => false]);
        }

        $branch->update($request->all());

        return response()->json(['success' => true, 'message' => 'Cập nhật thành công', 'data' => $branch]);
    }

    public function destroy(Branch $branch)
    {
        // 🚀 BẢO VỆ CHỐNG THẤT THOÁT TÀI SẢN KẾ TOÁN:
        $hasStock = VariantBranchStock::where('branch_id', $branch->id)->where('stock', '>', 0)->exists();
        
        if ($hasStock) {
            return response()->json([
                'success' => false,
                'message' => 'LỖI KẾ TOÁN: Không thể xóa chi nhánh đang còn tồn kho. Vui lòng CHUYỂN KHO toàn bộ hàng hóa sang chi nhánh khác trước khi xóa!'
            ], 400); // Trả về mã lỗi 400 (Bad Request) để Frontend hiện Toast Đỏ
        }

        $branch->delete();

        $maxId = Branch::max('id') ?? 0; 
        DB::statement("ALTER TABLE branches AUTO_INCREMENT = " . ($maxId + 1));

        return response()->json(['success' => true, 'message' => 'Đã xóa chi nhánh thành công']);
    }
}