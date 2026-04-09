<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BranchStoreRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255|unique:branches,name',
            'address' => 'required|string|max:500',
            'phone' => 'nullable|string|max:20|regex:/^[0-9\-\+\s\(\)]+$/',
            'email' => 'nullable|email|max:255|unique:branches,email',
            'is_main' => 'boolean',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Tên chi nhánh không được để trống.',
            'name.unique' => 'Tên chi nhánh đã tồn tại trong hệ thống.',
            'address.required' => 'Địa chỉ chi nhánh không được để trống.',
            'phone.regex' => 'Số phone không hợp lệ. Chỉ chứa số, dấu cách, dấu ngoặc, dấu trừ và dấu cộng.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email chi nhánh đã tồn tại trong hệ thống.',
        ];
    }
}
