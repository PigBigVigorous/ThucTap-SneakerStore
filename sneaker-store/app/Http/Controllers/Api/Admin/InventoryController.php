<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InventoryTransaction;
use App\Services\InventoryService;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }
    /**
     * Xem lịch sử biến động kho (Dành cho Admin)
     * API: GET /api/admin/inventory/transactions
     */
    public function index()
    {
        // Lấy lịch sử giao dịch kho, kèm theo thông tin biến thể và tên sản phẩm
        // Sắp xếp từ mới nhất đến cũ nhất
        $transactions = InventoryTransaction::with([
            'variant.product', 
            'variant.color', 
            'variant.size',
            'variant.branchStocks',
            'fromBranch',
            'toBranch'
        ])
        ->orderBy('created_at', 'desc')
        ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách lịch sử kho thành công',
            'data' => $transactions
        ]);
    }

    /**
     * Transfer stock between branches
     * API: POST /api/admin/inventory/transfer
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'variant_id' => 'required|exists:product_variants,id',
            'from_branch_id' => 'required|exists:branches,id',
            'to_branch_id' => 'required|exists:branches,id|different:from_branch_id',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            $this->inventoryService->transferStock(
                $request->variant_id,
                $request->from_branch_id,
                $request->to_branch_id,
                $request->quantity,
                $request->note ?? 'Stock transfer'
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock transferred successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Adjust stock
     * API: POST /api/admin/inventory/adjust
     */
    public function adjust(Request $request)
    {
        $request->validate([
            'variant_id' => 'required|exists:product_variants,id',
            'branch_id' => 'required|exists:branches,id',
            'quantity_change' => 'required|integer',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            $this->inventoryService->adjustStock(
                $request->variant_id,
                $request->branch_id,
                $request->quantity_change,
                $request->note ?? 'Stock adjustment'
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock adjusted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
    /**
     * Lấy danh sách Tồn kho theo Chi nhánh
     */
    public function getStocks(Request $request)
    {
        $branchId = $request->query('branch_id');
        
        // Kéo dữ liệu Tồn kho, gộp luôn tên Giày, Màu, Size và Tên Kho để hiển thị
        $query = \App\Models\VariantBranchStock::with([
            'variant.product', 
            'variant.color', 
            'variant.size', 
            'branch'
        ]);

        // Nếu sếp có chọn lọc theo 1 kho cụ thể (VD: Chỉ xem kho Hà Nội)
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $stocks = $query->get();

        return response()->json([
            'success' => true,
            'data' => $stocks
        ]);
    }
}