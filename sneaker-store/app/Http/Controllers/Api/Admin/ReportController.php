<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Shared\Date;

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
     * Xuất file Excel báo cáo doanh thu chi tiết
     */
    public function exportRevenueCSV(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = Order::with(['user', 'items.variant.product', 'items.variant.size', 'items.variant.color', 'discount', 'salesChannel', 'branch'])
            ->where('status', 'delivered');

        if ($startDate) {
            $query->where('created_at', '>=', $startDate . ' 00:00:00');
        }
        if ($endDate) {
            $query->where('created_at', '<=', $endDate . ' 23:59:59');
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 1. Heading
        $headings = [
            'Mã Đơn Hàng', 'Ngày Bán', 'Chi Nhánh', 'Kênh Bán', 
            'Tổng Tiền (VNĐ)', 'Giảm Giá (VNĐ)', 'Phí Ship (VNĐ)', 
            'Thành Tiền (VNĐ)', 'Trạng Thái Thanh Toán'
        ];
        
        $sheet->fromArray([$headings], NULL, 'A1');

        $sheet->getStyle('A1:I1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF4F46E5']],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        
        $sheet->freezePane('A2');

        // 2. Dữ liệu chính
        $row = 2;
        foreach ($query->orderBy('created_at', 'desc')->cursor() as $order) {
            $totalAmount = $order->total_amount;
            $discount = $order->discount_amount ?? 0;
            $shipping = $order->shipping_fee ?? 0;
            $subTotal = $totalAmount - $shipping + $discount;

            $sheet->fromArray([
                $order->order_tracking_code,
                Date::dateTimeToExcel($order->created_at),
                $order->branch?->name ?? 'N/A',
                $order->salesChannel?->name ?? 'Khác',
                $subTotal,
                $discount,
                $shipping,
                $totalAmount,
                ucfirst($order->payment_status ?? 'N/A'),
            ], NULL, 'A' . $row);
            
            $row++;
        }

        // 3. Định dạng cột
        if ($row > 2) {
            $sheet->getStyle('B2:B' . ($row - 1))->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_DATE_DDMMYYYY);
            $sheet->getStyle('E2:H' . ($row - 1))->getNumberFormat()->setFormatCode('#,##0');
        }

        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = "bao-cao-doanh-thu-sneaker-" . now()->format('Ymd-His') . ".xlsx";

        $response = new StreamedResponse(function() use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        });

        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $response->headers->set('Cache-Control', 'max-age=0');
        
        return $response;
    }
}
