<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'customer_id',
        'is_preorder',
        'preorder_note',
        'subtotal',
        'discount',
        'delivery_charge',
        'total_amount',
        'order_status',
        'payment_status',
        'payment_method',
        'courier_name',
        'source_channel',
        'notes',
    ];

    protected $casts = [
        'is_preorder'     => 'boolean',
        'subtotal'        => 'decimal:2',
        'discount'        => 'decimal:2',
        'delivery_charge' => 'decimal:2',
        'total_amount'    => 'decimal:2',
    ];

    // Order belongs to one business
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // Order belongs to one customer
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // Order has many line items
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    // Order has one payment record
    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    // Order has one delivery record
    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }

    // Order has one return record
    // We use OrderReturn to avoid PHP reserved word 'return'
    public function orderReturn()
    {
        return $this->hasOne(OrderReturn::class);
    }

    // Order has many notification records
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
