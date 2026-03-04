<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * ĐĂNG KÝ TÀI KHOẢN (REGISTER)
     */
    public function register(Request $request)
    {
        // 1. Kiểm tra dữ liệu đầu vào (🚨 Đã bỏ chữ 'confirmed' vì frontend đã check)
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6', 
        ]);

        // 2. Tạo User mới trong CSDL
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            // 🚨 SỬA LỖI DOUBLE HASHING: Chỉ cần truyền text thẳng, Model User sẽ tự động mã hóa
            'password' => $request->password, 
        ]);

        // 3. Cấp Token cho User vừa tạo
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công!',
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ], 201);
    }

    /**
     * ĐĂNG NHẬP (LOGIN)
     */
    public function login(Request $request)
    {
        // 1. Kiểm tra đầu vào
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // 2. Kiểm tra thông tin đăng nhập trong CSDL
        $user = User::where('email', $request->email)->first();

        // 🚨 VẪN DÙNG Hash::check BÌNH THƯỜNG ĐỂ SO SÁNH
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác!'
            ], 401);
        }

        // 3. Cấp Token mới
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công!',
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ]);
    }

    /**
     * ĐĂNG XUẤT (LOGOUT)
     */
    public function logout(Request $request)
    {
        // Xóa (Thu hồi) cái token hiện tại mà người dùng đang dùng
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công!'
        ]);
    }
}