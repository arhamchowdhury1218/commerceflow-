<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    // GET /api/products
    // Returns all products for the authenticated seller's business
    public function index(Request $request)
    {
        $products = Product::where('business_id', $request->user()->business->id)
            ->with(['variants.inventory'])
            ->latest()
            ->get();

        return response()->json($products);
    }

    // POST /api/products
    // Creates a new product with all its variants and inventory records
    public function store(Request $request)
    {
        $request->validate([
            'name'                         => 'required|string|max:255',
            'base_price'                   => 'required|numeric|min:0',
            'description'                  => 'nullable|string',
            'variants'                     => 'required|array|min:1',
            'variants.*.quantity'          => 'required|integer|min:0',
            'variants.*.price'             => 'nullable|numeric|min:0',
            'variants.*.color'             => 'nullable|string',
            'variants.*.size'              => 'nullable|string',
            'variants.*.low_stock_threshold' => 'nullable|integer|min:0',
        ]);

        // Guard against duplicate variants — two rows with the SAME
        // color + size combination would create two inventory records
        // for what is really one variant. We reject the request with a
        // clear message rather than silently creating duplicates.
        $seen = [];
        foreach ($request->variants as $v) {
            // Normalise: trim + lowercase so "Red"/"red "/"RED" all match,
            // and treat missing color/size as an empty string
            $key = strtolower(trim($v['color'] ?? '')) . '|'
                . strtolower(trim($v['size'] ?? ''));
            if (isset($seen[$key])) {
                $label = trim(($v['color'] ?? '') . ' ' . ($v['size'] ?? ''));
                $label = $label !== '' ? $label : 'blank';
                return response()->json([
                    'message' => "Duplicate variant: \"{$label}\" is listed more than once. Each color/size combination must be unique.",
                ], 422);
            }
            $seen[$key] = true;
        }

        return DB::transaction(function () use ($request) {
            // Create the product
            $product = Product::create([
                'business_id' => $request->user()->business->id,
                'name'        => $request->name,
                'base_price'  => $request->base_price,
                'description' => $request->description,
                'status'      => 'active',
            ]);

            // Create each variant with its inventory record
            foreach ($request->variants as $variantData) {
                $variant = $product->variants()->create([
                    'color' => $variantData['color'] ?? null,
                    'size'  => $variantData['size']  ?? null,
                    'price' => $variantData['price']  ?? null,
                ]);

                Inventory::create([
                    'product_variant_id'  => $variant->id,
                    'quantity'            => $variantData['quantity'] ?? 0,
                    'low_stock_threshold' => $variantData['low_stock_threshold'] ?? 5,
                    'updated_at'          => now(),
                ]);
            }

            return response()->json(
                $product->load('variants.inventory'),
                201
            );
        });
    }

    // PUT /api/products/{product}
    // Updates the product base info — name, price, description
    // Variants are updated separately via their own endpoints
    public function update(Request $request, Product $product)
    {
        // Make sure this product belongs to the logged-in seller
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name'        => 'required|string|max:255',
            'base_price'  => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:active,inactive',
        ]);

        $product->update([
            'name'        => $request->name,
            'base_price'  => $request->base_price,
            'description' => $request->description,
            'status'      => $request->status ?? $product->status,
        ]);

        return response()->json(
            $product->fresh()->load('variants.inventory')
        );
    }

    // PUT /api/products/{product}/variants/{variant}
    // Updates a single variant — color, size, price, stock, threshold
    public function updateVariant(Request $request, Product $product, ProductVariant $variant)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Make sure variant belongs to this product
        if ($variant->product_id !== $product->id) {
            return response()->json(['error' => 'Variant not found'], 404);
        }

        $request->validate([
            'color'               => 'nullable|string',
            'size'                => 'nullable|string',
            'price'               => 'nullable|numeric|min:0',
            'quantity'            => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
        ]);

        // Update variant details
        $variant->update([
            'color' => $request->color ?? null,
            'size'  => $request->size  ?? null,
            'price' => $request->price ?? null,
        ]);

        // Update inventory — create if it doesn't exist yet
        $variant->inventory()->updateOrCreate(
            ['product_variant_id' => $variant->id],
            [
                'quantity'            => $request->quantity,
                'low_stock_threshold' => $request->low_stock_threshold ?? 5,
                'updated_at'          => now(),
            ]
        );

        return response()->json(
            $variant->fresh()->load('inventory')
        );
    }

    // POST /api/products/{product}/variants
    // Adds a new variant to an existing product
    public function addVariant(Request $request, Product $product)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'color'               => 'nullable|string',
            'size'                => 'nullable|string',
            'price'               => 'nullable|numeric|min:0',
            'quantity'            => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
        ]);

        // Reject if this color + size already exists on the product
        $newColor = strtolower(trim($request->color ?? ''));
        $newSize  = strtolower(trim($request->size ?? ''));
        $duplicate = $product->variants->first(function ($v) use ($newColor, $newSize) {
            return strtolower(trim($v->color ?? '')) === $newColor
                && strtolower(trim($v->size ?? '')) === $newSize;
        });
        if ($duplicate) {
            $label = trim(($request->color ?? '') . ' ' . ($request->size ?? ''));
            $label = $label !== '' ? $label : 'blank';
            return response()->json([
                'message' => "\"{$label}\" already exists for this product. Each color/size must be unique.",
            ], 422);
        }

        return DB::transaction(function () use ($request, $product) {
            $variant = $product->variants()->create([
                'color' => $request->color ?? null,
                'size'  => $request->size  ?? null,
                'price' => $request->price ?? null,
            ]);

            Inventory::create([
                'product_variant_id'  => $variant->id,
                'quantity'            => $request->quantity ?? 0,
                'low_stock_threshold' => $request->low_stock_threshold ?? 5,
                'updated_at'          => now(),
            ]);

            return response()->json(
                $variant->load('inventory'),
                201
            );
        });
    }

    // DELETE /api/products/{product}/variants/{variant}
    // Removes a variant and its inventory record
    // Prevents deleting the last variant — every product needs at least one
    public function deleteVariant(Request $request, Product $product, ProductVariant $variant)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($variant->product_id !== $product->id) {
            return response()->json(['error' => 'Variant not found'], 404);
        }

        // Prevent deleting the last variant
        if ($product->variants()->count() <= 1) {
            return response()->json([
                'error' => 'Cannot delete the last variant. A product must have at least one variant.'
            ], 422);
        }

        // Delete inventory first due to foreign key constraint
        $variant->inventory()->delete();
        $variant->delete();

        return response()->json(['message' => 'Variant deleted']);
    }

    // DELETE /api/products/{product}
    // Deletes the full product — variants and inventory cascade automatically
    public function destroy(Request $request, Product $product)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    // PATCH /api/products/{product}/status
    // Toggles a product between active and inactive
    public function toggleStatus(Request $request, Product $product)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $product->update([
            'status' => $product->status === 'active' ? 'inactive' : 'active'
        ]);

        return response()->json($product->fresh());
    }
}
