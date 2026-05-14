<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use App\Models\ProductVariant;
use App\Models\VariantBranchStock;
use App\Http\Requests\BranchStoreRequest;
use App\Http\Requests\BranchUpdateRequest;
use Illuminate\Support\Facades\Cache;

class BranchController extends Controller
{
    public function index()
    {
        $branches = Cache::remember('branches_list', 300, function () {
            return Branch::all();
        });

        return response()->json(['success' => true, 'data' => $branches]);
    }

    public function store(BranchStoreRequest $request)
    {
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

        Cache::forget('branches_list');

        return response()->json(['success' => true, 'message' => 'Tạo chi nhánh thành công!', 'data' => $branch], 201);
    }

    public function show(Branch $branch)
    {
        return response()->json(['success' => true, 'data' => $branch]);
    }

    public function update(BranchUpdateRequest $request, Branch $branch)
    {
        if ($request->has('is_main') && $request->is_main) {
            Branch::where('id', '!=', $branch->id)->update(['is_main' => false]);
        }

        $branch->update($request->all());

        Cache::forget('branches_list');

        return response()->json(['success' => true, 'message' => 'Cập nhật thành công', 'data' => $branch]);
    }

    public function destroy(Branch $branch)
    {
        $hasStock = VariantBranchStock::where('branch_id', $branch->id)->where('stock', '>', 0)->exists();
        
        if ($hasStock) {
            return response()->json([
                'success' => false,
                'message' => 'LỖI KẾ TOÁN: Không thể xóa chi nhánh đang còn tồn kho. Vui lòng CHUYỂN KHO toàn bộ hàng hóa sang chi nhánh khác trước khi xóa!'
            ], 400); 
        }

        $branch->delete();

        Cache::forget('branches_list');

        return response()->json(['success' => true, 'message' => 'Đã xóa chi nhánh thành công']);
    }
}