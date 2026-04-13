<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Lấy dữ liệu báo cáo doanh thu nhóm theo Ngày/Tháng/Năm
     */
    public function getRevenueReport(Request $request)
    {
        $period = $request->query('period', 'day'); // day, month, year
        
        $query = Order::where('status', 'delivered');

        switch ($period) {
            case 'year':
                $groupBy = DB::raw("YEAR(created_at)");
                $select = DB::raw("YEAR(created_at) as date, SUM(total_amount) as total, COUNT(id) as order_count");
                break;
            case 'month':
                $groupBy = DB::raw("DATE_FORMAT(created_at, '%Y-%m')");
                $select = DB::raw("DATE_FORMAT(created_at, '%Y-%m') as date, SUM(total_amount) as total, COUNT(id) as order_count");
                break;
            default: // day
                $groupBy = DB::raw("DATE(created_at)");
                $select = DB::raw("DATE(created_at) as date, SUM(total_amount) as total, COUNT(id) as order_count");
                $query->where('created_at', '>=', now()->subDays(30)); // Mặc định lấy 30 ngày gần nhất cho biểu đồ ngày
                break;
        }

        $data = $query->select($select)
            ->groupBy($groupBy)
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Xuất file CSV báo cáo doanh thu chi tiết
     */
    public function exportRevenueCSV(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = Order::with(['user', 'items.variant.product', 'items.variant.size', 'items.variant.color', 'discount', 'salesChannel', 'branch'])
            ->where('status', 'delivered');

        if ($startDate) $query->where('created_at', '>=', $startDate);
        if ($endDate) $query->where('created_at', '<=', $endDate);

        // Tính tổng kết trước khi export (Query nhỏ hơn ko cần cursor)
        $summary = (clone $query)->selectRaw('SUM(total_amount) as total_revenue, COUNT(id) as total_orders, SUM(discount_amount) as total_discount')->first();

        $response = new StreamedResponse(function () use ($query, $summary) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for UTF-8

            // 1. Dòng thông tin chung (Để gọn trong 2 cột đầu cho đẹp Excel)
            fputcsv($handle, ['BÁO CÁO DOANH THU CHI TIẾT']);
            fputcsv($handle, ['Ngày xuất:', now()->format('d/m/Y H:i')]);
            fputcsv($handle, ['Tổng doanh thu:', number_format($summary->total_revenue, 0, ',', '.') . ' VNĐ']);
            fputcsv($handle, ['Tổng số đơn hàng:', $summary->total_orders]);
            fputcsv($handle, ['Tổng tiền đã giảm:', number_format($summary->total_discount, 0, ',', '.') . ' VNĐ']);
            fputcsv($handle, []); // Dòng trống

            // 2. Header bảng dữ liệu
            fputcsv($handle, [
                'STT',
                'Mã Đơn Hàng', 
                'Ngày Đặt', 
                'Khách Hàng', 
                'Email', 
                'Số Điện Thoại', 
                'Kênh Bán Hàng',
                'Chi Nhánh',
                'Chi Tiết Sản Phẩm',
                'Mã Giảm Giá',
                'Giảm Giá',
                'Phí Ship',
                'TỔNG TIỀN', 
                'PT Thanh Toán',
                'Trạng Thái TT',
                'Địa Chỉ Giao Hàng'
            ]);

            // 3. Dữ liệu chính (Sử dụng Cursor để tối ưu bộ nhớ)
            $stt = 1;
            foreach ($query->orderBy('created_at', 'desc')->cursor() as $order) {
                // Gom danh sách sản phẩm thành 1 chuỗi
                $productDetails = $order->items->map(function($item) {
                    $pName = $item->variant->product->name ?? 'N/A';
                    $size = $item->variant->size->name ?? '';
                    $color = $item->variant->color->name ?? '';
                    return "{$pName} [{$size}/{$color}] x{$item->quantity}";
                })->implode('; ');

                fputcsv($handle, [
                    $stt++,
                    $order->order_tracking_code,
                    $order->created_at->format('d/m/Y H:i'),
                    $order->customer_name ?? $order->user?->name,
                    $order->customer_email ?? $order->user?->email,
                    $order->customer_phone,
                    $order->salesChannel?->name ?? 'Khác',
                    $order->branch?->name ?? 'N/A',
                    $productDetails,
                    $order->discount?->code ?? 'Không có',
                    round($order->discount_amount),
                    round($order->shipping_fee ?? 0),
                    round($order->total_amount),
                    strtoupper($order->payment_method),
                    $order->payment_status ?? 'N/A',
                    $order->full_address // Sử dụng accessor mới
                ]);
            }

            fclose($handle);
        });

        $filename = "bao-cao-doanh-thu-sneaker-" . now()->format('Ymd-His') . ".csv";
        $response->headers->set('Content-Type', 'text/csv; charset=utf-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');

        return $response;
    }
}
