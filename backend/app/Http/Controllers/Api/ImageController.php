<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ImageController extends Controller
{
    // POST /api/products/{product}/images
    public function upload(Request $request, Product $product)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        try {
            $cloudName  = config('services.cloudinary.cloud_name');
            $apiKey     = config('services.cloudinary.api_key');
            $apiSecret  = config('services.cloudinary.api_secret');
            $timestamp  = time();

            // Build the signature Cloudinary requires
            $paramsToSign = "folder=commerceflow/products&timestamp={$timestamp}";
            $signature    = sha1($paramsToSign . $apiSecret);

            // Upload directly to Cloudinary REST API
            // No package needed — just a standard HTTP multipart request
            $response = Http::attach(
                'file',
                file_get_contents($request->file('image')->getRealPath()),
                $request->file('image')->getClientOriginalName()
            )->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
                'api_key'   => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'folder'    => 'commerceflow/products',
            ]);

            if (!$response->successful()) {
                \Log::error('Cloudinary upload failed', [
                    'response' => $response->body()
                ]);
                return response()->json([
                    'error'   => 'Cloudinary upload failed',
                    'message' => $response->json('error.message') ?? 'Unknown error',
                ], 500);
            }

            $imageUrl = $response->json('secure_url');

            // Safely build images array
            $images   = is_array($product->images) ? $product->images : [];
            $images[] = $imageUrl;

            // Save to database
            $product->update(['images' => $images]);

            return response()->json([
                'message'   => 'Image uploaded successfully',
                'image_url' => $imageUrl,
                'images'    => $images,
            ]);
        } catch (\Exception $e) {
            \Log::error('Image upload exception', [
                'error'      => $e->getMessage(),
                'product_id' => $product->id,
            ]);
            return response()->json([
                'error'   => 'Upload failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // DELETE /api/products/{product}/images
    public function delete(Request $request, Product $product)
    {
        if ($product->business_id !== $request->user()->business->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'image_url' => 'required|string',
        ]);

        // Remove from our database
        $images = collect(is_array($product->images) ? $product->images : [])
            ->filter(fn($url) => $url !== $request->image_url)
            ->values()
            ->toArray();

        $product->update(['images' => $images]);

        // Try to delete from Cloudinary too
        try {
            $cloudName = config('services.cloudinary.cloud_name');
            $apiKey    = config('services.cloudinary.api_key');
            $apiSecret = config('services.cloudinary.api_secret');
            $timestamp = time();
            $publicId  = $this->extractPublicId($request->image_url);

            if ($publicId) {
                $signature = sha1(
                    "public_id={$publicId}&timestamp={$timestamp}{$apiSecret}"
                );

                Http::post(
                    "https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy",
                    [
                        'public_id' => $publicId,
                        'api_key'   => $apiKey,
                        'timestamp' => $timestamp,
                        'signature' => $signature,
                    ]
                );
            }
        } catch (\Exception $e) {
            // Cloudinary delete failure should not block our response
            \Log::warning('Cloudinary delete failed', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'message' => 'Image removed',
            'images'  => $images,
        ]);
    }

    // Extract Cloudinary public_id from a secure URL
    // URL: https://res.cloudinary.com/cloud/image/upload/v123/commerceflow/products/abc.jpg
    // Returns: commerceflow/products/abc
    private function extractPublicId(string $url): ?string
    {
        preg_match('/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i', $url, $matches);
        return $matches[1] ?? null;
    }
}
