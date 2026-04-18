<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    /**
     * Chatbot AI tư vấn giày — dùng Google Gemini API (miễn phí).
     * Gemini hỗ trợ Function Calling tương tự Claude Tool Use.
     */
    public function handleChat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        $apiKey  = env('GEMINI_API_KEY');
        $userMsg = $request->input('message');
        $history = $request->input('history', []);

        // Kiểm tra API key
        if (empty($apiKey) || $apiKey === 'your-gemini-api-key-here') {
            Log::error('ChatbotController: GEMINI_API_KEY chưa được cấu hình trong .env');
            return response()->json([
                'success' => false,
                'message' => 'Chatbot chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
            ], 503);
        }

        // ---- Xây dựng conversation history cho Gemini ----
        // Gemini dùng format: [{"role":"user","parts":[{"text":"..."}]}, {"role":"model","parts":[...]}]
        $geminiHistory = [];
        foreach ($history as $item) {
            if (!isset($item['role']) || !isset($item['content'])) continue;
            $geminiRole = $item['role'] === 'assistant' ? 'model' : 'user';
            $geminiHistory[] = [
                'role'  => $geminiRole,
                'parts' => [['text' => $item['content']]],
            ];
        }

        // Tin nhắn hiện tại của user
        $geminiHistory[] = [
            'role'  => 'user',
            'parts' => [['text' => $userMsg]],
        ];

        // ---- System prompt ----
        $systemPrompt = 'Bạn là trợ lý AI của Sneaker Store - cửa hàng giày thể thao chính hãng hàng đầu Việt Nam. '
            . 'Nhiệm vụ của bạn là tư vấn, gợi ý giày phù hợp cho khách hàng một cách thân thiện, nhiệt tình. '
            . 'Khi khách hàng hỏi tìm giày theo thương hiệu hoặc ngân sách, hãy sử dụng function search_sneakers để tra cứu sản phẩm thực tế trong kho. '
            . 'Khi khách hàng hỏi về màu sắc của một đôi giày cụ thể, hãy sử dụng function get_product_colors. '
            . 'Sau khi có kết quả, hãy giới thiệu sản phẩm một cách tự nhiên, nêu bật điểm nổi bật và giá cả. '
            . 'Trả lời bằng tiếng Việt, ngắn gọn và thân thiện. '
            . 'Nếu không tìm thấy sản phẩm phù hợp, hãy gợi ý khách mở rộng tiêu chí tìm kiếm.';

        // ---- Khai báo Function Declaration cho Gemini ----
        $tools = [
            [
                'function_declarations' => [
                    [
                        'name'        => 'search_sneakers',
                        'description' => 'Tìm kiếm sản phẩm giày trong kho theo thương hiệu và ngân sách tối đa của khách hàng.',
                        'parameters'  => [
                            'type'       => 'object',
                            'properties' => [
                                'brand' => [
                                    'type'        => 'string',
                                    'description' => 'Tên thương hiệu giày, ví dụ: Nike, Adidas, Puma. Bỏ qua nếu khách không chỉ định.',
                                ],
                                'max_price' => [
                                    'type'        => 'integer',
                                    'description' => 'Giá tối đa (VNĐ). Ví dụ: 2000000. Bỏ qua nếu không giới hạn ngân sách.',
                                ],
                            ],
                        ],
                    ],
                    [
                        'name'        => 'get_product_colors',
                        'description' => 'Tra cứu chi tiết các màu sắc hiện có của một sản phẩm giày cụ thể. Sử dụng chức năng này khi khách hàng muốn biết một mẫu giày cụ thể có những tùy chọn màu nào.',
                        'parameters'  => [
                            'type'       => 'object',
                            'properties' => [
                                'product_name' => [
                                    'type'        => 'string',
                                    'description' => 'Tên của sản phẩm giày, ví dụ: Nike Air Force 1 Low',
                                ],
                            ],
                            'required' => ['product_name'],
                        ],
                    ],
                ],
            ],
        ];

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={$apiKey}";

        // ---- Vòng lặp xử lý Function Calling (tối đa 3 lần) ----
        $loopCount    = 0;
        $maxLoop      = 3;
        $lastProducts = null;

        while ($loopCount < $maxLoop) {
            $loopCount++;

            $payload = [
                'system_instruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents'           => $geminiHistory,
                'tools'              => $tools,
                'generationConfig'   => [
                    'temperature'     => 0.7,
                    'maxOutputTokens' => 1024,
                ],
            ];

            $response = Http::timeout(30)->post($endpoint, $payload);

            if ($response->failed()) {
                $status = $response->status();
                Log::error('Gemini API error', [
                    'status' => $status,
                    'body'   => $response->body(),
                ]);

                // Rate limit → dùng fallback thông minh (tra DB trực tiếp)
                if ($status === 429) {
                    return $this->smartFallback($userMsg);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Xin lỗi, hệ thống AI tạm thời gặp sự cố. Vui lòng thử lại sau.',
                ], 500);
            }

            $data        = $response->json();
            $candidate   = $data['candidates'][0] ?? null;
            $content     = $candidate['content'] ?? null;
            $finishReason= $candidate['finishReason'] ?? 'STOP';
            $parts       = $content['parts'] ?? [];

            // Kiểm tra có function call không
            $functionCallPart = collect($parts)->firstWhere('functionCall');

            if ($functionCallPart && isset($functionCallPart['functionCall'])) {
                $funcCall  = $functionCallPart['functionCall'];
                $funcName  = $funcCall['name'];
                $funcArgs  = $funcCall['args'] ?? [];

                // Thực thi search_sneakers hoặc get_product_colors
                $toolResult = [];
                if ($funcName === 'search_sneakers') {
                    $brand    = $funcArgs['brand']     ?? null;
                    $maxPrice = $funcArgs['max_price'] ?? null;

                    $products = Product::chatbotSearch($brand, $maxPrice)->get();

                    $toolResult = $products->map(function ($p) {
                        $cheapestVariant = $p->variants->first();
                        $image           = $p->images->first();
                        // Tính tồn kho từ bảng variant_branch_stocks
                        $totalStock = $p->variants->sum(function ($v) {
                            return $v->branchStocks->sum('stock');
                        });
                        return [
                            'id'        => $p->id,
                            'name'      => $p->name,
                            'slug'      => $p->slug,
                            'brand'     => $p->brand?->name ?? '',
                            'price'     => $cheapestVariant?->price ?? null,
                            'image_url' => $p->base_image_url ?? ($image?->image_url ?? null),
                            'in_stock'  => $totalStock > 0,
                        ];
                    })->values()->toArray();

                    $lastProducts = count($toolResult) > 0 ? $toolResult : null;
                } elseif ($funcName === 'get_product_colors') {
                    $productName = $funcArgs['product_name'] ?? null;
                    
                    if ($productName) {
                        $product = Product::where('name', 'like', '%' . $productName . '%')
                                          ->where('is_active', true)
                                          ->with('variants.color')
                                          ->first();
                        
                        if ($product) {
                            $colors = $product->variants->map(function($v) {
                                return $v->color?->name;
                            })->filter()->unique()->values()->toArray();
                            
                            $toolResult = [
                                'product_name' => $product->name,
                                'available_colors' => count($colors) > 0 ? $colors : ['Đang cập nhật'],
                            ];
                        } else {
                            $toolResult = ['error' => "Không tìm thấy sản phẩm nào có tên gần giống '{$productName}'."];
                        }
                    } else {
                        $toolResult = ['error' => 'Chưa có thông tin tên sản phẩm cần kiểm tra.'];
                    }
                }

                // Thêm model response (function call) vào history
                $geminiHistory[] = [
                    'role'  => 'model',
                    'parts' => $parts,
                ];

                // Thêm function response vào history
                $geminiHistory[] = [
                    'role'  => 'user',
                    'parts' => [
                        [
                            'functionResponse' => [
                                'name'     => $funcName,
                                'response' => [
                                    'products' => $toolResult,
                                    'count'    => count($toolResult),
                                ],
                            ],
                        ],
                    ],
                ];

                // Tiếp tục để Gemini sinh phản hồi cuối
                continue;
            }

            // Gemini đã sinh text — lấy phản hồi
            $textPart  = collect($parts)->firstWhere('text');
            $replyText = $textPart['text'] ?? 'Xin lỗi, tôi không hiểu yêu cầu của bạn.';

            return response()->json([
                'success'  => true,
                'reply'    => $replyText,
                'products' => $lastProducts,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
        ], 500);
    }

    /**
     * Fallback thông minh khi Gemini bị rate limit.
     * Phân tích keyword trong câu hỏi → tra DB → trả lời cố định.
     */
    private function smartFallback(string $userMsg): \Illuminate\Http\JsonResponse
    {
        $msg = mb_strtolower($userMsg);

        // ---- Phát hiện thương hiệu ----
        $brand = null;
        $brandMap = [
            'nike'          => 'Nike',
            'adidas'        => 'Adidas',
            'puma'          => 'Puma',
            'jordan'        => 'Jordan',
            'new balance'   => 'New Balance',
            'converse'      => 'Converse',
            'vans'          => 'Vans',
            'reebok'        => 'Reebok',
            'under armour'  => 'Under Armour',
            'asics'         => 'Asics',
            'fila'          => 'Fila',
            'mlb'           => 'MLB',
        ];
        foreach ($brandMap as $keyword => $brandName) {
            if (str_contains($msg, $keyword)) {
                $brand = $brandName;
                break;
            }
        }

        // ---- Phát hiện mức giá ----
        $maxPrice = null;
        // Dạng "X triệu" hoặc "Xtr"
        if (preg_match('/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr\b)/u', $msg, $m)) {
            $maxPrice = (int)(str_replace(',', '.', $m[1]) * 1_000_000);
        }
        // Dạng "dưới/duoi X00k" hoặc "X00 ngàn"
        if (!$maxPrice && preg_match('/(\d+)\s*(?:nghìn|ngàn|k\b)/u', $msg, $m)) {
            $maxPrice = (int)$m[1] * 1_000;
        }

        // ---- Tra DB ----
        $products = Product::chatbotSearch($brand, $maxPrice)->get();
        $productList = $products->map(function ($p) {
            $v          = $p->variants->first();
            $img        = $p->images->first();
            // Tính tồn kho từ bảng variant_branch_stocks
            $totalStock = $p->variants->sum(function ($v) {
                return $v->branchStocks->sum('stock');
            });
            return [
                'id'        => $p->id,
                'name'      => $p->name,
                'slug'      => $p->slug,
                'brand'     => $p->brand?->name ?? '',
                'price'     => $v?->price ?? null,
                'image_url' => $p->base_image_url ?? ($img?->image_url ?? null),
                'in_stock'  => $totalStock > 0,
            ];
        })->values()->toArray();

        // ---- Sinh câu trả lời ----
        $count = count($productList);
        if ($count === 0) {
            $reply = 'Hiện tại chúng tôi chưa có sản phẩm phù hợp với yêu cầu của bạn. '
                   . 'Bạn có muốn mở rộng ngân sách hoặc tìm thương hiệu khác không? 😊';
            return response()->json(['success' => true, 'reply' => $reply, 'products' => null]);
        }

        $brandText = $brand ? "giày **{$brand}**" : 'sản phẩm giày';
        $priceText = $maxPrice ? ' dưới ' . number_format($maxPrice, 0, ',', '.') . 'đ' : '';

        $reply = "Tôi tìm thấy **{$count} sản phẩm** {$brandText}{$priceText} đang có hàng tại Sneaker Store! 👟\n\n"
               . "Dưới đây là một số gợi ý tốt nhất cho bạn. Bấm vào sản phẩm để xem chi tiết nhé!";

        return response()->json([
            'success'  => true,
            'reply'    => $reply,
            'products' => $productList,
        ]);
    }
}
