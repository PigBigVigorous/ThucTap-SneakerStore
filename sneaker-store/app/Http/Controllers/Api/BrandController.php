<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class BrandController extends Controller
{
    /**
     * Lấy danh sách thương hiệu
     */
    public function index()
    {
        $brands = Cache::remember('brands_list', 86400, function () {
            return Brand::withCount('products')
                ->orderBy('name', 'asc')
                ->get();
        });
            
        return response()->json([
            'success' => true,
            'data' => $brands
        ]);
    }

    /**
     * Tạo thương hiệu mới
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $brand = Brand::create($validated);

        Cache::forget('brands_list');

        return response()->json([
            'success' => true,
            'message' => 'Tạo thương hiệu thành công',
            'data' => $brand
        ], 201);
    }

    /**
     * Cập nhật thương hiệu
     */
    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name,' . $id,
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'is_active' => 'nullable|boolean'
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $brand->update($validated);

        Cache::forget('brands_list');

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thương hiệu thành công',
            'data' => $brand
        ]);
    }

    /**
     * Xóa thương hiệu
     */
    public function destroy($id)
    {
        $brand = Brand::findOrFail($id);
        
        if ($brand->products()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa thương hiệu đang có sản phẩm'
            ], 400);
        }

        $brand->delete();

        Cache::forget('brands_list');

        return response()->json([
            'success' => true,
            'message' => 'Xóa thương hiệu thành công'
        ]);
    }
}
