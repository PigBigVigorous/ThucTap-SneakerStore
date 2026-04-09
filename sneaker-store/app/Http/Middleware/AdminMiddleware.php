<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Kiểm tra xem user đã đăng nhập chưa, và có phải là 'super-admin' không (dùng Spatie Permission)
        if (!$request->user() || !$request->user()->hasRole('super-admin')) {
            return response()->json([
                'success' => false, 
                'message' => 'Bạn không có quyền truy cập khu vực này. Chỉ super-admin mới được phép.'
            ], 403);
        }

        // Nếu đúng là super-admin thì cho phép đi tiếp
        return $next($request);
    }
}