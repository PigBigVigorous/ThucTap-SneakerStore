<?php

// app/Http/Controllers/Api/PaymentController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\OrderNotificationService;
use App\Models\Order;

class PaymentController extends Controller
{
    protected OrderNotificationService $notificationService;

    public function __construct(OrderNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function vnpayCallback(Request $request)
    {
        $vnp_HashSecret = env('VNP_HASH_SECRET');
        $inputData = array();
        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) == "vnp_") {
                $inputData[$key] = $value;
            }
        }

        $vnp_SecureHash = $inputData['vnp_SecureHash'];
        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);
        ksort($inputData);
        $i = 0;
        $hashData = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData = $hashData . '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashData = $hashData . urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($secureHash == $vnp_SecureHash) {
            $order = Order::where('order_tracking_code', $request->vnp_TxnRef)->first();

            if ($order) {
                if ($request->vnp_ResponseCode == '00') {
                    // Payment successful
                    $oldStatus = $order->payment_status;
                    $order->update([
                        'payment_status' => 'paid',
                        'transaction_id' => $request->vnp_TransactionNo,
                        'status' => 'processing' // Update order status to processing
                    ]);

                    // Send confirmation email asynchronously
                    $this->notificationService->sendOrderConfirmation($order);

                    Log::info('Payment successful and email queued', [
                        'order_id' => $order->id,
                        'tracking_code' => $order->order_tracking_code,
                        'amount' => $order->total_amount
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Thanh toán thành công! Email xác nhận sẽ được gửi trong giây lát.',
                        'order_tracking_code' => $order->order_tracking_code
                    ]);
                } else {
                    // Payment failed or cancelled
                    $order->update(['payment_status' => 'failed']);

                    Log::warning('Payment failed or cancelled', [
                        'order_id' => $order->id,
                        'tracking_code' => $order->order_tracking_code,
                        'response_code' => $request->vnp_ResponseCode
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Thanh toán thất bại hoặc đã bị hủy'
                    ]);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng'
            ]);
        } else {
            Log::error('Invalid VNPay signature', [
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Chữ ký không hợp lệ (Invalid Signature)'
            ]);
        }
    }
    public function vnpayIpn(Request $request)
    {
        try {
            $inputData = $request->all();
            $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';
            unset($inputData['vnp_SecureHash']);
            ksort($inputData);
            
            $hashData = "";
            $i = 0;
            foreach ($inputData as $key => $value) {
                if ($i == 1) {
                    $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
                } else {
                    $hashData .= urlencode($key) . "=" . urlencode($value);
                    $i = 1;
                }
            }

            $secureHash = hash_hmac('sha512', $hashData, env('VNP_HASH_SECRET'));

            // 1. Kiểm tra chữ ký
            if ($secureHash !== $vnp_SecureHash) {
                return response()->json(['RspCode' => '97', 'Message' => 'Invalid signature']);
            }

            // 2. Tìm đơn hàng
            $order = Order::where('order_tracking_code', $inputData['vnp_TxnRef'])->first();
            if (!$order) {
                return response()->json(['RspCode' => '01', 'Message' => 'Order not found']);
            }

            // 3. Kiểm tra số tiền (VNPAY gửi số tiền nhân 100)
            if (round($order->total_amount * 100) != $inputData['vnp_Amount']) {
                return response()->json(['RspCode' => '04', 'Message' => 'Invalid amount']);
            }

            // 4. Kiểm tra trạng thái đơn hàng (Tránh update nhiều lần - Idempotency)
            if ($order->payment_status !== 'pending') {
                return response()->json(['RspCode' => '02', 'Message' => 'Order already confirmed']);
            }

            // 5. Xử lý kết quả từ VNPAY
            if ($inputData['vnp_ResponseCode'] == '00') {
                $order->update([
                    'payment_status' => 'paid',
                    'transaction_id' => $inputData['vnp_TransactionNo']
                ]);
                // Có thể bắn thêm event gửi Mail tại đây
            } else {
                $order->update(['payment_status' => 'failed']);
            }

            return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);

        } catch (\Exception $e) {
            Log::error("VNPAY IPN Error: " . $e->getMessage());
            return response()->json(['RspCode' => '99', 'Message' => 'Unknow error']);
        }
    }
}
