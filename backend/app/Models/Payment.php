<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'amount_paid',
        'method',
        'status',
        'transaction_id',
        'paid_at',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'paid_at'     => 'datetime',
    ];

    // Payment belongs to one order
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
