<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;


class AuthController extends Controller
{
    /**
     * ĐĂNG KÝ TÀI KHOẢN (REGISTER)
     */
    public function register(Request $request)
    {
        // 1. Kiểm tra dữ liệu đầu vào
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6', 
        ]);

        // 2. Tạo User mới trong CSDL
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, 
        ]);

        $user->load('roles'); // Tải thông tin Role

        $user->setRelation('permissions', $user->getAllPermissions()); 
        
        //Cấp Token mới
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

    //ĐĂNG NHẬP (LOGIN)
     
    public function login(Request $request)
    {
        // Kiểm tra đầu vào
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Kiểm tra thông tin đăng nhập trong CSDL
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc mật khẩu không chính xác!'
            ], 401);
        }

        // Kiểm tra xem tài khoản có bị khóa không
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!'
            ], 403);
        }

        
        $user->load('roles');
        $user->setRelation('permissions', $user->getAllPermissions()); // Lấy đủ cả permissions của role

        // Cấp Token mới
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
     * LẤY THÔNG TIN NGƯỜI DÙNG (PROFILE)
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('roles');
        $user->setRelation('permissions', $user->getAllPermissions());

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * ĐĂNG XUẤT (LOGOUT)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công!'
        ]);
    }
}