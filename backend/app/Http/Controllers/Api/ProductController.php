<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // GET /api/products
    public function index(Request $request)
    {
        $businessId = $request->user()->business->id;

        $products = Product::where('business_id', $businessId)
            ->with(['variants.inventory'])
            // Load variants and their stock levels in one query
            ->latest()
            ->get();

        return response()->json($products);
    }

    // POST /api/products
    public function store(Request $request)
    {
        $request->validate([
            'name'                        => 'required|string|max:255',
            'base_price'                  => 'required|numeric|min:0',
            'description'                 => 'nullable|string',
            'variants'                    => 'required|array|min:1',
            'variants.*.color'            => 'nullable|string',
            'variants.*.size'             => 'nullable|string',
            'variants.*.price'            => 'nullable|numeric|min:0',
            'variants.*.quantity'         => 'required|integer|min:0',
            'variants.*.low_stock_threshold' => 'nullable|integer|min:0',
        ]);

        $businessId = $request->user()->business->id;

        // Create the product
        $product = Product::create([
            'business_id' => $businessId,
            'name'        => $request->name,
            'base_price'  => $request->base_price,
            'description' => $request->description,
            'status'      => 'active',
        ]);

        // Create each variant + its inventory record
        foreach ($request->variants as $variantData) {
            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'color'      => $variantData['color'] ?? null,
                'size'       => $variantData['size'] ?? null,
                'price'      => $variantData['price'] ?? $request->base_price,
            ]);

            // Create inventory for this variant
            Inventory::create([
                'product_variant_id'  => $variant->id,
                'quantity'            => $variantData['quantity'],
                'low_stock_threshold' => $variantData['low_stock_threshold'] ?? 5,
                'updated_at'          => now(),
            ]);
        }

        // Return the product with all variants and inventory
        return response()->json(
            $product->load('variants.inventory'),
            201
        );
    }

    // GET /api/products/{id}
    public function show(Request $request, Product $product)
    {
        // Authorize: seller can only see their own products
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($product->load('variants.inventory'));
    }

    // PUT /api/products/{id}
    public function update(Request $request, Product $product)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name'       => 'sometimes|string|max:255',
            'base_price' => 'sometimes|numeric|min:0',
            'status'     => 'sometimes|in:active,inactive',
        ]);

        $product->update($request->only(['name', 'base_price', 'description', 'status']));

        return response()->json($product->load('variants.inventory'));
    }

    // DELETE /api/products/{id}
    public function destroy(Request $request, Product $product)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $product->delete();
        // cascade delete removes variants and inventory automatically

        return response()->json(['message' => 'Product deleted']);
    }
}
