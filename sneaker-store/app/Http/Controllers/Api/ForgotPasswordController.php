<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Mail\ResetPasswordMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ForgotPasswordController extends Controller
{
    /**
     * Gửi OTP khôi phục mật khẩu.
     * POST /api/forgot-password
     */
    public function sendResetOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $email = $request->email;
        $user = User::where('email', $email)->first();

        // Tạo mã OTP ngẫu nhiên 6 chữ số
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Lưu vào bảng password_reset_tokens
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => $otp, // Ở đây dùng token làm OTP luôn cho đơn giản
                'created_at' => Carbon::now()
            ]
        );

        // Gửi Mail
        try {
            Mail::to($email)->send(new ResetPasswordMail($otp, $user->name));
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể gửi email lúc này. Vui lòng thử lại sau.'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mã OTP đã được gửi đến email của bạn.'
        ]);
    }

    /**
     * Xác thực OTP và đổi mật khẩu mới.
     * POST /api/reset-password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $resetData = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->first();

        if (!$resetData) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP không chính xác.'
            ], 400);
        }

        // Kiểm tra OTP hết hạn (15 phút)
        if (Carbon::parse($resetData->created_at)->addMinutes(15)->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP đã hết hiệu lực. Vui lòng lấy mã mới.'
            ], 400);
        }

        // Cập nhật mật khẩu mới cho User
        $user = User::where('email', $request->email)->first();
        $user->password = $request->password;
        $user->save();

        // Xóa OTP sau khi đã dùng thành công
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mật khẩu của bạn đã được cập nhật thành công!'
        ]);
    }
}
