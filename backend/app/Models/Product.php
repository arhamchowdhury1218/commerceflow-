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
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        // decimal:2 keeps exactly 2 decimal places: 1200.00
    ];

    // Product belongs to one business
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // Product has many variants (Red XL, Blue M etc.)
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
