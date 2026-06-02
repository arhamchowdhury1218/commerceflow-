<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'phone',
        'email',
        'delivery_address',
        'source_channel',
    ];

    // Customer belongs to one business
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // Customer has many orders
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    // Customer has many notifications sent to them
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Customer has many returns
    public function returns()
    {
        return $this->hasMany(OrderReturn::class);
    }
}
