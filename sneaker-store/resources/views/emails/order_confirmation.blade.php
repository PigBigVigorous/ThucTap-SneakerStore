<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận đơn hàng - SneakerStore</title>
    <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #444; background-color: #f4f7f9; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: #1a202c; color: #ffffff; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; letter-spacing: -0.5px; }
        .header p { margin: 10px 0 0; opacity: 0.8; font-size: 15px; }
        .content { padding: 40px 30px; }
        .greeting { margin-bottom: 30px; }
        .greeting p { font-size: 16px; line-height: 1.6; margin: 0 0 10px; }
        
        .section-card { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #edf2f7; }
        .section-title { font-size: 14px; font-weight: 800; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; display: block; }
        
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 6px 0; font-size: 15px; }
        .info-label { color: #718096; width: 130px; }
        .info-value { color: #2d3748; font-weight: 600; }

        .product-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .product-table th { text-align: left; font-size: 12px; font-weight: 700; color: #a0aec0; text-transform: uppercase; padding: 12px 10px; border-bottom: 2px solid #edf2f7; }
        .product-table td { padding: 16px 10px; border-bottom: 1px solid #edf2f7; }
        
        .product-name { font-size: 15px; font-weight: 700; color: #1a202c; margin-bottom: 4px; }
        .product-meta { font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; }
        
        .summary-row td { padding: 10px 10px; font-size: 14px; }
        .summary-label { color: #718096; text-align: right; }
        .summary-value { color: #2d3748; font-weight: 700; text-align: right; }
        .summary-discount { color: #e53e3e; }
        
        .total-box { background: #f0fff4; border-radius: 10px; margin-top: 15px; }
        .total-box td { padding: 20px 15px; }
        .total-label { font-size: 15px; font-weight: 800; color: #276749; text-align: right; }
        .total-price { font-size: 22px; font-weight: 900; color: #2f855a; text-align: right; }

        .btn-container { text-align: center; margin: 40px 0 20px; }
        .btn { background: #3182ce; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: background 0.2s; }
        
        .footer { padding: 30px; text-align: center; background: #f7fafc; color: #a0aec0; font-size: 13px; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Xác nhận đơn hàng</h1>
            <p>Mã đơn: {{ $order->order_tracking_code }}</p>
        </div>

        <div class="content">
            <div class="greeting">
                <p>Chào <strong>{{ $order->customer_name }}</strong>,</p>
                <p>Đơn hàng của bạn đã được tiếp nhận và đang được chuẩn bị. Dưới đây là thông tin chi tiết:</p>
            </div>

            <div class="section-card">
                <span class="section-title">📍 Thông tin giao nhận</span>
                <table class="info-table">
                    <tr><td class="info-label">Người nhận:</td><td class="info-value">{{ $order->customer_name }}</td></tr>
                    <tr><td class="info-label">Điện thoại:</td><td class="info-value">{{ $order->customer_phone }}</td></tr>
                    <tr><td class="info-label">Địa chỉ:</td><td class="info-value">{{ $order->address_detail }}, {{ $order->ward }}, {{ $order->district }}, {{ $order->province }}</td></tr>
                </table>
            </div>

            <div class="section-card" style="background: #fff; border: none; padding: 0;">
                <span class="section-title">🛍️ Chi tiết đơn hàng</span>
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th style="text-align: center; width: 40px;">SL</th>
                            <th style="text-align: right;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        @php $subtotal = 0; @endphp
                        @foreach($order->items as $item)
                            @php $subtotal += $item->unit_price * $item->quantity; @endphp
                            <tr>
                                <td>
                                    <div class="product-name">{{ $item->variant->product->name ?? 'Sản phẩm' }}</div>
                                    <div class="product-meta">
                                        {{ $item->variant->color->name ?? 'N/A' }} / {{ $item->variant->size->name ?? 'N/A' }}
                                    </div>
                                </td>
                                <td style="text-align: center; font-weight: 600; color: #4a5568;">{{ $item->quantity }}</td>
                                <td style="text-align: right; font-weight: 700; color: #2d3748;">
                                    {{ number_format($item->unit_price * $item->quantity, 0, ',', '.') }} ₫
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

                <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
                    <tr class="summary-row">
                        <td class="summary-label">Tổng tiền hàng</td>
                        <td class="summary-value">{{ number_format($subtotal, 0, ',', '.') }} ₫</td>
                    </tr>
                    @if($order->discount_amount > 0)
                    <tr class="summary-row">
                        <td class="summary-label">Voucher giảm giá</td>
                        <td class="summary-value summary-discount">-{{ number_format($order->discount_amount, 0, ',', '.') }} ₫</td>
                    </tr>
                    @endif
                    @if($order->points_used > 0)
                    <tr class="summary-row">
                        <td class="summary-label">Dùng {{ number_format($order->points_used) }} điểm</td>
                        <td class="summary-value summary-discount">-{{ number_format($order->points_used * 1000, 0, ',', '.') }} ₫</td>
                    </tr>
                    @endif
                    <tr class="summary-row">
                        <td class="summary-label">Phí vận chuyển</td>
                        <td class="summary-value">+{{ $formattedShipping }} ₫</td>
                    </tr>
                    <tr class="total-box">
                        <td class="total-label">TỔNG THANH TOÁN</td>
                        <td class="total-price">{{ $formattedTotal }} ₫</td>
                    </tr>
                </table>
            </div>

            <div class="btn-container">
                <a href="{{ env('FRONTEND_URL', 'http://localhost:3000') }}/user/purchase" class="btn">Theo dõi đơn hàng</a>
            </div>
        </div>

        <div class="footer">
            <p>Cảm ơn bạn đã mua sắm tại <strong>SneakerStore</strong></p>
            <p>Đây là email tự động, vui lòng không phản hồi email này.</p>
            <p style="margin-top: 15px; font-weight: 700; color: #4a5568;">Hotline: 1900 xxxx</p>
        </div>
    </div>
</body>
</html>
