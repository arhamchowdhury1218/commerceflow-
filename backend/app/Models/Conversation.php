<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'business_id',
        'psid',
        'customer_name',
        'customer_id',
        'last_message',
        'last_message_at',
        'is_read',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'is_read'         => 'boolean',
    ];

    // A conversation belongs to one business (seller)
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    // A conversation may be linked to a customer record
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // A conversation has many messages
    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }
}
