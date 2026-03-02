<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InventoryTransaction;

class InventoryController extends Controller
{
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
            'variant.size'
        ])
        ->orderBy('created_at', 'desc')
        ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách lịch sử kho thành công',
            'data' => $transactions
        ]);
    }
}