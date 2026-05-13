<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProductReview;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductReview::with(['user:id,name,email', 'product:id,name,slug,base_image_url']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('product', function($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })->orWhereHas('user', function($q3) use ($search) {
                    $q3->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('comment', 'like', "%{$search}%");
            });
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => $reviews
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected'
        ]);

        $review = ProductReview::findOrFail($id);
        $review->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đánh giá thành công',
            'data' => $review->load(['user:id,name', 'product:id,name'])
        ]);
    }

    public function destroy($id)
    {
        $review = ProductReview::findOrFail($id);
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa đánh giá thành công'
        ]);
    }
}
