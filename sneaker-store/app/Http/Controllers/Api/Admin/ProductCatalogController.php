<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\VariantBranchStock;
use App\Models\ProductImage;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;

class ProductCatalogController extends Controller
{
    /**
     * Display a listing of products
     */
    public function index()
    {
        $products = Product::with(['brand', 'category', 'variants', 'images'])->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'brand_id' => 'required|exists:brands,id',
            'category_id' => 'required|exists:categories,id',
            'base_image_url' => 'nullable|url',
            'is_active' => 'boolean',
            'variants' => 'required|array|min:1',
            'variants.*.sku' => 'required|string|unique:product_variants,sku',
            'variants.*.color_id' => 'required|exists:colors,id',
            'variants.*.size_id' => 'required|exists:sizes,id',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock' => 'required|array',
            'variants.*.stock.*.branch_id' => 'required|exists:branches,id',
            'variants.*.stock.*.quantity' => 'required|integer|min:0',
            'images' => 'nullable|array',
            'images.*.image_url' => 'required|url',
            'images.*.sort_order' => 'integer|min:0',
        ]);

        return DB::transaction(function () use ($request) {
            // Create product
            $product = Product::create($request->only([
                'name', 'description', 'brand_id', 'category_id', 'base_image_url', 'is_active'
            ]));

            // Create variants
            foreach ($request->variants as $variantData) {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $variantData['sku'],
                    'color_id' => $variantData['color_id'],
                    'size_id' => $variantData['size_id'],
                    'price' => $variantData['price'],
                ]);

                // Create branch stocks
                foreach ($variantData['stock'] as $stockData) {
                    VariantBranchStock::create([
                        'variant_id' => $variant->id,
                        'branch_id' => $stockData['branch_id'],
                        'stock' => $stockData['quantity'],
                    ]);
                }
            }

            // Create images
            if ($request->has('images')) {
                foreach ($request->images as $imageData) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $imageData['image_url'],
                        'sort_order' => $imageData['sort_order'] ?? 0,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product->load(['variants', 'images'])
            ], 201);
        });
    }

    /**
     * Display the specified product
     */
    public function show(Product $product)
    {
        $product->load(['brand', 'category', 'variants.color', 'variants.size', 'variants.branchStocks.branch', 'images']);

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'brand_id' => 'sometimes|required|exists:brands,id',
            'category_id' => 'sometimes|required|exists:categories,id',
            'base_image_url' => 'nullable|url',
            'is_active' => 'boolean',
            // For simplicity, update only basic product info. Variants update can be separate endpoint
        ]);

        $product->update($request->only([
            'name', 'description', 'brand_id', 'category_id', 'base_image_url', 'is_active'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product
        ]);
    }

    /**
     * Remove the specified product
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }
}