<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    protected $fillable = [
        'order_id',
        'courier_name',
        'tracking_number',
        'consignment_id',
        'delivery_status',
        'delivery_address',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'shipped_at'   => 'datetime',
        'delivered_at' => 'datetime',
    ];

    // Delivery belongs to one order
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
