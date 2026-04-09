<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductUpdateRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $productId = $this->route('id');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'name')->ignore($productId),
            ],
            'category_id' => 'sometimes|required|integer|exists:categories,id',
            'brand_id' => 'sometimes|required|integer|exists:brands,id',
            'description' => 'nullable|string|max:1000',
            'base_image' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
            'gallery_images' => 'nullable|array',
            'gallery_images.*' => 'file|mimes:jpeg,png,jpg,webp|max:5120',
        ];
    }

    public function messages()
    {
        return [
            'name.unique' => 'Tên sản phẩm đã tồn tại trong hệ thống.',
            'category_id.exists' => 'Danh mục sản phẩm không hợp lệ.',
            'brand_id.exists' => 'Thương hiệu không hợp lệ.',
            'base_image.mimes' => 'Chỉ chấp nhận file ảnh (JPEG, PNG, JPG, WEBP).',
            'base_image.max' => 'Kích thước ảnh không được vượt quá 5MB.',
        ];
    }
}
