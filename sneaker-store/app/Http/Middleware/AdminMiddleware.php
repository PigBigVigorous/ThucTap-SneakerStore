<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Kiểm tra xem user đã đăng nhập chưa, và có phải là 'admin' không
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false, 
                'message' => 'Bạn không có quyền truy cập khu vực này!'
            ], 403);
        }

        // Nếu đúng là admin thì cho phép đi tiếp
        return $next($request);
    }
}