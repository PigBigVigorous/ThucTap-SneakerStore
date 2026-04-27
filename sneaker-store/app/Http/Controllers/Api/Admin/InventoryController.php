<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InventoryTransaction;
use App\Services\InventoryService;
use App\Http\Requests\InventoryImportRequest;
use App\Http\Requests\InventoryTransferRequest;
use App\Http\Requests\InventoryAdjustRequest;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index(Request $request)
    {
        $query = InventoryTransaction::with([
            'variant.product', 'variant.color', 'variant.size',
            'variant.branchStocks', 'fromBranch', 'toBranch'
        ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->whereHas('variant.product', function($pq) use ($search) {
                    $pq->where('name', 'LIKE', "%{$search}%");
                })->orWhereHas('variant', function($vq) use ($search) {
                    $vq->where('sku', 'LIKE', "%{$search}%");
                });
            });
        }

        if ($request->filled('brand_id')) {
            $query->whereHas('variant.product', function($pq) use ($request) {
                $pq->where('brand_id', $request->input('brand_id'));
            });
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(30);

        return response()->json(['success' => true, 'message' => 'Lấy danh sách lịch sử kho thành công', 'data' => $transactions]);
    }

    // 🚀 ĐÂY LÀ HÀM IMPORT BỊ THIẾU, TÔI ĐÃ THÊM VÀO GIÚP BẠN
    public function import(InventoryImportRequest $request)
    {

        try {
            $this->inventoryService->importStock(
                $request->variant_id, 
                $request->branch_id, 
                $request->quantity, 
                $request->note ?? 'Nhập lô hàng mới'
            );
            return response()->json(['success' => true, 'message' => 'Đã nhập hàng thành công vào hệ thống']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function transfer(InventoryTransferRequest $request)
    {

        try {
            $this->inventoryService->transferStock($request->variant_id, $request->from_branch_id, $request->to_branch_id, $request->quantity, $request->note ?? 'Stock transfer');
            return response()->json(['success' => true, 'message' => 'Stock transferred successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function adjust(InventoryAdjustRequest $request)
    {

        try {
            $this->inventoryService->adjustStock($request->variant_id, $request->branch_id, $request->quantity_change, $request->note ?? 'Stock adjustment');
            return response()->json(['success' => true, 'message' => 'Stock adjusted successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function getStocks(Request $request)
    {
        $branchId = $request->query('branch_id');
        $search = $request->query('search');
        $brandId = $request->query('brand_id');
        
        // 🚀 SỬA LỖI UI CRASH: Chỉ lấy tồn kho của những Biến thể CHƯA BỊ XÓA (has('variant'))
        $query = \App\Models\VariantBranchStock::has('variant')->with([
            'variant.product', 
            'variant.color', 
            'variant.size', 
            'branch'
        ]);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($brandId) {
            $query->whereHas('variant.product', function($pq) use ($brandId) {
                $pq->where('brand_id', $brandId);
            });
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->whereHas('variant.product', function($pq) use ($search) {
                    $pq->where('name', 'LIKE', "%{$search}%");
                })->orWhereHas('variant', function($vq) use ($search) {
                    $vq->where('sku', 'LIKE', "%{$search}%");
                });
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }
}