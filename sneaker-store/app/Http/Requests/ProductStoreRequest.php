<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductStoreRequest extends FormRequest
{
    public function authorize()
    {
        // Được kiểm tra bởi middleware 'permission:manage-products,sanctum'
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255|unique:products,name',
            'category_id' => 'required|integer|exists:categories,id',
            'brand_id' => 'required|integer|exists:brands,id',
            'description' => 'nullable|string|max:1000',
            // NOTE: base_image và gallery_images được validate thủ công trong Controller
            // vì PHP không convert nested file array (gallery_images[colorId][]) thành UploadedFile đúng cách
            'variants' => 'required|string|json',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Tên sản phẩm không được để trống.',
            'name.unique' => 'Tên sản phẩm đã tồn tại trong hệ thống.',
            'category_id.required' => 'Danh mục sản phẩm không được để trống.',
            'category_id.exists' => 'Danh mục sản phẩm không hợp lệ.',
            'brand_id.required' => 'Thương hiệu không được để trống.',
            'brand_id.exists' => 'Thương hiệu không hợp lệ.',
            'base_image.mimes' => 'Chỉ chấp nhận file ảnh (JPEG, PNG, JPG, WEBP).',
            'base_image.max' => 'Kích thước ảnh không được vượt quá 5MB.',
            'variants.required' => 'Phải có ít nhất một biến thể sản phẩm.',
            'variants.json' => 'Định dạng dữ liệu biến thể không hợp lệ.',
        ];
    }
}
