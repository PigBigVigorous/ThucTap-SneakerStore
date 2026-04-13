<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class StaffController extends Controller
{
    /**
     * Get list of staff members
     */
    public function index()
    {
        // Lấy tất cả user có role (nhân viên) hoặc trừ khách hàng nếu cần
        // Ở đây mình lấy tất cả và load roles
        $staff = User::with('roles')
            ->whereHas('roles', function($q) {
                $q->where('name', '!=', 'customer');
            })
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $staff
        ]);
    }

    /**
     * Create a new staff member
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => true,
            'role' => $request->role, // Fallback cho logic cũ nếu cần
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'success' => true,
            'message' => 'Tạo nhân viên thành công!',
            'data' => $user->load('roles')
        ], 201);
    }

    /**
     * Update staff member info and role
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        if ($request->password) {
            $user->password = Hash::make($request->password);
        }
        $user->role = $request->role;
        $user->save();

        // Cập nhật Role
        $user->syncRoles([$request->role]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật nhân viên thành công!',
            'data' => $user->load('roles')
        ]);
    }

    /**
     * Toggle active status (Lock/Unlock)
     */
    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);
        
        // Không cho phép tự khóa chính mình
        if (auth()->id() == $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể tự khóa tài khoản của chính mình!'
            ], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $statusLabel = $user->is_active ? 'mở khóa' : 'khóa';

        return response()->json([
            'success' => true,
            'message' => "Đã {$statusLabel} tài khoản nhân viên!",
            'data' => ['is_active' => $user->is_active]
        ]);
    }

    /**
     * Delete staff member
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if (auth()->id() == $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể tự xóa tài khoản của chính mình!'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa tài khoản nhân viên!'
        ]);
    }

    /**
     * Get list of available roles for selection
     */
    public function getRoles()
    {
        // Lấy các role trừ customer và super-admin (nếu không muốn manager tạo thêm admin)
        $roles = Role::whereNotIn('name', ['customer', 'super-admin'])->get(['id', 'name']);
        
        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }
}
