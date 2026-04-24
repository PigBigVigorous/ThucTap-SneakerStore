<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PointTransaction;

class PointController extends Controller
{
    /**
     * Lấy danh sách giao dịch điểm của người dùng đang đăng nhập
     */
    public function index(Request $request)
    {
        $transactions = PointTransaction::where('user_id', $request->user()->id)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'current_points' => $request->user()->points,
                'transactions' => $transactions
            ]
        ]);
    }
}
