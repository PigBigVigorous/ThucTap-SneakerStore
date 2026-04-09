<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InventoryImportRequest extends FormRequest
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
            'quantity' => 'required|integer|min:1|max:100000',
            'unit_cost' => 'nullable|numeric|min:0|max:999999999',
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
            'quantity.required' => 'Số lượng nhập không được để trống.',
            'quantity.min' => 'Số lượng nhập phải lớn hơn 0.',
            'quantity.max' => 'Số lượng nhập không được vượt quá 100000 chiếc.',
            'unit_cost.numeric' => 'Giá vốn phải là một số.',
            'unit_cost.min' => 'Giá vốn không được âm.',
        ];
    }
}
