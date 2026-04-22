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
        'description' => 'Tra cứu tồn kho giày theo một hoặc nhiều bộ lọc kết hợp. Gọi tool này khi khách hàng hỏi về tên sản phẩm, màu sắc, size, thể loại, hoặc giới tính.',
        'parameters'  => [
            'type'       => 'object',
            'properties' => [
                'product_name' => [
                    'type'        => 'string',
                    'description' => "Tên dòng giày cụ thể. Ví dụ: 'Nike Air Force 1 Low', 'Adidas Ultraboost'.",
                ],
                'brand' => [
                    'type'        => 'string',
                    'description' => "Thương hiệu giày. Ví dụ: 'Nike', 'Adidas', 'Puma', 'Vans', 'Converse'.",
                ],
                'category' => [
                    'type'        => 'string',
                    'description' => "Thể loại giày. Ví dụ: 'bóng đá', 'chạy bộ', 'lifestyle', 'training'.",
                ],
                'color' => [
                    'type'        => 'string',
                    'description' => "Màu sắc khách yêu cầu. Ví dụ: 'đen', 'trắng', 'đỏ'.",
                ],
                'gender' => [
                    'type'        => 'string',
                    'enum'        => ['nam', 'nữ', 'unisex'],
                    'description' => "Giới tính: 'nam', 'nữ', hoặc 'unisex'.",
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
Bạn là nhân viên tư vấn của Sneaker Store - cửa hàng giày thể thao chính hãng.

Nguyên tắc sử dụng tool:
- Khi khách hỏi về tính sẵn có của sản phẩm (màu, size, tên, loại, giới tính) → PHẢI gọi search_shoe_inventory.
- Trích xuất TẤT CẢ thông tin có trong câu hỏi vào một lần gọi duy nhất. Không gọi tool nhiều lần cho cùng một câu hỏi.
- Chỉ điền các tham số mà khách hàng đề cập, bỏ qua các tham số không được nhắc đến.

Ví dụ ánh xạ:
- "Nike Air Force 1 Low màu đen" → { product_name: "Nike Air Force 1 Low", color: "đen" }
- "Giày bóng đá màu trắng nam" → { category: "bóng đá", color: "trắng", gender: "nam" }
- "Air Force 1 size 40 hoặc 41" → { product_name: "Air Force 1", sizes: ["40", "41"] }
- "Giày chạy bộ nữ" → { category: "chạy bộ", gender: "nữ" }

Sau khi nhận kết quả tool:
- Có hàng: Giới thiệu nhiệt tình, nêu bật sản phẩm, nhấn mạnh "đang có sẵn".
- Hết hàng: Xin lỗi khéo, gợi ý mở rộng tiêu chí (màu khác, size khác, dòng tương tự).
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn. Dùng **bold** cho tên sản phẩm và giá.
- TUYỆT ĐỐI không bịa thông tin sản phẩm ngoài dữ liệu tool trả về.
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
        $params = [];

        // 1. Trích xuất Thương hiệu (Brands)
        $brands = ['nike', 'adidas', 'puma', 'jordan', 'converse', 'vans', 'balenciaga', 'mlb', 'asics'];
        foreach ($brands as $b) {
            if (str_contains($lowMsg, $b)) {
                $params['brand'] = $b;
                break;
            }
        }

        // 2. Trích xuất Giới tính
        if (str_contains($lowMsg, 'nam')) $params['gender'] = 'nam';
        elseif (str_contains($lowMsg, 'nữ')) $params['gender'] = 'nữ';

        // 3. Trích xuất Danh mục
        $cats = ['chạy bộ' => 'chạy bộ', 'bóng đá' => 'bóng đá', 'lifestyle' => 'lifestyle', 'thể thao' => 'thể thao', 'casual' => 'lifestyle'];
        foreach ($cats as $key => $val) {
            if (str_contains($lowMsg, $key)) {
                $params['category'] = $val;
                break;
            }
        }
        
        // 4. Trích xuất Màu sắc
        $colors = ['đen', 'trắng', 'đỏ', 'xanh', 'vàng', 'xám', 'hồng', 'tím'];
        foreach ($colors as $c) {
            if (str_contains($lowMsg, $c)) {
                $params['color'] = $c;
                break;
            }
        }

        // 5. Trích xuất Size (Số từ 35-48)
        if (preg_match_all('/\b(3[5-9]|4[0-8])\b/', $message, $matches)) {
            $params['sizes'] = $matches[0];
        }

        // 6. Nếu không trích xuất được gì cụ thể, dùng tag chung để tìm theo tên
        if (empty($params)) {
             $params['product_name'] = $message;
        }

        $products = Product::searchInventory($params)->get();
        $productList = $products->map(fn($p) => $this->mapProduct($p))->values()->toArray();

        $reply = "Hiện tại bộ não AI của tôi đang được 'bảo trì' một chút, nhưng tôi đã lọc nhanh kho hàng cho bạn.";
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

        return [
            'id'               => $p->id,
            'name'             => $p->name,
            'slug'             => $p->slug,
            'brand'            => $p->brand?->name ?? '',
            'category'         => $p->category?->name ?? '',
            'price'            => $variant?->price ?? null,
            'image_url'        => $p->base_image_url ?? ($image?->image_url ?? null),
            'in_stock'         => $totalStock > 0,
            'available_colors' => $availableColors,
            'available_sizes'  => $availableSizes,
        ];
    }
}
