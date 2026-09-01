<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Business extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'facebook_page_id',
        'facebook_page_token',
        'instagram_id',
        'whatsapp_number',
    ];

    // Business belongs to one seller
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Business has many products
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    // Business has many customers
    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    // Business has many orders
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    // Business has one subscription plan
    public function subscription()
    {
        return $this->hasOne(Subscription::class);
    }

    // Business has many Messenger conversations
    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}
