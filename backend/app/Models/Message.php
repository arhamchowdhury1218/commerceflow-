<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'direction',
        'text',
        'fb_message_id',
    ];

    // A message belongs to one conversation
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}
