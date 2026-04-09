<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewStoreRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ];
    }

    public function messages()
    {
        return [
            'rating.required' => 'Đánh giá không được để trống.',
            'rating.integer' => 'Đánh giá phải là một số nguyên.',
            'rating.min' => 'Đánh giá phải từ 1 sao trở lên.',
            'rating.max' => 'Đánh giá không được vượt quá 5 sao.',
            'comment.string' => 'Nhận xét phải là văn bản.',
            'comment.max' => 'Nhận xét không được vượt quá 1000 ký tự.',
        ];
    }
}
