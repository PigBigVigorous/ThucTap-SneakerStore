<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BranchUpdateRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $branchId = $this->route('branch');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('branches', 'name')->ignore($branchId),
            ],
            'address' => 'sometimes|required|string|max:500',
            'phone' => 'nullable|string|max:20|regex:/^[0-9\-\+\s\(\)]+$/',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('branches', 'email')->ignore($branchId),
            ],
            'is_main' => 'boolean',
        ];
    }

    public function messages()
    {
        return [
            'name.unique' => 'Tên chi nhánh đã tồn tại trong hệ thống.',
            'phone.regex' => 'Số phone không hợp lệ.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email chi nhánh đã tồn tại trong hệ thống.',
        ];
    }
}
