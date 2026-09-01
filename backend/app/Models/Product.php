<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'sku',
        'base_price',
        'status',
        'description',
        'image',
        'images',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'images'     => 'array',
    ];

    // Override the images getter to ALWAYS return an array
    // even when the database value is null
    public function getImagesAttribute($value): array
    {
        if (empty($value)) return [];
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    // Main image is always the first image in the array
    // Returns null if no images uploaded yet
    public function getMainImageAttribute(): ?string
    {
        $images = $this->getImagesAttribute(
            $this->attributes['images'] ?? null
        );
        return $images[0] ?? null;
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
