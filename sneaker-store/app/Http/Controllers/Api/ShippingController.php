<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ShippingService;

class ShippingController extends Controller
{
    protected $shippingService;

    public function __construct(ShippingService $shippingService)
    {
        $this->shippingService = $shippingService;
    }

    /**
     * Tham số: province, district, ward
     */
    public function calculateFee(Request $request)
    {
        $request->validate([
            'province' => 'required|string',
            'district' => 'required|string',
            'ward' => 'nullable|string',
        ]);

        try {
            $fee = $this->shippingService->calculateFee(
                $request->province,
                $request->district,
                $request->ward ?? ''
            );

            return response()->json([
                'success' => true,
                'shipping_fee' => $fee,
                'message' => 'Lấy phí vận chuyển thành công!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tính phí vận chuyển lúc này.'
            ], 500);
        }
    }
}
