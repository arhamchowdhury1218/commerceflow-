<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrderReturn extends Model
{
    use HasFactory;

    // Override table name because Laravel would guess 'order_returns'
    // but our migration created the table as 'returns'
    protected $table = 'returns';

    protected $fillable = [
        'order_id',
        'customer_id',
        'reason',
        'status',
        'inventory_restored',
        'refund_amount',
    ];

    protected $casts = [
        'inventory_restored' => 'boolean',
        'refund_amount'      => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
