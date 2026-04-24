<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true; 
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'address_id' => 'nullable|exists:user_addresses,id',
            'customer_name' => 'required_without:address_id|nullable|string|max:255',
            'customer_phone' => 'required_without:address_id|nullable|string|max:20',
            'customer_email' => 'required_without:address_id|nullable|email|max:255',
            'province' => 'required_without:address_id|nullable|string|max:255',
            'district' => 'required_without:address_id|nullable|string|max:255',
            'ward' => 'required_without:address_id|nullable|string|max:255',
            'address_detail' => 'required_without:address_id|nullable|string|max:255',
            'shipping_fee' => 'required|numeric|min:0', 
            'payment_method' => 'required|string', 
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'discount_code' => 'nullable|string',
            'points_used' => 'nullable|integer|min:0',
        ];
    }
    
    public function messages()
    {
        return [
            'items.required' => 'Giỏ hàng không được để trống.',
            'items.*.variant_id.exists' => 'Sản phẩm không hợp lệ hoặc đã ngừng kinh doanh.',
        ];
    }
}
