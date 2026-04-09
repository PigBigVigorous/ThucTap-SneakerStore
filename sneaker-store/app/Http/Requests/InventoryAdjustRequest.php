<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InventoryAdjustRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'variant_id' => 'required|integer|exists:product_variants,id',
            'branch_id' => 'required|integer|exists:branches,id',
            'quantity_change' => 'required|integer|between:-100000,100000', // Có thể là số âm (giảm) hay dương (tăng)
            'note' => 'nullable|string|max:500',
        ];
    }

    public function messages()
    {
        return [
            'variant_id.required' => 'Mã biến thể sản phẩm không được để trống.',
            'variant_id.exists' => 'Biến thể sản phẩm không tồn tại hoặc không hợp lệ.',
            'branch_id.required' => 'Chi nhánh/kho không được để trống.',
            'branch_id.exists' => 'Chi nhánh/kho không tồn tại hoặc không hợp lệ.',
            'quantity_change.required' => 'Số lượng thay đổi không được để trống.',
            'quantity_change.integer' => 'Số lượng thay đổi phải là một số nguyên.',
            'quantity_change.between' => 'Số lượng thay đổi phải nằm trong khoảng -100000 đến 100000.',
        ];
    }
}
