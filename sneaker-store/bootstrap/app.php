<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //ĐĂNG KÝ MIDDLEWARE CỦA SPATIE
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Ép hệ thống luôn trả về JSON nếu là request từ API
        $exceptions->shouldRenderJsonWhen(function (Request $request) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // Tùy chỉnh format trả về cho từng loại lỗi
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                
                // 1. Lỗi Validate Dữ liệu (422)
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Dữ liệu đầu vào không hợp lệ!',
                        'errors' => $e->errors(),
                    ], 422);
                }

                // 2. Lỗi Không tìm thấy dữ liệu (404) - VD: findOrFail
                if ($e instanceof NotFoundHttpException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tìm thấy dữ liệu yêu cầu (404).',
                        'data' => null
                    ], 404);
                }

                // 3. Các lỗi Sập hệ thống / Logic khác (500)
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi hệ thống: ' . $e->getMessage(), 
                    'data' => null
                ], 500);
            }
        });
    })->create();