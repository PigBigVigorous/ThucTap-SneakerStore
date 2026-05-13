<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Color;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ColorController extends Controller
{
    /**
     * GET /api/admin/colors — Lấy danh sách tất cả màu
     */
    public function index()
    {
        $colors = Color::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $colors,
        ]);
    }

    /**
     * POST /api/admin/colors — Tạo màu mới
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:100|unique:colors,name',
            'hex_code' => 'nullable|string|max:20',
        ], [
            'name.required' => 'Vui lòng nhập tên màu.',
            'name.unique'   => 'Tên màu này đã tồn tại trong hệ thống.',
        ]);

        $color = Color::create([
            'name'     => $validated['name'],
            'hex_code' => $validated['hex_code'] ?? '#000000',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Đã tạo màu \"{$color->name}\" thành công!",
            'data'    => $color,
        ], 201);
    }

    /**
     * PUT /api/admin/colors/{id} — Cập nhật màu
     */
    public function update(Request $request, $id)
    {
        $color = Color::findOrFail($id);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100', Rule::unique('colors', 'name')->ignore($color->id)],
            'hex_code' => 'nullable|string|max:20',
        ], [
            'name.required' => 'Vui lòng nhập tên màu.',
            'name.unique'   => 'Tên màu này đã tồn tại trong hệ thống.',
        ]);

        $color->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật màu thành công!',
            'data'    => $color,
        ]);
    }

    /**
     * DELETE /api/admin/colors/{id} — Xóa màu
     */
    public function destroy($id)
    {
        $color = Color::findOrFail($id);

        // Kiểm tra xem màu này có đang được dùng bởi variant nào không
        if ($color->variants()->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Không thể xóa màu \"{$color->name}\" vì đang được sử dụng bởi sản phẩm.",
            ], 422);
        }

        $color->delete();

        return response()->json([
            'success' => true,
            'message' => "Đã xóa màu \"{$color->name}\" thành công!",
        ]);
    }
}
