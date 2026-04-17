<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận đơn hàng - SneakerShop</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #374151; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; padding: 32px 24px; text-align: center; position: relative; }
        .header::before { content: '🎉'; font-size: 48px; display: block; margin-bottom: 8px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 18px; margin-bottom: 24px; color: #1f2937; }
        .order-info { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #3b82f6; }
        .order-info table { width: 100%; border-collapse: collapse; }
        .order-info td { padding: 8px 0; }
        .order-info .label { font-weight: 600; color: #374151; width: 140px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .shipping-info { background: #ecfdf5; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #10b981; }
        .products { margin: 32px 0; }
        .products h2 { color: #1f2937; font-size: 20px; margin-bottom: 16px; display: flex; align-items: center; }
        .products h2::before { content: '🛍️'; margin-right: 8px; }
        .product-table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
        .product-table th { background: #f1f5f9; color: #374151; font-weight: 600; padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .product-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .product-table tr:last-child td { border-bottom: none; }
        .product-name { font-weight: 500; color: #1f2937; }
        .quantity { text-align: center; font-weight: 600; color: #7c3aed; }
        .price { text-align: right; font-weight: 600; color: #059669; }
        .total-row { background: #f8fafc; font-weight: 700; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 8px 0; color: #6b7280; }
        .footer .signature { color: #374151; font-weight: 600; }
        .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
        .btn:hover { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
        @media (max-width: 600px) {
            .container { margin: 10px; }
            .header, .content, .footer { padding: 20px; }
            .order-info .label { width: 120px; display: block; margin-bottom: 4px; }
            .product-table { font-size: 14px; }
            .product-table th, .product-table td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Xác nhận đơn hàng</h1>
            <p>Đơn hàng của bạn đã được xử lý thành công!</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                <p>Chào <strong>{{ $order->customer_name }}</strong>,</p>
                <p>Cảm ơn bạn đã tin tưởng và mua sắm tại SneakerShop! Đơn hàng của bạn đã được thanh toán thành công và đang được chuẩn bị để giao hàng.</p>
            </div>

            <!-- Order Info -->
            <div class="order-info">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">📋 Thông tin đơn hàng</h2>
                <table>
                    <tr>
                        <td class="label">Mã đơn hàng:</td>
                        <td><strong>{{ $order->order_tracking_code }}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Trạng thái:</td>
                        <td>
                            <span class="status-badge {{ $order->status === 'completed' ? 'status-paid' : 'status-pending' }}">
                                {{ ucfirst($order->status) }}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td class="label">Thanh toán:</td>
                        <td>
                            <span class="status-badge status-paid">
                                {{ strtoupper($order->payment_method ?? 'VNPAY') }}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td class="label">Tổng tiền:</td>
                        <td style="font-size: 18px; font-weight: 700; color: #059669;">{{ $formattedTotal }} ₫</td>
                    </tr>
                </table>
            </div>

            <!-- Shipping Info -->
            <div class="shipping-info">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">🚚 Thông tin giao hàng</h2>
                <p style="margin: 4px 0;"><strong>📞 Số điện thoại:</strong> {{ $order->customer_phone }}</p>
                <p style="margin: 4px 0;"><strong>✉️ Email:</strong> {{ $order->customer_email }}</p>
                <p style="margin: 4px 0;"><strong>🏠 Địa chỉ:</strong> {{ $order->address_detail }}, {{ $order->ward }}, {{ $order->district }}, {{ $order->province }}</p>
                @if($order->shipping_fee > 0)
                <p style="margin: 4px 0;"><strong>🚛 Phí vận chuyển:</strong> {{ $formattedShipping }} ₫</p>
                @endif
            </div>

            <!-- Products -->
            <div class="products">
                <h2>Sản phẩm đã đặt</h2>
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th style="text-align: center;">SL</th>
                            <th style="text-align: right;">Đơn giá</th>
                            <th style="text-align: right;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                            <tr>
                                <td class="product-name">{{ $item->variant->product->name ?? 'Sản phẩm' }}</td>
                                <td class="quantity">{{ $item->quantity }}</td>
                                <td class="price">{{ number_format($item->unit_price, 0, ',', '.') }} ₫</td>
                                <td class="price">{{ number_format($item->unit_price * $item->quantity, 0, ',', '.') }} ₫</td>
                            </tr>
                        @endforeach
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right; font-size: 16px;">Tổng cộng:</td>
                            <td style="font-size: 18px; color: #059669;">{{ $formattedTotal }} ₫</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 32px 0;">
                <p style="margin-bottom: 16px; color: #6b7280;">Bạn có thể theo dõi trạng thái đơn hàng qua tài khoản của mình.</p>
                <a href="{{ env('FRONTEND_URL', 'http://localhost:3000') }}/my-orders" class="btn">Xem đơn hàng của tôi</a>
            </div>

            <p style="color: #6b7280; line-height: 1.6;">
                Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.
                Chúng tôi luôn sẵn sàng giúp đỡ bạn!
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Chúc bạn có những trải nghiệm mua sắm tuyệt vời cùng SneakerShop!</p>
            <p class="signature">Đội ngũ SneakerShop 💙</p>
            <p style="font-size: 12px; margin-top: 16px; color: #9ca3af;">
                Email này được gửi tự động, vui lòng không trả lời trực tiếp.
            </p>
        </div>
    </div>
</body>
</html>
