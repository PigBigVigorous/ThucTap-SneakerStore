<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    // ── Tool definition — cùng schema với Claude, chuyển sang format Gemini ──
    private array $toolSchema = [
        'name'        => 'search_shoe_inventory',
        'description' => 'Tra cứu tồn kho giày theo một hoặc nhiều bộ lọc kết hợp. Gọi tool này khi khách hàng hỏi về tên sản phẩm, màu sắc, size, thể loại, giới tính hoặc khoảng giá.',
        'parameters'  => [
            'type'       => 'object',
            'properties' => [
                'product_name' => [
                    'type'        => 'string',
                    'description' => "Tên dòng giày cụ thể. Ví dụ: 'Nike Air Force 1 Low', 'Adidas Ultraboost'.",
                ],
                'brand' => [
                    'type'        => 'string',
                    'description' => "Thương hiệu giày. Ví dụ: 'Nike', 'Adidas', 'Puma', 'Vans', 'Converse', 'Jordan', 'MLB', 'Asics'.",
                ],
                'category' => [
                    'type'        => 'string',
                    'description' => "Thể loại giày. Ví dụ: 'bóng đá', 'chạy bộ', 'lifestyle', 'training', 'basketball'.",
                ],
                'color' => [
                    'type'        => 'string',
                    'description' => "Màu sắc khách yêu cầu. Ví dụ: 'đen', 'trắng', 'đỏ', 'xanh', 'vàng'.",
                ],
                'gender' => [
                    'type'        => 'string',
                    'enum'        => ['nam', 'nữ', 'unisex'],
                    'description' => "Giới tính: 'nam', 'nữ', hoặc 'unisex'.",
                ],
                'min_price' => [
                    'type'        => 'number',
                    'description' => "Giá tối thiểu tính bằng VNĐ. Ví dụ: khách hỏi 'trên 2 triệu' → 2000000.",
                ],
                'max_price' => [
                    'type'        => 'number',
                    'description' => "Giá tối đa tính bằng VNĐ. Ví dụ: khách hỏi 'dưới 3 triệu' → 3000000.",
                ],
                'sizes' => [
                    'type'        => 'array',
                    'items'       => ['type' => 'string'],
                    'description' => "Danh sách kích cỡ cần kiểm tra. Ví dụ: ['40', '41', '42'].",
                ],
            ],
        ],
    ];

    // ── System Prompt ────────────────────────────────────────────────────────
    private string $systemPrompt = <<<'PROMPT'
Bạn là nhân viên tư vấn của **Sneaker Store** - cửa hàng giày thể thao chính hãng tại Việt Nam.

## Thông tin cửa hàng
- Website: sneakerstore.vn
- Hotline: 0987 654 321 (8h–22h hàng ngày)
- Thanh toán: Tiền mặt, Chuyển khoản, VNPay, COD
- Giao hàng: Nội thành 1–2 ngày, tỉnh thành 3–5 ngày. Miễn phí đơn từ 500.000đ.
- Đổi trả: Trong 7 ngày kể từ ngày mua, sản phẩm chưa qua sử dụng, còn nguyên hộp.
- Bảo hành: Theo chính sách hãng, 1–2 năm tùy dòng sản phẩm.

## Câu hỏi thường gặp — trả lời TRỰC TIẾP, KHÔNG gọi tool:
- Hỏi về chính sách đổi trả → Giải thích chính sách 7 ngày
- Hỏi về giao hàng / phí ship → Nêu thời gian và điều kiện miễn phí
- Hỏi về thanh toán → Liệt kê các hình thức
- Hỏi về bảo hành → Nêu chính sách bảo hành
- Hỏi địa chỉ, hotline, liên hệ → Trả lời thông tin cửa hàng
- Chào hỏi, hỏi thăm → Chào lại thân thiện, giới thiệu bản thân

## Nguyên tắc tìm sản phẩm (gọi tool search_shoe_inventory):
- Gọi tool khi khách hỏi về: tên giày, thương hiệu, màu sắc, size, danh mục, giới tính, hoặc khoảng giá.
- Trích xuất TẤT CẢ thông tin từ câu hỏi vào MỘT lần gọi duy nhất.
- Chỉ điền tham số khách đề cập. Không đoán mò.

## Ví dụ ánh xạ tham số tool:
- "Nike Air Force 1 Low màu đen" → { product_name: "Nike Air Force 1 Low", color: "đen" }
- "Giày bóng đá trắng nam" → { category: "bóng đá", color: "trắng", gender: "nam" }
- "Air Force 1 size 40 hoặc 41" → { product_name: "Air Force 1", sizes: ["40", "41"] }
- "Giày chạy bộ nữ dưới 2 triệu" → { category: "chạy bộ", gender: "nữ", max_price: 2000000 }
- "Adidas từ 1.5 đến 3 triệu" → { brand: "Adidas", min_price: 1500000, max_price: 3000000 }

