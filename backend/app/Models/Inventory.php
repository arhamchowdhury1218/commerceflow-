<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    // Tell Laravel the exact table name
    // Without this, Laravel guesses 'inventories' — which doesn't exist
    // Our migration created it as 'inventory'
    protected $table = 'inventory';

    public $timestamps = false;

    protected $fillable = [
        'product_variant_id',
        'quantity',
        'low_stock_threshold',
        'updated_at',
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function isLow(): bool
    {
        return $this->quantity > 0 && $this->quantity <= $this->low_stock_threshold;
    }

    public function isOutOfStock(): bool
    {
        return $this->quantity === 0;
    }
}
