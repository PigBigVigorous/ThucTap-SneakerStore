<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InventoryTransferRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'variant_id' => 'required|integer|exists:product_variants,id',
            'from_branch_id' => 'required|integer|exists:branches,id',
            'to_branch_id' => [
                'required',
                'integer',
                'exists:branches,id',
                'different:from_branch_id', // Không được transfer đến chính chi nhánh đó
            ],
            'quantity' => 'required|integer|min:1|max:100000',
            'note' => 'nullable|string|max:500',
        ];
    }

    public function messages()
    {
        return [
            'variant_id.required' => 'Mã biến thể sản phẩm không được để trống.',
            'variant_id.exists' => 'Biến thể sản phẩm không tồn tại hoặc không hợp lệ.',
            'from_branch_id.required' => 'Chi nhánh nguồn không được để trống.',
            'from_branch_id.exists' => 'Chi nhánh nguồn không tồn tại hoặc không hợp lệ.',
            'to_branch_id.required' => 'Chi nhánh đích không được để trống.',
            'to_branch_id.exists' => 'Chi nhánh đích không tồn tại hoặc không hợp lệ.',
            'to_branch_id.different' => 'Không thể transfer hàng đến chính chi nhánh đó. Vui lòng chọn chi nhánh khác.',
            'quantity.required' => 'Số lượng chuyển không được để trống.',
            'quantity.min' => 'Số lượng chuyển phải lớn hơn 0.',
            'quantity.max' => 'Số lượng chuyển không được vượt quá 100000 chiếc.',
        ];
    }
}
