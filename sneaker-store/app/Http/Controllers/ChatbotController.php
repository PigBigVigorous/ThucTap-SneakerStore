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
            return response()->json([
                'success' => false,
                'message' => 'Chatbot chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
            ], 503);
        }

        // ── Build Gemini conversation history ────────────────────────────────
        $contents = [];
        foreach ($history as $item) {
            if (!isset($item['role'], $item['content'])) continue;
            $geminiRole = $item['role'] === 'assistant' ? 'model' : 'user';
            $contents[] = [
                'role'  => $geminiRole,
                'parts' => [['text' => $item['content']]],
            ];
        }
        $contents[] = [
            'role'  => 'user',
            'parts' => [['text' => $userMsg]],
        ];

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";

        $payload = [
            'system_instruction' => ['parts' => [['text' => $this->systemPrompt]]],
            'contents'           => $contents,
            'tools'              => [['function_declarations' => [$this->toolSchema]]],
            'generationConfig'   => ['temperature' => 0.7, 'maxOutputTokens' => 1024],
        ];

        // ── Turn 1: gửi đến Gemini ───────────────────────────────────────────
        $resp1 = Http::timeout(30)->post($endpoint, $payload);

        if ($resp1->failed()) {
            Log::error('Gemini API error (turn 1)', [
                'status' => $resp1->status(),
                'body'   => $resp1->body(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Hệ thống AI tạm thời gặp sự cố. Vui lòng thử lại.',
            ], 500);
        }

        $data1    = $resp1->json();
        $parts1   = $data1['candidates'][0]['content']['parts'] ?? [];

        // ── Kiểm tra có function call không ─────────────────────────────────
        $funcCallPart = collect($parts1)->first(fn ($p) => isset($p['functionCall']));

        if ($funcCallPart) {
            $funcName  = $funcCallPart['functionCall']['name'];
            $funcArgs  = $funcCallPart['functionCall']['args'] ?? [];

            // ── Thực thi truy vấn DB ─────────────────────────────────────────
            $products    = Product::searchInventory($funcArgs)->get();
            $productList = $products->map(function ($p) {
                $variant    = $p->variants->first();
                $image      = $p->images->first();
                $totalStock = $p->variants->sum(fn ($v) => $v->branchStocks->sum('stock'));

                $availableColors = $p->variants
                    ->filter(fn ($v) => $v->branchStocks->sum('stock') > 0)
                    ->map(fn ($v) => $v->color?->name)
                    ->filter()->unique()->values()->toArray();

                $availableSizes = $p->variants
                    ->filter(fn ($v) => $v->branchStocks->sum('stock') > 0)
                    ->map(fn ($v) => $v->size?->name)
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
            })->values()->toArray();

            $lastProducts = count($productList) > 0 ? $productList : null;

            // ── Turn 2: gửi functionResponse → Gemini sinh câu trả lời ───────
            $contents[] = ['role' => 'model', 'parts' => $parts1];
            $contents[] = [
                'role'  => 'user',
                'parts' => [[
                    'functionResponse' => [
                        'name'     => $funcName,
                        'response' => [
                            'found'    => count($productList),
                            'products' => $productList,
                        ],
                    ],
                ]],
            ];

            $payload['contents'] = $contents;
            $resp2 = Http::timeout(30)->post($endpoint, $payload);

            if ($resp2->failed()) {
                Log::error('Gemini API error (turn 2)', [
                    'status' => $resp2->status(),
                    'body'   => $resp2->body(),
                ]);
                return response()->json(['success' => false, 'message' => 'Lỗi sinh phản hồi từ AI.'], 500);
            }

            $data2     = $resp2->json();
            $parts2    = $data2['candidates'][0]['content']['parts'] ?? [];
            $textPart  = collect($parts2)->first(fn ($p) => isset($p['text']));
            $replyText = $textPart['text'] ?? 'Xin lỗi, tôi không hiểu yêu cầu của bạn.';

            return response()->json([
                'success'  => true,
                'reply'    => $replyText,
                'products' => $lastProducts,
            ]);
        }

        // ── Gemini trả lời trực tiếp (không cần tool) ────────────────────────
        $textPart  = collect($parts1)->first(fn ($p) => isset($p['text']));
        $replyText = $textPart['text'] ?? 'Xin lỗi, tôi không hiểu yêu cầu của bạn.';

        return response()->json([
            'success'  => true,
            'reply'    => $replyText,
            'products' => null,
        ]);
    }
}
