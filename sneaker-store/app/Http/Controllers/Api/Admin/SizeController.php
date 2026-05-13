<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Size;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SizeController extends Controller
{
    /**
     * GET /api/admin/sizes — Lấy danh sách tất cả size
     */
    public function index()
    {
        // Sắp xếp theo tên số (39, 40, 41...) hoặc chữ (S, M, L...)
        $sizes = Size::orderByRaw('CAST(name AS UNSIGNED), name')->get();

        return response()->json([
            'success' => true,
            'data'    => $sizes,
        ]);
    }

    /**
     * POST /api/admin/sizes — Tạo size mới
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:20|unique:sizes,name',
            'code' => 'nullable|string|max:20',
        ], [
            'name.required' => 'Vui lòng nhập tên size.',
            'name.unique'   => 'Size này đã tồn tại trong hệ thống.',
        ]);

        $size = Size::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $validated['name'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Đã tạo size \"{$size->name}\" thành công!",
            'data'    => $size,
        ], 201);
    }

    /**
     * PUT /api/admin/sizes/{id} — Cập nhật size
     */
    public function update(Request $request, $id)
    {
        $size = Size::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:20', Rule::unique('sizes', 'name')->ignore($size->id)],
            'code' => 'nullable|string|max:20',
        ], [
            'name.required' => 'Vui lòng nhập tên size.',
            'name.unique'   => 'Size này đã tồn tại trong hệ thống.',
        ]);

        $size->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật size thành công!',
            'data'    => $size,
        ]);
    }

    /**
     * DELETE /api/admin/sizes/{id} — Xóa size
     */
    public function destroy($id)
    {
        $size = Size::findOrFail($id);

        if ($size->variants()->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Không thể xóa size \"{$size->name}\" vì đang được sử dụng bởi sản phẩm.",
            ], 422);
        }

        $size->delete();

        return response()->json([
            'success' => true,
            'message' => "Đã xóa size \"{$size->name}\" thành công!",
        ]);
    }
}