## Sau khi nhận kết quả tool:
- Có hàng: Giới thiệu nhiệt tình, nêu màu sắc/size sẵn có, giá, nhấn mạnh "còn hàng".
- Hết hàng: Xin lỗi khéo léo, gợi ý mở rộng tiêu chí (màu khác, size khác, dòng tương tự).
- Dùng **bold** cho tên sản phẩm và giá. Trả lời ngắn gọn, thân thiện bằng tiếng Việt.
- TUYỆT ĐỐI không bịa thông tin ngoài dữ liệu tool trả về.
PROMPT;

    public function handleChat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        $apiKey  = env('GEMINI_API_KEY');
        $userMsg = $request->input('message');
        $history = $request->input('history', []);

        if (empty($apiKey)) {
            return $this->smartFallback($userMsg, 'Cấu hình AI chưa hoàn tất.');
        }

        // ── Gemini history format ──
        $contents = [];
        foreach ($history as $item) {
            if (!isset($item['role'], $item['content'])) continue;
            $contents[] = [
                'role'  => $item['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $item['content']]],
            ];
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $userMsg]]];

        // Dùng gemini-1.5-flash ổn định hơn cho free tier
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}";

        $payload = [
            'system_instruction' => ['parts' => [['text' => $this->systemPrompt]]],
            'contents'           => $contents,
            'tools'              => [['function_declarations' => [$this->toolSchema]]],
            'generationConfig'   => ['temperature' => 0.7, 'maxOutputTokens' => 1024],
        ];

        try {
            $resp1 = Http::timeout(20)->post($endpoint, $payload);

            if ($resp1->failed()) {
                Log::warning('Gemini API failed, falling back to smart search.', [
                    'status' => $resp1->status(),
                    'error'  => $resp1->json('error.message') ?? $resp1->body(),
                ]);
                return $this->smartFallback($userMsg);
            }

            $data1  = $resp1->json();
            $parts1 = $data1['candidates'][0]['content']['parts'] ?? [];
            $funcCallPart = collect($parts1)->first(fn($p) => isset($p['functionCall']));

            if ($funcCallPart) {
                $funcName = $funcCallPart['functionCall']['name'];
                $funcArgs = $funcCallPart['functionCall']['args'] ?? [];

                $products = Product::searchInventory($funcArgs)->get();
                // Lọc theo giá nếu AI trích xuất được min_price / max_price
                if (!empty($funcArgs['min_price']) || !empty($funcArgs['max_price'])) {
                    $products = $products->filter(function ($p) use ($funcArgs) {
                        $price = $p->variants->min('price');
                        if ($price === null) return false;
                        if (!empty($funcArgs['min_price']) && $price < $funcArgs['min_price']) return false;
                        if (!empty($funcArgs['max_price']) && $price > $funcArgs['max_price']) return false;
                        return true;
                    });
                }
                $productList = $products->map(fn($p) => $this->mapProduct($p))->values()->toArray();

                // Gửi kết quả tool lại cho Gemini
                $contents[] = ['role' => 'model', 'parts' => $parts1];
                $contents[] = [
                    'role'  => 'user',
                    'parts' => [[
                        'functionResponse' => [
                            'name'     => $funcName,
                            'response' => ['found' => count($productList), 'products' => $productList],
                        ],
                    ]],
                ];

                $payload['contents'] = $contents;
                $resp2 = Http::timeout(20)->post($endpoint, $payload);

                if ($resp2->successful()) {
                    $parts2    = $resp2->json()['candidates'][0]['content']['parts'] ?? [];
                    $textPart  = collect($parts2)->first(fn($p) => isset($p['text']));
                    return response()->json([
                        'success'  => true,
                        'reply'    => $textPart['text'] ?? 'Đây là kết quả tôi tìm được:',
                        'products' => count($productList) > 0 ? $productList : null,
                    ]);
                }
            }

            $textPart = collect($parts1)->first(fn($p) => isset($p['text']));
            return response()->json([
                'success'  => true,
                'reply'    => $textPart['text'] ?? 'Tôi có thể giúp gì thêm cho bạn?',
                'products' => null,
            ]);

        } catch (\Exception $e) {
            Log::error('Chatbot error: ' . $e->getMessage());
            return $this->smartFallback($userMsg);
        }
    }

    /**
     * Fallback tìm kiếm thủ công khi AI gặp sự cố (Rate limit/Quota).
     */
    private function smartFallback($message, $reason = null)
    {
        $lowMsg = mb_strtolower($message);

        // ── FAQ: Trả lời câu hỏi chính sách không cần tìm sản phẩm ──
        $faqs = [
            'đổi trả'       => 'Chính sách đổi trả: **7 ngày** kể từ ngày mua, sản phẩm chưa qua sử dụng và còn nguyên hộp. Liên hệ hotline **0987 654 321** để được hỗ trợ.',
            'hoàn hàng'     => 'Chính sách hoàn hàng: **7 ngày** kể từ ngày mua. Vui lòng giữ hóa đơn và hộp sản phẩm. Hotline: **0987 654 321**.',
            'bảo hành'      => 'Sneaker Store bảo hành theo chính sách hãng, thông thường **1–2 năm** tùy dòng sản phẩm. Chi tiết vui lòng gọi **0987 654 321**.',
            'giao hàng'     => 'Giao hàng nội thành **1–2 ngày**, tỉnh thành **3–5 ngày**. **Miễn phí ship** cho đơn hàng từ 500.000đ.',
            'phí ship'      => 'Miễn phí giao hàng cho đơn từ **500.000đ**. Đơn dưới mức này phí ship từ 25.000đ–35.000đ tùy khu vực.',
            'thanh toán'    => 'Sneaker Store hỗ trợ: **Tiền mặt**, **Chuyển khoản ngân hàng**, **VNPay** và **COD** (thanh toán khi nhận hàng).',
            'vnpay'         => 'Chúng tôi hỗ trợ thanh toán qua **VNPay**. Bạn có thể chọn phương thức này ngay tại trang thanh toán.',
            'cod'           => 'Hỗ trợ **COD** (thanh toán khi nhận hàng) toàn quốc.',
            'hotline'       => 'Hotline hỗ trợ: **0987 654 321** (8h–22h hàng ngày, kể cả Thứ 7 & Chủ nhật).',
            'liên hệ'       => 'Bạn có thể liên hệ Sneaker Store qua hotline **0987 654 321** hoặc ghé trực tiếp cửa hàng tại **123 Đường Cầu Giấy, Hà Nội**.',
            'địa chỉ'       => 'Địa chỉ: **123 Đường Cầu Giấy, Hà Nội**. Mở cửa 8h–22h tất cả các ngày trong tuần.',
            'giờ mở cửa'    => 'Sneaker Store mở cửa từ **8h đến 22h**, tất cả các ngày trong tuần kể cả lễ Tết.',
            'khuyến mãi'    => 'Sneaker Store thường xuyên có các chương trình khuyến mãi và mã giảm giá. Bạn có thể đăng nhập để xem voucher trong ví của mình!',
            'voucher'       => 'Bạn có thể sử dụng **mã voucher** tại trang thanh toán. Đăng nhập tài khoản để xem các voucher hiện có trong ví.',
            'tích điểm'     => 'Mỗi **100.000đ** mua hàng bạn tích được **1 điểm**. Điểm có thể dùng để giảm giá cho đơn hàng tiếp theo.',
        ];

        foreach ($faqs as $keyword => $answer) {
            if (str_contains($lowMsg, $keyword)) {
                return response()->json([
                    'success'  => true,
                    'reply'    => $answer,
                    'products' => null,
                ]);
            }
        }

        // ── Tìm sản phẩm theo từ khóa ──
        $params = [];

        // 1. Trích xuất Thương hiệu
        $brands = ['nike', 'adidas', 'puma', 'jordan', 'converse', 'vans', 'balenciaga', 'mlb', 'asics', 'new balance', 'nb'];
        foreach ($brands as $b) {
            if (str_contains($lowMsg, $b)) {
                $params['brand'] = $b;
                break;
            }
        }

        // 2. Trích xuất Giới tính
        if (str_contains($lowMsg, ' nữ') || str_contains($lowMsg, 'cho nữ')) $params['gender'] = 'nữ';
        elseif (str_contains($lowMsg, ' nam') || str_contains($lowMsg, 'cho nam')) $params['gender'] = 'nam';

        // 3. Trích xuất Danh mục
        $cats = [
            'chạy bộ' => 'chạy bộ', 'running' => 'chạy bộ',
            'bóng đá' => 'bóng đá', 'football' => 'bóng đá',
            'lifestyle' => 'lifestyle', 'casual' => 'lifestyle',
            'thể thao' => 'thể thao', 'training' => 'training',
            'basketball' => 'basketball', 'bóng rổ' => 'basketball',
        ];
        foreach ($cats as $key => $val) {
            if (str_contains($lowMsg, $key)) { $params['category'] = $val; break; }
        }

        // 4. Trích xuất Màu sắc
        $colors = ['đen', 'trắng', 'đỏ', 'xanh', 'vàng', 'xám', 'hồng', 'tím', 'cam', 'nâu', 'be', 'bạc'];
        foreach ($colors as $c) {
            if (str_contains($lowMsg, $c)) { $params['color'] = $c; break; }
        }

        // 5. Trích xuất Size (35–48)
        if (preg_match_all('/\b(3[5-9]|4[0-8])\b/', $message, $matches)) {
            $params['sizes'] = $matches[0];
        }

        // 6. Trích xuất khoảng giá
        if (preg_match('/dưới\s*([0-9]+(?:[.,][0-9]+)?)\s*(triệu|tr|k|nghìn|đồng)/i', $lowMsg, $m)) {
            $val = (float) str_replace(',', '.', $m[1]);
            $params['max_price'] = str_contains($m[2], 'triệu') || str_contains($m[2], 'tr') ? $val * 1_000_000 : $val * 1_000;
        }
        if (preg_match('/trên\s*([0-9]+(?:[.,][0-9]+)?)\s*(triệu|tr|k|nghìn|đồng)/i', $lowMsg, $m)) {
            $val = (float) str_replace(',', '.', $m[1]);
            $params['min_price'] = str_contains($m[2], 'triệu') || str_contains($m[2], 'tr') ? $val * 1_000_000 : $val * 1_000;
        }

        // 7. Nếu không trích xuất được gì cụ thể, tìm theo tên
        if (empty($params)) {
            $params['product_name'] = $message;
        }

        $products = Product::searchInventory($params)->get();

        // Lọc theo khoảng giá trong fallback
        if (!empty($params['min_price']) || !empty($params['max_price'])) {
            $products = $products->filter(function ($p) use ($params) {
                $price = $p->variants->min('price');
                if ($price === null) return false;
                if (!empty($params['min_price']) && $price < $params['min_price']) return false;
                if (!empty($params['max_price']) && $price > $params['max_price']) return false;
                return true;
            });
        }

        $productList = $products->map(fn($p) => $this->mapProduct($p))->values()->toArray();

        $reply = "Hiện tại tôi tìm được **" . count($productList) . "** sản phẩm phù hợp với yêu cầu của bạn:";
        if (count($productList) > 0) {
            $reply .= " Đây là các mẫu **" . ($params['brand'] ?? $params['category'] ?? 'giày') . "** phù hợp nhất:";
        } else {
            $reply .= " Rất tiếc tôi chưa tìm thấy sản phẩm nào khớp chính xác với từ khóa của bạn. Bạn hãy thử nhắn 'Nike nam' hoặc 'Adidas đen' xem sao nhé!";
        }

        return response()->json([
            'success'  => true,
            'reply'    => $reply,
            'products' => count($productList) > 0 ? $productList : null,
            'fallback' => true,
        ]);
    }

    private function mapProduct($p)
    {
        $variant    = $p->variants->first();
        $image      = $p->images->first();
        $totalStock = $p->variants->sum(fn($v) => $v->branchStocks->sum('stock'));

        $availableColors = $p->variants
            ->filter(fn($v) => $v->branchStocks->sum('stock') > 0)
            ->map(fn($v) => $v->color?->name)
            ->filter()->unique()->values()->toArray();

        $availableSizes = $p->variants
            ->filter(fn($v) => $v->branchStocks->sum('stock') > 0)
            ->map(fn($v) => $v->size?->name)
            ->filter()->unique()->sort()->values()->toArray();

        // Giá thấp nhất và cao nhất trong các biến thể còn hàng
        $priceMin = $p->variants
            ->filter(fn($v) => $v->branchStocks->sum('stock') > 0)
            ->min('price');
        $priceMax = $p->variants
            ->filter(fn($v) => $v->branchStocks->sum('stock') > 0)
            ->max('price');

        return [
            'id'               => $p->id,
            'name'             => $p->name,
            'slug'             => $p->slug,
            'description'      => $p->description ? mb_substr(strip_tags($p->description), 0, 150) : null,
            'brand'            => $p->brand?->name ?? '',
            'category'         => $p->category?->name ?? '',
            'price'            => $variant?->price ?? null,
            'price_min'        => $priceMin,
            'price_max'        => $priceMax,
            'image_url'        => $p->base_image_url ?? ($image?->image_url ?? null),
            'in_stock'         => $totalStock > 0,
            'total_stock'      => $totalStock,
            'available_colors' => $availableColors,
            'available_sizes'  => $availableSizes,
        ];
    }
}
