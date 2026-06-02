<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'color',
        'size',
        'price',
        'sku_variant',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    // Variant belongs to one product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Variant has one inventory record
    public function inventory()
    {
        return $this->hasOne(Inventory::class, 'product_variant_id');
    }

    // Variant appears in many order items
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'product_variant_id');
    }
}
